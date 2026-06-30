import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import type {
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
} from "./one-roster-csv-gradebook-types.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterResourceRole } from "./one-roster-csv-resources-types.js";
import type { OneRosterUserResourceRecord } from "./one-roster-csv-resources-types.js";
import type {
  OneRosterAcademicSessionType,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterOrgType,
  OneRosterRole,
  OneRosterRoleRecord,
} from "./one-roster-csv-rostering-types.js";
import { isExtensionVocabularyToken } from "./one-roster-csv-vocabulary.js";
import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import { userOrgKey } from "./one-roster-csv-full-semantic-context.js";
import {
  addSemanticDiagnostic,
  shouldValidateSemanticRecord,
} from "./one-roster-csv-full-semantic-diagnostic.js";
import { runSemanticRowRules } from "./one-roster-csv-full-semantic-rules.js";

const caseUuidUrnPattern =
  /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export type ResourceRoleEvidence = {
  readonly hasEvidence: boolean;
  readonly roles: ReadonlySet<OneRosterResourceRole>;
};

/** Return true when an org type is an acceptable school reference target. */
export function isSchoolOrgType(type: OneRosterOrgType): boolean {
  return type === "school" || isExtensionVocabularyToken(type);
}

/** Return true when a referenced org should not trigger a school-org semantic error. */
export function isAcceptableSchoolOrgReference(org: OneRosterOrgRecord | undefined): boolean {
  return org === undefined || isSchoolOrgType(org.type);
}

/** Return true when an academic session type is a school year or extension token. */
export function isSchoolYearAcademicSessionType(type: OneRosterAcademicSessionType): boolean {
  return type === "schoolYear" || isExtensionVocabularyToken(type);
}

/** Return true when an academic session type is invalid for class term references. */
export function isInvalidClassTermSessionType(type: OneRosterAcademicSessionType): boolean {
  return type === "schoolYear";
}

/** Return true when an academic session type is invalid for line item references. */
export function isInvalidLineItemAcademicSessionType(type: OneRosterAcademicSessionType): boolean {
  return type === "schoolYear";
}

/** Return true when a roles.csv role is an administrator role. */
export function isAdministratorRole(role: OneRosterRole): boolean {
  return (
    role === "districtAdministrator" ||
    role === "principal" ||
    role === "siteAdministrator" ||
    role === "systemAdministrator"
  );
}

/** Map a roles.csv role to a resources.csv role when the vocabulary aligns. */
export function resourceRoleFromRole(role: OneRosterRole): OneRosterResourceRole | undefined {
  if (isExtensionVocabularyToken(role)) {
    return role;
  }

  if (isAdministratorRole(role)) {
    return "administrator";
  }

  switch (role) {
    case "aide":
    case "guardian":
    case "parent":
    case "proctor":
    case "relative":
    case "student":
    case "teacher":
      return role;
    default:
      return undefined;
  }
}

/** Return true when a CASE learning objective identifier is a UUID URN. */
export function isValidCaseLearningObjectiveUrn(learningObjectiveId: string): boolean {
  return caseUuidUrnPattern.test(learningObjectiveId);
}

/** Return true when a score scale value uses {lhs:rhs} mapping syntax. */
export function isValidScoreScaleMapping(value: string): boolean {
  if (!value.startsWith("{") || !value.endsWith("}")) {
    return false;
  }

  const inner = value.slice(1, -1);
  const colonIndex = inner.indexOf(":");

  return colonIndex > 0 && colonIndex === inner.lastIndexOf(":") && colonIndex < inner.length - 1;
}

/** Return true when a line item has comparable min/max score bounds. */
export function hasComparableScoreBounds(
  lineItem: OneRosterLineItemRecord,
): lineItem is OneRosterLineItemRecord & {
  readonly resultValueMin: number;
  readonly resultValueMax: number;
} {
  return lineItem.resultValueMin !== undefined && lineItem.resultValueMax !== undefined;
}

/** Return true when a line item has an invalid min/max score range. */
export function hasInvalidScoreBounds(lineItem: OneRosterLineItemRecord): boolean {
  return hasComparableScoreBounds(lineItem) && lineItem.resultValueMin > lineItem.resultValueMax;
}

/** Validate CASE learning objective identifiers for a typed objective-id file. */
export function validateCaseLearningObjectiveIdRecords(
  context: OneRosterCsvFullSemanticContext,
  records: ReadonlyArray<
    OneRosterLineItemLearningObjectiveIdRecord | OneRosterResultLearningObjectiveIdRecord
  >,
  fileName: "lineItemLearningObjectiveIds.csv" | "resultLearningObjectiveIds.csv",
): void {
  runSemanticRowRules(context, [
    {
      records,
      when: (record) => record.source === "case",
      satisfies: (record) => isValidCaseLearningObjectiveUrn(record.learningObjectiveId),
      diagnostic: (record) => ({
        code: "semantic.invalid_case_learning_objective_id",
        message: "OneRoster CASE learning objective identifiers must be UUID URNs.",
        fileName,
        rowNumber: record.rowNumber,
        field: "learningObjectiveId",
        expected: "UUID URN",
        actual: "invalid",
      }),
    },
  ]);
}

/** Validate that a user is enrolled in a class when enrollments.csv is present. */
export function validateSemanticClassUserEnrollment(
  context: OneRosterCsvFullSemanticContext,
  input: {
    readonly record: OneRosterCsvRecordBase;
    readonly classSourcedId: OneRosterGuid | undefined;
    readonly userSourcedId: OneRosterGuid;
    readonly hasTargets: boolean;
    readonly fileName: OneRosterCsvDataFileName;
    readonly field: string;
    readonly code:
      | "semantic.result_student_not_enrolled"
      | "semantic.user_resource_user_not_enrolled";
    readonly message: string;
  },
): void {
  if (!context.isManifestFilePresent("enrollments.csv")) {
    return;
  }

  if (!shouldValidateSemanticRecord(context, input.record)) {
    return;
  }

  if (input.classSourcedId === undefined || !input.hasTargets) {
    return;
  }

  if (context.hasClassEnrollment(input.classSourcedId, input.userSourcedId)) {
    return;
  }

  addSemanticDiagnostic(context, {
    code: input.code,
    message: input.message,
    fileName: input.fileName,
    rowNumber: input.record.rowNumber,
    field: input.field,
    expected: "enrollments.csv class/user membership",
    actual: "missing",
  });
}

/** Report duplicate primary roles for the same user/org pair. */
export function validateDuplicatePrimaryRoles(context: OneRosterCsvFullSemanticContext): void {
  if (!context.isManifestFilePresent("roles.csv")) {
    return;
  }

  for (const roles of context.semanticIndexes.rolesByUserOrg.values()) {
    let primaryRoleSeen = false;

    for (const role of roles) {
      if (!shouldValidateSemanticRecord(context, role) || role.roleType !== "primary") {
        continue;
      }

      if (!primaryRoleSeen) {
        primaryRoleSeen = true;
        continue;
      }

      addSemanticDiagnostic(context, {
        code: "semantic.multiple_primary_roles_for_user_org",
        message: "OneRoster permits only one primary role for each user/org pair.",
        fileName: "roles.csv",
        rowNumber: role.rowNumber,
        field: "roleType",
        expected: "one primary role per user/org",
        actual: "multiple primary roles",
      });
    }
  }
}

/** Return true when an enrollment role has compatible roles.csv evidence. */
export function roleMatchesEnrollment(
  context: OneRosterCsvFullSemanticContext,
  enrollment: OneRosterEnrollmentRecord,
  role: OneRosterRoleRecord,
): boolean {
  if (isExtensionVocabularyToken(enrollment.role)) {
    return role.role === enrollment.role && role.orgSourcedId === enrollment.schoolSourcedId;
  }

  if (enrollment.role === "administrator") {
    return (
      isAdministratorRole(role.role) &&
      isSameOrAncestorOrg(context, enrollment.schoolSourcedId, role.orgSourcedId)
    );
  }

  return role.role === enrollment.role && role.orgSourcedId === enrollment.schoolSourcedId;
}

/** Build resource-role evidence for a user from enrollments and roles.csv. */
export function buildResourceRoleEvidence(
  context: OneRosterCsvFullSemanticContext,
  userSourcedId: OneRosterGuid,
): ResourceRoleEvidence {
  const roles = new Set<OneRosterResourceRole>();
  let hasEvidence = false;

  for (const enrollment of context.semanticIndexes.enrollmentsByUser.get(userSourcedId) ?? []) {
    hasEvidence = true;
    roles.add(enrollment.role);
  }

  for (const role of context.semanticIndexes.rolesByUser.get(userSourcedId) ?? []) {
    hasEvidence = true;

    const resourceRole = resourceRoleFromRole(role.role);
    if (resourceRole !== undefined) {
      roles.add(resourceRole);
    }
  }

  return { hasEvidence, roles };
}

/** Resolve the effective class for a result, including line item fallback. */
export function effectiveResultClassSourcedId(
  context: OneRosterCsvFullSemanticContext,
  result: OneRosterResultRecord,
): OneRosterGuid | undefined {
  if (result.classSourcedId !== undefined) {
    return result.classSourcedId;
  }

  return context.gradebookIndexes.lineItemsBySourcedId.get(result.lineItemSourcedId)
    ?.classSourcedId;
}

/** Return true when result rostering targets exist for enrollment validation. */
export function hasResultEnrollmentTargets(
  context: OneRosterCsvFullSemanticContext,
  result: OneRosterResultRecord,
  classSourcedId: OneRosterGuid,
): boolean {
  return (
    context.rosteringIndexes.usersBySourcedId.has(result.studentSourcedId) &&
    context.rosteringIndexes.classesBySourcedId.has(classSourcedId)
  );
}

/** Return true when userResource rostering targets exist for enrollment validation. */
export function hasUserResourceEnrollmentTargets(
  context: OneRosterCsvFullSemanticContext,
  userResource: OneRosterUserResourceRecord,
  classSourcedId: OneRosterGuid,
): boolean {
  return (
    context.rosteringIndexes.usersBySourcedId.has(userResource.userSourcedId) &&
    context.rosteringIndexes.classesBySourcedId.has(classSourcedId)
  );
}

/** Return true when a user has a role for their declared primary org. */
export function hasPrimaryOrgRoleEvidence(
  context: OneRosterCsvFullSemanticContext,
  userSourcedId: OneRosterGuid,
  primaryOrgSourcedId: OneRosterGuid,
): boolean {
  return context.semanticIndexes.rolesByUserOrg.has(userOrgKey(userSourcedId, primaryOrgSourcedId));
}

function isSameOrAncestorOrg(
  context: OneRosterCsvFullSemanticContext,
  orgSourcedId: OneRosterGuid,
  possibleAncestorSourcedId: OneRosterGuid,
): boolean {
  if (orgSourcedId === possibleAncestorSourcedId) {
    return true;
  }

  const visited = new Set<OneRosterGuid>();
  let current = context.rosteringIndexes.orgsBySourcedId.get(orgSourcedId);

  while (current?.parentSourcedId !== undefined && !visited.has(current.sourcedId)) {
    visited.add(current.sourcedId);

    if (current.parentSourcedId === possibleAncestorSourcedId) {
      return true;
    }

    current = context.rosteringIndexes.orgsBySourcedId.get(current.parentSourcedId);
  }

  return false;
}
