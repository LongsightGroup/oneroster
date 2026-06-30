import { parseCsvBytes, type CsvDocument } from "./csv.js";
import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import {
  packageDiagnostic,
  packageDiagnosticFromCsv,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterManifestFileMode } from "./one-roster-csv-manifest.js";
import { err, ok, type Result } from "./result.js";

/** Manifest mode for a data file that must be supplied in the package. */
export type OneRosterSuppliedFileMode = Exclude<OneRosterManifestFileMode, "absent">;

/** Normalized row in a raw OneRoster CSV data table. */
export type OneRosterCsvTableRow = {
  readonly rowNumber: number;
  readonly values: ReadonlyArray<string>;
  readonly valuesByHeader: Readonly<Record<string, string>>;
};

/** Normalized raw OneRoster CSV data table before typed row-record parsing. */
export type OneRosterCsvTable = {
  readonly fileName: OneRosterCsvDataFileName;
  readonly manifestMode: OneRosterSuppliedFileMode;
  readonly header: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<OneRosterCsvTableRow>;
};

/** Parse a manifest-required OneRoster CSV data file into a normalized table. */
export function parseOneRosterCsvTable(
  bytes: Uint8Array,
  fileName: OneRosterCsvDataFileName,
  manifestMode: OneRosterSuppliedFileMode,
): Result<OneRosterCsvTable, readonly OneRosterCsvPackageDiagnostic[]> {
  const csv = parseCsvBytes(bytes, { fileName });

  if (csv._tag === "err") {
    return err([packageDiagnosticFromCsv(csv.error)]);
  }

  return normalizeOneRosterCsvTable(csv.value, fileName, manifestMode);
}

function normalizeOneRosterCsvTable(
  document: CsvDocument,
  fileName: OneRosterCsvDataFileName,
  manifestMode: OneRosterSuppliedFileMode,
): Result<OneRosterCsvTable, readonly OneRosterCsvPackageDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const header = document.rows[0];

  if (header === undefined) {
    return err([
      packageDiagnostic({
        code: "table.missing_header",
        message: "OneRoster CSV data files must include a header row.",
        fileName,
        rowNumber: 1,
      }),
    ]);
  }

  validateTableHeader(header, fileName, diagnostics);

  if (document.rows.length <= 1) {
    diagnostics.push(
      packageDiagnostic({
        code: "table.missing_data_rows",
        message: "OneRoster CSV data files must contain at least one data row.",
        fileName,
      }),
    );
  }

  const rows: OneRosterCsvTableRow[] = [];

  for (let rowIndex = 1; rowIndex < document.rows.length; rowIndex += 1) {
    const row = document.rows[rowIndex];

    if (row === undefined) {
      continue;
    }

    if (row.length !== header.length) {
      diagnostics.push(
        packageDiagnostic({
          code: "table.row_width_mismatch",
          message: "OneRoster CSV data rows must contain the same number of cells as the header.",
          fileName,
          rowNumber: rowIndex + 1,
          expected: header.length,
          actual: row.length,
        }),
      );
      continue;
    }

    rows.push(buildOneRosterCsvTableRow(header, row, rowIndex + 1));
  }

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    fileName,
    manifestMode,
    header,
    rows,
  });
}

function validateTableHeader(
  header: readonly string[],
  fileName: OneRosterCsvDataFileName,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): void {
  const seenHeaders = new Set<string>();

  for (const headerName of header) {
    if (headerName === "") {
      diagnostics.push(
        packageDiagnostic({
          code: "table.empty_header_name",
          message: "OneRoster CSV header names must not be empty.",
          fileName,
          rowNumber: 1,
          field: headerName,
        }),
      );
      continue;
    }

    if (seenHeaders.has(headerName)) {
      diagnostics.push(
        packageDiagnostic({
          code: "table.duplicate_header",
          message: "OneRoster CSV header names must be unique within a file.",
          fileName,
          rowNumber: 1,
          field: headerName,
        }),
      );
      continue;
    }

    seenHeaders.add(headerName);
  }
}

function buildOneRosterCsvTableRow(
  header: readonly string[],
  values: readonly string[],
  rowNumber: number,
): OneRosterCsvTableRow {
  const valuesByHeader: Record<string, string> = {};

  for (let index = 0; index < header.length; index += 1) {
    const headerName = header[index];
    const value = values[index];

    if (headerName === undefined || value === undefined) {
      throw new Error("OneRoster CSV table row width invariant violated after validation.");
    }

    valuesByHeader[headerName] = value;
  }

  return {
    rowNumber,
    values,
    valuesByHeader,
  };
}
