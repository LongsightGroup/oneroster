import { ok, type Result } from "../../result.js";
import type { OneRosterV1p1EntityBase } from "./entity.js";
import type { OneRosterV1p1Reference } from "./references.js";
import type { Diagnostics } from "./rostering-parsing.js";
import {
  optionalBoolean,
  optionalDate,
  parseEntityContext,
  requiredReference,
  requiredToken,
} from "./rostering-parsing.js";
import type { OneRosterV1p1Date } from "./primitive.js";

/** An enrollment relationship. */
export interface OneRosterV1p1Enrollment extends OneRosterV1p1EntityBase {
  readonly user: OneRosterV1p1Reference<"user">;
  readonly class: OneRosterV1p1Reference<"class">;
  readonly school: OneRosterV1p1Reference<"org">;
  readonly role: OneRosterV1p1EnrollmentRole;
  readonly primary?: "true" | "false";
  readonly beginDate?: OneRosterV1p1Date;
  readonly endDate?: OneRosterV1p1Date;
}

/** Enrollment roles defined by the v1.1 final revision. */
export type OneRosterV1p1EnrollmentRole = "administrator" | "proctor" | "student" | "teacher";

/** Parse an enrollment. */
export function parseOneRosterV1p1Enrollment(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Enrollment, Diagnostics> {
  const context = parseEntityContext(input, path);
  if (context._tag === "err") return context;
  const user = requiredReference(context.value.record, "user", "user", path);
  if (user._tag === "err") return user;
  const classValue = requiredReference(context.value.record, "class", "class", path);
  if (classValue._tag === "err") return classValue;
  const school = requiredReference(context.value.record, "school", "org", path);
  if (school._tag === "err") return school;
  const role = requiredToken<OneRosterV1p1EnrollmentRole>(
    context.value.record,
    "role",
    ["administrator", "proctor", "student", "teacher"],
    path,
  );
  if (role._tag === "err") return role;
  const primary = optionalBoolean(context.value.record, "primary", path);
  if (primary._tag === "err") return primary;
  const beginDate = optionalDate(context.value.record, "beginDate", path);
  if (beginDate._tag === "err") return beginDate;
  const endDate = optionalDate(context.value.record, "endDate", path);
  if (endDate._tag === "err") return endDate;
  return ok({
    ...context.value.base,
    user: user.value,
    class: classValue.value,
    school: school.value,
    role: role.value,
    ...(primary.value === undefined ? {} : { primary: primary.value }),
    ...(beginDate.value === undefined ? {} : { beginDate: beginDate.value }),
    ...(endDate.value === undefined ? {} : { endDate: endDate.value }),
  });
}
