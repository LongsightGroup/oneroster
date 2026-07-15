import { err, ok, type Result } from "../../result.js";
import {
  createOneRosterV1p2PayloadDiagnostic,
  oneRosterV1p2PropertyPath,
  type OneRosterV1p2PayloadDiagnostic,
  type OneRosterV1p2PayloadParser,
} from "./json-value.js";
import {
  parseOneRosterV1p2DateTimeAt,
  parseOneRosterV1p2SourcedIdAt,
  parseOneRosterV1p2LifecycleStatusAt,
  type OneRosterV1p2DateTime,
  type OneRosterV1p2SourcedId,
  type OneRosterV1p2LifecycleStatus,
} from "./primitive.js";
import { parseOneRosterV1p2MetadataAt } from "./json-value.js";
import type { OneRosterV1p2JsonValue } from "./json-value.js";

/** A record-shaped value after the JSON object boundary has been checked. */
export type OneRosterV1p2Record = Readonly<Record<string, unknown>>;

/** Common fields present on every OneRoster 1.2 REST entity. */
export interface OneRosterV1p2EntityBase {
  readonly sourcedId: OneRosterV1p2SourcedId;
  readonly status: OneRosterV1p2LifecycleStatus;
  readonly dateLastModified: OneRosterV1p2DateTime;
  readonly metadata?: Readonly<Record<string, OneRosterV1p2JsonValue>>;
}

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse an unknown value as a plain JSON object. */
export function parseOneRosterV1p2RecordAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Record, Diagnostics> {
  if (!isOneRosterV1p2Record(input)) {
    return err([
      createOneRosterV1p2PayloadDiagnostic("payload.invalid_type", path, "Expected a JSON object."),
    ]);
  }
  return ok(input);
}

/** Test whether a decoded object contains a property, including an explicit undefined value. */
export function hasOneRosterV1p2Property(record: OneRosterV1p2Record, property: string): boolean {
  return Object.hasOwn(record, property);
}

/** Read and parse a required property at a nested JSON path. */
export function requireOneRosterV1p2Property<TValue>(
  record: OneRosterV1p2Record,
  property: string,
  path: string,
  parser: OneRosterV1p2PayloadParser<TValue>,
): Result<TValue, Diagnostics> {
  if (!hasOneRosterV1p2Property(record, property)) {
    return err([
      createOneRosterV1p2PayloadDiagnostic(
        "payload.missing_property",
        oneRosterV1p2PropertyPath(path, property),
        "A required property is missing.",
      ),
    ]);
  }
  return parser(record[property], oneRosterV1p2PropertyPath(path, property));
}

/** Read and parse an optional property while distinguishing absence from invalid presence. */
export function optionalOneRosterV1p2Property<TValue>(
  record: OneRosterV1p2Record,
  property: string,
  path: string,
  parser: OneRosterV1p2PayloadParser<TValue>,
): Result<TValue | undefined, Diagnostics> {
  if (!hasOneRosterV1p2Property(record, property)) {
    return ok(undefined);
  }
  return parser(record[property], oneRosterV1p2PropertyPath(path, property));
}

/** Reject properties outside the exact information-model shape. */
export function rejectUnknownOneRosterV1p2Properties(
  record: OneRosterV1p2Record,
  allowedProperties: ReadonlySet<string>,
  path: string,
): Result<void, Diagnostics> {
  for (const property of Object.keys(record)) {
    if (!allowedProperties.has(property)) {
      return err([
        createOneRosterV1p2PayloadDiagnostic(
          "payload.unknown_property",
          oneRosterV1p2PropertyPath(path, property),
          "The property is not part of the OneRoster information model.",
        ),
      ]);
    }
  }
  return ok(undefined);
}

/** Parse common entity fields from an already validated object. */
export function parseOneRosterV1p2EntityBaseRecordAt(
  record: OneRosterV1p2Record,
  path: string,
): Result<OneRosterV1p2EntityBase, Diagnostics> {
  const sourcedId = requireOneRosterV1p2Property(record, "sourcedId", path, (value, nestedPath) =>
    parseOneRosterV1p2SourcedIdAt(value, nestedPath),
  );
  if (sourcedId._tag === "err") {
    return sourcedId;
  }
  const status = requireOneRosterV1p2Property(record, "status", path, (value, nestedPath) =>
    parseOneRosterV1p2LifecycleStatusAt(value, nestedPath),
  );
  if (status._tag === "err") {
    return status;
  }
  const dateLastModified = requireOneRosterV1p2Property(
    record,
    "dateLastModified",
    path,
    (value, nestedPath) => parseOneRosterV1p2DateTimeAt(value, nestedPath),
  );
  if (dateLastModified._tag === "err") {
    return dateLastModified;
  }
  const metadata = optionalOneRosterV1p2Property(record, "metadata", path, (value, nestedPath) =>
    parseOneRosterV1p2MetadataAt(value, nestedPath),
  );
  if (metadata._tag === "err") {
    return metadata;
  }
  return ok({
    sourcedId: sourcedId.value,
    status: status.value,
    dateLastModified: dateLastModified.value,
    ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
  });
}

/** Parse common entity fields from an unknown value. */
export function parseOneRosterV1p2EntityBase(
  input: unknown,
): Result<OneRosterV1p2EntityBase, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, "$");
  if (record._tag === "err") {
    return record;
  }
  return parseOneRosterV1p2EntityBaseRecordAt(record.value, "$");
}

function isOneRosterV1p2Record(input: unknown): input is OneRosterV1p2Record {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
