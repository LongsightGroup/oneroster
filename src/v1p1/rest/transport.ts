import { err, ok, type Result } from "../../result.js";
import {
  oneRosterRestSystemRetryClock,
  parseOneRosterRestRetryPolicy,
  type OneRosterRestRetryClock,
  type OneRosterRestRetryPolicy,
  type OneRosterRestRetryPolicyInput,
} from "../../rest/retry.js";
import { createOneRosterRestTransportErrors } from "../../rest/transport-errors.js";
import { parseOneRosterRestQueryFromLink } from "../../rest/query-from-link.js";
import type {
  OneRosterV1p1AuthorizationError,
  OneRosterV1p1RequestAuthorizer,
} from "./authorization.js";
import type { OneRosterV1p1ConfigurationError, OneRosterV1p1RestError } from "./error.js";
import { oneRosterV1p1BasePath, type OneRosterV1p1Operation } from "./operation.js";
import { parseOneRosterV1p1PageMetadata, type OneRosterV1p1Page } from "./page.js";
import {
  serializeOneRosterV1p1Query,
  withOneRosterV1p1QueryOffset,
  type OneRosterV1p1Query,
} from "./query.js";
import type { OneRosterV1p1PayloadDiagnostic } from "../model/primitive.js";
import {
  createOneRosterRestMechanics,
  isOneRosterRestAbortCause,
  isOneRosterRestJsonContentType,
  type OneRosterRestTransportRequest,
  type OneRosterRestTransportResponse,
  type OneRosterRestCollectionRequest,
  type OneRosterRestCollectionBounds,
  type OneRosterRestIterationBounds,
  type OneRosterRestFetch,
} from "../../rest/transport.js";
import { substituteOneRosterRestPathParameters } from "../../rest/url.js";

/** A portable fetch-compatible function. */
export type OneRosterV1p1Fetch = OneRosterRestFetch;

/** Explicit v1.1 client configuration. */
export interface OneRosterV1p1ClientConfigurationInput {
  readonly baseUrl: string;
  readonly authorizer: OneRosterV1p1RequestAuthorizer;
  readonly fetch?: OneRosterV1p1Fetch;
  readonly retryPolicy?: OneRosterRestRetryPolicyInput;
  readonly retryClock?: OneRosterRestRetryClock;
}

interface Configuration {
  readonly baseUrl: string;
  readonly authorizer: OneRosterV1p1RequestAuthorizer;
  readonly fetch: OneRosterV1p1Fetch;
  readonly retryPolicy?: OneRosterRestRetryPolicy;
  readonly retryClock: OneRosterRestRetryClock;
}

const transportErrors = createOneRosterRestTransportErrors("OneRosterV1p1", {
  cancellation: "The request was cancelled.",
  network: "The request could not be completed.",
  query: "The OneRoster query is invalid.",
  pathParameter: "A required path parameter is missing or invalid.",
  contentType: "The OneRoster response content type is not JSON.",
  json: "The OneRoster response was not valid JSON.",
  payload: "The response failed OneRoster payload validation.",
  pagination: "Pagination metadata is malformed.",
  collectionLimit: "The collection bound was reached.",
});

/** A request through the v1.1 transport boundary. */
export type OneRosterV1p1TransportRequest<TValue> = OneRosterRestTransportRequest<
  OneRosterV1p1Operation,
  OneRosterV1p1Query,
  TValue,
  OneRosterV1p1PayloadDiagnostic
>;

/** A collection request. */
export type OneRosterV1p1CollectionRequest<TValue> = OneRosterRestCollectionRequest<
  OneRosterV1p1Operation,
  OneRosterV1p1Query,
  TValue,
  OneRosterV1p1PayloadDiagnostic
>;

/** Bounds for deterministic collection traversal. */
export type OneRosterV1p1CollectionBounds = OneRosterRestCollectionBounds;

/** Bounds for lazy v1.1 page iteration. */
export type OneRosterV1p1IterationBounds = OneRosterRestIterationBounds;

/** Successful transport response. */
export type OneRosterV1p1TransportResponse<TValue> = OneRosterRestTransportResponse<TValue>;

/** The portable v1.1 REST transport. */
export interface OneRosterV1p1RestTransport {
  request<TValue>(
    input: OneRosterV1p1TransportRequest<TValue>,
  ): Promise<Result<OneRosterV1p1TransportResponse<TValue>, OneRosterV1p1RestError>>;
  requestPage<TValue>(
    input: OneRosterV1p1CollectionRequest<TValue>,
  ): Promise<Result<OneRosterV1p1Page<TValue>, OneRosterV1p1RestError>>;
  iteratePages<TValue>(
    input: OneRosterV1p1CollectionRequest<TValue> & OneRosterV1p1IterationBounds,
  ): AsyncGenerator<Result<OneRosterV1p1Page<TValue>, OneRosterV1p1RestError>, void, void>;
  collectAll<TValue>(
    input: OneRosterV1p1CollectionRequest<TValue> & OneRosterV1p1CollectionBounds,
  ): Promise<Result<ReadonlyArray<TValue>, OneRosterV1p1RestError>>;
}

/** Validate an explicit v1.1 root and create a portable transport. */
export function createOneRosterV1p1RestTransport(
  input: unknown,
): Result<OneRosterV1p1RestTransport, OneRosterV1p1ConfigurationError> {
  const configuration = parseConfiguration(input);
  if (configuration._tag === "err") return configuration;
  const value = configuration.value;
  return ok(
    createOneRosterRestMechanics<
      OneRosterV1p1Operation,
      OneRosterV1p1Query,
      OneRosterV1p1RestError,
      OneRosterV1p1PayloadDiagnostic
    >({
      fetch: value.fetch,
      retryClock: value.retryClock,
      ...(value.retryPolicy === undefined ? {} : { retryPolicy: value.retryPolicy }),
      resolveUrl: (operation, pathParameters, query) =>
        buildRequestUrl(value.baseUrl, operation, pathParameters, query),
      authorize: async ({ request, operation, signal }) => {
        let authorization: Result<HeadersInit, OneRosterV1p1AuthorizationError>;
        try {
          authorization = await value.authorizer({ request, operation, signal });
        } catch (cause: unknown) {
          if (signal.aborted || isOneRosterRestAbortCause(cause)) {
            return err(transportErrors.cancellation(operation.operationId));
          }
          return err(
            authorizationError(operation.operationId, {
              _tag: "OneRosterV1p1AuthorizationError",
              code: "authorization_failed",
              message: "The request authorizer failed.",
            }),
          );
        }
        if (authorization._tag === "err") {
          if (authorization.error.code === "cancelled" || signal.aborted) {
            return err(transportErrors.cancellation(operation.operationId));
          }
          return err(authorizationError(operation.operationId, authorization.error));
        }
        return authorization;
      },
      parseHttpError: httpError,
      parsePageMetadata: (headers, query, operationId) =>
        parseOneRosterV1p1PageMetadata(headers, query, operationId),
      withQueryOffset,
      queryFromLink: (link, current, fallbackOffset, operationId) =>
        parseOneRosterRestQueryFromLink({
          link,
          current,
          fallbackOffset,
          operationId,
          withQueryOffset,
          paginationError: transportErrors.pagination,
        }),
      skipResponseBody: (operation) => operation.responseKind === "write",
      errors: {
        cancellation: transportErrors.cancellation,
        network: transportErrors.network,
        authorization: (operationId) =>
          authorizationError(operationId, {
            _tag: "OneRosterV1p1AuthorizationError",
            code: "authorization_failed",
            message: "The request authorizer failed.",
          }),
        contentType: transportErrors.contentType,
        json: transportErrors.json,
        payload: transportErrors.payload,
        pagination: transportErrors.pagination,
        collectionLimit: transportErrors.collectionLimit,
      },
    }),
  );
}

function parseConfiguration(
  input: unknown,
): Result<Configuration, OneRosterV1p1ConfigurationError> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return err(configurationError("invalid_base_url", "", "REST configuration must be an object."));
  }
  const value = input as Partial<OneRosterV1p1ClientConfigurationInput>;
  if (typeof value.baseUrl !== "string" || value.baseUrl.length === 0) {
    return err(
      configurationError("missing_base_url", "", "An explicit v1.1 base URL is required."),
    );
  }
  if (!validBaseUrl(value.baseUrl)) {
    return err(
      configurationError(
        "invalid_base_url",
        "",
        "baseUrl must be the absolute OneRoster v1.1 service root.",
      ),
    );
  }
  if (typeof value.authorizer !== "function") {
    return err(
      configurationError("invalid_authorizer", "", "An injected request authorizer is required."),
    );
  }
  if (value.fetch !== undefined && typeof value.fetch !== "function") {
    return err(
      configurationError("invalid_fetch", "", "The injected fetch seam must be callable."),
    );
  }
  if (value.retryClock !== undefined && !isRetryClock(value.retryClock)) {
    return err(
      configurationError(
        "invalid_retry_policy",
        "",
        "The retry clock must expose nowMilliseconds().",
      ),
    );
  }
  const fetchFunction = value.fetch ?? globalThis.fetch;
  if (typeof fetchFunction !== "function") {
    return err(
      configurationError("invalid_fetch", "", "No Web Platform fetch implementation is available."),
    );
  }
  const retryPolicy =
    value.retryPolicy === undefined ? undefined : parseOneRosterRestRetryPolicy(value.retryPolicy);
  if (retryPolicy?._tag === "err") {
    return err(
      configurationError(
        "invalid_retry_policy",
        "",
        "The read retry policy must be explicitly bounded and valid.",
      ),
    );
  }
  return ok({
    baseUrl: normalizeBaseUrl(value.baseUrl),
    authorizer: value.authorizer,
    fetch: fetchFunction,
    retryClock: value.retryClock ?? oneRosterRestSystemRetryClock,
    ...(retryPolicy === undefined ? {} : { retryPolicy: retryPolicy.value }),
  });
}

function isRetryClock(input: unknown): input is OneRosterRestRetryClock {
  return (
    input !== null &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "nowMilliseconds" in input &&
    typeof input.nowMilliseconds === "function"
  );
}

function validBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      url.pathname.replace(/\/$/, "") === oneRosterV1p1BasePath
    );
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildRequestUrl(
  baseUrl: string,
  operation: OneRosterV1p1Operation,
  pathParameters: Readonly<Record<string, string>> | undefined,
  query: OneRosterV1p1Query | undefined,
): Result<string, OneRosterV1p1RestError> {
  const path = substituteOneRosterRestPathParameters(
    operation,
    pathParameters,
    transportErrors.pathParameter,
  );
  if (path._tag === "err") return path;
  const url = new URL(`${baseUrl}${path.value}`);
  if (query !== undefined) {
    const serialized = serializeOneRosterV1p1Query(query, operation.allowedQuery);
    if (serialized._tag === "err") {
      return err(transportErrors.query(operation.operationId, serialized.error));
    }
    url.search = serialized.value;
  }
  return ok(url.toString());
}

function withQueryOffset(
  query: OneRosterV1p1Query | undefined,
  offset: number,
  operationId: string,
): Result<OneRosterV1p1Query, OneRosterV1p1RestError> {
  const nextQuery = withOneRosterV1p1QueryOffset(query, offset);
  if (nextQuery._tag === "err") return err(transportErrors.query(operationId, nextQuery.error));
  return nextQuery;
}

async function httpError(
  operationId: string,
  response: Response,
  headers: Readonly<Record<string, string>>,
): Promise<OneRosterV1p1RestError> {
  let malformed = true;
  if (isOneRosterRestJsonContentType(response.headers.get("content-type") ?? undefined)) {
    try {
      JSON.parse(await response.text());
      malformed = false;
    } catch (cause: unknown) {
      void cause;
    }
  }
  return {
    _tag: "OneRosterV1p1HttpError",
    code: "http_failure",
    operationId,
    status: response.status,
    headers: {
      ...(headers["content-type"] === undefined ? {} : { contentType: headers["content-type"] }),
      ...(headers["retry-after"] === undefined ? {} : { retryAfter: headers["retry-after"] }),
      ...(headers["x-request-id"] === undefined ? {} : { requestId: headers["x-request-id"] }),
    },
    statusPayloadMalformed: malformed,
    message: "The OneRoster service returned a non-success HTTP status.",
  };
}

function authorizationError(
  operationId: string,
  authorization: OneRosterV1p1AuthorizationError,
): OneRosterV1p1RestError {
  return {
    _tag: "OneRosterV1p1AuthorizationRestError",
    code: "authorization_failure",
    operationId,
    authorization,
    message: "The request authorizer rejected the request.",
  };
}

function configurationError(
  code: OneRosterV1p1ConfigurationError["code"],
  operationId: string,
  message: string,
): OneRosterV1p1ConfigurationError {
  return { _tag: "OneRosterV1p1ConfigurationError", code, operationId, message };
}
