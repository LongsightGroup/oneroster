import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnosticCode,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";

type SemanticDiagnosticCode = Extract<OneRosterCsvPackageDiagnosticCode, `semantic.${string}`>;

/** Input for a semantic validation diagnostic. */
export type SemanticDiagnosticInput = {
  readonly code: SemanticDiagnosticCode;
  readonly message: string;
  readonly fileName: OneRosterCsvDataFileName;
  readonly rowNumber: number;
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
};

/** Add a PII-safe semantic validation diagnostic. */
export function addSemanticDiagnostic(
  context: OneRosterCsvFullSemanticContext,
  input: SemanticDiagnosticInput,
): void {
  context.diagnostics.push(packageDiagnostic(input));
}

/** Return true when the source row should participate in semantic validation. */
export function shouldValidateSemanticRecord(
  context: OneRosterCsvFullSemanticContext,
  record: OneRosterCsvRecordBase,
): boolean {
  return context.referenceMode === "allRows" || record.lifecycle.mode === "bulk";
}
