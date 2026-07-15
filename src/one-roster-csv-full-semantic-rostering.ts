import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import {
  hasPrimaryOrgRoleEvidence,
  isAcceptableSchoolOrgReference,
  isSchoolYearAcademicSessionType,
  validateDuplicatePrimaryRoles,
} from "./one-roster-csv-full-semantic-policies.js";
import { runSemanticRowRules } from "./one-roster-csv-full-semantic-rules.js";

/** Validate rostering semantics that require typed cross-record context. */
export function validateOneRosterCsvFullRosteringSemantics(
  context: OneRosterCsvFullSemanticContext,
): void {
  validateCourseSchoolYearSessions(context);
  validateClassSchoolOrgs(context);
  validateEnrollmentSchoolOrgs(context);
  validateDuplicatePrimaryRoles(context);
  validateUserPrimaryOrgRoles(context);
  validateRoleUserProfiles(context);
}

function validateCourseSchoolYearSessions(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.rosteringPackage.courses,
      when: (course) => course.schoolYearSourcedId !== undefined,
      satisfies: (course, ctx) => {
        const schoolYearSourcedId = course.schoolYearSourcedId;

        if (schoolYearSourcedId === undefined) {
          return true;
        }

        const academicSession =
          ctx.rosteringIndexes.academicSessionsBySourcedId.get(schoolYearSourcedId);
        return (
          academicSession === undefined || isSchoolYearAcademicSessionType(academicSession.type)
        );
      },
      diagnostic: (course) => ({
        code: "semantic.academic_session_type_mismatch",
        message: "OneRoster course schoolYearSourcedId must reference a schoolYear session.",
        fileName: "courses.csv",
        rowNumber: course.rowNumber,
        field: "schoolYearSourcedId",
        expected: "schoolYear or ext:*",
        actual: "incompatible academic session type",
      }),
    },
  ]);
}

function validateClassSchoolOrgs(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.rosteringPackage.classes,
      satisfies: (classRecord, ctx) =>
        isAcceptableSchoolOrgReference(
          ctx.rosteringIndexes.orgsBySourcedId.get(classRecord.schoolSourcedId),
        ),
      diagnostic: (classRecord) => ({
        code: "semantic.org_type_mismatch",
        message: "OneRoster class schoolSourcedId must reference a school org.",
        fileName: "classes.csv",
        rowNumber: classRecord.rowNumber,
        field: "schoolSourcedId",
        expected: "school or ext:*",
        actual: "incompatible org type",
      }),
    },
  ]);
}

function validateEnrollmentSchoolOrgs(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.rosteringPackage.enrollments,
      satisfies: (enrollment, ctx) =>
        isAcceptableSchoolOrgReference(
          ctx.rosteringIndexes.orgsBySourcedId.get(enrollment.schoolSourcedId),
        ),
      diagnostic: (enrollment) => ({
        code: "semantic.org_type_mismatch",
        message: "OneRoster enrollment schoolSourcedId must reference a school org.",
        fileName: "enrollments.csv",
        rowNumber: enrollment.rowNumber,
        field: "schoolSourcedId",
        expected: "school or ext:*",
        actual: "incompatible org type",
      }),
    },
  ]);
}

function validateUserPrimaryOrgRoles(context: OneRosterCsvFullSemanticContext): void {
  if (!context.isManifestFilePresent("roles.csv")) {
    return;
  }

  runSemanticRowRules(context, [
    {
      records: context.packageValue.rosteringPackage.users,
      when: (user) => user.primaryOrgSourcedId !== undefined,
      satisfies: (user, ctx) => {
        const primaryOrgSourcedId = user.primaryOrgSourcedId;

        if (primaryOrgSourcedId === undefined) {
          return true;
        }

        return hasPrimaryOrgRoleEvidence(ctx, user.sourcedId, primaryOrgSourcedId);
      },
      diagnostic: (user) => ({
        code: "semantic.primary_org_missing_role",
        message: "OneRoster user primaryOrgSourcedId must have roles.csv evidence.",
        fileName: "users.csv",
        rowNumber: user.rowNumber,
        field: "primaryOrgSourcedId",
        expected: "roles.csv user/org role",
        actual: "missing role",
      }),
    },
  ]);
}

function validateRoleUserProfiles(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.rosteringPackage.roles,
      when: (role) => role.userProfileSourcedId !== undefined,
      satisfies: (role, ctx) => {
        const userProfileSourcedId = role.userProfileSourcedId;

        if (userProfileSourcedId === undefined) {
          return true;
        }

        const userProfile = ctx.rosteringIndexes.userProfilesBySourcedId.get(userProfileSourcedId);
        return userProfile === undefined || userProfile.userSourcedId === role.userSourcedId;
      },
      diagnostic: (role) => ({
        code: "semantic.user_profile_user_mismatch",
        message: "OneRoster role userProfileSourcedId must reference a profile for the same user.",
        fileName: "roles.csv",
        rowNumber: role.rowNumber,
        field: "userProfileSourcedId",
        expected: "userProfiles.userSourcedId matching roles.userSourcedId",
        actual: "mismatch",
      }),
    },
  ]);
}
