import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { validateOneRosterCsvRecordHeader } from "./one-roster-csv-record-header.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";

/** Validate rostering CSV headers against spec order and metadata placement rules. */
export function validateRosteringHeader(
  table: OneRosterCsvTable,
  expectedHeaders: readonly string[],
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyArray<string> | undefined {
  return validateOneRosterCsvRecordHeader(table, expectedHeaders, diagnostics);
}
