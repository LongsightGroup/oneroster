import type { OneRosterCsvRosteringFileName } from "./one-roster-csv-rostering-types.js";

/** Spec-defined headers for academicSessions.csv in exact order. */
export const academicSessionHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "type",
  "startDate",
  "endDate",
  "parentSourcedId",
  "schoolYear",
] as const;

/** Spec-defined headers for orgs.csv in exact order. */
export const orgHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "name",
  "type",
  "identifier",
  "parentSourcedId",
] as const;

/** Spec-defined headers for courses.csv in exact order. */
export const courseHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "schoolYearSourcedId",
  "title",
  "courseCode",
  "grades",
  "orgSourcedId",
  "subjects",
  "subjectCodes",
] as const;

/** Spec-defined headers for classes.csv in exact order. */
export const classHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "grades",
  "courseSourcedId",
  "classCode",
  "classType",
  "location",
  "schoolSourcedId",
  "termSourcedIds",
  "subjects",
  "subjectCodes",
  "periods",
] as const;

/** Spec-defined headers for users.csv in exact order. */
export const userHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "enabledUser",
  "username",
  "userIds",
  "givenName",
  "familyName",
  "middleName",
  "identifier",
  "email",
  "sms",
  "phone",
  "agentSourcedIds",
  "grades",
  "password",
  "userMasterIdentifier",
  "preferredGivenName",
  "preferredMiddleName",
  "preferredFamilyName",
  "primaryOrgSourcedId",
  "pronouns",
] as const;

/** Spec-defined headers for roles.csv in exact order. */
export const roleHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "userSourcedId",
  "roleType",
  "role",
  "beginDate",
  "endDate",
  "orgSourcedId",
  "userProfileSourcedId",
] as const;

/** Spec-defined headers for enrollments.csv in exact order. */
export const enrollmentHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "classSourcedId",
  "schoolSourcedId",
  "userSourcedId",
  "role",
  "primary",
  "beginDate",
  "endDate",
] as const;

/** All rostering table headers keyed by file name for tests and tooling. */
export const rosteringTableHeaders: Readonly<
  Record<OneRosterCsvRosteringFileName, readonly string[]>
> = {
  "academicSessions.csv": academicSessionHeaders,
  "orgs.csv": orgHeaders,
  "courses.csv": courseHeaders,
  "classes.csv": classHeaders,
  "users.csv": userHeaders,
  "roles.csv": roleHeaders,
  "enrollments.csv": enrollmentHeaders,
};

export const academicSessionTypeValues = [
  "gradingPeriod",
  "semester",
  "schoolYear",
  "term",
] as const;
export const orgTypeValues = [
  "department",
  "school",
  "district",
  "local",
  "state",
  "national",
] as const;
export const classTypeValues = ["homeroom", "scheduled"] as const;
export const roleTypeValues = ["primary", "secondary"] as const;
export const roleValues = [
  "aide",
  "counselor",
  "districtAdministrator",
  "guardian",
  "parent",
  "principal",
  "proctor",
  "relative",
  "siteAdministrator",
  "student",
  "systemAdministrator",
  "teacher",
] as const;
export const enrollmentRoleValues = ["administrator", "proctor", "student", "teacher"] as const;

export type FieldRequiredness = "required" | "optional";

/** Format allowed vocabulary values for diagnostic expected text. */
export function formatVocabularyExpected(
  values: readonly string[],
  allowExtension: boolean,
): string {
  const parts = [...values];

  if (allowExtension) {
    parts.push("ext:*");
  }

  return parts.join("|");
}
