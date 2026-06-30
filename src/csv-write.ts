import { err, ok, type Result } from "./result.js";

/** Line ending policy for generated CSV documents. */
export type CsvWriteLineEnding = "\n" | "\r\n";

/** Options for deterministic CSV serialization. */
export type CsvWriteOptions = {
  readonly lineEnding?: CsvWriteLineEnding;
};

/** Stable CSV writer diagnostic code. */
export type CsvWriteDiagnosticCode = "csv.field_line_break";

/** Expected CSV serialization failure with safe location context. */
export type CsvWriteDiagnostic = {
  readonly _tag: "CsvWriteDiagnostic";
  readonly code: CsvWriteDiagnosticCode;
  readonly message: string;
  readonly rowNumber: number;
  readonly columnNumber: number;
};

const textEncoder = new TextEncoder();

/** Serialize rows into RFC 4180-compatible CSV text. */
export function writeCsv(
  rows: ReadonlyArray<readonly string[]>,
  options: CsvWriteOptions = {},
): Result<string, CsvWriteDiagnostic> {
  const serializedRows: string[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (row === undefined) {
      continue;
    }

    const serializedFields: string[] = [];

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const field = row[columnIndex];

      if (field === undefined) {
        continue;
      }

      const serializedField = serializeCsvField(field, rowIndex + 1, columnIndex + 1);

      if (serializedField._tag === "err") {
        return serializedField;
      }

      serializedFields.push(serializedField.value);
    }

    serializedRows.push(serializedFields.join(","));
  }

  return ok(serializedRows.join(options.lineEnding ?? "\n"));
}

/** Serialize rows into UTF-8 encoded CSV bytes. */
export function writeCsvBytes(
  rows: ReadonlyArray<readonly string[]>,
  options: CsvWriteOptions = {},
): Result<Uint8Array, CsvWriteDiagnostic> {
  const csv = writeCsv(rows, options);

  if (csv._tag === "err") {
    return csv;
  }

  return ok(textEncoder.encode(csv.value));
}

function serializeCsvField(
  field: string,
  rowNumber: number,
  columnNumber: number,
): Result<string, CsvWriteDiagnostic> {
  if (field.includes("\r") || field.includes("\n")) {
    return err({
      _tag: "CsvWriteDiagnostic",
      code: "csv.field_line_break",
      message: "OneRoster CSV writer does not allow embedded field line breaks.",
      rowNumber,
      columnNumber,
    });
  }

  if (field.includes(",") || field.includes('"')) {
    return ok(`"${field.replaceAll('"', '""')}"`);
  }

  return ok(field);
}
