import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import type { OneRosterCsvFieldRequiredness } from "./one-roster-csv-record-schema.js";

/** Read one CSV cell by header, reporting missing schema headers. */
export function readOneRosterCsvRecordCell(
  context: OneRosterCsvRecordRowContext,
  field: string,
): string | undefined {
  const value = context.row.valuesByHeader[field];

  if (value !== undefined) {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "schema.missing_header",
      message: "OneRoster CSV table is missing a spec-defined header.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
    }),
  );
  return undefined;
}

/** Read a cell and enforce requiredness before downstream field parsing. */
export function readPossiblyRequiredOneRosterCsvRecordCell(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): string | undefined {
  const value = readOneRosterCsvRecordCell(context, field);

  if (value === undefined) {
    return undefined;
  }

  if (value !== "" || requiredness === "optional") {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.missing_required_value",
      message: "OneRoster required fields must not be blank.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "non-empty value",
      actual: "empty",
    }),
  );
  return undefined;
}

/** Split a comma-delimited OneRoster list cell into non-empty items. */
export function splitOneRosterCsvRecordList(
  context: OneRosterCsvRecordRowContext,
  field: string,
  value: string,
  requiredness: OneRosterCsvFieldRequiredness,
): ReadonlyArray<string> | undefined {
  if (value === "") {
    if (requiredness === "required") {
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.missing_required_value",
          message: "OneRoster required fields must not be blank.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field,
          expected: "non-empty value",
          actual: "empty",
        }),
      );
      return undefined;
    }

    return [];
  }

  const values = value.split(",");

  for (const item of values) {
    if (item !== "") {
      continue;
    }

    context.diagnostics.push(
      packageDiagnostic({
        code: "row.invalid_list",
        message: "OneRoster list fields must not contain empty list items.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field,
        expected: "comma-delimited non-empty items",
        actual: "empty list item",
      }),
    );
    return undefined;
  }

  return values;
}
