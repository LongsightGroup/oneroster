import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";

/** Return whether new diagnostics were appended after a parsing checkpoint. */
export function hasNewRowDiagnostics(
  context: OneRosterCsvRecordRowContext,
  diagnosticStart: number,
): boolean {
  return context.diagnostics.length > diagnosticStart;
}
