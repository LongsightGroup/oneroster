import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvTable, OneRosterCsvTableRow } from "./one-roster-csv-table.js";
import type {
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
} from "./one-roster-csv-rostering-types.js";

/** Parsing context for one rostering CSV data row. */
export type RosteringRowContext = {
  readonly table: OneRosterCsvTable;
  readonly row: OneRosterCsvTableRow;
  readonly metadataHeaders: ReadonlyArray<string>;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
};

/** Common fields shared by every typed rostering record. */
export type CommonRecordFields = {
  readonly sourcedId: OneRosterGuid;
  readonly lifecycle: OneRosterCsvRowLifecycle;
  readonly metadata: OneRosterCsvRecordMetadata;
};
