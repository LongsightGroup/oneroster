import { err, ok, type Result } from "../result.js";
import type { OneRosterRestQuery } from "./transport.js";

/** A version-neutral diagnostic produced while reading a public option object. */
export interface OneRosterRestRuntimeDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

/** Runtime options for a single REST read. */
export interface OneRosterRestReadOptions<TQuery extends OneRosterRestQuery> {
  readonly query?: TQuery;
  readonly signal?: AbortSignal;
}

/** Runtime options for bounded lazy traversal. */
export interface OneRosterRestIterationOptions<
  TQuery extends OneRosterRestQuery,
> extends OneRosterRestReadOptions<TQuery> {
  readonly maxPages: number;
  readonly maxItems?: number;
}

/** Runtime options for bounded collection materialization. */
export interface OneRosterRestCollectAllOptions<
  TQuery extends OneRosterRestQuery,
> extends OneRosterRestReadOptions<TQuery> {
  readonly maxPages: number;
  readonly maxItems: number;
}

interface ParsedRuntimeOptions<
  TQuery extends OneRosterRestQuery,
> extends OneRosterRestReadOptions<TQuery> {
  readonly maxPages?: number;
  readonly maxItems?: number;
}

/** Required cancellation input for a REST mutation. */
export interface OneRosterRestWriteOptions {
  readonly signal: AbortSignal;
}

/** Validated reader installed by a version-specific client adapter. */
export type OneRosterRestRuntimeOptionReader<
  TQuery extends OneRosterRestQuery,
  TError,
  TOptions extends OneRosterRestReadOptions<TQuery> = OneRosterRestReadOptions<TQuery>,
> = (input: unknown, operationId: string) => Result<TOptions, TError>;

/** Method-specific runtime option readers used by registry clients. */
export interface OneRosterRestRuntimeOptionReaders<TQuery extends OneRosterRestQuery, TError> {
  readonly read: OneRosterRestRuntimeOptionReader<TQuery, TError>;
  readonly iterate: OneRosterRestRuntimeOptionReader<
    TQuery,
    TError,
    OneRosterRestIterationOptions<TQuery>
  >;
  readonly collectAll: OneRosterRestRuntimeOptionReader<
    TQuery,
    TError,
    OneRosterRestCollectAllOptions<TQuery>
  >;
}

/** Validated reader for mutation options with required cancellation. */
export type OneRosterRestWriteOptionReader<TError> = (
  input: unknown,
  operationId: string,
) => Result<OneRosterRestWriteOptions, TError>;

/** Build method-specific option readers around version query and error policy. */
export function createOneRosterRestRuntimeOptionReaders<
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestRuntimeDiagnostic,
>(
  parseQuery: (input: unknown) => Result<TQuery, ReadonlyArray<TDiagnostic>>,
  createDiagnostic: (path: string, message: string) => TDiagnostic,
  createError: (operationId: string, diagnostics: ReadonlyArray<TDiagnostic>) => TError,
): OneRosterRestRuntimeOptionReaders<TQuery, TError> {
  const parse = (
    input: unknown,
    operationId: string,
  ): Result<ParsedRuntimeOptions<TQuery>, TError> => {
    if (input === undefined) return ok({});
    if (!isRecord(input)) {
      return err(
        createError(operationId, [createDiagnostic("$", "REST method options must be an object.")]),
      );
    }

    const query = input["query"];
    let parsedQuery: TQuery | undefined;
    if (query !== undefined) {
      const result = parseQuery(query);
      if (result._tag === "err") return err(createError(operationId, result.error));
      parsedQuery = result.value;
    }

    const signal = input["signal"];
    if (signal !== undefined && !isAbortSignal(signal)) {
      return err(
        createError(operationId, [createDiagnostic("$.signal", "signal must be an AbortSignal.")]),
      );
    }

    const maxPages = positiveBound(input["maxPages"], "$.maxPages");
    if (maxPages._tag === "err") {
      return err(createError(operationId, [createDiagnostic(maxPages.path, maxPages.message)]));
    }
    const maxItems = positiveBound(input["maxItems"], "$.maxItems");
    if (maxItems._tag === "err") {
      return err(createError(operationId, [createDiagnostic(maxItems.path, maxItems.message)]));
    }

    return ok({
      ...(parsedQuery === undefined ? {} : { query: parsedQuery }),
      ...(signal === undefined ? {} : { signal }),
      ...(maxPages.value === undefined ? {} : { maxPages: maxPages.value }),
      ...(maxItems.value === undefined ? {} : { maxItems: maxItems.value }),
    });
  };

  const read: OneRosterRestRuntimeOptionReader<TQuery, TError> = (input, operationId) => {
    const parsed = parse(input, operationId);
    if (parsed._tag === "err") return parsed;
    return ok({
      ...(parsed.value.query === undefined ? {} : { query: parsed.value.query }),
      ...(parsed.value.signal === undefined ? {} : { signal: parsed.value.signal }),
    });
  };

  const iterate: OneRosterRestRuntimeOptionReaders<TQuery, TError>["iterate"] = (
    input,
    operationId,
  ) => {
    const parsed = parse(input, operationId);
    if (parsed._tag === "err") return parsed;
    if (parsed.value.maxPages === undefined) {
      return err(
        createError(operationId, [
          createDiagnostic("$.maxPages", "maxPages is required for collection traversal."),
        ]),
      );
    }
    return ok({
      maxPages: parsed.value.maxPages,
      ...(parsed.value.maxItems === undefined ? {} : { maxItems: parsed.value.maxItems }),
      ...(parsed.value.query === undefined ? {} : { query: parsed.value.query }),
      ...(parsed.value.signal === undefined ? {} : { signal: parsed.value.signal }),
    });
  };

  const collectAll: OneRosterRestRuntimeOptionReaders<TQuery, TError>["collectAll"] = (
    input,
    operationId,
  ) => {
    const parsed = parse(input, operationId);
    if (parsed._tag === "err") return parsed;
    if (parsed.value.maxPages === undefined) {
      return err(
        createError(operationId, [
          createDiagnostic("$.maxPages", "maxPages is required for collection traversal."),
        ]),
      );
    }
    if (parsed.value.maxItems === undefined) {
      return err(
        createError(operationId, [
          createDiagnostic("$.maxItems", "maxItems is required when collecting all pages."),
        ]),
      );
    }
    return ok({
      maxPages: parsed.value.maxPages,
      maxItems: parsed.value.maxItems,
      ...(parsed.value.query === undefined ? {} : { query: parsed.value.query }),
      ...(parsed.value.signal === undefined ? {} : { signal: parsed.value.signal }),
    });
  };

  return { read, iterate, collectAll };
}

/** Build a runtime reader that requires an AbortSignal for every mutation. */
export function createOneRosterRestWriteOptionReader<
  TError,
  TDiagnostic extends OneRosterRestRuntimeDiagnostic,
>(
  createDiagnostic: (path: string, message: string) => TDiagnostic,
  createError: (operationId: string, diagnostics: ReadonlyArray<TDiagnostic>) => TError,
): OneRosterRestWriteOptionReader<TError> {
  return (input, operationId) => {
    if (!isRecord(input)) {
      return err(
        createError(operationId, [
          createDiagnostic("$", "REST mutation options must be an object."),
        ]),
      );
    }

    const signal = input["signal"];
    if (!isAbortSignal(signal)) {
      return err(
        createError(operationId, [createDiagnostic("$.signal", "signal must be an AbortSignal.")]),
      );
    }

    return ok({ signal });
  };
}

function positiveBound(
  input: unknown,
  path: string,
):
  | { readonly _tag: "ok"; readonly value: number | undefined }
  | { readonly _tag: "err"; readonly path: string; readonly message: string } {
  if (input === undefined) return { _tag: "ok", value: undefined };
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input <= 0) {
    return { _tag: "err", path, message: "Collection bounds must be positive safe integers." };
  }
  return { _tag: "ok", value: input };
}

function isAbortSignal(input: unknown): input is AbortSignal {
  if (!isRecord(input)) return false;
  return (
    typeof input["aborted"] === "boolean" &&
    typeof input["addEventListener"] === "function" &&
    typeof input["removeEventListener"] === "function"
  );
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
