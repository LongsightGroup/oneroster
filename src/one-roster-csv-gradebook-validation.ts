import { parseOneRosterCsvGradebookZip } from "./one-roster-csv-gradebook.js";
import type {
  OneRosterCsvGradebookPackage,
  OneRosterCsvGradebookRecordBase,
  OneRosterCsvGradebookReferenceIndexes,
} from "./one-roster-csv-gradebook-types.js";
import {
  buildGradebookReferenceIndexes,
  categoriesRecordSet,
  lineItemLearningObjectiveIdsRecordSet,
  lineItemsRecordSet,
  lineItemScoreScalesRecordSet,
  resultLearningObjectiveIdsRecordSet,
  resultsRecordSet,
  resultScoreScalesRecordSet,
  scoreScalesRecordSet,
  type GradebookRecordSet,
} from "./one-roster-csv-gradebook-tables.js";
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

export type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";
export type { OneRosterCsvReferenceValidationOptions as OneRosterCsvGradebookValidationOptions } from "./one-roster-csv-profile-validation.js";

/** OneRoster CSV gradebook package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedGradebookPackage = {
  readonly gradebookPackage: OneRosterCsvGradebookPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly indexes: OneRosterCsvGradebookReferenceIndexes;
};

/** Accumulated gradebook validation state, including indexes even when diagnostics exist. */
export type OneRosterCsvGradebookValidationState = {
  readonly rosteringValidation: OneRosterCsvRosteringValidationState;
  readonly indexes: OneRosterCsvGradebookReferenceIndexes;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

type GradebookReferenceValidationContext =
  OneRosterCsvReferenceValidationContext<OneRosterCsvGradebookPackage> & {
    readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
    readonly indexes: OneRosterCsvGradebookReferenceIndexes;
  };

type GradebookReferenceRule = OneRosterCsvReferenceRule<GradebookReferenceValidationContext>;

function gradebookRecordSetTarget<TRecord extends OneRosterCsvGradebookRecordBase>(
  recordSet: GradebookRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

const rosteringTargets = rosteringIndexTargets<GradebookReferenceValidationContext>();

const GRADEBOOK_REFERENCE_RULES: readonly GradebookReferenceRule[] = [
  defineOneRosterCsvReferenceRule({
    source: lineItemsRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemsRecordSet,
    field: "categorySourcedId",
    target: gradebookRecordSetTarget(categoriesRecordSet),
    getReferenceValues: (record) => [record.categorySourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemsRecordSet,
    field: "academicSessionSourcedId",
    target: rosteringTargets.academicSessions,
    getReferenceValues: (record) => [record.academicSessionSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemsRecordSet,
    field: "schoolSourcedId",
    target: rosteringTargets.orgs,
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultsRecordSet,
    field: "lineItemSourcedId",
    target: gradebookRecordSetTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultsRecordSet,
    field: "studentSourcedId",
    target: rosteringTargets.users,
    getReferenceValues: (record) => [record.studentSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultsRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.classSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: scoreScalesRecordSet,
    field: "orgSourcedId",
    target: rosteringTargets.orgs,
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: scoreScalesRecordSet,
    field: "courseSourcedId",
    target: rosteringTargets.courses,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: scoreScalesRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemLearningObjectiveIdsRecordSet,
    field: "lineItemSourcedId",
    target: gradebookRecordSetTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemScoreScalesRecordSet,
    field: "lineItemSourcedId",
    target: gradebookRecordSetTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: lineItemScoreScalesRecordSet,
    field: "scoreScaleSourcedId",
    target: gradebookRecordSetTarget(scoreScalesRecordSet),
    getReferenceValues: (record) => [record.scoreScaleSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultLearningObjectiveIdsRecordSet,
    field: "resultSourcedId",
    target: gradebookRecordSetTarget(resultsRecordSet),
    getReferenceValues: (record) => [record.resultSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultScoreScalesRecordSet,
    field: "resultSourcedId",
    target: gradebookRecordSetTarget(resultsRecordSet),
    getReferenceValues: (record) => [record.resultSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: resultScoreScalesRecordSet,
    field: "scoreScaleSourcedId",
    target: gradebookRecordSetTarget(scoreScalesRecordSet),
    getReferenceValues: (record) => [record.scoreScaleSourcedId],
  }),
];

/** Parse a OneRoster CSV ZIP archive and validate gradebook plus rostering references. */
export function parseAndValidateOneRosterCsvGradebookZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const parsedPackage = parseOneRosterCsvGradebookZip(bytes, options);

  if (parsedPackage._tag === "err") {
    return err(parsedPackage.error);
  }

  return validateOneRosterCsvGradebookPackage(parsedPackage.value, options);
}

/** Validate duplicate sourcedIds and direct references in a typed gradebook package. */
export function validateOneRosterCsvGradebookPackage(
  packageValue: OneRosterCsvGradebookPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const validation = collectOneRosterCsvGradebookValidation(packageValue, options);

  if (validation.diagnostics.length > 0) {
    return err(validation.diagnostics);
  }

  return ok({
    gradebookPackage: packageValue,
    rosteringValidation: {
      rosteringPackage: packageValue.rosteringPackage,
      indexes: validation.rosteringValidation.indexes,
    },
    indexes: validation.indexes,
  });
}

/** Collect duplicate and reference validation diagnostics for typed gradebook records. */
export function collectOneRosterCsvGradebookValidation(
  packageValue: OneRosterCsvGradebookPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
  rosteringValidation?: OneRosterCsvRosteringValidationState,
  includeRosteringDiagnostics = true,
): OneRosterCsvGradebookValidationState {
  return collectProfileReferenceValidation({
    rosteringPackage: packageValue.rosteringPackage,
    packageValue,
    options,
    rosteringValidation,
    includeRosteringDiagnostics,
    buildIndexes: buildGradebookReferenceIndexes,
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
    rules: GRADEBOOK_REFERENCE_RULES,
  });
}
