import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvTable, OneRosterCsvTableRow } from "./one-roster-csv-table.js";
import type {
  OneRosterCsvRecordBase,
  OneRosterCsvRecordMetadata,
} from "./one-roster-csv-record-types.js";

/** Parsing context for one typed OneRoster CSV data row. */
export type OneRosterCsvRecordRowContext = {
  readonly table: OneRosterCsvTable;
  readonly row: OneRosterCsvTableRow;
  readonly metadataHeaders: ReadonlyArray<string>;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
};

/** Common fields shared by typed OneRoster CSV records. */
export type OneRosterCsvCommonRecordFields = OneRosterCsvRecordBase & {
  readonly metadata: OneRosterCsvRecordMetadata;
};
