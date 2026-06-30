import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import {
  isOneRosterMetadataHeader,
  oneRosterMetadataHeaderPrefix,
} from "./one-roster-csv-metadata.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import { validateOneRosterCsvRecordHeader } from "./one-roster-csv-record-header.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";
import {
  packageWriteDiagnostic,
  type OneRosterCsvPackageWriteDiagnostic,
  type OneRosterCsvWritableDataTable,
} from "./one-roster-csv-package-writer.js";

/** Typed record set descriptor for a parsed OneRoster CSV table. */
export type OneRosterCsvRecordSet<TPackage, TIndexes, TRecord extends OneRosterCsvRecordBase> = {
  readonly fileName: OneRosterCsvDataFileName;
  readonly getRecords: (packageValue: TPackage) => ReadonlyArray<TRecord>;
  readonly getIndex: (indexes: TIndexes) => ReadonlyMap<OneRosterGuid, TRecord>;
};

/** Serializer for one typed OneRoster CSV record. */
export type OneRosterCsvRecordSerializer<TRecord extends OneRosterCsvRecordBase> = (
  record: TRecord,
) => readonly string[];

/** Adapt a typed serializer for profile table registry storage. */
export function defineOneRosterCsvRecordSerializer<TRecord extends OneRosterCsvRecordBase>(
  serialize: OneRosterCsvRecordSerializer<TRecord>,
): OneRosterCsvRecordSerializer<OneRosterCsvRecordBase> {
  return (record) => {
    // SAFETY: registry write paths only call this with records from the matching `getRecords`.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return serialize(record as TRecord);
  };
}

/** Typed table descriptor used to parse and serialize a OneRoster CSV table. */
export type OneRosterCsvRecordTableDefinition<
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
> = OneRosterCsvRecordSet<TPackage, TIndexes, TRecord> & {
  readonly headers: readonly string[];
  readonly parse: (context: OneRosterCsvRecordRowContext) => TRecord | undefined;
  readonly serialize: OneRosterCsvRecordSerializer<OneRosterCsvRecordBase>;
};

type ParsedPackageRecords<
  TPackage,
  TIndexes,
  TTables extends Record<
    string,
    OneRosterCsvRecordTableDefinition<TPackage, TIndexes, OneRosterCsvRecordBase>
  >,
> = {
  readonly [K in keyof TTables]: TTables[K] extends OneRosterCsvRecordTableDefinition<
    TPackage,
    TIndexes,
    infer TRecord
  >
    ? ReadonlyArray<TRecord>
    : never;
};

/** Registry of typed profile tables with shared parse and index builders. */
export type OneRosterCsvProfileTableRegistry<
  TPackage,
  TIndexes,
  TTables extends Record<
    string,
    OneRosterCsvRecordTableDefinition<TPackage, TIndexes, OneRosterCsvRecordBase>
  >,
> = {
  readonly tables: TTables;
  parsePackageRecords(
    packageValue: OneRosterCsvPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ): ParsedPackageRecords<TPackage, TIndexes, TTables>;
  buildReferenceIndexes(
    packageValue: TPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ): TIndexes;
  writePackageTables(
    packageValue: TPackage,
    diagnostics: OneRosterCsvPackageWriteDiagnostic[],
  ): readonly OneRosterCsvWritableDataTable[];
};

/** Register profile tables keyed by package record property and `${key}BySourcedId` index keys. */
export function defineProfileTables<
  TPackage,
  TIndexes,
  const TTables extends Record<
    string,
    OneRosterCsvRecordTableDefinition<TPackage, TIndexes, OneRosterCsvRecordBase>
  >,
>(tables: TTables): OneRosterCsvProfileTableRegistry<TPackage, TIndexes, TTables> {
  return {
    tables,
    parsePackageRecords(packageValue, diagnostics) {
      const entries = (Object.keys(tables) as (keyof TTables & string)[]).map((key) => {
        // SAFETY: `key` is always a registered table entry from the same `tables` object.
        const tableDefinition = tables[key]!;
        return [
          key,
          parseOneRosterCsvRecordTable(packageValue, tableDefinition, diagnostics),
        ] as const;
      });

      // SAFETY: entries are built from the same `tables` registry that defines the return shape.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return Object.fromEntries(entries) as ParsedPackageRecords<TPackage, TIndexes, TTables>;
    },
    buildReferenceIndexes(packageValue, diagnostics) {
      const entries = (Object.keys(tables) as (keyof TTables & string)[]).map((key) => {
        // SAFETY: `key` is always a registered table entry from the same `tables` object.
        const tableDefinition = tables[key]!;
        // SAFETY: `${key}BySourcedId` is the canonical index property for each registered table key.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        const indexKey = `${key}BySourcedId` as keyof TIndexes;
        return [
          indexKey,
          buildOneRosterCsvRecordSetIndex(tableDefinition, packageValue, diagnostics),
        ] as const;
      });

      // SAFETY: entries follow the `${recordKey}BySourcedId` convention enforced by callers.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return Object.fromEntries(entries) as TIndexes;
    },
    writePackageTables(packageValue, diagnostics) {
      const writableTables: OneRosterCsvWritableDataTable[] = [];

      for (const key of Object.keys(tables) as (keyof TTables & string)[]) {
        // SAFETY: `key` is always a registered table entry from the same `tables` object.
        const tableDefinition = tables[key]!;
        const writableTable = writeOneRosterCsvRecordTable(
          tableDefinition,
          packageValue,
          diagnostics,
        );

        if (writableTable !== undefined) {
          writableTables.push(writableTable);
        }
      }

      return writableTables;
    },
  };
}

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

/** Write one typed record table into a package-ready CSV table. */
export function writeOneRosterCsvRecordTable<
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
>(
  tableDefinition: OneRosterCsvRecordTableDefinition<TPackage, TIndexes, TRecord>,
  packageValue: TPackage,
  diagnostics: OneRosterCsvPackageWriteDiagnostic[],
): OneRosterCsvWritableDataTable | undefined {
  const records = tableDefinition.getRecords(packageValue);

  if (records.length === 0) {
    // Empty typed tables are omitted from output; manifest mode stays absent.
    return undefined;
  }

  const manifestMode = tableRecordMode(records);

  if (manifestMode === undefined) {
    diagnostics.push(
      packageWriteDiagnostic({
        code: "write.mixed_lifecycle_modes",
        message: "OneRoster CSV writer requires one lifecycle mode per output file.",
        fileName: tableDefinition.fileName,
        field: "status",
        expected: "one lifecycle mode",
        actual: "mixed lifecycle modes",
      }),
    );
    return undefined;
  }

  const metadataHeaders = collectMetadataHeaders(tableDefinition, records, diagnostics);

  if (metadataHeaders === undefined) {
    return undefined;
  }

  const rows: Array<readonly string[]> = [[...tableDefinition.headers, ...metadataHeaders]];

  for (const record of records) {
    rows.push([
      ...tableDefinition.serialize(record),
      ...metadataHeaders.map((header) => record.metadata[header] ?? ""),
    ]);
  }

  return {
    fileName: tableDefinition.fileName,
    manifestMode,
    rows,
  };
}

function tableRecordMode(
  records: ReadonlyArray<OneRosterCsvRecordBase>,
): "bulk" | "delta" | undefined {
  const firstRecord = records[0];

  if (firstRecord === undefined) {
    return undefined;
  }

  const mode = firstRecord.lifecycle.mode;

  for (const record of records) {
    if (record.lifecycle.mode !== mode) {
      return undefined;
    }
  }

  return mode;
}

function collectMetadataHeaders<TPackage, TIndexes, TRecord extends OneRosterCsvRecordBase>(
  tableDefinition: OneRosterCsvRecordTableDefinition<TPackage, TIndexes, TRecord>,
  records: ReadonlyArray<TRecord>,
  diagnostics: OneRosterCsvPackageWriteDiagnostic[],
): readonly string[] | undefined {
  const metadataHeaders = new Set<string>();
  let valid = true;

  for (const record of records) {
    for (const key of Object.keys(record.metadata)) {
      if (!isOneRosterMetadataHeader(key)) {
        valid = false;
        diagnostics.push(
          packageWriteDiagnostic({
            code: "write.invalid_metadata_header",
            message: "OneRoster CSV metadata keys must be metadata-prefixed headers.",
            fileName: tableDefinition.fileName,
            rowNumber: record.rowNumber,
            expected: `${oneRosterMetadataHeaderPrefix}*`,
            actual: "invalid metadata header",
          }),
        );
        continue;
      }

      metadataHeaders.add(key);
    }
  }

  if (!valid) {
    return undefined;
  }

  return [...metadataHeaders].toSorted();
}
