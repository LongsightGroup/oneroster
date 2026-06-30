import type { CsvParseDiagnostic, CsvParseDiagnosticCode } from "./csv.js";
import type { ZipDiagnostic, ZipDiagnosticCode } from "./zip.js";

/** Stable OneRoster CSV package diagnostic code. */
export type OneRosterCsvPackageDiagnosticCode =
  | ZipDiagnosticCode
  | CsvParseDiagnosticCode
  | "package.duplicate_file"
  | "package.missing_manifest"
  | "package.unknown_file"
  | "reference.duplicate_sourced_id"
  | "reference.missing_target_file"
  | "reference.missing_target_record"
  | "manifest.duplicate_property"
  | "manifest.file_missing"
  | "manifest.file_unexpected"
  | "manifest.invalid_file_mode"
  | "manifest.invalid_header"
  | "manifest.invalid_manifest_version"
  | "manifest.invalid_oneroster_version"
  | "manifest.missing_header"
  | "manifest.missing_property"
  | "manifest.row_width_mismatch"
  | "manifest.unknown_property"
  | "row.field_forbidden_in_bulk"
  | "row.field_required_in_delta"
  | "row.invalid_boolean"
  | "row.invalid_date"
  | "row.invalid_datetime"
  | "row.invalid_enum"
  | "row.invalid_guid"
  | "row.invalid_integer"
  | "row.invalid_list"
  | "row.invalid_float"
  | "row.invalid_year"
  | "row.missing_required_value"
  | "schema.header_order_mismatch"
  | "schema.invalid_metadata_header"
  | "schema.metadata_column_position"
  | "schema.missing_header"
  | "table.duplicate_header"
  | "table.empty_header_name"
  | "table.missing_data_rows"
  | "table.missing_header"
  | "table.row_width_mismatch";

/** Expected package, manifest, or table parse failure with safe location context. */
export type OneRosterCsvPackageDiagnostic = {
  readonly _tag: "OneRosterCsvPackageDiagnostic";
  readonly severity: "error";
  readonly code: OneRosterCsvPackageDiagnosticCode;
  readonly message: string;
  readonly fileName?: string;
  readonly entryName?: string;
  readonly rowNumber?: number;
  readonly columnNumber?: number;
  readonly field?: string;
  readonly propertyName?: string;
  readonly expected?: string | number;
  readonly actual?: string | number;
  readonly limit?: number;
};

type PackageDiagnosticInput = {
  readonly code: OneRosterCsvPackageDiagnosticCode;
  readonly message: string;
  readonly fileName?: string | undefined;
  readonly entryName?: string | undefined;
  readonly rowNumber?: number | undefined;
  readonly columnNumber?: number | undefined;
  readonly field?: string | undefined;
  readonly propertyName?: string | undefined;
  readonly expected?: string | number | undefined;
  readonly actual?: string | number | undefined;
  readonly limit?: number | undefined;
};

/** Build a package diagnostic from a ZIP intake failure. */
export function packageDiagnosticFromZip(diagnostic: ZipDiagnostic): OneRosterCsvPackageDiagnostic {
  return packageDiagnostic({
    code: diagnostic.code,
    message: diagnostic.message,
    entryName: diagnostic.entryName,
    limit: diagnostic.limit,
    actual: diagnostic.actual,
  });
}

/** Build a package diagnostic from a CSV parse failure. */
export function packageDiagnosticFromCsv(
  diagnostic: CsvParseDiagnostic,
): OneRosterCsvPackageDiagnostic {
  return packageDiagnostic({
    code: diagnostic.code,
    message: diagnostic.message,
    fileName: diagnostic.fileName,
    rowNumber: diagnostic.rowNumber,
    columnNumber: diagnostic.columnNumber,
  });
}

/** Build a package diagnostic with only defined optional location fields. */
export function packageDiagnostic(input: PackageDiagnosticInput): OneRosterCsvPackageDiagnostic {
  return {
    _tag: "OneRosterCsvPackageDiagnostic",
    severity: "error",
    code: input.code,
    message: input.message,
    ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
    ...(input.entryName !== undefined ? { entryName: input.entryName } : {}),
    ...(input.rowNumber !== undefined ? { rowNumber: input.rowNumber } : {}),
    ...(input.columnNumber !== undefined ? { columnNumber: input.columnNumber } : {}),
    ...(input.field !== undefined ? { field: input.field } : {}),
    ...(input.propertyName !== undefined ? { propertyName: input.propertyName } : {}),
    ...(input.expected !== undefined ? { expected: input.expected } : {}),
    ...(input.actual !== undefined ? { actual: input.actual } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  };
}
