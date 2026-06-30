import { manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import { rosteringModes, validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";
import {
  categoriesCsv,
  categoryRow,
  lineItemLearningObjectiveIdRow,
  lineItemLearningObjectiveIdsCsv,
  lineItemRow,
  lineItemsCsv,
  lineItemScoreScaleRow,
  lineItemScoreScalesCsv,
  resultLearningObjectiveIdRow,
  resultLearningObjectiveIdsCsv,
  resultRow,
  resultsCsv,
  resultScoreScaleRow,
  resultScoreScalesCsv,
  scoreScaleRow,
  scoreScalesCsv,
} from "./one-roster-csv-gradebook-rows.js";

/** Build manifest file modes for all typed gradebook CSV files. */
export function gradebookModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([
    ["categories.csv", mode],
    ["lineItems.csv", mode],
    ["results.csv", mode],
    ["scoreScales.csv", mode],
    ["lineItemLearningObjectiveIds.csv", mode],
    ["lineItemScoreScales.csv", mode],
    ["resultLearningObjectiveIds.csv", mode],
    ["resultScoreScales.csv", mode],
  ]);
}

/** Build manifest file modes for all typed rostering and gradebook CSV files. */
export function gradebookAndRosteringModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([...rosteringModes(mode), ...gradebookModes(mode)]);
}

/** Build a minimal valid bulk typed gradebook package with one record per file. */
export function validBulkGradebookFiles(): Readonly<Record<string, string>> {
  return {
    "categories.csv": categoriesCsv([categoryRow()]),
    "lineItems.csv": lineItemsCsv([lineItemRow()]),
    "results.csv": resultsCsv([resultRow()]),
    "scoreScales.csv": scoreScalesCsv([scoreScaleRow()]),
    "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
      lineItemLearningObjectiveIdRow(),
    ]),
    "lineItemScoreScales.csv": lineItemScoreScalesCsv([lineItemScoreScaleRow()]),
    "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
      resultLearningObjectiveIdRow(),
    ]),
    "resultScoreScales.csv": resultScoreScalesCsv([resultScoreScaleRow()]),
  };
}

/** Build a ZIP archive containing a complete bulk rostering plus gradebook graph. */
export function validBulkGradebookGraphZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
    ...validBulkGraphFiles(),
    ...validBulkGradebookFiles(),
  });
}
