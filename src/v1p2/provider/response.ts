import { err, ok, type Result } from "../../result.js";
import type { OneRosterV1p2Operation } from "../rest/operation.js";
import { oneRosterV1p2GeneratedResponseEnvelopeSerializers } from "../rest/payload.generated.js";
import type {
  OneRosterV1p2ProviderFailure,
  OneRosterV1p2ProviderPage,
  OneRosterV1p2ProviderSuccess,
} from "./service.js";

/** A framework-neutral wire response assembled before constructing `Response`. */
export interface OneRosterV1p2ProviderWireResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}

/** Validate provider page metadata before it reaches HTTP headers. */
export function createOneRosterV1p2ProviderPage<TValue>(
  input: OneRosterV1p2ProviderPage<TValue>,
): Result<OneRosterV1p2ProviderPage<TValue>, OneRosterV1p2ProviderFailure> {
  if (!Number.isSafeInteger(input.limit) || input.limit < 0) return err(internalFailure());
  if (!Number.isSafeInteger(input.offset) || input.offset < 0) return err(internalFailure());
  if (
    input.totalCount !== undefined &&
    (!Number.isSafeInteger(input.totalCount) || input.totalCount < 0)
  )
    return err(internalFailure());
  if (input.links !== undefined) {
    for (const link of Object.values(input.links)) {
      if (link !== undefined && !isAbsoluteUrl(link)) return err(internalFailure());
    }
  }
  return ok({
    items: [...input.items],
    limit: input.limit,
    offset: input.offset,
    ...(input.totalCount === undefined ? {} : { totalCount: input.totalCount }),
    ...(input.links === undefined ? {} : { links: { ...input.links } }),
  });
}

/** Serialize a typed provider success using the operation's exact envelope and status. */
export function serializeOneRosterV1p2ProviderSuccess(
  operation: OneRosterV1p2Operation,
  success: OneRosterV1p2ProviderSuccess,
  fields?: ReadonlyArray<string>,
): Result<OneRosterV1p2ProviderWireResponse, OneRosterV1p2ProviderFailure> {
  if (operation.responseKind === "noContent") {
    return success.kind === "noContent"
      ? ok({ status: operation.successStatuses[0] ?? 204, headers: {} })
      : err(internalFailure());
  }
  if (operation.responseKind === "write") {
    if (success.kind !== "write") return err(internalFailure());
    const body = {
      sourcedIdPairs: success.sourcedIdPairs === undefined ? [] : [...success.sourcedIdPairs],
    };
    return ok(jsonResponse(operation.successStatuses[0] ?? 201, body));
  }
  if (operation.responseKind === "singleton") {
    if (success.kind !== "singleton") return err(internalFailure());
    const serializeEnvelope =
      oneRosterV1p2GeneratedResponseEnvelopeSerializers[operation.operationId];
    if (serializeEnvelope === undefined) return err(internalFailure());
    const value = fields === undefined ? success.value : projectValue(success.value, fields);
    return ok(jsonResponse(operation.successStatuses[0] ?? 200, serializeEnvelope(value)));
  }
  if (success.kind !== "collection") return err(internalFailure());
  const page = createOneRosterV1p2ProviderPage(success.page);
  if (page._tag === "err") return page;
  const serializeEnvelope =
    oneRosterV1p2GeneratedResponseEnvelopeSerializers[operation.operationId];
  if (serializeEnvelope === undefined) return err(internalFailure());
  const items =
    fields === undefined
      ? page.value.items
      : page.value.items.map((item) => projectValue(item, fields));
  const response = jsonResponse(operation.successStatuses[0] ?? 200, serializeEnvelope(items));
  const headers: Record<string, string> = { ...response.headers };
  if (page.value.totalCount !== undefined) headers["X-Total-Count"] = String(page.value.totalCount);
  if (page.value.links !== undefined) {
    const link = serializeLinks(page.value.links);
    if (link.length > 0) headers["Link"] = link;
  }
  return ok({ ...response, headers });
}

/** Create a standards-shaped `imsx_StatusInfo` error response without unsafe details. */
export function createOneRosterV1p2ProviderStatusResponse(
  status: number,
): OneRosterV1p2ProviderWireResponse {
  const minor = statusMinor(status);
  return jsonResponse(status, {
    imsx_StatusInfo: {
      imsx_codeMajor: "failure",
      imsx_severity: "error",
      imsx_description: statusDescription(status),
      imsx_CodeMinor: {
        imsx_codeMinorField: [
          { imsx_codeMinorFieldName: "httpStatus", imsx_codeMinorFieldValue: minor },
        ],
      },
    },
  });
}

function jsonResponse(status: number, body: unknown): OneRosterV1p2ProviderWireResponse {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function projectValue(input: unknown, fields: ReadonlyArray<string>): unknown {
  if (!isRecord(input)) return input;
  const source = input;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const segments = field.split(".");
    let current: unknown = source;
    for (const segment of segments) {
      if (!isRecord(current)) {
        current = undefined;
        break;
      }
      current = current[segment];
    }
    if (current !== undefined) result[segments[0] ?? field] = current;
  }
  return result;
}

function serializeLinks(links: NonNullable<OneRosterV1p2ProviderPage["links"]>): string {
  return Object.entries(links)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([relation, link]) => `<${link}>; rel="${relation}"`)
    .join(", ");
}

function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function internalFailure(): OneRosterV1p2ProviderFailure {
  return { _tag: "OneRosterV1p2ProviderFailure", status: 500, code: "internal" };
}

function statusMinor(
  status: number,
):
  | "invaliddata"
  | "unauthorisedrequest"
  | "forbidden"
  | "unknownobject"
  | "unsupported"
  | "server_busy"
  | "internal_server_error" {
  switch (status) {
    case 401:
      return "unauthorisedrequest";
    case 403:
      return "forbidden";
    case 404:
      return "unknownobject";
    case 405:
    case 501:
      return "unsupported";
    case 429:
    case 503:
      return "server_busy";
    case 500:
      return "internal_server_error";
    default:
      return "invaliddata";
  }
}

function statusDescription(status: number): string {
  switch (status) {
    case 401:
      return "Authorization is required.";
    case 403:
      return "The requested operation is forbidden.";
    case 404:
      return "The requested resource was not found.";
    case 405:
      return "The requested method is not supported.";
    case 429:
      return "The service is temporarily rate limited.";
    case 500:
      return "The service failed to process the request.";
    case 501:
      return "The requested operation is not implemented.";
    case 503:
      return "The service is temporarily unavailable.";
    default:
      return "The request is invalid.";
  }
}
