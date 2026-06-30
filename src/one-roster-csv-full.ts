import {
  parseGradebookPackageRecords,
  type GradebookPackageRecords,
} from "./one-roster-csv-gradebook-tables.js";
import type { OneRosterCsvGradebookPackage } from "./one-roster-csv-gradebook-types.js";
import {
  parseOneRosterCsvLayeredPackage,
  parseOneRosterCsvLayeredZip,
} from "./one-roster-csv-layered-package.js";
import type { OneRosterCsvPackage, OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  parseResourcesPackageRecords,
  type ResourcesPackageRecords,
} from "./one-roster-csv-resources-tables.js";
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

type FullLayerRecords = GradebookPackageRecords & ResourcesPackageRecords;

type LayeredFullPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
} & FullLayerRecords;

/** Parse a OneRoster CSV ZIP archive into all supported typed CSV record layers. */
export function parseOneRosterCsvFullZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseOneRosterCsvLayeredZip(bytes, options, parseFullPackageRecords);

  if (result._tag === "err") {
    return result;
  }

  return ok(toFullPackage(result.value));
}

/** Parse an already-normalized OneRoster CSV package into all supported typed CSV record layers. */
export function parseOneRosterCsvFullPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseOneRosterCsvLayeredPackage(packageValue, parseFullPackageRecords);

  if (result._tag === "err") {
    return result;
  }

  return ok(toFullPackage(result.value));
}

function parseFullPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): FullLayerRecords {
  return {
    ...parseGradebookPackageRecords(packageValue, diagnostics),
    ...parseResourcesPackageRecords(packageValue, diagnostics),
  };
}

function toFullPackage(packageValue: LayeredFullPackage): OneRosterCsvFullPackage {
  const gradebookPackage: OneRosterCsvGradebookPackage = {
    rosteringPackage: packageValue.rosteringPackage,
    categories: packageValue.categories,
    lineItems: packageValue.lineItems,
    results: packageValue.results,
    scoreScales: packageValue.scoreScales,
    lineItemLearningObjectiveIds: packageValue.lineItemLearningObjectiveIds,
    lineItemScoreScales: packageValue.lineItemScoreScales,
    resultLearningObjectiveIds: packageValue.resultLearningObjectiveIds,
    resultScoreScales: packageValue.resultScoreScales,
  };
  const resourcesPackage: OneRosterCsvResourcesPackage = {
    rosteringPackage: packageValue.rosteringPackage,
    resources: packageValue.resources,
    classResources: packageValue.classResources,
    courseResources: packageValue.courseResources,
    userResources: packageValue.userResources,
  };

  return {
    rosteringPackage: packageValue.rosteringPackage,
    gradebookPackage,
    resourcesPackage,
  };
}
