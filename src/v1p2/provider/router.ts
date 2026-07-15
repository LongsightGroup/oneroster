import { err, ok, type Result } from "../../result.js";
import { parseOneRosterV1p2QueryParameters } from "../rest/query.js";
import { oneRosterV1p2GeneratedRequestPayloadParsers } from "../rest/payload.generated.js";
import type { OneRosterV1p2Operation, OneRosterV1p2Service } from "../rest/operation.js";
import { oneRosterV1p2BasePaths, oneRosterV1p2Operations } from "../rest/operation.js";
import {
  createOneRosterV1p2ProviderStatusResponse,
  serializeOneRosterV1p2ProviderSuccess,
} from "./response.js";
import type {
  OneRosterV1p2ProviderAuthorizationFacts,
  OneRosterV1p2ProviderOperationInput,
  OneRosterV1p2ProviderOperationHandler,
  OneRosterV1p2ProviderRequestContext,
  OneRosterV1p2ProviderServices,
} from "./service.js";
import {
  findOneRosterV1p2ProviderHandler,
  getOneRosterV1p2ProviderOperationIds,
} from "./service.js";
import type { OneRosterV1p2ProviderAuthorize } from "./authorization.js";

/** Safe router configuration failure. */
export interface OneRosterV1p2ProviderRouterConfigurationError {
  readonly _tag: "OneRosterV1p2ProviderRouterConfigurationError";
  readonly code: "invalid_authorizer" | "missing_service";
}

/** Configuration for a framework-neutral OneRoster 1.2 provider router. */
export interface OneRosterV1p2ProviderRouterOptions {
  readonly services: OneRosterV1p2ProviderServices;
  readonly authorize: OneRosterV1p2ProviderAuthorize;
}

/** Standard Web Request handler returned by the provider router factory. */
export interface OneRosterV1p2ProviderRouter {
  readonly handle: (request: Request) => Promise<Response>;
}

/**
 * The index narrows by service, segment count, and method. Each bucket still
 * compares path templates linearly; replace buckets with a trie if provider
 * coverage grows enough for template scans to become measurable.
 */
type ProviderOperationIndex = ReadonlyMap<
  OneRosterV1p2Service,
  ReadonlyMap<number, ReadonlyMap<string, ReadonlyArray<OneRosterV1p2Operation>>>
>;

/**
 * Provider routing exposes three service roots. Assessment Results is a
 * Gradebook-root profile, so its handlers remain in the Gradebook capability
 * while its consumer client and codecs live under assessment-results/.
 */
const providerServices: ReadonlyArray<OneRosterV1p2Service> = [
  "rostering",
  "gradebook",
  "resources",
];

/** Create a provider router with explicit services and injected authorization. */
export function createOneRosterV1p2ProviderRouter(
  options: OneRosterV1p2ProviderRouterOptions,
): Result<OneRosterV1p2ProviderRouter, OneRosterV1p2ProviderRouterConfigurationError> {
  if (typeof options.authorize !== "function") {
    return err({
      _tag: "OneRosterV1p2ProviderRouterConfigurationError",
      code: "invalid_authorizer",
    });
  }
  if (getOneRosterV1p2ProviderOperationIds(options.services).length === 0) {
    return err({ _tag: "OneRosterV1p2ProviderRouterConfigurationError", code: "missing_service" });
  }
  const operationIndex = createProviderOperationIndex();
  return ok({ handle: (request) => routeRequest(request, options, operationIndex) });
}

async function routeRequest(
  request: Request,
  options: OneRosterV1p2ProviderRouterOptions,
  operationIndex: ProviderOperationIndex,
): Promise<Response> {
  if (request.signal.aborted) return responseForStatus(499);
  const parsedUrl = parseRequestUrl(request);
  if (parsedUrl === undefined) return responseForStatus(400);
  const pathMatch = findPathMatch(
    parsedUrl.pathname,
    request.method,
    options.services,
    operationIndex,
  );
  if (pathMatch.kind === "notFound") return responseForStatus(404);
  if (pathMatch.kind === "methodNotAllowed") return responseForStatus(405);
  if (pathMatch.kind === "badPath") return responseForStatus(400);
  const { operation, pathParameters, handler } = pathMatch;
  const query = parseOneRosterV1p2QueryParameters(parsedUrl.searchParams, operation.allowedQuery);
  if (query._tag === "err") return responseForStatus(400);

  const contentType = request.headers.get("content-type");
  const facts: OneRosterV1p2ProviderAuthorizationFacts = {
    operationId: operation.operationId,
    service: operation.service,
    method: operation.method,
    pathParameters,
    ...(query.value === undefined ? {} : { query: query.value }),
    requiredScopes: operation.requiredScopes,
    hasAuthorizationHeader: request.headers.has("authorization"),
    ...(contentType === null ? {} : { contentType }),
  };
  let authorized: Awaited<ReturnType<OneRosterV1p2ProviderAuthorize>>;
  try {
    authorized = await options.authorize(facts, request.signal);
  } catch (cause: unknown) {
    void cause;
    return responseForStatus(request.signal.aborted ? 499 : 500);
  }
  if (authorized._tag === "err") return responseForStatus(authorized.error.status);
  if (request.signal.aborted) return responseForStatus(499);

  const body = await parseRequestBody(request, operation.requestCodec);
  if (body._tag === "err") return responseForStatus(request.signal.aborted ? 499 : 400);
  const context: OneRosterV1p2ProviderRequestContext = {
    ...facts,
    principal: authorized.value,
    signal: request.signal,
  };
  const input: OneRosterV1p2ProviderOperationInput = {
    context,
    ...(body.value === undefined ? {} : { body: body.value }),
  };
  let serviceResult: Awaited<ReturnType<typeof handler>>;
  try {
    serviceResult = await handler(input);
  } catch (cause: unknown) {
    void cause;
    return responseForStatus(request.signal.aborted ? 499 : 500);
  }
  if (serviceResult._tag === "err") return responseForStatus(serviceResult.error.status);
  if (request.signal.aborted) return responseForStatus(499);
  const wire = serializeOneRosterV1p2ProviderSuccess(
    operation,
    serviceResult.value,
    query.value?.fields,
  );
  if (wire._tag === "err") return responseForStatus(wire.error.status);
  return new Response(wire.value.body, {
    status: wire.value.status,
    headers: wire.value.headers,
  });
}

type PathMatch =
  | {
      readonly kind: "matched";
      readonly operation: OneRosterV1p2Operation;
      readonly pathParameters: Readonly<Record<string, string>>;
      readonly handler: OneRosterV1p2ProviderOperationHandler;
    }
  | { readonly kind: "methodNotAllowed" }
  | { readonly kind: "notFound" }
  | { readonly kind: "badPath" };

function createProviderOperationIndex(): ProviderOperationIndex {
  const index = new Map<
    OneRosterV1p2Service,
    Map<number, Map<string, Array<OneRosterV1p2Operation>>>
  >();
  for (const operation of oneRosterV1p2Operations) {
    const segmentCount = `${oneRosterV1p2BasePaths[operation.service]}${operation.path}`.split(
      "/",
    ).length;
    const bySegmentCount = index.get(operation.service) ?? new Map();
    const byMethod = bySegmentCount.get(segmentCount) ?? new Map();
    const operations = byMethod.get(operation.method) ?? [];
    operations.push(operation);
    byMethod.set(operation.method, operations);
    bySegmentCount.set(segmentCount, byMethod);
    index.set(operation.service, bySegmentCount);
  }
  return index;
}

function findPathMatch(
  pathname: string,
  method: string,
  services: OneRosterV1p2ProviderServices,
  operationIndex: ProviderOperationIndex,
): PathMatch {
  const service = serviceForPath(pathname);
  if (service === undefined) return { kind: "notFound" };
  const bySegmentCount = operationIndex.get(service);
  const byMethod = bySegmentCount?.get(pathname.split("/").length);
  if (byMethod === undefined) return { kind: "notFound" };

  const decisionsByMethod = new Map<
    string,
    Array<{
      readonly operation: OneRosterV1p2Operation;
      readonly match: Exclude<MatchResult, { readonly kind: "notFound" }>;
      readonly handler?: OneRosterV1p2ProviderOperationHandler;
    }>
  >();
  for (const [candidateMethod, operations] of byMethod) {
    const decisions = decisionsByMethod.get(candidateMethod) ?? [];
    for (const operation of operations) {
      const match = matchPath(pathname, operation);
      if (match.kind === "notFound") continue;
      const handler = findOneRosterV1p2ProviderHandler(
        services,
        operation.service,
        operation.operationId,
      );
      decisions.push({ operation, match, ...(handler === undefined ? {} : { handler }) });
    }
    if (decisions.length > 0) decisionsByMethod.set(candidateMethod, decisions);
  }
  if (decisionsByMethod.size === 0) return { kind: "notFound" };

  /*
   * A published path/method absent from configured capabilities is 404. An
   * undefined method for an otherwise enabled path is 405.
   */
  const requestedMethod = decisionsByMethod.get(method);
  const enabled = requestedMethod?.find((decision) => decision.handler !== undefined);
  if (enabled !== undefined && enabled.handler !== undefined) {
    if (enabled.match.kind === "badPath") return enabled.match;
    return {
      kind: "matched",
      operation: enabled.operation,
      pathParameters: enabled.match.pathParameters,
      handler: enabled.handler,
    };
  }
  if (requestedMethod !== undefined) return { kind: "notFound" };
  const hasEnabledMethod = [...decisionsByMethod.values()].some((decisions) =>
    decisions.some((decision) => decision.handler !== undefined),
  );
  return hasEnabledMethod ? { kind: "methodNotAllowed" } : { kind: "notFound" };
}

function serviceForPath(pathname: string): OneRosterV1p2Service | undefined {
  for (const service of providerServices) {
    const basePath = oneRosterV1p2BasePaths[service];
    if (pathname === basePath || pathname.startsWith(`${basePath}/`)) return service;
  }
  return undefined;
}

type MatchResult =
  | { readonly kind: "matched"; readonly pathParameters: Readonly<Record<string, string>> }
  | { readonly kind: "notFound" }
  | { readonly kind: "badPath" };

function matchPath(pathname: string, operation: OneRosterV1p2Operation): MatchResult {
  const expected = `${oneRosterV1p2BasePaths[operation.service]}${operation.path}`;
  const expectedParts = expected.split("/");
  const actualParts = pathname.split("/");
  if (expectedParts.length !== actualParts.length) return { kind: "notFound" };
  const parameters: Record<string, string> = {};
  for (const [index, expectedPart] of expectedParts.entries()) {
    const actualPart = actualParts[index];
    if (actualPart === undefined) return { kind: "notFound" };
    if (expectedPart.startsWith("{") && expectedPart.endsWith("}")) {
      try {
        parameters[expectedPart.slice(1, -1)] = decodeURIComponent(actualPart);
      } catch (cause: unknown) {
        void cause;
        return { kind: "badPath" };
      }
    } else if (expectedPart !== actualPart) {
      return { kind: "notFound" };
    }
  }
  return { kind: "matched", pathParameters: parameters };
}

function parseRequestUrl(request: Request): URL | undefined {
  try {
    return new URL(request.url);
  } catch (cause: unknown) {
    void cause;
    return undefined;
  }
}

async function parseRequestBody(
  request: Request,
  codec: string | undefined,
): Promise<Result<unknown, undefined>> {
  if (codec === undefined) return ok(undefined);
  let text: string;
  try {
    text = await request.text();
  } catch (cause: unknown) {
    void cause;
    return err(undefined);
  }
  if (text.length === 0) return err(undefined);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (cause: unknown) {
    void cause;
    return err(undefined);
  }
  const parsed = parseBodyCodec(json, codec);
  return parsed._tag === "err" ? err(undefined) : ok(parsed.value);
}

function parseBodyCodec(input: unknown, codec: string): Result<unknown, undefined> {
  const parser = oneRosterV1p2GeneratedRequestPayloadParsers[codec];
  if (parser === undefined) return err(undefined);
  const result = parser(input);
  return result._tag === "err" ? err(undefined) : ok(result.value);
}

function responseForStatus(status: number): Response {
  const wire = createOneRosterV1p2ProviderStatusResponse(status);
  return new Response(wire.body, { status: wire.status, headers: wire.headers });
}
