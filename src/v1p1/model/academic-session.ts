import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalReferenceArray,
  parseEntityContext,
  referenceParser,
  requiredDate,
  requiredString,
} from "./rostering-parsing.js";
import { optionalOneRosterV1p1Property, requireOneRosterV1p1Property } from "./entity.js";
import { parseOneRosterV1p1TokenAt } from "./primitive.js";
import type { OneRosterV1p1Date, OneRosterV1p1ExtensionToken } from "./primitive.js";

/** Academic-session types defined by OneRoster 1.1. */
export type OneRosterV1p1AcademicSessionType =
  | "gradingPeriod"
  | "semester"
  | "schoolYear"
  | "term"
  | OneRosterV1p1ExtensionToken;

/** An academic session, term, semester, school year, or grading period. */
export interface OneRosterV1p1AcademicSession extends OneRosterV1p1EntityBase {
  readonly title: string;
  readonly startDate: OneRosterV1p1Date;
  readonly endDate: OneRosterV1p1Date;
  readonly type: OneRosterV1p1AcademicSessionType;
  readonly schoolYear: string;
  readonly parent?: OneRosterV1p1Reference<"academicSession">;
  readonly children?: ReadonlyArray<OneRosterV1p1Reference<"academicSession">>;
}

/** Parse an academic session. */
export function parseOneRosterV1p1AcademicSession(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1AcademicSession, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const title = requiredString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  const startDate = requiredDate(context.value.record, "startDate", path);
  if (startDate._tag === "err") return startDate;
  const endDate = requiredDate(context.value.record, "endDate", path);
  if (endDate._tag === "err") return endDate;
  const type = requireOneRosterV1p1Property(
    context.value.record,
    "type",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p1TokenAt<OneRosterV1p1AcademicSessionType>(value, nestedPath, [
        "gradingPeriod",
        "semester",
        "schoolYear",
        "term",
      ]),
  );
  if (type._tag === "err") return type;
  const schoolYear = requiredString(context.value.record, "schoolYear", path);
  if (schoolYear._tag === "err") return schoolYear;
  const parent = optionalOneRosterV1p1Property(
    context.value.record,
    "parent",
    path,
    referenceParser("academicSession"),
  );
  if (parent._tag === "err") return parent;
  const children = optionalReferenceArray(
    context.value.record,
    "children",
    "academicSession",
    path,
  );
  if (children._tag === "err") return children;
  return ok({
    ...context.value.base,
    title: title.value,
    startDate: startDate.value,
    endDate: endDate.value,
    type: type.value,
    schoolYear: schoolYear.value,
    ...(parent.value === undefined ? {} : { parent: parent.value }),
    ...(children.value === undefined ? {} : { children: children.value }),
  });
}
