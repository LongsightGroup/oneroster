import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import { validateOneRosterCsvRecordHeader } from "./one-roster-csv-record-header.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";

/** Typed record set descriptor for a parsed OneRoster CSV table. */
export type OneRosterCsvRecordSet<TPackage, TIndexes, TRecord extends OneRosterCsvRecordBase> = {
  readonly fileName: OneRosterCsvDataFileName;
  readonly getRecords: (packageValue: TPackage) => ReadonlyArray<TRecord>;
  readonly getIndex: (indexes: TIndexes) => ReadonlyMap<OneRosterGuid, TRecord>;
};

/** Typed table descriptor used to parse a OneRoster CSV table into records. */
export type OneRosterCsvRecordTableDefinition<
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
> = OneRosterCsvRecordSet<TPackage, TIndexes, TRecord> & {
  readonly headers: readonly string[];
  readonly parse: (context: OneRosterCsvRecordRowContext) => TRecord | undefined;
};

/** Parse a typed record table from a normalized OneRoster CSV package. */
export function parseOneRosterCsvRecordTable<
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
>(
  packageValue: OneRosterCsvPackage,
  tableDefinition: OneRosterCsvRecordTableDefinition<TPackage, TIndexes, TRecord>,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyArray<TRecord> {
  const table = findTable(packageValue, tableDefinition.fileName);

  if (table === undefined) {
    return [];
  }

  const metadataHeaders = validateOneRosterCsvRecordHeader(
    table,
    tableDefinition.headers,
    diagnostics,
  );

  if (metadataHeaders === undefined) {
    return [];
  }

  const records: TRecord[] = [];

  for (const row of table.rows) {
    const context: OneRosterCsvRecordRowContext = {
      table,
      row,
      metadataHeaders,
      diagnostics,
    };
    const record = tableDefinition.parse(context);

    if (record !== undefined) {
      records.push(record);
    }
  }

  return records;
}

/** Build a sourcedId index for one typed record set and report duplicate IDs. */
export function buildOneRosterCsvRecordSetIndex<
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
>(
  recordSet: OneRosterCsvRecordSet<TPackage, TIndexes, TRecord>,
  packageValue: TPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyMap<OneRosterGuid, TRecord> {
  const index = new Map<OneRosterGuid, TRecord>();

  for (const record of recordSet.getRecords(packageValue)) {
    if (index.has(record.sourcedId)) {
      diagnostics.push(
        packageDiagnostic({
          code: "reference.duplicate_sourced_id",
          message: "OneRoster sourcedId values must be unique within a CSV file.",
          fileName: recordSet.fileName,
          rowNumber: record.rowNumber,
          field: "sourcedId",
          expected: "unique sourcedId",
          actual: "duplicate",
        }),
      );
      continue;
    }

    index.set(record.sourcedId, record);
  }

  return index;
}

function findTable(
  packageValue: OneRosterCsvPackage,
  fileName: OneRosterCsvDataFileName,
): OneRosterCsvTable | undefined {
  for (const table of packageValue.tables) {
    if (table.fileName === fileName) {
      return table;
    }
  }

  return undefined;
}
