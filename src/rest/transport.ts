import { err, ok, type Result } from "../result.js";
import { hasMoreOneRosterRestPage, type OneRosterRestPageMetadata } from "./page.js";
import {
  parseOneRosterRestRetryAfter,
  scheduleOneRosterRestRetry,
  type OneRosterRestRetryClock,
  type OneRosterRestRetryPolicy,
} from "./retry.js";

/** The operation shape required by the version-neutral REST mechanics. */
export interface OneRosterRestOperation {
  readonly operationId: string;
  readonly method: string;
  readonly pathParameters: ReadonlyArray<string>;
  readonly responseKind: "collection" | "singleton" | "write" | "noContent";
  readonly successStatuses: ReadonlyArray<number>;
}

/** The query shape required by the version-neutral REST mechanics. */
export interface OneRosterRestQuery<TFilter = unknown> {
  readonly limit?: number;
  readonly offset?: number;
  readonly sort?: string;
  readonly orderBy?: "asc" | "desc";
  readonly filter?: TFilter;
  readonly fields?: ReadonlyArray<string>;
}

/** A portable fetch-compatible function seam. */
export type OneRosterRestFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** A parsed response returned by the shared REST mechanics. */
export interface OneRosterRestTransportResponse<TValue> {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly data?: TValue;
}

/** Minimum diagnostic contract required by shared REST payload handling. */
export interface OneRosterRestPayloadDiagnostic {
  readonly code: string;
  readonly path: string;
}

/** A request through the shared REST mechanics. */
export interface OneRosterRestTransportRequest<
  TOperation,
  TQuery,
  TValue,
  TDiagnostic extends OneRosterRestPayloadDiagnostic = OneRosterRestPayloadDiagnostic,
> {
  readonly operation: TOperation;
  readonly pathParameters?: Readonly<Record<string, string>>;
  readonly query?: TQuery;
  readonly body?: unknown;
  readonly responseParser?: (
    input: unknown,
    path: string,
  ) => Result<TValue, ReadonlyArray<TDiagnostic>>;
  readonly signal?: AbortSignal;
}

/** A collection request through the shared REST mechanics. */
export interface OneRosterRestCollectionRequest<
  TOperation,
  TQuery,
  TValue,
  TDiagnostic extends OneRosterRestPayloadDiagnostic = OneRosterRestPayloadDiagnostic,
> {
  readonly operation: TOperation;
  readonly pathParameters?: Readonly<Record<string, string>>;
  readonly query?: TQuery;
  readonly parsePayload: (
    input: unknown,
    path: string,
  ) => Result<ReadonlyArray<TValue>, ReadonlyArray<TDiagnostic>>;
  readonly signal?: AbortSignal;
}

/** Bounds for deterministic collection traversal. */
export interface OneRosterRestCollectionBounds {
  readonly maxPages: number;
  readonly maxItems: number;
}

/** Bounds for lazy collection traversal. */
export interface OneRosterRestIterationBounds {
  readonly maxPages: number;
  readonly maxItems?: number;
}

/** Safe response headers retained by versioned error and page adapters. */
export function snapshotOneRosterRestHeaders(headers: Headers): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const name of ["content-type", "x-total-count", "link", "retry-after", "x-request-id"]) {
    const value = headers.get(name);
    if (value !== null) result[name] = value;
  }
  return result;
}

/** Check whether a response advertises a JSON-compatible media type. */
export function isOneRosterRestJsonContentType(contentType: string | undefined): boolean {
  if (contentType === undefined) return false;
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
}

/** Recognize the Web Platform's standard abort failure shape. */
export function isOneRosterRestAbortCause(cause: unknown): boolean {
  return (
    typeof cause === "object" && cause !== null && "name" in cause && cause.name === "AbortError"
  );
}

/** Merge an authorization result into a request header set. */
export function setOneRosterRestHeaders(headers: Headers, value: HeadersInit): void {
  const additions = new Headers(value);
  additions.forEach((headerValue, headerName) => headers.set(headerName, headerValue));
}

/** Version-specific failures required by the shared REST mechanics. */
export interface OneRosterRestMechanicsErrors<TError> {
  readonly cancellation: (operationId: string) => TError;
  readonly network: (operationId: string) => TError;
  readonly authorization: (operationId: string) => TError;
  readonly contentType: (operationId: string, contentType: string | undefined) => TError;
  readonly json: (operationId: string) => TError;
  readonly payload: (
    operationId: string,
    diagnostics: ReadonlyArray<{ readonly code: string; readonly path: string }>,
  ) => TError;
  readonly pagination: (operationId: string) => TError;
  readonly collectionLimit: (
    operationId: string,
    limitKind: "maxPages" | "maxItems" | "repeatedUrl",
  ) => TError;
}

/** Configuration hooks that keep version-specific URL, auth, and error policy at the seam. */
export interface OneRosterRestMechanicsConfiguration<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
> {
  readonly fetch: OneRosterRestFetch;
  readonly retryPolicy?: OneRosterRestRetryPolicy;
  readonly retryClock: OneRosterRestRetryClock;
  readonly resolveUrl: (
    operation: TOperation,
    pathParameters: Readonly<Record<string, string>> | undefined,
    query: TQuery | undefined,
  ) => Result<string, TError>;
  readonly authorize: (input: {
    readonly request: Request;
    readonly operation: TOperation;
    readonly signal: AbortSignal;
  }) => Promise<Result<HeadersInit, TError>>;
  readonly parseHttpError: (
    operationId: string,
    response: Response,
    headers: Readonly<Record<string, string>>,
  ) => Promise<TError>;
  readonly parsePageMetadata: (
    headers: Headers,
    query: TQuery | undefined,
    operationId: string,
  ) => Result<OneRosterRestPageMetadata, TError>;
  readonly withQueryOffset: (
    query: TQuery | undefined,
    offset: number,
    operationId: string,
  ) => Result<TQuery, TError>;
  readonly queryFromLink: (
    link: string,
    current: TQuery | undefined,
    fallbackOffset: number,
    operationId: string,
  ) => Result<TQuery, TError>;
  readonly skipResponseBody: (operation: TOperation) => boolean;
  readonly errors: OneRosterRestMechanicsErrors<TError>;
}

/** The common transport contract implemented by each versioned public adapter. */
export interface OneRosterRestMechanics<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestPayloadDiagnostic = OneRosterRestPayloadDiagnostic,
> {
  request<TValue>(
    input: OneRosterRestTransportRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestTransportResponse<TValue>, TError>>;
  requestPage<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestPage<TValue>, TError>>;
  iteratePages<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestIterationBounds,
  ): AsyncGenerator<Result<OneRosterRestPage<TValue>, TError>, void, void>;
  collectAll<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestCollectionBounds,
  ): Promise<Result<ReadonlyArray<TValue>, TError>>;
}

/** A page returned by the shared transport mechanics. */
export interface OneRosterRestPage<TValue> extends OneRosterRestPageMetadata {
  readonly items: ReadonlyArray<TValue>;
}

type OneRosterRestFetchAttempt<TError> =
  | { readonly _tag: "response"; readonly response: Response }
  | {
      readonly _tag: "failure";
      readonly error: TError;
      readonly retryConnection: boolean;
    };

/** Create version-neutral request, response, pagination, and bounded traversal mechanics. */
export function createOneRosterRestMechanics<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestPayloadDiagnostic = OneRosterRestPayloadDiagnostic,
>(
  configuration: OneRosterRestMechanicsConfiguration<TOperation, TQuery, TError>,
): OneRosterRestMechanics<TOperation, TQuery, TError, TDiagnostic> {
  const request = async <TValue>(
    input: OneRosterRestTransportRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestTransportResponse<TValue>, TError>> => {
    const signal = input.signal ?? new AbortController().signal;
    if (signal.aborted) return err(configuration.errors.cancellation(input.operation.operationId));
    const url = configuration.resolveUrl(input.operation, input.pathParameters, input.query);
    if (url._tag === "err") return url;

    let body: string | undefined;
    if (input.body !== undefined) {
      try {
        body = JSON.stringify(input.body);
      } catch (cause: unknown) {
        void cause;
        return err(
          configuration.errors.payload(input.operation.operationId, [
            { code: "payload.invalid_value", path: "$.body" },
          ]),
        );
      }
      if (body === undefined) {
        return err(
          configuration.errors.payload(input.operation.operationId, [
            { code: "payload.invalid_value", path: "$.body" },
          ]),
        );
      }
    }

    const startedAt = configuration.retryClock.nowMilliseconds();
    let attempt = 1;
    let response: Response;
    while (true) {
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: retry attempts are intentionally sequential and bounded.
      const fetchAttempt = await performOneRosterRestFetchAttempt(configuration, {
        url: url.value,
        operation: input.operation,
        body,
        signal,
      });
      if (fetchAttempt._tag === "failure") {
        if (
          !fetchAttempt.retryConnection ||
          configuration.retryPolicy?.retryConnectionErrors !== true
        ) {
          return err(fetchAttempt.error);
        }
        // oxlint-disable-next-line no-await-in-loop -- SAFETY: backoff must complete before the next bounded fetch attempt.
        const retry = await scheduleOneRosterRestRetry({
          policy: configuration.retryPolicy,
          method: input.operation.method,
          attempt,
          startedAtMilliseconds: startedAt,
          retryAfterMilliseconds: undefined,
          clock: configuration.retryClock,
          signal,
        });
        if (retry === "cancelled") {
          return err(configuration.errors.cancellation(input.operation.operationId));
        }
        if (retry === "retry") {
          attempt += 1;
          continue;
        }
        return err(fetchAttempt.error);
      }
      response = fetchAttempt.response;

      if (
        !input.operation.successStatuses.includes(response.status) &&
        configuration.retryPolicy?.statusCodes.has(response.status) === true
      ) {
        // oxlint-disable-next-line no-await-in-loop -- SAFETY: backoff must complete before the next bounded fetch attempt.
        const retry = await scheduleOneRosterRestRetry({
          policy: configuration.retryPolicy,
          method: input.operation.method,
          attempt,
          startedAtMilliseconds: startedAt,
          retryAfterMilliseconds: parseOneRosterRestRetryAfter(
            response.headers.get("retry-after"),
            configuration.retryClock.nowMilliseconds(),
          ),
          clock: configuration.retryClock,
          signal,
        });
        if (retry === "cancelled") {
          return err(configuration.errors.cancellation(input.operation.operationId));
        }
        if (retry === "retry") {
          try {
            // oxlint-disable-next-line no-await-in-loop -- SAFETY: release this failed response before the next bounded attempt.
            await response.body?.cancel();
          } catch (cause: unknown) {
            void cause;
          }
          attempt += 1;
          continue;
        }
      }
      break;
    }

    const safeHeaders = snapshotOneRosterRestHeaders(response.headers);
    if (!input.operation.successStatuses.includes(response.status)) {
      return err(
        await configuration.parseHttpError(input.operation.operationId, response, safeHeaders),
      );
    }
    if (
      input.operation.responseKind === "noContent" ||
      response.status === 204 ||
      configuration.skipResponseBody(input.operation)
    ) {
      return ok({ status: response.status, headers: safeHeaders });
    }
    const contentType = response.headers.get("content-type") ?? undefined;
    if (!isOneRosterRestJsonContentType(contentType)) {
      return err(configuration.errors.contentType(input.operation.operationId, contentType));
    }
    let text: string;
    try {
      text = await response.text();
    } catch (cause: unknown) {
      if (signal.aborted || isOneRosterRestAbortCause(cause)) {
        return err(configuration.errors.cancellation(input.operation.operationId));
      }
      return err(configuration.errors.network(input.operation.operationId));
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (cause: unknown) {
      void cause;
      return err(configuration.errors.json(input.operation.operationId));
    }
    if (input.responseParser === undefined) {
      return err(
        configuration.errors.payload(input.operation.operationId, [
          { code: "payload.invalid_value", path: "$" },
        ]),
      );
    }
    const parsed = input.responseParser(json, "$");
    if (parsed._tag === "err") {
      return err(configuration.errors.payload(input.operation.operationId, parsed.error));
    }
    return ok({ status: response.status, headers: safeHeaders, data: parsed.value });
  };

  const requestPage = async <TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestPage<TValue>, TError>> => {
    const response = await request({
      operation: input.operation,
      ...(input.pathParameters === undefined ? {} : { pathParameters: input.pathParameters }),
      ...(input.query === undefined ? {} : { query: input.query }),
      responseParser: input.parsePayload,
      ...(input.signal === undefined ? {} : { signal: input.signal }),
    });
    if (response._tag === "err") return response;
    if (response.value.data === undefined) {
      return err(
        configuration.errors.payload(input.operation.operationId, [
          { code: "payload.invalid_value", path: "$" },
        ]),
      );
    }
    const metadata = configuration.parsePageMetadata(
      new Headers(response.value.headers),
      input.query,
      input.operation.operationId,
    );
    if (metadata._tag === "err") return metadata;
    return ok({ items: response.value.data, ...metadata.value });
  };

  const iteratePages = async function* <TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestIterationBounds,
  ): AsyncGenerator<Result<OneRosterRestPage<TValue>, TError>, void, void> {
    if (!validBound(input.maxPages)) {
      yield err(configuration.errors.collectionLimit(input.operation.operationId, "maxPages"));
      return;
    }
    if (input.maxItems !== undefined && !validBound(input.maxItems)) {
      yield err(configuration.errors.collectionLimit(input.operation.operationId, "maxItems"));
      return;
    }
    let query = input.query;
    let pages = 0;
    let itemCount = 0;
    const visited = new Set<string>();
    while (true) {
      if (pages >= input.maxPages) {
        yield err(configuration.errors.collectionLimit(input.operation.operationId, "maxPages"));
        return;
      }
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: page traversal depends on the validated next link.
      const page = await requestPage({
        operation: input.operation,
        parsePayload: input.parsePayload,
        ...(input.pathParameters === undefined ? {} : { pathParameters: input.pathParameters }),
        ...(query === undefined ? {} : { query }),
        ...(input.signal === undefined ? {} : { signal: input.signal }),
      });
      if (page._tag === "err") {
        yield page;
        return;
      }
      pages += 1;
      if (input.maxItems !== undefined && itemCount + page.value.items.length > input.maxItems) {
        yield err(configuration.errors.collectionLimit(input.operation.operationId, "maxItems"));
        return;
      }
      itemCount += page.value.items.length;
      yield page;
      if (!hasMoreOneRosterRestPage(page.value)) return;
      const next = page.value.links.next;
      if (next === undefined) {
        const nextQuery = configuration.withQueryOffset(
          query,
          page.value.offset + page.value.items.length,
          input.operation.operationId,
        );
        if (nextQuery._tag === "err") {
          yield nextQuery;
          return;
        }
        query = nextQuery.value;
        continue;
      }
      if (visited.has(next)) {
        yield err(configuration.errors.collectionLimit(input.operation.operationId, "repeatedUrl"));
        return;
      }
      visited.add(next);
      const nextQuery = configuration.queryFromLink(
        next,
        query,
        page.value.offset + page.value.items.length,
        input.operation.operationId,
      );
      if (nextQuery._tag === "err") {
        yield nextQuery;
        return;
      }
      query = nextQuery.value;
    }
  };

  const collectAll = async <TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestCollectionBounds,
  ): Promise<Result<ReadonlyArray<TValue>, TError>> => {
    const items: Array<TValue> = [];
    for await (const page of iteratePages(input)) {
      if (page._tag === "err") return page;
      items.push(...page.value.items);
    }
    return ok(items);
  };

  return { request, requestPage, iteratePages, collectAll };
}

async function performOneRosterRestFetchAttempt<TOperation extends OneRosterRestOperation, TError>(
  configuration: {
    readonly fetch: OneRosterRestFetch;
    readonly authorize: (input: {
      readonly request: Request;
      readonly operation: TOperation;
      readonly signal: AbortSignal;
    }) => Promise<Result<HeadersInit, TError>>;
    readonly errors: Pick<
      OneRosterRestMechanicsErrors<TError>,
      "authorization" | "cancellation" | "network"
    >;
  },
  input: {
    readonly url: string;
    readonly operation: TOperation;
    readonly body: string | undefined;
    readonly signal: AbortSignal;
  },
): Promise<OneRosterRestFetchAttempt<TError>> {
  const headers = new Headers({ Accept: "application/json" });
  if (input.body !== undefined) headers.set("Content-Type", "application/json");

  let request: Request;
  try {
    request = new Request(input.url, {
      method: input.operation.method,
      headers,
      ...(input.body === undefined ? {} : { body: input.body }),
      signal: input.signal,
    });
  } catch (cause: unknown) {
    void cause;
    return {
      _tag: "failure",
      error: configuration.errors.network(input.operation.operationId),
      retryConnection: false,
    };
  }

  let authorization: Result<HeadersInit, TError>;
  try {
    authorization = await configuration.authorize({
      request,
      operation: input.operation,
      signal: input.signal,
    });
  } catch (cause: unknown) {
    return {
      _tag: "failure",
      error:
        input.signal.aborted || isOneRosterRestAbortCause(cause)
          ? configuration.errors.cancellation(input.operation.operationId)
          : configuration.errors.authorization(input.operation.operationId),
      retryConnection: false,
    };
  }
  if (authorization._tag === "err") {
    return { _tag: "failure", error: authorization.error, retryConnection: false };
  }
  setOneRosterRestHeaders(headers, authorization.value);

  try {
    const init: RequestInit = { method: input.operation.method, headers, signal: input.signal };
    if (input.body !== undefined) init.body = input.body;
    const response = await configuration.fetch(input.url, init);
    return { _tag: "response", response };
  } catch (cause: unknown) {
    return {
      _tag: "failure",
      error:
        input.signal.aborted || isOneRosterRestAbortCause(cause)
          ? configuration.errors.cancellation(input.operation.operationId)
          : configuration.errors.network(input.operation.operationId),
      retryConnection: !input.signal.aborted && !isOneRosterRestAbortCause(cause),
    };
  }
}

function validBound(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}
