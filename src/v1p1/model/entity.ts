import { err, ok, type Result } from "../../result.js";
import {
  parseOneRosterV1p1DateTimeAt,
  parseOneRosterV1p1MetadataAt,
  parseOneRosterV1p1SourcedIdAt,
  parseOneRosterV1p1StringAt,
  type OneRosterV1p1DateTime,
  type OneRosterV1p1JsonValue,
  type OneRosterV1p1LifecycleStatus,
  type OneRosterV1p1PayloadDiagnostic,
  type OneRosterV1p1PayloadParser,
  type OneRosterV1p1SourcedId,
} from "./primitive.js";

/** A record-shaped value after the JSON object boundary is checked. */
export type OneRosterV1p1Record = Readonly<Record<string, unknown>>;

/** Common fields on OneRoster 1.1 entities. */
export interface OneRosterV1p1EntityBase {
  readonly sourcedId: OneRosterV1p1SourcedId;
  readonly status: OneRosterV1p1LifecycleStatus;
  readonly dateLastModified: OneRosterV1p1DateTime;
  readonly metadata?: Readonly<Record<string, OneRosterV1p1JsonValue>>;
}

type Diagnostics = ReadonlyArray<OneRosterV1p1PayloadDiagnostic>;

/** Parse a JSON object. */
export function parseOneRosterV1p1RecordAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1Record, Diagnostics> {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    return err([diagnostic("payload.invalid_type", path, "Expected a JSON object.")]);
  // SAFETY: the null/array/object checks establish the JSON-record boundary.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: validated record boundary.
  return ok(input as OneRosterV1p1Record);
}

/** Read a required property with a path-aware codec. */
export function requireOneRosterV1p1Property<TValue>(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
  parser: OneRosterV1p1PayloadParser<TValue>,
): Result<TValue, Diagnostics> {
  if (!Object.hasOwn(record, property))
    return err([
      diagnostic(
        "payload.missing_property",
        `${path}.${property}`,
        "A required property is missing.",
      ),
    ]);
  return parser(record[property], `${path}.${property}`);
}

/** Read an optional property while rejecting an invalid present value. */
export function optionalOneRosterV1p1Property<TValue>(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
  parser: OneRosterV1p1PayloadParser<TValue>,
): Result<TValue | undefined, Diagnostics> {
  return Object.hasOwn(record, property)
    ? parser(record[property], `${path}.${property}`)
    : ok(undefined);
}

/** Parse the common entity fields. Unknown extension fields are intentionally ignored. */
export function parseOneRosterV1p1EntityBaseRecordAt(
  record: OneRosterV1p1Record,
  path: string,
): Result<OneRosterV1p1EntityBase, Diagnostics> {
  const sourcedId = requireOneRosterV1p1Property(record, "sourcedId", path, (value, nestedPath) =>
    parseOneRosterV1p1SourcedIdAt(value, nestedPath),
  );
  if (sourcedId._tag === "err") return sourcedId;
  const status = requireOneRosterV1p1Property(record, "status", path, parseStatusAt);
  if (status._tag === "err") return status;
  const dateLastModified = requireOneRosterV1p1Property(
    record,
    "dateLastModified",
    path,
    (value, nestedPath) => parseOneRosterV1p1DateTimeAt(value, nestedPath),
  );
  if (dateLastModified._tag === "err") return dateLastModified;
  const metadata = optionalOneRosterV1p1Property(record, "metadata", path, (value, nestedPath) =>
    parseOneRosterV1p1MetadataAt(value, nestedPath),
  );
  if (metadata._tag === "err") return metadata;
  return ok({
    sourcedId: sourcedId.value,
    status: status.value,
    dateLastModified: dateLastModified.value,
    ...(metadata.value === undefined ? {} : { metadata: metadata.value }),
  });
}

function parseStatusAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p1LifecycleStatus, Diagnostics> {
  const value = parseOneRosterV1p1StringAt(input, path);
  if (value._tag === "err") return value;
  return value.value === "active" || value.value === "tobedeleted"
    ? ok(value.value)
    : err([diagnostic("payload.invalid_value", path, "The lifecycle status is invalid.")]);
}

function diagnostic(
  code: OneRosterV1p1PayloadDiagnostic["code"],
  path: string,
  message: string,
): OneRosterV1p1PayloadDiagnostic {
  return { _tag: "OneRosterV1p1PayloadDiagnostic", code, path, message };
}
