import { zipSync } from "fflate";

import {
  writeCsvBytes,
  type CsvWriteDiagnostic,
  type CsvWriteDiagnosticCode,
  type CsvWriteOptions,
} from "./csv-write.js";
import {
  oneRosterCsvDataFileNames,
  type OneRosterCsvDataFileName,
  type OneRosterCsvFileName,
} from "./one-roster-csv-file.js";
import {
  oneRosterManifestRows,
  type OneRosterManifestFileMode,
  type OneRosterManifestFileModes,
  type OneRosterManifestSource,
} from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";
import { err, ok, type Result } from "./result.js";
import type { ZipEntry } from "./zip.js";

/** Options shared by OneRoster CSV package writers. */
export type OneRosterCsvWriteOptions = CsvWriteOptions;

/** Stable OneRoster CSV package writer diagnostic code. */
export type OneRosterCsvPackageWriteDiagnosticCode =
  | CsvWriteDiagnosticCode
  | "write.invalid_metadata_header"
  | "write.missing_table"
  | "write.mixed_lifecycle_modes"
  | "write.row_width_mismatch"
  | "write.table_mode_mismatch"
  | "write.unexpected_table"
  | "write.zip_failed";

/** Expected OneRoster CSV package write failure with safe location context. */
export type OneRosterCsvPackageWriteDiagnostic = {
  readonly _tag: "OneRosterCsvPackageWriteDiagnostic";
  readonly severity: "error";
  readonly code: OneRosterCsvPackageWriteDiagnosticCode;
  readonly message: string;
  readonly fileName?: OneRosterCsvFileName;
  readonly rowNumber?: number;
  readonly columnNumber?: number;
  readonly field?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
};

/** Data table ready for deterministic OneRoster CSV package writing. */
export type OneRosterCsvWritableDataTable = {
  readonly fileName: OneRosterCsvDataFileName;
  readonly manifestMode: Exclude<OneRosterManifestFileMode, "absent">;
  readonly rows: ReadonlyArray<readonly string[]>;
};

type PackageWriteDiagnosticInput = {
  readonly code: OneRosterCsvPackageWriteDiagnosticCode;
  readonly message: string;
  readonly fileName?: OneRosterCsvFileName | undefined;
  readonly rowNumber?: number | undefined;
  readonly columnNumber?: number | undefined;
  readonly field?: string | undefined;
  readonly expected?: string | number | undefined;
  readonly actual?: string | number | undefined;
};

/** Write a normalized raw OneRoster CSV package into root-level ZIP entries. */
export function writeOneRosterCsvPackageEntries(
  packageValue: OneRosterCsvPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<readonly ZipEntry[], readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageWriteDiagnostic[] = [];
  const tables = rawPackageWritableTables(packageValue, diagnostics);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return writeOneRosterCsvPackageEntriesFromTables(
    {
      fileModes: packageValue.manifest.fileModes,
      source: packageValue.manifest.source,
      tables,
    },
    options,
  );
}

/** Write a normalized raw OneRoster CSV package into ZIP bytes. */
export function writeOneRosterCsvPackageZip(
  packageValue: OneRosterCsvPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const entries = writeOneRosterCsvPackageEntries(packageValue, options);

  if (entries._tag === "err") {
    return entries;
  }

  return writeZipEntries(entries.value);
}

/** Write prepared data tables and manifest metadata into a ZIP archive. */
export function writeWritablePackageZip(
  tables: readonly OneRosterCsvWritableDataTable[],
  source: OneRosterManifestSource | undefined,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const fileModes = createAbsentManifestFileModes();

  for (const table of tables) {
    fileModes[table.fileName] = table.manifestMode;
  }

  const entries = writeOneRosterCsvPackageEntriesFromTables({ fileModes, source, tables }, options);

  if (entries._tag === "err") {
    return entries;
  }

  return writeZipEntries(entries.value);
}

/** Write prepared data tables and manifest metadata into root-level ZIP entries. */
export function writeOneRosterCsvPackageEntriesFromTables(
  input: {
    readonly fileModes: OneRosterManifestFileModes;
    readonly source?: OneRosterManifestSource | undefined;
    readonly tables: ReadonlyArray<OneRosterCsvWritableDataTable>;
  },
  options: OneRosterCsvWriteOptions = {},
): Result<readonly ZipEntry[], readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageWriteDiagnostic[] = [];
  const tableByFileName = new Map<OneRosterCsvDataFileName, OneRosterCsvWritableDataTable>();

  for (const table of input.tables) {
    tableByFileName.set(table.fileName, table);
  }

  validateWritableTablesAgainstManifest(input.fileModes, tableByFileName, diagnostics);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  const entries: ZipEntry[] = [];
  const manifest = writeCsvBytes(oneRosterManifestRows(input.fileModes, input.source), options);

  if (manifest._tag === "err") {
    return err([packageWriteDiagnosticFromCsv(manifest.error, "manifest.csv")]);
  }

  entries.push({ path: "manifest.csv", bytes: manifest.value });

  for (const fileName of oneRosterCsvDataFileNames) {
    if (input.fileModes[fileName] === "absent") {
      continue;
    }

    const table = tableByFileName.get(fileName);

    if (table === undefined) {
      continue;
    }

    const csv = writeCsvBytes(table.rows, options);

    if (csv._tag === "err") {
      return err([packageWriteDiagnosticFromCsv(csv.error, fileName)]);
    }

    entries.push({ path: fileName, bytes: csv.value });
  }

  return ok(entries);
}

/** Write root-level package entries into a ZIP archive. */
export function writeZipEntries(
  entries: readonly ZipEntry[],
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const files: Record<string, Uint8Array> = {};

  for (const entry of entries) {
    files[entry.path] = entry.bytes;
  }

  try {
    return ok(zipSync(files));
  } catch {
    return err([
      packageWriteDiagnostic({
        code: "write.zip_failed",
        message: "OneRoster CSV package ZIP archive could not be written.",
      }),
    ]);
  }
}

/** Create an absent manifest mode table for every OneRoster CSV data file. */
export function createAbsentManifestFileModes(): Record<
  OneRosterCsvDataFileName,
  OneRosterManifestFileMode
> {
  // SAFETY: `oneRosterCsvDataFileNames` contains every `OneRosterCsvDataFileName` exactly once.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return Object.fromEntries(
    oneRosterCsvDataFileNames.map((fileName) => [fileName, "absent" as const]),
  ) as Record<OneRosterCsvDataFileName, OneRosterManifestFileMode>;
}

/** Build a OneRoster package writer diagnostic with only defined optional fields. */
export function packageWriteDiagnostic(
  input: PackageWriteDiagnosticInput,
): OneRosterCsvPackageWriteDiagnostic {
  return {
    _tag: "OneRosterCsvPackageWriteDiagnostic",
    severity: "error",
    code: input.code,
    message: input.message,
    ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
    ...(input.rowNumber !== undefined ? { rowNumber: input.rowNumber } : {}),
    ...(input.columnNumber !== undefined ? { columnNumber: input.columnNumber } : {}),
    ...(input.field !== undefined ? { field: input.field } : {}),
    ...(input.expected !== undefined ? { expected: input.expected } : {}),
    ...(input.actual !== undefined ? { actual: input.actual } : {}),
  };
}

function rawPackageWritableTables(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageWriteDiagnostic[],
): OneRosterCsvWritableDataTable[] {
  const tables: OneRosterCsvWritableDataTable[] = [];

  for (const table of packageValue.tables) {
    const rows = rawTableRows(table, diagnostics);

    if (rows === undefined) {
      continue;
    }

    tables.push({
      fileName: table.fileName,
      manifestMode: table.manifestMode,
      rows,
    });
  }

  return tables;
}

function rawTableRows(
  table: OneRosterCsvTable,
  diagnostics: OneRosterCsvPackageWriteDiagnostic[],
): ReadonlyArray<readonly string[]> | undefined {
  const rows: Array<readonly string[]> = [table.header];
  const initialDiagnosticCount = diagnostics.length;

  for (const row of table.rows) {
    if (row.values.length !== table.header.length) {
      diagnostics.push(
        packageWriteDiagnostic({
          code: "write.row_width_mismatch",
          message: "OneRoster CSV output rows must match the header width.",
          fileName: table.fileName,
          rowNumber: row.rowNumber,
          expected: table.header.length,
          actual: row.values.length,
        }),
      );
      continue;
    }

    rows.push(row.values);
  }

  return diagnostics.length > initialDiagnosticCount ? undefined : rows;
}

function validateWritableTablesAgainstManifest(
  fileModes: OneRosterManifestFileModes,
  tableByFileName: ReadonlyMap<OneRosterCsvDataFileName, OneRosterCsvWritableDataTable>,
  diagnostics: OneRosterCsvPackageWriteDiagnostic[],
): void {
  for (const fileName of oneRosterCsvDataFileNames) {
    const mode = fileModes[fileName];
    const table = tableByFileName.get(fileName);

    if (mode === "absent") {
      if (table !== undefined) {
        diagnostics.push(
          packageWriteDiagnostic({
            code: "write.unexpected_table",
            message: "OneRoster CSV package writer received a table marked absent.",
            fileName,
            expected: "absent",
            actual: "present",
          }),
        );
      }
      continue;
    }

    if (table === undefined) {
      diagnostics.push(
        packageWriteDiagnostic({
          code: "write.missing_table",
          message: "OneRoster CSV package writer is missing a manifest-supplied table.",
          fileName,
          expected: mode,
          actual: "missing",
        }),
      );
      continue;
    }

    if (table.manifestMode !== mode) {
      diagnostics.push(
        packageWriteDiagnostic({
          code: "write.table_mode_mismatch",
          message: "OneRoster CSV writable table mode must match manifest file mode.",
          fileName,
          expected: mode,
          actual: table.manifestMode,
        }),
      );
    }
  }
}

function packageWriteDiagnosticFromCsv(
  diagnostic: CsvWriteDiagnostic,
  fileName: OneRosterCsvFileName,
): OneRosterCsvPackageWriteDiagnostic {
  return packageWriteDiagnostic({
    code: diagnostic.code,
    message: diagnostic.message,
    fileName,
    rowNumber: diagnostic.rowNumber,
    columnNumber: diagnostic.columnNumber,
  });
}
