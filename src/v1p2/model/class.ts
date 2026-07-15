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
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type {
  OneRosterV1p2AcademicSessionReference,
  OneRosterV1p2CourseReference,
  OneRosterV1p2OrgReference,
  OneRosterV1p2ResourceReference,
} from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** A class-type vocabulary token in the v1.2 Rostering service. */
export type OneRosterV1p2ClassType = "homeroom" | "scheduled" | OneRosterV1p2ExtensionToken;
/** A class entity. */
export interface OneRosterV1p2Class extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly classCode?: string;
  readonly classType?: OneRosterV1p2ClassType;
  readonly location?: string;
  readonly grades?: ReadonlyArray<string>;
  readonly subjects?: ReadonlyArray<string>;
  readonly course: OneRosterV1p2CourseReference;
  readonly school: OneRosterV1p2OrgReference;
  readonly terms: ReadonlyArray<OneRosterV1p2AcademicSessionReference>;
  readonly subjectCodes?: ReadonlyArray<string>;
  readonly periods?: ReadonlyArray<string>;
  readonly resources?: ReadonlyArray<OneRosterV1p2ResourceReference>;
}
const ref =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

const stringArray: OneRosterV1p2PayloadParser<ReadonlyArray<string>> = (input, path) =>
  parseOneRosterV1p2ArrayAt(input, path, parseOneRosterV1p2StringAt);

function parseClassAt(input: unknown, path: string): Result<OneRosterV1p2Class, Diagnostics> {
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
      "classCode",
      "classType",
      "location",
      "grades",
      "subjects",
      "course",
      "school",
      "terms",
      "subjectCodes",
      "periods",
      "resources",
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
  const classCode = optionalOneRosterV1p2Property(
    record.value,
    "classCode",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (classCode._tag === "err") return classCode;
  const classType = optionalOneRosterV1p2Property(
    record.value,
    "classType",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
        "homeroom",
        "scheduled",
      ] as const),
  );
  if (classType._tag === "err") return classType;
  const location = optionalOneRosterV1p2Property(
    record.value,
    "location",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (location._tag === "err") return location;
  const grades = optionalOneRosterV1p2Property(record.value, "grades", path, stringArray);
  if (grades._tag === "err") return grades;
  const subjects = optionalOneRosterV1p2Property(record.value, "subjects", path, stringArray);
  if (subjects._tag === "err") return subjects;
  const course = requireOneRosterV1p2Property(record.value, "course", path, ref("course"));
  if (course._tag === "err") return course;
  const school = requireOneRosterV1p2Property(record.value, "school", path, ref("org"));
  if (school._tag === "err") return school;
  const terms = requireOneRosterV1p2Property(record.value, "terms", path, (value, nestedPath) =>
    parseOneRosterV1p2ArrayAt(value, nestedPath, ref("academicSession"), 1),
  );
  if (terms._tag === "err") return terms;
  const subjectCodes = optionalOneRosterV1p2Property(
    record.value,
    "subjectCodes",
    path,
    stringArray,
  );
  if (subjectCodes._tag === "err") return subjectCodes;
  const periods = optionalOneRosterV1p2Property(record.value, "periods", path, stringArray);
  if (periods._tag === "err") return periods;
  const resources = optionalOneRosterV1p2Property(
    record.value,
    "resources",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, ref("resource")),
  );
  if (resources._tag === "err") return resources;
  return ok({
    ...base.value,
    title: title.value,
    ...(classCode.value === undefined ? {} : { classCode: classCode.value }),
    ...(classType.value === undefined ? {} : { classType: classType.value }),
    ...(location.value === undefined ? {} : { location: location.value }),
    ...(grades.value === undefined ? {} : { grades: grades.value }),
    ...(subjects.value === undefined ? {} : { subjects: subjects.value }),
    course: course.value,
    school: school.value,
    terms: terms.value,
    ...(subjectCodes.value === undefined ? {} : { subjectCodes: subjectCodes.value }),
    ...(periods.value === undefined ? {} : { periods: periods.value }),
    ...(resources.value === undefined ? {} : { resources: resources.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a class entity. */
export const parseOneRosterV1p2Class: RootParser<OneRosterV1p2Class> = parser(parseClassAt);
