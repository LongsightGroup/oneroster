import type { OneRosterV1p2AuthenticationError } from "./access-token.js";
import type { OneRosterV1p2QueryDiagnostic } from "./filter.js";
import type { OneRosterV1p2StatusInfo } from "../model/status.js";

/** A safe HTTP-header subset retained in REST diagnostics. */
export interface OneRosterV1p2SafeHeaders {
  readonly contentType?: string;
  readonly retryAfter?: string;
  readonly requestId?: string;
}

/** Common safe fields on every transport error. */
interface OneRosterV1p2RestErrorBase {
  readonly operationId: string;
  readonly message: string;
}

/** A validated configuration failure. */
export interface OneRosterV1p2ConfigurationError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2ConfigurationError";
  readonly code:
    | "invalid_service_url"
    | "invalid_operation_registry"
    | "missing_service_url"
    | "invalid_fetch"
    | "invalid_token_provider"
    | "invalid_retry_policy";
}

/** A query serialization failure. */
export interface OneRosterV1p2QueryError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2QueryError";
  readonly code: "invalid_query";
  readonly diagnostics: ReadonlyArray<OneRosterV1p2QueryDiagnostic>;
}

/** A path parameter failure. */
export interface OneRosterV1p2PathParameterError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2PathParameterError";
  readonly code: "missing_path_parameter" | "invalid_path_parameter";
  readonly parameter: string;
}

/** A caller-owned cancellation outcome. */
export interface OneRosterV1p2CancellationError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2CancellationError";
  readonly code: "cancelled";
}

/** A network or fetch rejection with no raw cause text. */
export interface OneRosterV1p2NetworkError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2NetworkError";
  readonly code: "network_failure";
}

/** A non-success HTTP result and optional parsed status payload. */
export interface OneRosterV1p2HttpError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2HttpError";
  readonly code: "http_failure";
  readonly status: number;
  readonly headers: OneRosterV1p2SafeHeaders;
  readonly statusInfo?: OneRosterV1p2StatusInfo;
  readonly statusPayloadMalformed: boolean;
}

/** A successful-status response with an unsupported content type. */
export interface OneRosterV1p2ContentTypeError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2ContentTypeError";
  readonly code: "unexpected_content_type";
  readonly contentType?: string;
}

/** A successful-status response that was not valid JSON. */
export interface OneRosterV1p2JsonError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2JsonError";
  readonly code: "malformed_json";
}

/** A response that failed its operation payload codec. */
export interface OneRosterV1p2PayloadError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2PayloadError";
  readonly code: "payload_validation_failure";
  readonly diagnostics: ReadonlyArray<{
    readonly code: string;
    readonly path: string;
  }>;
}

/** Invalid page headers or link relations. */
export interface OneRosterV1p2PaginationError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2PaginationError";
  readonly code: "malformed_pagination";
}

/** A caller-imposed bounded collection limit was reached. */
export interface OneRosterV1p2CollectionLimitError extends OneRosterV1p2RestErrorBase {
  readonly _tag: "OneRosterV1p2CollectionLimitError";
  readonly code: "collection_limit";
  readonly limitKind: "maxPages" | "maxItems" | "repeatedUrl";
}

/** All expected failures returned by the portable OneRoster REST transport. */
export type OneRosterV1p2RestError =
  | OneRosterV1p2ConfigurationError
  | OneRosterV1p2QueryError
  | OneRosterV1p2PathParameterError
  | OneRosterV1p2CancellationError
  | OneRosterV1p2NetworkError
  | OneRosterV1p2HttpError
  | OneRosterV1p2ContentTypeError
  | OneRosterV1p2JsonError
  | OneRosterV1p2PayloadError
  | OneRosterV1p2PaginationError
  | OneRosterV1p2CollectionLimitError
  | {
      readonly _tag: "OneRosterV1p2AuthenticationRestError";
      readonly operationId: string;
      readonly code: "authentication_failure";
      readonly authentication: OneRosterV1p2AuthenticationError;
      readonly message: string;
    };
