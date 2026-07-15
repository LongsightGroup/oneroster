import type { OneRosterV1p1AuthorizationError } from "./authorization.js";
import type { OneRosterV1p1QueryDiagnostic } from "./query.js";

/** Safe headers retained in v1.1 REST errors. */
export interface OneRosterV1p1SafeHeaders {
  readonly contentType?: string;
  readonly retryAfter?: string;
  readonly requestId?: string;
}

interface BaseError {
  readonly operationId: string;
  readonly message: string;
}

/** Invalid client configuration. */
export interface OneRosterV1p1ConfigurationError extends BaseError {
  readonly _tag: "OneRosterV1p1ConfigurationError";
  readonly code:
    | "invalid_base_url"
    | "invalid_operation_registry"
    | "missing_base_url"
    | "invalid_fetch"
    | "invalid_authorizer"
    | "invalid_retry_policy";
}

/** Query serialization failure. */
export interface OneRosterV1p1QueryError extends BaseError {
  readonly _tag: "OneRosterV1p1QueryError";
  readonly code: "invalid_query";
  readonly diagnostics: ReadonlyArray<OneRosterV1p1QueryDiagnostic>;
}

/** Path parameter failure. */
export interface OneRosterV1p1PathParameterError extends BaseError {
  readonly _tag: "OneRosterV1p1PathParameterError";
  readonly code: "missing_path_parameter" | "invalid_path_parameter";
  readonly parameter: string;
}

/** Caller-owned cancellation. */
export interface OneRosterV1p1CancellationError extends BaseError {
  readonly _tag: "OneRosterV1p1CancellationError";
  readonly code: "cancelled";
}

/** Fetch or authorizer network failure without raw cause text. */
export interface OneRosterV1p1NetworkError extends BaseError {
  readonly _tag: "OneRosterV1p1NetworkError";
  readonly code: "network_failure";
}

/** A non-success HTTP result. */
export interface OneRosterV1p1HttpError extends BaseError {
  readonly _tag: "OneRosterV1p1HttpError";
  readonly code: "http_failure";
  readonly status: number;
  readonly headers: OneRosterV1p1SafeHeaders;
  readonly statusPayloadMalformed: boolean;
}

/** Successful HTTP response with non-JSON content. */
export interface OneRosterV1p1ContentTypeError extends BaseError {
  readonly _tag: "OneRosterV1p1ContentTypeError";
  readonly code: "unexpected_content_type";
  readonly contentType?: string;
}

/** Successful HTTP response with malformed JSON. */
export interface OneRosterV1p1JsonError extends BaseError {
  readonly _tag: "OneRosterV1p1JsonError";
  readonly code: "malformed_json";
}

/** Successful HTTP response that failed a model codec. */
export interface OneRosterV1p1PayloadError extends BaseError {
  readonly _tag: "OneRosterV1p1PayloadError";
  readonly code: "payload_validation_failure";
  readonly diagnostics: ReadonlyArray<{ readonly code: string; readonly path: string }>;
}

/** Malformed pagination metadata. */
export interface OneRosterV1p1PaginationError extends BaseError {
  readonly _tag: "OneRosterV1p1PaginationError";
  readonly code: "malformed_pagination";
}

/** A bounded traversal stopped before it could complete. */
export interface OneRosterV1p1CollectionLimitError extends BaseError {
  readonly _tag: "OneRosterV1p1CollectionLimitError";
  readonly code: "collection_limit";
  readonly limitKind: "maxPages" | "maxItems" | "repeatedUrl";
}

/** All expected failures from v1.1 REST operations. */
export type OneRosterV1p1RestError =
  | OneRosterV1p1ConfigurationError
  | OneRosterV1p1QueryError
  | OneRosterV1p1PathParameterError
  | OneRosterV1p1CancellationError
  | OneRosterV1p1NetworkError
  | OneRosterV1p1HttpError
  | OneRosterV1p1ContentTypeError
  | OneRosterV1p1JsonError
  | OneRosterV1p1PayloadError
  | OneRosterV1p1PaginationError
  | OneRosterV1p1CollectionLimitError
  | {
      readonly _tag: "OneRosterV1p1AuthorizationRestError";
      readonly code: "authorization_failure";
      readonly operationId: string;
      readonly authorization: OneRosterV1p1AuthorizationError;
      readonly message: string;
    };
