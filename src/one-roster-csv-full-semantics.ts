import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";
import type { OneRosterLineItemRecord } from "./one-roster-csv-gradebook-types.js";

/** Inputs required to run semantic checks across a fully typed OneRoster CSV package. */
export type OneRosterCsvFullSemanticValidationInput = {
  readonly packageValue: OneRosterCsvFullPackage;
  readonly gradebookIndexes: OneRosterCsvGradebookReferenceIndexes;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
};

/** Validate semantic constraints that require already typed records and lookup indexes. */
export function validateOneRosterCsvFullSemanticRules(
  input: OneRosterCsvFullSemanticValidationInput,
): void {
  validateLineItemScoreRanges(input.packageValue, input.diagnostics);
  validateResultScoresAgainstLineItems(
    input.packageValue,
    input.gradebookIndexes,
    input.diagnostics,
  );
}

function validateLineItemScoreRanges(
  packageValue: OneRosterCsvFullPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): void {
  for (const lineItem of packageValue.gradebookPackage.lineItems) {
    if (!hasComparableScoreBounds(lineItem)) {
      continue;
    }

    if (lineItem.resultValueMin <= lineItem.resultValueMax) {
      continue;
    }

    diagnostics.push(
      packageDiagnostic({
        code: "semantic.invalid_score_range",
        message: "OneRoster lineItem resultValueMin must not exceed resultValueMax.",
        fileName: "lineItems.csv",
        rowNumber: lineItem.rowNumber,
        field: "resultValueMin",
        expected: "resultValueMin <= resultValueMax",
        actual: "min greater than max",
      }),
    );
  }
}

function validateResultScoresAgainstLineItems(
  packageValue: OneRosterCsvFullPackage,
  indexes: OneRosterCsvGradebookReferenceIndexes,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): void {
  for (const result of packageValue.gradebookPackage.results) {
    if (result.score === undefined) {
      continue;
    }

    const lineItem = indexes.lineItemsBySourcedId.get(result.lineItemSourcedId);
    if (lineItem === undefined || hasInvalidScoreBounds(lineItem)) {
      continue;
    }

    if (lineItem.resultValueMin !== undefined && result.score < lineItem.resultValueMin) {
      diagnostics.push(
        packageDiagnostic({
          code: "semantic.score_below_min",
          message:
            "OneRoster result score must be greater than or equal to lineItem resultValueMin.",
          fileName: "results.csv",
          rowNumber: result.rowNumber,
          field: "score",
          expected: "lineItems.resultValueMin",
          actual: "below minimum",
        }),
      );
    }

    if (lineItem.resultValueMax !== undefined && result.score > lineItem.resultValueMax) {
      diagnostics.push(
        packageDiagnostic({
          code: "semantic.score_above_max",
          message: "OneRoster result score must be less than or equal to lineItem resultValueMax.",
          fileName: "results.csv",
          rowNumber: result.rowNumber,
          field: "score",
          expected: "lineItems.resultValueMax",
          actual: "above maximum",
        }),
      );
    }
  }
}

function hasComparableScoreBounds(
  lineItem: OneRosterLineItemRecord,
): lineItem is OneRosterLineItemRecord & {
  readonly resultValueMin: number;
  readonly resultValueMax: number;
} {
  return lineItem.resultValueMin !== undefined && lineItem.resultValueMax !== undefined;
}

function hasInvalidScoreBounds(lineItem: OneRosterLineItemRecord): boolean {
  return hasComparableScoreBounds(lineItem) && lineItem.resultValueMin > lineItem.resultValueMax;
}
