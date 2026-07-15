import { err, ok, type Result } from "../../result.js";
import {
  createOneRosterV1p2PayloadDiagnostic,
  oneRosterV1p2IndexPath,
  type OneRosterV1p2PayloadDiagnostic,
  type OneRosterV1p2PayloadParser,
} from "./json-value.js";

/** A parsed OneRoster sourced identifier. */
export type OneRosterV1p2SourcedId = string & { readonly __oneRosterV1p2SourcedId: unique symbol };

/** A parsed absolute URI used by OneRoster reference hrefs and profile IDs. */
export type OneRosterV1p2Uri = string & { readonly __oneRosterV1p2Uri: unique symbol };

/** A parsed calendar date in `YYYY-MM-DD` form. */
export type OneRosterV1p2Date = string & { readonly __oneRosterV1p2Date: unique symbol };

/** A canonical UTC instant emitted by the OneRoster 1.2 REST date-time parser. */
export type OneRosterV1p2DateTime = string & { readonly __oneRosterV1p2DateTime: unique symbol };

/** An extensible OneRoster vocabulary token. */
export type OneRosterV1p2ExtensionToken = string & {
  readonly __oneRosterV1p2ExtensionToken: unique symbol;
};

/** The OneRoster entity lifecycle vocabulary. */
export type OneRosterV1p2LifecycleStatus = "active" | "tobedeleted";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

function invalid(
  code: "payload.invalid_type" | "payload.invalid_value" | "payload.invalid_format",
  path: string,
  message: string,
): Result<never, Diagnostics> {
  return err([createOneRosterV1p2PayloadDiagnostic(code, path, message)]);
}

/** Parse a non-empty text value without retaining rejected input in diagnostics. */
export function parseOneRosterV1p2StringAt(
  input: unknown,
  path: string,
): Result<string, Diagnostics> {
  if (typeof input !== "string") {
    return invalid("payload.invalid_type", path, "Expected a string.");
  }
  if (input.length === 0) {
    return invalid("payload.invalid_value", path, "Expected a non-empty string.");
  }
  return ok(input);
}

/** Parse a sourced identifier at a nested JSON path. */
export function parseOneRosterV1p2SourcedIdAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2SourcedId, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  // SAFETY: parseOneRosterV1p2StringAt established the non-empty sourcedId invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the non-empty string parser established the sourcedId invariant.
  return ok(parsed.value as OneRosterV1p2SourcedId);
}

/** Parse a sourced identifier from an unknown JSON value. */
export function parseOneRosterV1p2SourcedId(
  input: unknown,
): Result<OneRosterV1p2SourcedId, Diagnostics> {
  return parseOneRosterV1p2SourcedIdAt(input, "$");
}

/** Parse an absolute URI from an unknown JSON value. */
export function parseOneRosterV1p2Uri(input: unknown): Result<OneRosterV1p2Uri, Diagnostics> {
  return parseOneRosterV1p2UriAt(input, "$");
}

/** Parse an absolute URI at a nested JSON path. */
export function parseOneRosterV1p2UriAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Uri, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  try {
    const parsedUri = new URL(parsed.value);
    if (parsedUri.href.length === 0) {
      return invalid("payload.invalid_format", path, "Expected an absolute URI.");
    }
  } catch (cause: unknown) {
    void cause;
    return invalid("payload.invalid_format", path, "Expected an absolute URI.");
  }
  // SAFETY: URL construction above established the absolute URI invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: URL construction established the URI invariant.
  return ok(parsed.value as OneRosterV1p2Uri);
}

/** Parse a calendar date at a nested JSON path. */
export function parseOneRosterV1p2DateAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Date, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.value)) {
    return invalid("payload.invalid_format", path, "Expected an ISO calendar date.");
  }
  const date = new Date(`${parsed.value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== parsed.value) {
    return invalid("payload.invalid_format", path, "Expected a valid ISO calendar date.");
  }
  // SAFETY: lexical and calendar validation established the date invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: lexical and calendar validation established the date invariant.
  return ok(parsed.value as OneRosterV1p2Date);
}

/** Parse a UTC calendar date from an unknown JSON value. */
export function parseOneRosterV1p2Date(input: unknown): Result<OneRosterV1p2Date, Diagnostics> {
  return parseOneRosterV1p2DateAt(input, "$");
}

/** Parse a UTC instant at a nested JSON path. */
export function parseOneRosterV1p2DateTimeAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2DateTime, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|\+00:00)$/.test(parsed.value)) {
    return invalid(
      "payload.invalid_format",
      path,
      "Expected an RFC 3339 instant with an explicit UTC timezone.",
    );
  }
  const time = new Date(parsed.value);
  if (Number.isNaN(time.getTime())) {
    return invalid("payload.invalid_format", path, "Expected a valid UTC instant.");
  }
  // SAFETY: lexical and Date validation established the UTC instant invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: lexical and Date validation established the UTC instant invariant.
  return ok(time.toISOString() as OneRosterV1p2DateTime);
}

/** Parse and canonicalize a UTC instant from an unknown JSON value. */
export function parseOneRosterV1p2DateTime(
  input: unknown,
): Result<OneRosterV1p2DateTime, Diagnostics> {
  return parseOneRosterV1p2DateTimeAt(input, "$");
}

/** Parse a finite JSON number at a nested path. */
export function parseOneRosterV1p2NumberAt(
  input: unknown,
  path: string,
): Result<number, Diagnostics> {
  return typeof input === "number" && Number.isFinite(input)
    ? ok(input)
    : invalid("payload.invalid_type", path, "Expected a finite number.");
}

/** Parse a repeated value with a minimum cardinality. */
export function parseOneRosterV1p2ArrayAt<TValue>(
  input: unknown,
  path: string,
  parser: OneRosterV1p2PayloadParser<TValue>,
  minimumLength = 0,
): Result<ReadonlyArray<TValue>, Diagnostics> {
  if (!Array.isArray(input)) {
    return invalid("payload.invalid_type", path, "Expected an array.");
  }
  if (input.length < minimumLength) {
    return invalid("payload.invalid_value", path, "The array has too few items.");
  }
  const values: Array<TValue> = [];
  for (const [index, value] of input.entries()) {
    const parsed = parser(value, oneRosterV1p2IndexPath(path, index));
    if (parsed._tag === "err") {
      return parsed;
    }
    values.push(parsed.value);
  }
  return ok(values);
}

/** Parse a closed vocabulary token. */
export function parseOneRosterV1p2FixedTokenAt<TToken extends string>(
  input: unknown,
  path: string,
  tokens: ReadonlyArray<TToken>,
): Result<TToken, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  const token = tokens.find((candidate) => candidate === parsed.value);
  return token === undefined
    ? invalid("payload.invalid_value", path, "The value is not in the required vocabulary.")
    : ok(token);
}

/** Parse a known token or an explicit `ext:` vocabulary extension. */
export function parseOneRosterV1p2KnownOrExtensionTokenAt<TToken extends string>(
  input: unknown,
  path: string,
  tokens: ReadonlyArray<TToken>,
): Result<TToken | OneRosterV1p2ExtensionToken, Diagnostics> {
  const parsed = parseOneRosterV1p2StringAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  const token = tokens.find((candidate) => candidate === parsed.value);
  if (token !== undefined) {
    return ok(token);
  }
  if (!/^ext:[a-zA-Z0-9._-]+$/.test(parsed.value)) {
    return invalid(
      "payload.invalid_value",
      path,
      "The value is not a known or valid extension token.",
    );
  }
  // SAFETY: the extension-token expression established the vocabulary invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the extension-token expression established the vocabulary invariant.
  return ok(parsed.value as OneRosterV1p2ExtensionToken);
}

/** Parse the lifecycle vocabulary at a nested JSON path. */
export function parseOneRosterV1p2LifecycleStatusAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2LifecycleStatus, Diagnostics> {
  return parseOneRosterV1p2FixedTokenAt(input, path, ["active", "tobedeleted"] as const);
}

/** Parse the OneRoster JSON boolean lexical vocabulary. */
export function parseOneRosterV1p2BooleanTokenAt(
  input: unknown,
  path: string,
): Result<"true" | "false", Diagnostics> {
  const parsed = parseOneRosterV1p2FixedTokenAt(input, path, ["true", "false"] as const);
  return parsed;
}

/** Parse a string property that is required to be present. */
export function parseOneRosterV1p2StringPropertyAt(
  input: unknown,
  path: string,
): Result<string, Diagnostics> {
  return parseOneRosterV1p2StringAt(input, path);
}
