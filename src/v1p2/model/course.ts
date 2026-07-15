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
import { parseOneRosterV1p2ArrayAt, parseOneRosterV1p2StringAt } from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";
import type {
  OneRosterV1p2AcademicSessionReference,
  OneRosterV1p2OrgReference,
  OneRosterV1p2ResourceReference,
} from "./references.js";
type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** A course entity. */
export interface OneRosterV1p2Course extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly courseCode: string;
  readonly schoolYear?: OneRosterV1p2AcademicSessionReference;
  readonly grades?: ReadonlyArray<string>;
  readonly subjects?: ReadonlyArray<string>;
  readonly org?: OneRosterV1p2OrgReference;
  readonly subjectCodes?: ReadonlyArray<string>;
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

function parseCourseAt(input: unknown, path: string): Result<OneRosterV1p2Course, Diagnostics> {
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
      "schoolYear",
      "courseCode",
      "grades",
      "subjects",
      "org",
      "subjectCodes",
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
  const courseCode = requireOneRosterV1p2Property(
    record.value,
    "courseCode",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (courseCode._tag === "err") return courseCode;
  const schoolYear = optionalOneRosterV1p2Property(
    record.value,
    "schoolYear",
    path,
    ref("academicSession"),
  );
  if (schoolYear._tag === "err") return schoolYear;
  const grades = optionalOneRosterV1p2Property(record.value, "grades", path, stringArray);
  if (grades._tag === "err") return grades;
  const subjects = optionalOneRosterV1p2Property(record.value, "subjects", path, stringArray);
  if (subjects._tag === "err") return subjects;
  const org = optionalOneRosterV1p2Property(record.value, "org", path, ref("org"));
  if (org._tag === "err") return org;
  const subjectCodes = optionalOneRosterV1p2Property(
    record.value,
    "subjectCodes",
    path,
    stringArray,
  );
  if (subjectCodes._tag === "err") return subjectCodes;
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
    courseCode: courseCode.value,
    ...(schoolYear.value === undefined ? {} : { schoolYear: schoolYear.value }),
    ...(grades.value === undefined ? {} : { grades: grades.value }),
    ...(subjects.value === undefined ? {} : { subjects: subjects.value }),
    ...(org.value === undefined ? {} : { org: org.value }),
    ...(subjectCodes.value === undefined ? {} : { subjectCodes: subjectCodes.value }),
    ...(resources.value === undefined ? {} : { resources: resources.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): (input: unknown) => Result<TValue, Diagnostics> {
  return (input) => parseAt(input, "$");
}

/** Parse a course entity. */
export const parseOneRosterV1p2Course: RootParser<OneRosterV1p2Course> = parser(parseCourseAt);
