import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";

/** Serialize common lifecycle cells in the spec-defined position. */
export function commonRecordCells(record: OneRosterCsvRecordBase): readonly string[] {
  if (record.lifecycle.mode === "bulk") {
    return [record.sourcedId, "", ""];
  }

  return [record.sourcedId, record.lifecycle.status, record.lifecycle.dateLastModified];
}

/** Serialize an optional scalar field as a CSV cell. */
export function optionalCell(value: string | number | boolean | undefined): string {
  if (value === undefined) {
    return "";
  }

  return String(value);
}

/** Serialize a list field as a comma-delimited OneRoster CSV cell. */
export function listCell(values: ReadonlyArray<string | number>): string {
  return values.join(",");
}
