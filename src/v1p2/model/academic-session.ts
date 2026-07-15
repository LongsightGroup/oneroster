import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic, OneRosterV1p2PayloadParser } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "./entity.js";
import type { OneRosterV1p2EntityBase } from "./entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type { OneRosterV1p2AcademicSessionReference } from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** An academic-session vocabulary token in the v1.2 Rostering service. */
export type OneRosterV1p2AcademicSessionType =
  | "gradingPeriod"
  | "semester"
  | "schoolYear"
  | "term"
  | OneRosterV1p2ExtensionToken;
/** An academic session entity. */
export interface OneRosterV1p2AcademicSession extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly startDate: OneRosterV1p2Date;
  readonly endDate: OneRosterV1p2Date;
  readonly type: OneRosterV1p2AcademicSessionType;
  readonly schoolYear: string;
  readonly parent?: OneRosterV1p2AcademicSessionReference;
  readonly children?: ReadonlyArray<OneRosterV1p2AcademicSessionReference>;
}

const ref =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

function parseAcademicSessionAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AcademicSession, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "title",
      "startDate",
      "endDate",
      "type",
      "parent",
      "children",
      "schoolYear",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const title = requireOneRosterV1p2Property(
    record.value,
    "title",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (title._tag === "err") return title;
  const startDate = requireOneRosterV1p2Property(
    record.value,
    "startDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (startDate._tag === "err") return startDate;
  const endDate = requireOneRosterV1p2Property(
    record.value,
    "endDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (endDate._tag === "err") return endDate;
  const type = requireOneRosterV1p2Property(record.value, "type", path, (value, nestedPath) =>
    parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
      "gradingPeriod",
      "semester",
      "schoolYear",
      "term",
    ] as const),
  );
  if (type._tag === "err") return type;
  const schoolYear = requireOneRosterV1p2Property(
    record.value,
    "schoolYear",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (schoolYear._tag === "err") return schoolYear;
  const parent = optionalOneRosterV1p2Property(
    record.value,
    "parent",
    path,
    ref("academicSession"),
  );
  if (parent._tag === "err") return parent;
  const children = optionalOneRosterV1p2Property(
    record.value,
    "children",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, ref("academicSession")),
  );
  if (children._tag === "err") return children;
  return ok({
    ...base.value,
    title: title.value,
    startDate: startDate.value,
    endDate: endDate.value,
    type: type.value,
    schoolYear: schoolYear.value,
    ...(parent.value === undefined ? {} : { parent: parent.value }),
    ...(children.value === undefined ? {} : { children: children.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a academic session entity. */
export const parseOneRosterV1p2AcademicSession: RootParser<OneRosterV1p2AcademicSession> =
  parser(parseAcademicSessionAt);
