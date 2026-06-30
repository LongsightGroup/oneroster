import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import {
  addSemanticDiagnostic,
  shouldValidateSemanticRecord,
} from "./one-roster-csv-full-semantic-diagnostic.js";
import {
  buildResourceRoleEvidence,
  hasUserResourceEnrollmentTargets,
  validateSemanticClassUserEnrollment,
} from "./one-roster-csv-full-semantic-policies.js";
import { runSemanticRowRules } from "./one-roster-csv-full-semantic-rules.js";

/** Validate resources semantics that require typed resources and rostering records. */
export function validateOneRosterCsvFullResourcesSemantics(
  context: OneRosterCsvFullSemanticContext,
): void {
  validateUserResourceClassOrgs(context);
  validateUserResourceEnrollmentMembership(context);
  validateUserResourceRoles(context);
}

function validateUserResourceClassOrgs(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.resourcesPackage.userResources,
      when: (userResource) =>
        userResource.classSourcedId !== undefined && userResource.orgSourcedId !== undefined,
      satisfies: (userResource, ctx) => {
        const classSourcedId = userResource.classSourcedId;
        const orgSourcedId = userResource.orgSourcedId;

        if (classSourcedId === undefined || orgSourcedId === undefined) {
          return true;
        }

        const classRecord = ctx.rosteringIndexes.classesBySourcedId.get(classSourcedId);
        return classRecord === undefined || classRecord.schoolSourcedId === orgSourcedId;
      },
      diagnostic: (userResource) => ({
        code: "semantic.user_resource_class_org_mismatch",
        message: "OneRoster userResource orgSourcedId must match the referenced class school.",
        fileName: "userResources.csv",
        rowNumber: userResource.rowNumber,
        field: "orgSourcedId",
        expected: "classes.schoolSourcedId",
        actual: "mismatch",
      }),
    },
  ]);
}

function validateUserResourceEnrollmentMembership(context: OneRosterCsvFullSemanticContext): void {
  for (const userResource of context.packageValue.resourcesPackage.userResources) {
    if (userResource.classSourcedId === undefined) {
      continue;
    }

    validateSemanticClassUserEnrollment(context, {
      record: userResource,
      classSourcedId: userResource.classSourcedId,
      userSourcedId: userResource.userSourcedId,
      hasTargets: hasUserResourceEnrollmentTargets(
        context,
        userResource,
        userResource.classSourcedId,
      ),
      fileName: "userResources.csv",
      field: "userSourcedId",
      code: "semantic.user_resource_user_not_enrolled",
      message: "OneRoster userResource user must be enrolled in the referenced class.",
    });
  }
}

function validateUserResourceRoles(context: OneRosterCsvFullSemanticContext): void {
  for (const userResource of context.packageValue.resourcesPackage.userResources) {
    if (!shouldValidateSemanticRecord(context, userResource)) {
      continue;
    }

    const resource = context.resourcesIndexes.resourcesBySourcedId.get(
      userResource.resourceSourcedId,
    );
    if (
      resource === undefined ||
      resource.roles.length === 0 ||
      !context.rosteringIndexes.usersBySourcedId.has(userResource.userSourcedId)
    ) {
      continue;
    }

    const evidence = buildResourceRoleEvidence(context, userResource.userSourcedId);
    if (!evidence.hasEvidence || resource.roles.some((role) => evidence.roles.has(role))) {
      continue;
    }

    addSemanticDiagnostic(context, {
      code: "semantic.resource_role_mismatch",
      message: "OneRoster userResource user must have one of the resource roles.",
      fileName: "userResources.csv",
      rowNumber: userResource.rowNumber,
      field: "resourceSourcedId",
      expected: "resources.roles matching user role evidence",
      actual: "no matching role",
    });
  }
}
