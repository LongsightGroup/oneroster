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
  defineOneRosterCsvReferenceRule,
  optionalOneRosterCsvReference,
  validateOneRosterCsvReferences,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationContext,
} from "./one-roster-csv-record-reference-validation.js";
import {
  collectOneRosterCsvRosteringValidation,
  type OneRosterCsvReferenceValidationMode,
  type OneRosterCsvRosteringValidationOptions,
  type OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";

/** Options for semantic validation of typed OneRoster CSV gradebook records. */
export type OneRosterCsvGradebookValidationOptions = {
  readonly referenceMode?: OneRosterCsvReferenceValidationMode;
};

/** OneRoster CSV gradebook package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedGradebookPackage = {
  readonly gradebookPackage: OneRosterCsvGradebookPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly indexes: OneRosterCsvGradebookReferenceIndexes;
};

type GradebookReferenceValidationContext =
  OneRosterCsvReferenceValidationContext<OneRosterCsvGradebookPackage> & {
    readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
    readonly indexes: OneRosterCsvGradebookReferenceIndexes;
  };

type GradebookReferenceRule = OneRosterCsvReferenceRule<GradebookReferenceValidationContext>;

function defineGradebookReferenceRule<TRecord extends OneRosterCsvGradebookRecordBase>(rule: {
  readonly source: GradebookRecordSet<TRecord>;
  readonly field: string;
  readonly target: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext>;
  readonly getReferenceValues: (record: TRecord) => ReadonlyArray<TRecord["sourcedId"]>;
}): GradebookReferenceRule {
  return defineOneRosterCsvReferenceRule({
    source: rule.source,
    field: rule.field,
    target: rule.target,
    getReferenceValues: rule.getReferenceValues,
  });
}

function gradebookTarget<TRecord extends OneRosterCsvGradebookRecordBase>(
  recordSet: GradebookRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

const academicSessionsTarget: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> = {
  fileName: "academicSessions.csv",
  getIndex: (context) => context.rosteringIndexes.academicSessionsBySourcedId,
};

const classesTarget: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> = {
  fileName: "classes.csv",
  getIndex: (context) => context.rosteringIndexes.classesBySourcedId,
};

const coursesTarget: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> = {
  fileName: "courses.csv",
  getIndex: (context) => context.rosteringIndexes.coursesBySourcedId,
};

const orgsTarget: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> = {
  fileName: "orgs.csv",
  getIndex: (context) => context.rosteringIndexes.orgsBySourcedId,
};

const usersTarget: OneRosterCsvReferenceTarget<GradebookReferenceValidationContext> = {
  fileName: "users.csv",
  getIndex: (context) => context.rosteringIndexes.usersBySourcedId,
};

function isGradebookTargetFilePresent(
  packageValue: OneRosterCsvGradebookPackage,
  targetFileName: Parameters<GradebookReferenceValidationContext["isTargetFilePresent"]>[0],
): boolean {
  return packageValue.rosteringPackage.rawPackage.manifest.fileModes[targetFileName] !== "absent";
}

const GRADEBOOK_REFERENCE_RULES: readonly GradebookReferenceRule[] = [
  defineGradebookReferenceRule({
    source: lineItemsRecordSet,
    field: "classSourcedId",
    target: classesTarget,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemsRecordSet,
    field: "categorySourcedId",
    target: gradebookTarget(categoriesRecordSet),
    getReferenceValues: (record) => [record.categorySourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemsRecordSet,
    field: "academicSessionSourcedId",
    target: academicSessionsTarget,
    getReferenceValues: (record) => [record.academicSessionSourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemsRecordSet,
    field: "schoolSourcedId",
    target: orgsTarget,
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultsRecordSet,
    field: "lineItemSourcedId",
    target: gradebookTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultsRecordSet,
    field: "studentSourcedId",
    target: usersTarget,
    getReferenceValues: (record) => [record.studentSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultsRecordSet,
    field: "classSourcedId",
    target: classesTarget,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.classSourcedId),
  }),
  defineGradebookReferenceRule({
    source: scoreScalesRecordSet,
    field: "orgSourcedId",
    target: orgsTarget,
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineGradebookReferenceRule({
    source: scoreScalesRecordSet,
    field: "courseSourcedId",
    target: coursesTarget,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineGradebookReferenceRule({
    source: scoreScalesRecordSet,
    field: "classSourcedId",
    target: classesTarget,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemLearningObjectiveIdsRecordSet,
    field: "lineItemSourcedId",
    target: gradebookTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemScoreScalesRecordSet,
    field: "lineItemSourcedId",
    target: gradebookTarget(lineItemsRecordSet),
    getReferenceValues: (record) => [record.lineItemSourcedId],
  }),
  defineGradebookReferenceRule({
    source: lineItemScoreScalesRecordSet,
    field: "scoreScaleSourcedId",
    target: gradebookTarget(scoreScalesRecordSet),
    getReferenceValues: (record) => [record.scoreScaleSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultLearningObjectiveIdsRecordSet,
    field: "resultSourcedId",
    target: gradebookTarget(resultsRecordSet),
    getReferenceValues: (record) => [record.resultSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultScoreScalesRecordSet,
    field: "resultSourcedId",
    target: gradebookTarget(resultsRecordSet),
    getReferenceValues: (record) => [record.resultSourcedId],
  }),
  defineGradebookReferenceRule({
    source: resultScoreScalesRecordSet,
    field: "scoreScaleSourcedId",
    target: gradebookTarget(scoreScalesRecordSet),
    getReferenceValues: (record) => [record.scoreScaleSourcedId],
  }),
];

/** Parse a OneRoster CSV ZIP archive and validate gradebook plus rostering references. */
export function parseAndValidateOneRosterCsvGradebookZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvGradebookValidationOptions = {},
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
  options: OneRosterCsvGradebookValidationOptions = {},
): Result<OneRosterCsvValidatedGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const rosteringOptions: OneRosterCsvRosteringValidationOptions =
    options.referenceMode === undefined ? {} : { referenceMode: options.referenceMode };
  const rosteringValidation = collectOneRosterCsvRosteringValidation(
    packageValue.rosteringPackage,
    rosteringOptions,
  );
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [...rosteringValidation.diagnostics];
  const indexes = buildGradebookReferenceIndexes(packageValue, diagnostics);
  const context: GradebookReferenceValidationContext = {
    packageValue,
    rosteringIndexes: rosteringValidation.indexes,
    indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
    isTargetFilePresent: (targetFileName) =>
      isGradebookTargetFilePresent(packageValue, targetFileName),
  };

  validateOneRosterCsvReferences(GRADEBOOK_REFERENCE_RULES, context);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    gradebookPackage: packageValue,
    rosteringValidation: {
      rosteringPackage: packageValue.rosteringPackage,
      indexes: rosteringValidation.indexes,
    },
    indexes,
  });
}
