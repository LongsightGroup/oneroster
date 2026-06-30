import { err, ok, type Result } from "./result.js";

/** CSV rows parsed from a complete CSV document. */
export type CsvDocument = {
  readonly rows: ReadonlyArray<readonly string[]>;
};

/** Options for parsing OneRoster CSV text. */
export type CsvParseOptions = {
  readonly fileName?: string;
};

/** Stable CSV parser diagnostic code. */
export type CsvParseDiagnosticCode =
  | "csv.invalid_utf8"
  | "csv.unclosed_quote"
  | "csv.unescaped_quote"
  | "csv.unexpected_character_after_quote"
  | "csv.line_break_in_quoted_field"
  | "csv.bare_carriage_return";

/** Expected CSV parse failure with stable location context. */
export type CsvParseDiagnostic = {
  readonly _tag: "CsvParseDiagnostic";
  readonly code: CsvParseDiagnosticCode;
  readonly message: string;
  readonly fileName?: string;
  readonly rowNumber: number;
  readonly columnNumber: number;
};

type CsvParserState = "field_start" | "unquoted_field" | "quoted_field" | "after_quote";

type CsvDiagnosticInput = {
  readonly code: CsvParseDiagnosticCode;
  readonly message: string;
  readonly fileName: string | undefined;
  readonly rowNumber: number;
  readonly columnNumber: number;
};

/** Decode UTF-8 bytes and parse the resulting CSV text. BOM prefixes are tolerated. */
export function parseCsvBytes(
  bytes: Uint8Array,
  options: CsvParseOptions = {},
): Result<CsvDocument, CsvParseDiagnostic> {
  let text: string;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return err(
      csvDiagnostic({
        code: "csv.invalid_utf8",
        message: "CSV file is not valid UTF-8.",
        fileName: options.fileName,
        rowNumber: 1,
        columnNumber: 1,
      }),
    );
  }

  return parseCsv(text, options);
}

/** Parse CSV text using RFC 4180 quoting rules and OneRoster line-break restrictions. */
export function parseCsv(
  text: string,
  options: CsvParseOptions = {},
): Result<CsvDocument, CsvParseDiagnostic> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let state: CsvParserState = "field_start";
  let rowNumber = 1;
  let columnNumber = 1;
  let index = text.startsWith("\uFEFF") ? 1 : 0;

  while (index < text.length) {
    const character = text[index];

    if (character === undefined) {
      break;
    }

    if (state === "field_start") {
      if (character === '"') {
        state = "quoted_field";
        index += 1;
        columnNumber += 1;
        continue;
      }

      if (character === ",") {
        row.push("");
        index += 1;
        columnNumber += 1;
        continue;
      }

      if (character === "\n") {
        row.push("");
        rows.push(row);
        row = [];
        index += 1;
        rowNumber += 1;
        columnNumber = 1;
        continue;
      }

      if (character === "\r") {
        const lineEnding = readCarriageReturn(text, index);

        if (lineEnding._tag === "err") {
          return err(
            csvDiagnostic({
              code: "csv.bare_carriage_return",
              message: "CSV contains a carriage return that is not followed by a line feed.",
              fileName: options.fileName,
              rowNumber,
              columnNumber,
            }),
          );
        }

        row.push("");
        rows.push(row);
        row = [];
        index = lineEnding.value.nextIndex;
        rowNumber += 1;
        columnNumber = 1;
        continue;
      }

      field += character;
      state = "unquoted_field";
      index += 1;
      columnNumber += 1;
      continue;
    }

    if (state === "unquoted_field") {
      if (character === '"') {
        return err(
          csvDiagnostic({
            code: "csv.unescaped_quote",
            message: "CSV quote appeared inside an unquoted field.",
            fileName: options.fileName,
            rowNumber,
            columnNumber,
          }),
        );
      }

      if (character === ",") {
        row.push(field);
        field = "";
        state = "field_start";
        index += 1;
        columnNumber += 1;
        continue;
      }

      if (character === "\n") {
        row.push(field);
        field = "";
        state = "field_start";
        rows.push(row);
        row = [];
        index += 1;
        rowNumber += 1;
        columnNumber = 1;
        continue;
      }

      if (character === "\r") {
        const lineEnding = readCarriageReturn(text, index);

        if (lineEnding._tag === "err") {
          return err(
            csvDiagnostic({
              code: "csv.bare_carriage_return",
              message: "CSV contains a carriage return that is not followed by a line feed.",
              fileName: options.fileName,
              rowNumber,
              columnNumber,
            }),
          );
        }

        row.push(field);
        field = "";
        state = "field_start";
        rows.push(row);
        row = [];
        index = lineEnding.value.nextIndex;
        rowNumber += 1;
        columnNumber = 1;
        continue;
      }

      field += character;
      index += 1;
      columnNumber += 1;
      continue;
    }

    if (state === "quoted_field") {
      if (character === '"') {
        const nextCharacter = text[index + 1];

        if (nextCharacter === '"') {
          field += '"';
          index += 2;
          columnNumber += 2;
          continue;
        }

        state = "after_quote";
        index += 1;
        columnNumber += 1;
        continue;
      }

      if (character === "\r" || character === "\n") {
        return err(
          csvDiagnostic({
            code: "csv.line_break_in_quoted_field",
            message: "OneRoster CSV fields must not contain embedded line breaks.",
            fileName: options.fileName,
            rowNumber,
            columnNumber,
          }),
        );
      }

      field += character;
      index += 1;
      columnNumber += 1;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      state = "field_start";
      index += 1;
      columnNumber += 1;
      continue;
    }

    if (character === "\n") {
      row.push(field);
      field = "";
      state = "field_start";
      rows.push(row);
      row = [];
      index += 1;
      rowNumber += 1;
      columnNumber = 1;
      continue;
    }

    if (character === "\r") {
      const lineEnding = readCarriageReturn(text, index);

      if (lineEnding._tag === "err") {
        return err(
          csvDiagnostic({
            code: "csv.bare_carriage_return",
            message: "CSV contains a carriage return that is not followed by a line feed.",
            fileName: options.fileName,
            rowNumber,
            columnNumber,
          }),
        );
      }

      row.push(field);
      field = "";
      state = "field_start";
      rows.push(row);
      row = [];
      index = lineEnding.value.nextIndex;
      rowNumber += 1;
      columnNumber = 1;
      continue;
    }

    return err(
      csvDiagnostic({
        code: "csv.unexpected_character_after_quote",
        message: "CSV field has characters after a closing quote.",
        fileName: options.fileName,
        rowNumber,
        columnNumber,
      }),
    );
  }

  if (state === "quoted_field") {
    return err(
      csvDiagnostic({
        code: "csv.unclosed_quote",
        message: "CSV quoted field was not closed.",
        fileName: options.fileName,
        rowNumber,
        columnNumber,
      }),
    );
  }

  if (state === "after_quote" || state === "unquoted_field" || field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return ok({ rows });
}

function readCarriageReturn(
  text: string,
  index: number,
): Result<{ readonly nextIndex: number }, undefined> {
  return text[index + 1] === "\n" ? ok({ nextIndex: index + 2 }) : err(undefined);
}

function csvDiagnostic(input: CsvDiagnosticInput): CsvParseDiagnostic {
  const diagnostic: CsvParseDiagnostic = {
    _tag: "CsvParseDiagnostic",
    code: input.code,
    message: input.message,
    rowNumber: input.rowNumber,
    columnNumber: input.columnNumber,
  };

  if (input.fileName === undefined) {
    return diagnostic;
  }

  return { ...diagnostic, fileName: input.fileName };
}
