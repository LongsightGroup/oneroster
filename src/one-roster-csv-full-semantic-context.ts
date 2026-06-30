import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";
import { isManifestDataFilePresent } from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvReferenceValidationMode } from "./one-roster-csv-record-reference-validation.js";
import type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
import type {
  OneRosterCsvRosteringReferenceIndexes,
  OneRosterEnrollmentRecord,
  OneRosterRoleRecord,
} from "./one-roster-csv-rostering-types.js";

/** Internal lookup indexes used only by full-package semantic validation. */
export type OneRosterCsvFullSemanticIndexes = {
  readonly enrollmentsByClassAndUser: ReadonlyMap<string, readonly OneRosterEnrollmentRecord[]>;
  readonly enrollmentsByUser: ReadonlyMap<OneRosterGuid, readonly OneRosterEnrollmentRecord[]>;
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

/** Build private indexes for cross-record semantic checks. */
export function buildOneRosterCsvFullSemanticIndexes(
  packageValue: OneRosterCsvFullPackage,
): OneRosterCsvFullSemanticIndexes {
  const enrollmentsByClassAndUser = new Map<string, OneRosterEnrollmentRecord[]>();
  const enrollmentsByUser = new Map<OneRosterGuid, OneRosterEnrollmentRecord[]>();
  const rolesByUser = new Map<OneRosterGuid, OneRosterRoleRecord[]>();
  const rolesByUserOrg = new Map<string, OneRosterRoleRecord[]>();

  for (const enrollment of packageValue.rosteringPackage.enrollments) {
    appendMapValue(
      enrollmentsByClassAndUser,
      classUserKey(enrollment.classSourcedId, enrollment.userSourcedId),
      enrollment,
    );
    appendMapValue(enrollmentsByUser, enrollment.userSourcedId, enrollment);
  }

  for (const role of packageValue.rosteringPackage.roles) {
    appendMapValue(rolesByUser, role.userSourcedId, role);
    appendMapValue(rolesByUserOrg, userOrgKey(role.userSourcedId, role.orgSourcedId), role);
  }

  return {
    enrollmentsByClassAndUser,
    enrollmentsByUser,
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
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
}): OneRosterCsvFullSemanticContext {
  const semanticIndexes = buildOneRosterCsvFullSemanticIndexes(input.packageValue);
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

/** Build a stable private key for class/user membership lookups. */
export function classUserKey(classSourcedId: OneRosterGuid, userSourcedId: OneRosterGuid): string {
  return `${classSourcedId}|${userSourcedId}`;
}

/** Build a stable private key for user/org role lookups. */
export function userOrgKey(userSourcedId: OneRosterGuid, orgSourcedId: OneRosterGuid): string {
  return `${userSourcedId}|${orgSourcedId}`;
}

function appendMapValue<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey, value: TValue): void {
  const values = map.get(key);

  if (values === undefined) {
    map.set(key, [value]);
    return;
  }

  values.push(value);
}
