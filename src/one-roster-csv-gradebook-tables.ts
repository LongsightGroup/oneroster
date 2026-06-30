import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
  defineOneRosterCsvRecordTable,
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

function defineGradebookTable<TRecord extends OneRosterCsvGradebookRecordBase>(
  definition: GradebookTableDefinition<TRecord>,
): GradebookTableDefinition<TRecord> {
  return defineOneRosterCsvRecordTable(definition);
}

const categoriesTable = defineGradebookTable<OneRosterCategoryRecord>({
  fileName: "categories.csv",
  headers: categoryHeaders,
  getRecords: (packageValue) => packageValue.categories,
  getIndex: (indexes) => indexes.categoriesBySourcedId,
  parse: parseCategoryRecord,
});

const lineItemsTable = defineGradebookTable<OneRosterLineItemRecord>({
  fileName: "lineItems.csv",
  headers: lineItemHeaders,
  getRecords: (packageValue) => packageValue.lineItems,
  getIndex: (indexes) => indexes.lineItemsBySourcedId,
  parse: parseLineItemRecord,
});

const resultsTable = defineGradebookTable<OneRosterResultRecord>({
  fileName: "results.csv",
  headers: resultHeaders,
  getRecords: (packageValue) => packageValue.results,
  getIndex: (indexes) => indexes.resultsBySourcedId,
  parse: parseResultRecord,
});

const scoreScalesTable = defineGradebookTable<OneRosterScoreScaleRecord>({
  fileName: "scoreScales.csv",
  headers: scoreScaleHeaders,
  getRecords: (packageValue) => packageValue.scoreScales,
  getIndex: (indexes) => indexes.scoreScalesBySourcedId,
  parse: parseScoreScaleRecord,
});

const lineItemLearningObjectiveIdsTable =
  defineGradebookTable<OneRosterLineItemLearningObjectiveIdRecord>({
    fileName: "lineItemLearningObjectiveIds.csv",
    headers: lineItemLearningObjectiveIdHeaders,
    getRecords: (packageValue) => packageValue.lineItemLearningObjectiveIds,
    getIndex: (indexes) => indexes.lineItemLearningObjectiveIdsBySourcedId,
    parse: parseLineItemLearningObjectiveIdRecord,
  });

const lineItemScoreScalesTable = defineGradebookTable<OneRosterLineItemScoreScaleRecord>({
  fileName: "lineItemScoreScales.csv",
  headers: lineItemScoreScaleHeaders,
  getRecords: (packageValue) => packageValue.lineItemScoreScales,
  getIndex: (indexes) => indexes.lineItemScoreScalesBySourcedId,
  parse: parseLineItemScoreScaleRecord,
});

const resultLearningObjectiveIdsTable =
  defineGradebookTable<OneRosterResultLearningObjectiveIdRecord>({
    fileName: "resultLearningObjectiveIds.csv",
    headers: resultLearningObjectiveIdHeaders,
    getRecords: (packageValue) => packageValue.resultLearningObjectiveIds,
    getIndex: (indexes) => indexes.resultLearningObjectiveIdsBySourcedId,
    parse: parseResultLearningObjectiveIdRecord,
  });

const resultScoreScalesTable = defineGradebookTable<OneRosterResultScoreScaleRecord>({
  fileName: "resultScoreScales.csv",
  headers: resultScoreScaleHeaders,
  getRecords: (packageValue) => packageValue.resultScoreScales,
  getIndex: (indexes) => indexes.resultScoreScalesBySourcedId,
  parse: parseResultScoreScaleRecord,
});

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
    categories: parseOneRosterCsvRecordTable(packageValue, categoriesTable, diagnostics),
    lineItems: parseOneRosterCsvRecordTable(packageValue, lineItemsTable, diagnostics),
    results: parseOneRosterCsvRecordTable(packageValue, resultsTable, diagnostics),
    scoreScales: parseOneRosterCsvRecordTable(packageValue, scoreScalesTable, diagnostics),
    lineItemLearningObjectiveIds: parseOneRosterCsvRecordTable(
      packageValue,
      lineItemLearningObjectiveIdsTable,
      diagnostics,
    ),
    lineItemScoreScales: parseOneRosterCsvRecordTable(
      packageValue,
      lineItemScoreScalesTable,
      diagnostics,
    ),
    resultLearningObjectiveIds: parseOneRosterCsvRecordTable(
      packageValue,
      resultLearningObjectiveIdsTable,
      diagnostics,
    ),
    resultScoreScales: parseOneRosterCsvRecordTable(
      packageValue,
      resultScoreScalesTable,
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
      categoriesTable,
      packageValue,
      diagnostics,
    ),
    lineItemsBySourcedId: buildOneRosterCsvRecordSetIndex(
      lineItemsTable,
      packageValue,
      diagnostics,
    ),
    resultsBySourcedId: buildOneRosterCsvRecordSetIndex(resultsTable, packageValue, diagnostics),
    scoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      scoreScalesTable,
      packageValue,
      diagnostics,
    ),
    lineItemLearningObjectiveIdsBySourcedId: buildOneRosterCsvRecordSetIndex(
      lineItemLearningObjectiveIdsTable,
      packageValue,
      diagnostics,
    ),
    lineItemScoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      lineItemScoreScalesTable,
      packageValue,
      diagnostics,
    ),
    resultLearningObjectiveIdsBySourcedId: buildOneRosterCsvRecordSetIndex(
      resultLearningObjectiveIdsTable,
      packageValue,
      diagnostics,
    ),
    resultScoreScalesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resultScoreScalesTable,
      packageValue,
      diagnostics,
    ),
  };
}
