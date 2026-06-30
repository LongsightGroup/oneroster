import {
  conformanceLifecycleFields,
  type ConformanceLifecycleMode,
} from "./conformance-lifecycle.js";
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

/** Build a minimal valid typed gradebook package with one record per file. */
export function validBulkGradebookFiles(
  mode: ConformanceLifecycleMode = "bulk",
): Readonly<Record<string, string>> {
  const lifecycle = conformanceLifecycleFields(mode);

  return {
    "categories.csv": categoriesCsv([categoryRow(lifecycle)]),
    "lineItems.csv": lineItemsCsv([lineItemRow(lifecycle)]),
    "results.csv": resultsCsv([resultRow(lifecycle)]),
    "scoreScales.csv": scoreScalesCsv([scoreScaleRow(lifecycle)]),
    "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
      lineItemLearningObjectiveIdRow(lifecycle),
    ]),
    "lineItemScoreScales.csv": lineItemScoreScalesCsv([lineItemScoreScaleRow(lifecycle)]),
    "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
      resultLearningObjectiveIdRow(lifecycle),
    ]),
    "resultScoreScales.csv": resultScoreScalesCsv([resultScoreScaleRow(lifecycle)]),
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
