import type {
  OneRosterCsvCommonRecordFields,
  OneRosterCsvRecordRowContext,
} from "./one-roster-csv-record-context.js";

/** Parsing context for one rostering CSV data row. */
export type RosteringRowContext = OneRosterCsvRecordRowContext;

/** Common fields shared by every typed rostering record. */
export type CommonRecordFields = OneRosterCsvCommonRecordFields;
