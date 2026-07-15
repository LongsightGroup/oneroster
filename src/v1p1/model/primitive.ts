import { err, ok, type Result } from "../../result.js";

/** Stable diagnostics emitted while decoding OneRoster 1.1 JSON. */
export type OneRosterV1p1PayloadDiagnosticCode =
  | "payload.invalid_type"
  | "payload.missing_property"
  | "payload.invalid_value"
  | "payload.invalid_format";

/** A safe, path-aware diagnostic that does not retain rejected payload values. */
export interface OneRosterV1p1PayloadDiagnostic {
  readonly _tag: "OneRosterV1p1PayloadDiagnostic";
  readonly code: OneRosterV1p1PayloadDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

/** A parser used at the untrusted JSON boundary. */
export type OneRosterV1p1PayloadParser<TValue> = (
  input: unknown,
  path: string,
) => Result<TValue, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>>;

/** A parsed OneRoster sourced identifier. */
export type OneRosterV1p1SourcedId = string & {
  readonly __oneRosterV1p1SourcedId: unique symbol;
};

/** A parsed OneRoster calendar date. */
export type OneRosterV1p1Date = string & { readonly __oneRosterV1p1Date: unique symbol };

/** A parsed UTC date-time. */
export type OneRosterV1p1DateTime = string & {
  readonly __oneRosterV1p1DateTime: unique symbol;
};

/** A JSON-safe metadata extension value. */
export type OneRosterV1p1JsonValue =
  | null
  | boolean
  | number
  | string
  | ReadonlyArray<OneRosterV1p1JsonValue>
  | OneRosterV1p1JsonObject;

/** A JSON object accepted by the v1.1 metadata extension point. */
export interface OneRosterV1p1JsonObject {
  readonly [property: string]: OneRosterV1p1JsonValue;
}

/** OneRoster 1.1 lifecycle status. */
export type OneRosterV1p1LifecycleStatus = "active" | "tobedeleted";

/** An explicitly namespaced vocabulary extension. */
export type OneRosterV1p1ExtensionToken = string & {
  readonly __oneRosterV1p1ExtensionToken: unique symbol;
};

function diagnostic(
  code: OneRosterV1p1PayloadDiagnosticCode,
  path: string,
  message: string,
): OneRosterV1p1PayloadDiagnostic {
  return { _tag: "OneRosterV1p1PayloadDiagnostic", code, path, message };
}

function invalid(
  code: OneRosterV1p1PayloadDiagnosticCode,
  path: string,
  message: string,
): Result<never, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  return err([diagnostic(code, path, message)]);
}

/** Parse a non-empty string. */
export function parseOneRosterV1p1StringAt(
  input: unknown,
  path: string,
): Result<string, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  if (typeof input !== "string") return invalid("payload.invalid_type", path, "Expected a string.");
  if (input.length === 0)
    return invalid("payload.invalid_value", path, "Expected a non-empty string.");
  return ok(input);
}

/** Parse a sourcedId. */
export function parseOneRosterV1p1SourcedIdAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1SourcedId, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  const parsed = parseOneRosterV1p1StringAt(input, path);
  if (parsed._tag === "err") return parsed;
  // SAFETY: the non-empty string parser established the sourcedId invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: validated sourcedId string.
  return ok(parsed.value as OneRosterV1p1SourcedId);
}

/** Parse a sourcedId from unknown JSON. */
export function parseOneRosterV1p1SourcedId(
  input: unknown,
): Result<OneRosterV1p1SourcedId, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  return parseOneRosterV1p1SourcedIdAt(input, "$");
}

/** Parse an ISO calendar date. */
export function parseOneRosterV1p1DateAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1Date, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  const parsed = parseOneRosterV1p1StringAt(input, path);
  if (parsed._tag === "err") return parsed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.value))
    return invalid("payload.invalid_format", path, "Expected an ISO calendar date.");
  const date = new Date(`${parsed.value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== parsed.value)
    return invalid("payload.invalid_format", path, "Expected a valid ISO calendar date.");
  // SAFETY: lexical and calendar validation established the date invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: validated date string.
  return ok(parsed.value as OneRosterV1p1Date);
}

/** Parse a calendar date from unknown JSON. */
export function parseOneRosterV1p1Date(
  input: unknown,
): Result<OneRosterV1p1Date, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  return parseOneRosterV1p1DateAt(input, "$");
}

/** Parse and canonicalize a UTC date-time. */
export function parseOneRosterV1p1DateTimeAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1DateTime, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  const parsed = parseOneRosterV1p1StringAt(input, path);
  if (parsed._tag === "err") return parsed;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(parsed.value)
  )
    return invalid("payload.invalid_format", path, "Expected an RFC 3339 date-time.");
  const date = new Date(parsed.value);
  if (Number.isNaN(date.getTime()))
    return invalid("payload.invalid_format", path, "Expected a valid date-time.");
  // SAFETY: lexical and Date validation established the date-time invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: validated date-time string.
  return ok(date.toISOString() as OneRosterV1p1DateTime);
}

/** Parse a date-time from unknown JSON. */
export function parseOneRosterV1p1DateTime(
  input: unknown,
): Result<OneRosterV1p1DateTime, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  return parseOneRosterV1p1DateTimeAt(input, "$");
}

/** Parse a finite JSON number. */
export function parseOneRosterV1p1NumberAt(
  input: unknown,
  path: string,
): Result<number, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  return typeof input === "number" && Number.isFinite(input)
    ? ok(input)
    : invalid("payload.invalid_type", path, "Expected a finite number.");
}

/** Parse the OneRoster boolean enumeration. */
export function parseOneRosterV1p1BooleanAt(
  input: unknown,
  path: string,
): Result<"true" | "false", ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  const parsed = parseOneRosterV1p1StringAt(input, path);
  if (parsed._tag === "err") return parsed;
  return parsed.value === "true" || parsed.value === "false"
    ? ok(parsed.value)
    : invalid("payload.invalid_value", path, "Expected the OneRoster true/false vocabulary.");
}

/** Parse a non-empty string array. */
export function parseOneRosterV1p1StringArrayAt(
  input: unknown,
  path: string,
): Result<ReadonlyArray<string>, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  if (!Array.isArray(input)) return invalid("payload.invalid_type", path, "Expected an array.");
  const values: Array<string> = [];
  for (const [index, value] of input.entries()) {
    const parsed = parseOneRosterV1p1StringAt(value, `${path}[${index}]`);
    if (parsed._tag === "err") return parsed;
    values.push(parsed.value);
  }
  return ok(values);
}

/** Parse a JSON-safe metadata object. */
export function parseOneRosterV1p1MetadataAt(
  input: unknown,
  path: string,
): Result<
  Readonly<Record<string, OneRosterV1p1JsonValue>>,
  ReadonlyArray<OneRosterV1p1PayloadDiagnostic>
> {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    return invalid("payload.invalid_type", path, "Expected a metadata object.");
  const result: Record<string, OneRosterV1p1JsonValue> = {};
  for (const [key, value] of Object.entries(input)) {
    const parsed = parseJsonValueAt(value, `${path}.${key}`);
    if (parsed._tag === "err") return parsed;
    result[key] = parsed.value;
  }
  return ok(result);
}

function parseJsonValueAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1JsonValue, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  if (input === null || typeof input === "string" || typeof input === "boolean") return ok(input);
  if (typeof input === "number") {
    return Number.isFinite(input)
      ? ok(input)
      : invalid("payload.invalid_value", path, "Expected a finite JSON number.");
  }
  if (Array.isArray(input)) {
    const values: Array<OneRosterV1p1JsonValue> = [];
    for (const [index, value] of input.entries()) {
      const parsed = parseJsonValueAt(value, `${path}[${index}]`);
      if (parsed._tag === "err") return parsed;
      values.push(parsed.value);
    }
    return ok(values);
  }
  if (typeof input !== "object")
    return invalid("payload.invalid_type", path, "Expected a JSON value.");
  const result: Record<string, OneRosterV1p1JsonValue> = {};
  for (const [key, value] of Object.entries(input)) {
    const parsed = parseJsonValueAt(value, `${path}.${key}`);
    if (parsed._tag === "err") return parsed;
    result[key] = parsed.value;
  }
  return ok(result);
}

/** Parse a closed vocabulary token. */
export function parseOneRosterV1p1TokenAt<TToken extends string>(
  input: unknown,
  path: string,
  tokens: ReadonlyArray<TToken>,
): Result<TToken, ReadonlyArray<OneRosterV1p1PayloadDiagnostic>> {
  const value = parseOneRosterV1p1StringAt(input, path);
  if (value._tag === "err") return value;
  const token = tokens.find((candidate) => candidate === value.value);
  return token === undefined
    ? invalid("payload.invalid_value", path, "The value is not in the required vocabulary.")
    : ok(token);
}
