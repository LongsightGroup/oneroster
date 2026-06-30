import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
  parseOneRosterCsvRecordTable,
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

const categoriesTable = {
  fileName: "categories.csv",
  headers: categoryHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.categories,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) => indexes.categoriesBySourcedId,
  parse: parseCategoryRecord,
} satisfies GradebookTableDefinition<OneRosterCategoryRecord>;

const lineItemsTable = {
  fileName: "lineItems.csv",
  headers: lineItemHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.lineItems,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) => indexes.lineItemsBySourcedId,
  parse: parseLineItemRecord,
} satisfies GradebookTableDefinition<OneRosterLineItemRecord>;

const resultsTable = {
  fileName: "results.csv",
  headers: resultHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.results,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) => indexes.resultsBySourcedId,
  parse: parseResultRecord,
} satisfies GradebookTableDefinition<OneRosterResultRecord>;

const scoreScalesTable = {
  fileName: "scoreScales.csv",
  headers: scoreScaleHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.scoreScales,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) => indexes.scoreScalesBySourcedId,
  parse: parseScoreScaleRecord,
} satisfies GradebookTableDefinition<OneRosterScoreScaleRecord>;

const lineItemLearningObjectiveIdsTable = {
  fileName: "lineItemLearningObjectiveIds.csv",
  headers: lineItemLearningObjectiveIdHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) =>
    packageValue.lineItemLearningObjectiveIds,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) =>
    indexes.lineItemLearningObjectiveIdsBySourcedId,
  parse: parseLineItemLearningObjectiveIdRecord,
} satisfies GradebookTableDefinition<OneRosterLineItemLearningObjectiveIdRecord>;

const lineItemScoreScalesTable = {
  fileName: "lineItemScoreScales.csv",
  headers: lineItemScoreScaleHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.lineItemScoreScales,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) =>
    indexes.lineItemScoreScalesBySourcedId,
  parse: parseLineItemScoreScaleRecord,
} satisfies GradebookTableDefinition<OneRosterLineItemScoreScaleRecord>;

const resultLearningObjectiveIdsTable = {
  fileName: "resultLearningObjectiveIds.csv",
  headers: resultLearningObjectiveIdHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) =>
    packageValue.resultLearningObjectiveIds,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) =>
    indexes.resultLearningObjectiveIdsBySourcedId,
  parse: parseResultLearningObjectiveIdRecord,
} satisfies GradebookTableDefinition<OneRosterResultLearningObjectiveIdRecord>;

const resultScoreScalesTable = {
  fileName: "resultScoreScales.csv",
  headers: resultScoreScaleHeaders,
  getRecords: (packageValue: OneRosterCsvGradebookPackage) => packageValue.resultScoreScales,
  getIndex: (indexes: OneRosterCsvGradebookReferenceIndexes) =>
    indexes.resultScoreScalesBySourcedId,
  parse: parseResultScoreScaleRecord,
} satisfies GradebookTableDefinition<OneRosterResultScoreScaleRecord>;

const gradebookRecordTables = {
  categories: categoriesTable,
  lineItems: lineItemsTable,
  results: resultsTable,
  scoreScales: scoreScalesTable,
  lineItemLearningObjectiveIds: lineItemLearningObjectiveIdsTable,
  lineItemScoreScales: lineItemScoreScalesTable,
  resultLearningObjectiveIds: resultLearningObjectiveIdsTable,
  resultScoreScales: resultScoreScalesTable,
} as const;

const gradebookIndexTables = {
  categoriesBySourcedId: categoriesTable,
  lineItemsBySourcedId: lineItemsTable,
  resultsBySourcedId: resultsTable,
  scoreScalesBySourcedId: scoreScalesTable,
  lineItemLearningObjectiveIdsBySourcedId: lineItemLearningObjectiveIdsTable,
  lineItemScoreScalesBySourcedId: lineItemScoreScalesTable,
  resultLearningObjectiveIdsBySourcedId: resultLearningObjectiveIdsTable,
  resultScoreScalesBySourcedId: resultScoreScalesTable,
} as const;

export const categoriesRecordSet: GradebookRecordSet<OneRosterCategoryRecord> = categoriesTable;
export const lineItemsRecordSet: GradebookRecordSet<OneRosterLineItemRecord> = lineItemsTable;
export const resultsRecordSet: GradebookRecordSet<OneRosterResultRecord> = resultsTable;
export const scoreScalesRecordSet: GradebookRecordSet<OneRosterScoreScaleRecord> = scoreScalesTable;
export const lineItemLearningObjectiveIdsRecordSet: GradebookRecordSet<OneRosterLineItemLearningObjectiveIdRecord> =
  lineItemLearningObjectiveIdsTable;
export const lineItemScoreScalesRecordSet: GradebookRecordSet<OneRosterLineItemScoreScaleRecord> =
  lineItemScoreScalesTable;
export const resultLearningObjectiveIdsRecordSet: GradebookRecordSet<OneRosterResultLearningObjectiveIdRecord> =
  resultLearningObjectiveIdsTable;
export const resultScoreScalesRecordSet: GradebookRecordSet<OneRosterResultScoreScaleRecord> =
  resultScoreScalesTable;

/** Parse every registered gradebook table from a normalized CSV package. */
export function parseGradebookPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): GradebookPackageRecords {
  return {
    categories: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.categories,
      diagnostics,
    ),
    lineItems: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.lineItems,
      diagnostics,
    ),
    results: parseOneRosterCsvRecordTable(packageValue, gradebookRecordTables.results, diagnostics),
    scoreScales: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.scoreScales,
      diagnostics,
    ),
    lineItemLearningObjectiveIds: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.lineItemLearningObjectiveIds,
      diagnostics,
    ),
    lineItemScoreScales: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.lineItemScoreScales,
      diagnostics,
    ),
    resultLearningObjectiveIds: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.resultLearningObjectiveIds,
      diagnostics,
    ),
    resultScoreScales: parseOneRosterCsvRecordTable(
      packageValue,
      gradebookRecordTables.resultScoreScales,
      diagnostics,
    ),
  };
}

/** Build sourcedId lookup indexes for every registered gradebook table. */
export function buildGradebookReferenceIndexes(
  packageValue: OneRosterCsvGradebookPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvGradebookReferenceIndexes {
  return {
    categoriesBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.categoriesBySourcedId,
      packageValue,
      diagnostics,
    ),
    lineItemsBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.lineItemsBySourcedId,
      packageValue,
      diagnostics,
    ),
    resultsBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.resultsBySourcedId,
      packageValue,
      diagnostics,
    ),
    scoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.scoreScalesBySourcedId,
      packageValue,
      diagnostics,
    ),
    lineItemLearningObjectiveIdsBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.lineItemLearningObjectiveIdsBySourcedId,
      packageValue,
      diagnostics,
    ),
    lineItemScoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.lineItemScoreScalesBySourcedId,
      packageValue,
      diagnostics,
    ),
    resultLearningObjectiveIdsBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.resultLearningObjectiveIdsBySourcedId,
      packageValue,
      diagnostics,
    ),
    resultScoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      gradebookIndexTables.resultScoreScalesBySourcedId,
      packageValue,
      diagnostics,
    ),
  };
}
