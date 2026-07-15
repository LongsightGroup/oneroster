import { err, ok, type Result } from "../../result.js";
import {
  createOneRosterV1p2PayloadDiagnostic,
  type OneRosterV1p2PayloadDiagnostic,
} from "./json-value.js";
import { parseOneRosterV1p2RecordAt, requireOneRosterV1p2Property } from "./entity.js";
import {
  parseOneRosterV1p2FixedTokenAt,
  parseOneRosterV1p2SourcedId,
  parseOneRosterV1p2UriAt,
  type OneRosterV1p2SourcedId,
  type OneRosterV1p2Uri,
} from "./primitive.js";

/** The reference target vocabularies used by the v1.2 service models. */
export type OneRosterV1p2ReferenceType =
  | "academicSession"
  | "assessmentLineItem"
  | "category"
  | "class"
  | "course"
  | "enrollment"
  | "lineItem"
  | "org"
  | "resource"
  | "scoreScale"
  | "user";

/** A typed GUID reference in a OneRoster 1.2 JSON payload. */
export interface OneRosterV1p2Reference<
  TType extends OneRosterV1p2ReferenceType = OneRosterV1p2ReferenceType,
> {
  readonly href: OneRosterV1p2Uri;
  readonly sourcedId: OneRosterV1p2SourcedId;
  readonly type: TType;
}

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse a reference whose target type is known by the owning field. */
export function parseOneRosterV1p2ReferenceAt<TType extends OneRosterV1p2ReferenceType>(
  input: unknown,
  expectedType: TType,
  path: string,
): Result<OneRosterV1p2Reference<TType>, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") {
    return record;
  }
  const allowed = new Set(["href", "sourcedId", "type"]);
  for (const property of Object.keys(record.value)) {
    if (!allowed.has(property)) {
      return err([
        createOneRosterV1p2PayloadDiagnostic(
          "payload.unknown_property",
          `${path}.${property}`,
          "A reference contains an unknown property.",
        ),
      ]);
    }
  }
  const href = requireOneRosterV1p2Property(record.value, "href", path, (value, nestedPath) =>
    parseOneRosterV1p2UriAt(value, nestedPath),
  );
  if (href._tag === "err") {
    return href;
  }
  const sourcedId = requireOneRosterV1p2Property(record.value, "sourcedId", path, (value) =>
    parseOneRosterV1p2SourcedId(value),
  );
  if (sourcedId._tag === "err") {
    return sourcedId;
  }
  const type = requireOneRosterV1p2Property(record.value, "type", path, (value, nestedPath) =>
    parseOneRosterV1p2FixedTokenAt(value, nestedPath, [expectedType]),
  );
  if (type._tag === "err") {
    return type;
  }
  return ok({ href: href.value, sourcedId: sourcedId.value, type: type.value });
}

/** Parse a typed reference from an unknown JSON value. */
export function parseOneRosterV1p2Reference<TType extends OneRosterV1p2ReferenceType>(
  input: unknown,
  expectedType: TType,
): Result<OneRosterV1p2Reference<TType>, Diagnostics> {
  return parseOneRosterV1p2ReferenceAt(input, expectedType, "$");
}

/** Parse a reference when its target type is supplied by the payload itself. */
export function parseOneRosterV1p2AnyReferenceAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2Reference, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") {
    return record;
  }
  const type = record.value["type"];
  if (typeof type !== "string") {
    return err([
      createOneRosterV1p2PayloadDiagnostic(
        "payload.invalid_type",
        `${path}.type`,
        "Expected a reference type.",
      ),
    ]);
  }
  switch (type) {
    case "academicSession":
    case "assessmentLineItem":
    case "category":
    case "class":
    case "course":
    case "enrollment":
    case "lineItem":
    case "org":
    case "resource":
    case "scoreScale":
    case "user":
      return parseOneRosterV1p2ReferenceAt(input, type, path);
    default:
      return err([
        createOneRosterV1p2PayloadDiagnostic(
          "payload.invalid_value",
          `${path}.type`,
          "The reference type is not supported by OneRoster 1.2.",
        ),
      ]);
  }
}
