import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalReferenceArray,
  optionalString,
  optionalStringArray,
  optionalToken,
  parseEntityContext,
  requiredReference,
  requiredReferenceArray,
  requiredString,
} from "./rostering-parsing.js";
import type { OneRosterV1p1ExtensionToken } from "./primitive.js";

/** A class section. */
export interface OneRosterV1p1Class extends OneRosterV1p1EntityBase {
  readonly title: string;
  readonly classCode?: string;
  readonly classType?: OneRosterV1p1ClassType;
  readonly location?: string;
  readonly grades?: ReadonlyArray<string>;
  readonly subjects?: ReadonlyArray<string>;
  readonly course: OneRosterV1p1Reference<"course">;
  readonly school: OneRosterV1p1Reference<"org">;
  readonly terms: ReadonlyArray<OneRosterV1p1Reference<"academicSession">>;
  readonly subjectCodes?: ReadonlyArray<string>;
  readonly periods?: ReadonlyArray<string>;
  readonly resources?: ReadonlyArray<OneRosterV1p1Reference<"resource">>;
}

/** Class types defined by OneRoster 1.1. */
export type OneRosterV1p1ClassType = "homeroom" | "scheduled" | OneRosterV1p1ExtensionToken;

/** Parse a class. */
export function parseOneRosterV1p1Class(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Class, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const title = requiredString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  const course = requiredReference(context.value.record, "course", "course", path);
  if (course._tag === "err") return course;
  const school = requiredReference(context.value.record, "school", "org", path);
  if (school._tag === "err") return school;
  const terms = requiredReferenceArray(context.value.record, "terms", "academicSession", path);
  if (terms._tag === "err") return terms;
  const classCode = optionalString(context.value.record, "classCode", path);
  if (classCode._tag === "err") return classCode;
  const classType = optionalToken<OneRosterV1p1ClassType>(
    context.value.record,
    "classType",
    ["homeroom", "scheduled"],
    path,
  );
  if (classType._tag === "err") return classType;
  const location = optionalString(context.value.record, "location", path);
  if (location._tag === "err") return location;
  const grades = optionalStringArray(context.value.record, "grades", path);
  if (grades._tag === "err") return grades;
  const subjects = optionalStringArray(context.value.record, "subjects", path);
  if (subjects._tag === "err") return subjects;
  const subjectCodes = optionalStringArray(context.value.record, "subjectCodes", path);
  if (subjectCodes._tag === "err") return subjectCodes;
  const periods = optionalStringArray(context.value.record, "periods", path);
  if (periods._tag === "err") return periods;
  const resources = optionalReferenceArray(context.value.record, "resources", "resource", path);
  if (resources._tag === "err") return resources;
  return ok({
    ...context.value.base,
    title: title.value,
    course: course.value,
    school: school.value,
    terms: terms.value,
    ...(classCode.value === undefined ? {} : { classCode: classCode.value }),
    ...(classType.value === undefined ? {} : { classType: classType.value }),
    ...(location.value === undefined ? {} : { location: location.value }),
    ...(grades.value === undefined ? {} : { grades: grades.value }),
    ...(subjects.value === undefined ? {} : { subjects: subjects.value }),
    ...(subjectCodes.value === undefined ? {} : { subjectCodes: subjectCodes.value }),
    ...(periods.value === undefined ? {} : { periods: periods.value }),
    ...(resources.value === undefined ? {} : { resources: resources.value }),
  });
}
