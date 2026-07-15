import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalReference,
  optionalReferenceArray,
  optionalStringArray,
  parseEntityContext,
  requiredString,
} from "./rostering-parsing.js";

/** A course. */
export interface OneRosterV1p1Course extends OneRosterV1p1EntityBase {
  readonly title: string;
  readonly schoolYear?: OneRosterV1p1Reference<"academicSession">;
  readonly courseCode: string;
  readonly grades?: ReadonlyArray<string>;
  readonly subjects?: ReadonlyArray<string>;
  readonly org?: OneRosterV1p1Reference<"org">;
  readonly subjectCodes?: ReadonlyArray<string>;
  readonly resources?: ReadonlyArray<OneRosterV1p1Reference<"resource">>;
}

/** Parse a course. */
export function parseOneRosterV1p1Course(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Course, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const title = requiredString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  const courseCode = requiredString(context.value.record, "courseCode", path);
  if (courseCode._tag === "err") return courseCode;
  const schoolYear = optionalReference(context.value.record, "schoolYear", "academicSession", path);
  if (schoolYear._tag === "err") return schoolYear;
  const grades = optionalStringArray(context.value.record, "grades", path);
  if (grades._tag === "err") return grades;
  const subjects = optionalStringArray(context.value.record, "subjects", path);
  if (subjects._tag === "err") return subjects;
  const org = optionalReference(context.value.record, "org", "org", path);
  if (org._tag === "err") return org;
  const subjectCodes = optionalStringArray(context.value.record, "subjectCodes", path);
  if (subjectCodes._tag === "err") return subjectCodes;
  const resources = optionalReferenceArray(context.value.record, "resources", "resource", path);
  if (resources._tag === "err") return resources;
  return ok({
    ...context.value.base,
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
