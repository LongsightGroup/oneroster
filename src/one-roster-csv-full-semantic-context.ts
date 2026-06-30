import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import {
  classUserKey,
  type OneRosterEnrollmentRelationshipIndexes,
} from "./one-roster-csv-enrollment-indexes.js";
import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";
import { isManifestDataFilePresent } from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { appendIndexedMapValue } from "./one-roster-csv-indexed-map.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvReferenceValidationMode } from "./one-roster-csv-record-reference-validation.js";
import type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
import type {
  OneRosterCsvRosteringReferenceIndexes,
  OneRosterEnrollmentRecord,
  OneRosterRoleRecord,
} from "./one-roster-csv-rostering-types.js";

export { classUserKey } from "./one-roster-csv-enrollment-indexes.js";

/** Internal lookup indexes used only by full-package semantic validation. */
export type OneRosterCsvFullSemanticIndexes = {
  readonly enrollmentsByClassAndUser: ReadonlyMap<string, readonly OneRosterEnrollmentRecord[]>;
  readonly enrollmentsByUserSourcedId: ReadonlyMap<
    OneRosterGuid,
    readonly OneRosterEnrollmentRecord[]
  >;
  readonly rolesByUser: ReadonlyMap<OneRosterGuid, readonly OneRosterRoleRecord[]>;
  readonly rolesByUserOrg: ReadonlyMap<string, readonly OneRosterRoleRecord[]>;
};

/** Shared context for full-package semantic validation modules. */
export type OneRosterCsvFullSemanticContext = {
  readonly packageValue: OneRosterCsvFullPackage;
  readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
  readonly gradebookIndexes: OneRosterCsvGradebookReferenceIndexes;
  readonly resourcesIndexes: OneRosterCsvResourcesReferenceIndexes;
  readonly semanticIndexes: OneRosterCsvFullSemanticIndexes;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
  readonly isManifestFilePresent: (fileName: OneRosterCsvDataFileName) => boolean;
  readonly hasClassEnrollment: (
    classSourcedId: OneRosterGuid,
    userSourcedId: OneRosterGuid,
  ) => boolean;
};

/** Build private role indexes for cross-record semantic checks. */
export function buildOneRosterCsvFullSemanticIndexes(
  packageValue: OneRosterCsvFullPackage,
  enrollmentIndexes: OneRosterEnrollmentRelationshipIndexes,
): OneRosterCsvFullSemanticIndexes {
  const rolesByUser = new Map<OneRosterGuid, OneRosterRoleRecord[]>();
  const rolesByUserOrg = new Map<string, OneRosterRoleRecord[]>();

  for (const role of packageValue.rosteringPackage.roles) {
    appendIndexedMapValue(rolesByUser, role.userSourcedId, role);
    appendIndexedMapValue(rolesByUserOrg, userOrgKey(role.userSourcedId, role.orgSourcedId), role);
  }

  return {
    enrollmentsByClassAndUser: enrollmentIndexes.enrollmentsByClassAndUser,
    enrollmentsByUserSourcedId: enrollmentIndexes.enrollmentsByUserSourcedId,
    rolesByUser,
    rolesByUserOrg,
  };
}

/** Build the shared semantic validation context for a full package. */
export function buildOneRosterCsvFullSemanticContext(input: {
  readonly packageValue: OneRosterCsvFullPackage;
  readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
  readonly gradebookIndexes: OneRosterCsvGradebookReferenceIndexes;
  readonly resourcesIndexes: OneRosterCsvResourcesReferenceIndexes;
  readonly enrollmentIndexes: OneRosterEnrollmentRelationshipIndexes;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
}): OneRosterCsvFullSemanticContext {
  const semanticIndexes = buildOneRosterCsvFullSemanticIndexes(
    input.packageValue,
    input.enrollmentIndexes,
  );
  const fileModes = input.packageValue.rosteringPackage.manifest.fileModes;

  return {
    packageValue: input.packageValue,
    rosteringIndexes: input.rosteringIndexes,
    gradebookIndexes: input.gradebookIndexes,
    resourcesIndexes: input.resourcesIndexes,
    semanticIndexes,
    diagnostics: input.diagnostics,
    referenceMode: input.referenceMode,
    isManifestFilePresent: (fileName) => isManifestDataFilePresent(fileModes, fileName),
    hasClassEnrollment: (classSourcedId, userSourcedId) =>
      semanticIndexes.enrollmentsByClassAndUser.has(classUserKey(classSourcedId, userSourcedId)),
  };
}

/** Build a stable private key for user/org role lookups. */
export function userOrgKey(userSourcedId: OneRosterGuid, orgSourcedId: OneRosterGuid): string {
  return `${userSourcedId}|${orgSourcedId}`;
}
