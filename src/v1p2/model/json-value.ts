import { err, ok, type Result } from "../../result.js";

/** Stable diagnostic codes emitted while parsing OneRoster 1.2 REST JSON. */
export type OneRosterV1p2PayloadDiagnosticCode =
  | "payload.invalid_type"
  | "payload.missing_property"
  | "payload.invalid_value"
  | "payload.invalid_format"
  | "payload.unknown_property"
  | "payload.invalid_metadata"
  | "payload.invalid_envelope";

/** A safe, path-aware validation diagnostic for an untrusted payload. */
export interface OneRosterV1p2PayloadDiagnostic {
  readonly _tag: "OneRosterV1p2PayloadDiagnostic";
  readonly code: OneRosterV1p2PayloadDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

/** A recursive immutable JSON value accepted by OneRoster metadata. */
export type OneRosterV1p2JsonValue =
  | null
  | boolean
  | number
  | string
  | ReadonlyArray<OneRosterV1p2JsonValue>
  | OneRosterV1p2JsonObject;

/** An immutable JSON object. */
export interface OneRosterV1p2JsonObject {
  readonly [property: string]: OneRosterV1p2JsonValue;
}

/** A parser used by the model codecs at a JSON path. */
export type OneRosterV1p2PayloadParser<TValue> = (
  input: unknown,
  path: string,
) => Result<TValue, ReadonlyArray<OneRosterV1p2PayloadDiagnostic>>;

/** Create a safe payload diagnostic without retaining the rejected value. */
export function createOneRosterV1p2PayloadDiagnostic(
  code: OneRosterV1p2PayloadDiagnosticCode,
  path: string,
  message: string,
): OneRosterV1p2PayloadDiagnostic {
  return { _tag: "OneRosterV1p2PayloadDiagnostic", code, path, message };
}

/** Add a property segment to a JSON path. */
export function oneRosterV1p2PropertyPath(path: string, property: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(property)
    ? `${path}.${property}`
    : `${path}[${JSON.stringify(property)}]`;
}

/** Add an array index segment to a JSON path. */
export function oneRosterV1p2IndexPath(path: string, index: number): string {
  return `${path}[${index}]`;
}

function parseJsonValueAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2JsonValue, ReadonlyArray<OneRosterV1p2PayloadDiagnostic>> {
  if (input === null) {
    return ok(null);
  }

  if (typeof input === "string" || typeof input === "boolean") {
    return ok(input);
  }

  if (typeof input === "number") {
    return Number.isFinite(input)
      ? ok(input)
      : err([
          createOneRosterV1p2PayloadDiagnostic(
            "payload.invalid_value",
            path,
            "Expected a finite JSON number.",
          ),
        ]);
  }

  if (Array.isArray(input)) {
    const values: Array<OneRosterV1p2JsonValue> = [];
    for (const [index, value] of input.entries()) {
      const parsed = parseJsonValueAt(value, oneRosterV1p2IndexPath(path, index));
      if (parsed._tag === "err") {
        return parsed;
      }
      values.push(parsed.value);
    }
    return ok(values);
  }

  if (typeof input !== "object") {
    return err([
      createOneRosterV1p2PayloadDiagnostic("payload.invalid_type", path, "Expected a JSON value."),
    ]);
  }

  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    return err([
      createOneRosterV1p2PayloadDiagnostic("payload.invalid_type", path, "Expected a JSON object."),
    ]);
  }

  if (!isUnknownRecord(input)) {
    return err([
      createOneRosterV1p2PayloadDiagnostic("payload.invalid_type", path, "Expected a JSON object."),
    ]);
  }
  const record = input;
  const result: Record<string, OneRosterV1p2JsonValue> = {};
  for (const [key, value] of Object.entries(record)) {
    const parsed = parseJsonValueAt(value, oneRosterV1p2PropertyPath(path, key));
    if (parsed._tag === "err") {
      return parsed;
    }
    result[key] = parsed.value;
  }
  return ok(result);
}

/** Parse an unknown value as an immutable JSON value. */
export function parseOneRosterV1p2JsonValue(
  input: unknown,
): Result<OneRosterV1p2JsonValue, ReadonlyArray<OneRosterV1p2PayloadDiagnostic>> {
  return parseJsonValueAt(input, "$");
}

/** Parse the metadata object used as the standards extension point. */
export function parseOneRosterV1p2MetadataAt(
  input: unknown,
  path: string,
): Result<
  Readonly<Record<string, OneRosterV1p2JsonValue>>,
  ReadonlyArray<OneRosterV1p2PayloadDiagnostic>
> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return err([
      createOneRosterV1p2PayloadDiagnostic(
        "payload.invalid_metadata",
        path,
        "Metadata must be a JSON object.",
      ),
    ]);
  }

  const parsed = parseJsonValueAt(input, path);
  if (parsed._tag === "err") {
    return parsed;
  }
  if (!isOneRosterV1p2JsonObject(parsed.value)) {
    return err([
      createOneRosterV1p2PayloadDiagnostic(
        "payload.invalid_metadata",
        path,
        "Metadata must be a JSON object.",
      ),
    ]);
  }
  return ok(parsed.value);
}

function isOneRosterV1p2JsonObject(
  input: OneRosterV1p2JsonValue,
): input is OneRosterV1p2JsonObject {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function isUnknownRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

/** Parse the metadata object used as the standards extension point. */
export function parseOneRosterV1p2Metadata(
  input: unknown,
): Result<
  Readonly<Record<string, OneRosterV1p2JsonValue>>,
  ReadonlyArray<OneRosterV1p2PayloadDiagnostic>
> {
  return parseOneRosterV1p2MetadataAt(input, "$.metadata");
}
