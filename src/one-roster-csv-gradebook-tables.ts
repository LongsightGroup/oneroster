import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  defineProfileTables,
  type OneRosterCsvRecordSet,
  type OneRosterCsvRecordTableDefinition,
} from "./one-roster-csv-record-tables.js";
import {
  parseCategoryRecord,
  parseLineItemLearningObjectiveIdRecord,
  parseLineItemRecord,
  parseLineItemScoreScaleRecord,
  parseResultLearningObjectiveIdRecord,
  parseResultRecord,
  parseResultScoreScaleRecord,
  parseScoreScaleRecord,
} from "./one-roster-csv-gradebook-record-engine.js";
import {
  categoryHeaders,
  lineItemHeaders,
  lineItemLearningObjectiveIdHeaders,
  lineItemScoreScaleHeaders,
  resultHeaders,
  resultLearningObjectiveIdHeaders,
  resultScoreScaleHeaders,
  scoreScaleHeaders,
} from "./one-roster-csv-gradebook-schema.js";
import type {
  OneRosterCategoryRecord,
  OneRosterCsvGradebookPackage,
  OneRosterCsvGradebookRecordBase,
  OneRosterCsvGradebookReferenceIndexes,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";

export type GradebookPackageRecords = Omit<OneRosterCsvGradebookPackage, "rosteringPackage">;

export type GradebookRecordSet<TRecord extends OneRosterCsvGradebookRecordBase> =
  OneRosterCsvRecordSet<
    OneRosterCsvGradebookPackage,
    OneRosterCsvGradebookReferenceIndexes,
    TRecord
  >;

type GradebookTableDefinition<TRecord extends OneRosterCsvGradebookRecordBase> =
  OneRosterCsvRecordTableDefinition<
    OneRosterCsvGradebookPackage,
    OneRosterCsvGradebookReferenceIndexes,
    TRecord
  >;

const gradebookProfileTables = defineProfileTables<
  OneRosterCsvGradebookPackage,
  OneRosterCsvGradebookReferenceIndexes,
  {
    readonly categories: GradebookTableDefinition<OneRosterCategoryRecord>;
    readonly lineItems: GradebookTableDefinition<OneRosterLineItemRecord>;
    readonly results: GradebookTableDefinition<OneRosterResultRecord>;
    readonly scoreScales: GradebookTableDefinition<OneRosterScoreScaleRecord>;
    readonly lineItemLearningObjectiveIds: GradebookTableDefinition<OneRosterLineItemLearningObjectiveIdRecord>;
    readonly lineItemScoreScales: GradebookTableDefinition<OneRosterLineItemScoreScaleRecord>;
    readonly resultLearningObjectiveIds: GradebookTableDefinition<OneRosterResultLearningObjectiveIdRecord>;
    readonly resultScoreScales: GradebookTableDefinition<OneRosterResultScoreScaleRecord>;
  }
>({
  categories: {
    fileName: "categories.csv",
    headers: categoryHeaders,
    getRecords: (packageValue) => packageValue.categories,
    getIndex: (indexes) => indexes.categoriesBySourcedId,
    parse: parseCategoryRecord,
  },
  lineItems: {
    fileName: "lineItems.csv",
    headers: lineItemHeaders,
    getRecords: (packageValue) => packageValue.lineItems,
    getIndex: (indexes) => indexes.lineItemsBySourcedId,
    parse: parseLineItemRecord,
  },
  results: {
    fileName: "results.csv",
    headers: resultHeaders,
    getRecords: (packageValue) => packageValue.results,
    getIndex: (indexes) => indexes.resultsBySourcedId,
    parse: parseResultRecord,
  },
  scoreScales: {
    fileName: "scoreScales.csv",
    headers: scoreScaleHeaders,
    getRecords: (packageValue) => packageValue.scoreScales,
    getIndex: (indexes) => indexes.scoreScalesBySourcedId,
    parse: parseScoreScaleRecord,
  },
  lineItemLearningObjectiveIds: {
    fileName: "lineItemLearningObjectiveIds.csv",
    headers: lineItemLearningObjectiveIdHeaders,
    getRecords: (packageValue) => packageValue.lineItemLearningObjectiveIds,
    getIndex: (indexes) => indexes.lineItemLearningObjectiveIdsBySourcedId,
    parse: parseLineItemLearningObjectiveIdRecord,
  },
  lineItemScoreScales: {
    fileName: "lineItemScoreScales.csv",
    headers: lineItemScoreScaleHeaders,
    getRecords: (packageValue) => packageValue.lineItemScoreScales,
    getIndex: (indexes) => indexes.lineItemScoreScalesBySourcedId,
    parse: parseLineItemScoreScaleRecord,
  },
  resultLearningObjectiveIds: {
    fileName: "resultLearningObjectiveIds.csv",
    headers: resultLearningObjectiveIdHeaders,
    getRecords: (packageValue) => packageValue.resultLearningObjectiveIds,
    getIndex: (indexes) => indexes.resultLearningObjectiveIdsBySourcedId,
    parse: parseResultLearningObjectiveIdRecord,
  },
  resultScoreScales: {
    fileName: "resultScoreScales.csv",
    headers: resultScoreScaleHeaders,
    getRecords: (packageValue) => packageValue.resultScoreScales,
    getIndex: (indexes) => indexes.resultScoreScalesBySourcedId,
    parse: parseResultScoreScaleRecord,
  },
});

export const categoriesRecordSet: GradebookRecordSet<OneRosterCategoryRecord> =
  gradebookProfileTables.tables.categories;
export const lineItemsRecordSet: GradebookRecordSet<OneRosterLineItemRecord> =
  gradebookProfileTables.tables.lineItems;
export const resultsRecordSet: GradebookRecordSet<OneRosterResultRecord> =
  gradebookProfileTables.tables.results;
export const scoreScalesRecordSet: GradebookRecordSet<OneRosterScoreScaleRecord> =
  gradebookProfileTables.tables.scoreScales;
export const lineItemLearningObjectiveIdsRecordSet: GradebookRecordSet<OneRosterLineItemLearningObjectiveIdRecord> =
  gradebookProfileTables.tables.lineItemLearningObjectiveIds;
export const lineItemScoreScalesRecordSet: GradebookRecordSet<OneRosterLineItemScoreScaleRecord> =
  gradebookProfileTables.tables.lineItemScoreScales;
export const resultLearningObjectiveIdsRecordSet: GradebookRecordSet<OneRosterResultLearningObjectiveIdRecord> =
  gradebookProfileTables.tables.resultLearningObjectiveIds;
export const resultScoreScalesRecordSet: GradebookRecordSet<OneRosterResultScoreScaleRecord> =
  gradebookProfileTables.tables.resultScoreScales;

/** Parse every registered gradebook table from a normalized CSV package. */
export function parseGradebookPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): GradebookPackageRecords {
  return gradebookProfileTables.parsePackageRecords(packageValue, diagnostics);
}

/** Build sourcedId lookup indexes for every registered gradebook table. */
export function buildGradebookReferenceIndexes(
  packageValue: OneRosterCsvGradebookPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvGradebookReferenceIndexes {
  return gradebookProfileTables.buildReferenceIndexes(packageValue, diagnostics);
}
