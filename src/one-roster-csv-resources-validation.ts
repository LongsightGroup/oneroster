import { parseOneRosterCsvResourcesZip } from "./one-roster-csv-resources.js";
import {
  buildResourcesReferenceIndexes,
  classResourcesRecordSet,
  courseResourcesRecordSet,
  resourcesRecordSet,
  type ResourcesRecordSet,
  userResourcesRecordSet,
} from "./one-roster-csv-resources-tables.js";
import type {
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesRecordBase,
  OneRosterCsvResourcesReferenceIndexes,
} from "./one-roster-csv-resources-types.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  collectProfileReferenceValidation,
  type OneRosterCsvReferenceValidationOptions,
} from "./one-roster-csv-profile-validation.js";
import { isManifestDataFilePresent } from "./one-roster-csv-manifest.js";
import {
  defineOneRosterCsvReferenceRule,
  optionalOneRosterCsvReference,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationContext,
} from "./one-roster-csv-record-reference-validation.js";
import { rosteringIndexTargets } from "./one-roster-csv-rostering-reference-targets.js";
import type {
  OneRosterCsvRosteringValidationState,
  OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
export type { OneRosterCsvReferenceValidationOptions as OneRosterCsvResourcesValidationOptions } from "./one-roster-csv-profile-validation.js";

/** OneRoster CSV resources package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedResourcesPackage = {
  readonly resourcesPackage: OneRosterCsvResourcesPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly indexes: OneRosterCsvResourcesReferenceIndexes;
};

/** Accumulated resources validation state, including indexes even when diagnostics exist. */
export type OneRosterCsvResourcesValidationState = {
  readonly rosteringValidation: OneRosterCsvRosteringValidationState;
  readonly indexes: OneRosterCsvResourcesReferenceIndexes;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

type ResourcesReferenceValidationContext =
  OneRosterCsvReferenceValidationContext<OneRosterCsvResourcesPackage> & {
    readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
    readonly indexes: OneRosterCsvResourcesReferenceIndexes;
  };

type ResourcesReferenceRule = OneRosterCsvReferenceRule<ResourcesReferenceValidationContext>;

function resourcesRecordSetTarget<TRecord extends OneRosterCsvResourcesRecordBase>(
  recordSet: ResourcesRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

const rosteringTargets = rosteringIndexTargets<ResourcesReferenceValidationContext>();

const RESOURCES_REFERENCE_RULES: readonly ResourcesReferenceRule[] = [
  defineOneRosterCsvReferenceRule({
    source: classResourcesRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: classResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: courseResourcesRecordSet,
    field: "courseSourcedId",
    target: rosteringTargets.courses,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: courseResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "userSourcedId",
    target: rosteringTargets.users,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "orgSourcedId",
    target: rosteringTargets.orgs,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.orgSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.classSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
];

/** Parse a OneRoster CSV ZIP archive and validate resources plus rostering references. */
export function parseAndValidateOneRosterCsvResourcesZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const parsedPackage = parseOneRosterCsvResourcesZip(bytes, options);

  if (parsedPackage._tag === "err") {
    return err(parsedPackage.error);
  }

  return validateOneRosterCsvResourcesPackage(parsedPackage.value, options);
}

/** Validate duplicate sourcedIds and direct references in a typed resources package. */
export function validateOneRosterCsvResourcesPackage(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const validation = collectOneRosterCsvResourcesValidation(packageValue, options);

  if (validation.diagnostics.length > 0) {
    return err(validation.diagnostics);
  }

  return ok({
    resourcesPackage: packageValue,
    rosteringValidation: {
      rosteringPackage: packageValue.rosteringPackage,
      indexes: validation.rosteringValidation.indexes,
    },
    indexes: validation.indexes,
  });
}

/** Collect duplicate and reference validation diagnostics for typed resources records. */
export function collectOneRosterCsvResourcesValidation(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
  rosteringValidation?: OneRosterCsvRosteringValidationState,
  includeRosteringDiagnostics = true,
): OneRosterCsvResourcesValidationState {
  return collectProfileReferenceValidation({
    rosteringPackage: packageValue.rosteringPackage,
    packageValue,
    options,
    rosteringValidation,
    includeRosteringDiagnostics,
    buildIndexes: buildResourcesReferenceIndexes,
    buildContext: ({
      packageValue: currentPackage,
      rosteringValidation: currentRosteringValidation,
      indexes,
      diagnostics,
      referenceMode,
    }) => ({
      packageValue: currentPackage,
      rosteringIndexes: currentRosteringValidation.indexes,
      indexes,
      diagnostics,
      referenceMode,
      isTargetFilePresent: (targetFileName) =>
        isManifestDataFilePresent(
          currentPackage.rosteringPackage.rawPackage.manifest.fileModes,
          targetFileName,
        ),
    }),
    rules: RESOURCES_REFERENCE_RULES,
  });
}
