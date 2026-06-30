import {
  parseOneRosterCsvLayeredPackage,
  parseOneRosterCsvLayeredZip,
} from "./one-roster-csv-layered-package.js";
import { parseGradebookPackageRecords } from "./one-roster-csv-gradebook-tables.js";
import type { OneRosterCsvGradebookPackage } from "./one-roster-csv-gradebook-types.js";
import type { OneRosterCsvPackage, OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseResourcesPackageRecords } from "./one-roster-csv-resources-tables.js";
import type { OneRosterCsvResourcesPackage } from "./one-roster-csv-resources-types.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import { ok, type Result } from "./result.js";

export type {
  OneRosterCategoryRecord,
  OneRosterCsvGradebookFileName,
  OneRosterCsvGradebookRecordBase,
  OneRosterLearningObjectiveSource,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterResultScoreStatus,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";
export type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterCsvResourcesFileName,
  OneRosterCsvResourcesRecordBase,
  OneRosterResourceImportance,
  OneRosterResourceRecord,
  OneRosterResourceRole,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources-types.js";
export type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringRecordBase,
  OneRosterDemographicsRecord,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterRoleRecord,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

/** Typed OneRoster CSV package containing all supported CSV binding record layers. */
export type OneRosterCsvFullPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly gradebookPackage: OneRosterCsvGradebookPackage;
  readonly resourcesPackage: OneRosterCsvResourcesPackage;
};

function parseFullProfileRecords(
  packageValue: OneRosterCsvPackage,
  rosteringPackage: OneRosterCsvRosteringPackage | undefined,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): {
  readonly gradebookPackage: OneRosterCsvGradebookPackage;
  readonly resourcesPackage: OneRosterCsvResourcesPackage;
} {
  const gradebookRecords = parseGradebookPackageRecords(packageValue, diagnostics);
  const resourcesRecords = parseResourcesPackageRecords(packageValue, diagnostics);
  // SAFETY: failed parses return diagnostics before this composite package is used.
  const rostering = rosteringPackage!;

  return {
    gradebookPackage: {
      rosteringPackage: rostering,
      ...gradebookRecords,
    },
    resourcesPackage: {
      rosteringPackage: rostering,
      ...resourcesRecords,
    },
  };
}

/** Parse a OneRoster CSV ZIP archive into all supported typed CSV record layers. */
export function parseOneRosterCsvFullZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvLayeredZip(bytes, options, parseFullProfileRecords);
}

/** Parse an already-normalized OneRoster CSV package into all supported typed CSV record layers. */
export function parseOneRosterCsvFullPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseOneRosterCsvLayeredPackage(packageValue, parseFullProfileRecords);

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value);
}
