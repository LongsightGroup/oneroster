import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  parseOneRosterBooleanToken,
  parseOneRosterDate,
  parseOneRosterDateTime,
  parseOneRosterFloat,
  parseOneRosterGuid,
  parseOneRosterInteger,
  parseOneRosterYear,
  type OneRosterDate,
  type OneRosterDateTime,
  type OneRosterFloat,
  type OneRosterGuid,
  type OneRosterInteger,
  type OneRosterYear,
} from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvCommonRecordFields,
  OneRosterCsvRecordRowContext,
} from "./one-roster-csv-record-context.js";
import {
  formatVocabularyExpected,
  type OneRosterCsvFieldRequiredness,
} from "./one-roster-csv-record-schema.js";
import type {
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-record-types.js";

/** Parse common sourcedId, lifecycle, and metadata fields for a typed OneRoster row. */
export function parseCommonRecordFields(
  context: OneRosterCsvRecordRowContext,
): OneRosterCsvCommonRecordFields | undefined {
  const diagnosticStart = context.diagnostics.length;
  const sourcedId = parseGuidField(context, "sourcedId", "required");
  const lifecycle = parseLifecycle(context);

  if (
    context.diagnostics.length > diagnosticStart ||
    sourcedId === undefined ||
    lifecycle === undefined
  ) {
    return undefined;
  }

  return {
    rowNumber: context.row.rowNumber,
    sourcedId,
    lifecycle,
    metadata: extractMetadata(context),
  };
}

function parseLifecycle(
  context: OneRosterCsvRecordRowContext,
): OneRosterCsvRowLifecycle | undefined {
  const status = readCell(context, "status");
  const dateLastModified = readCell(context, "dateLastModified");

  if (status === undefined || dateLastModified === undefined) {
    return undefined;
  }

  if (context.table.manifestMode === "bulk") {
    let valid = true;

    if (status !== "") {
      valid = false;
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.field_forbidden_in_bulk",
          message: "Bulk OneRoster CSV rows must leave status blank.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field: "status",
          expected: "blank",
          actual: "present",
        }),
      );
    }

    if (dateLastModified !== "") {
      valid = false;
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.field_forbidden_in_bulk",
          message: "Bulk OneRoster CSV rows must leave dateLastModified blank.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field: "dateLastModified",
          expected: "blank",
          actual: "present",
        }),
      );
    }

    return valid ? { mode: "bulk" } : undefined;
  }

  const parsedStatus = parseDeltaStatus(context, status);
  const parsedDateLastModified = parseDeltaDateLastModified(context, dateLastModified);

  if (parsedStatus === undefined || parsedDateLastModified === undefined) {
    return undefined;
  }

  return {
    mode: "delta",
    status: parsedStatus,
    dateLastModified: parsedDateLastModified,
  };
}

function parseDeltaStatus(
  context: OneRosterCsvRecordRowContext,
  value: string,
): OneRosterCsvDeltaStatus | undefined {
  if (value === "") {
    context.diagnostics.push(
      packageDiagnostic({
        code: "row.field_required_in_delta",
        message: "Delta OneRoster CSV rows must include status.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field: "status",
        expected: "active|tobedeleted",
        actual: "empty",
      }),
    );
    return undefined;
  }

  if (value === "active" || value === "tobedeleted") {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_enum",
      message: "Delta OneRoster CSV status must be active or tobedeleted.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field: "status",
      expected: "active|tobedeleted",
      actual: "invalid value",
    }),
  );
  return undefined;
}

function parseDeltaDateLastModified(
  context: OneRosterCsvRecordRowContext,
  value: string,
): OneRosterDateTime | undefined {
  if (value === "") {
    context.diagnostics.push(
      packageDiagnostic({
        code: "row.field_required_in_delta",
        message: "Delta OneRoster CSV rows must include dateLastModified.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field: "dateLastModified",
        expected: "YYYY-MM-DDTHH:MM:SS.sssZ",
        actual: "empty",
      }),
    );
    return undefined;
  }

  const dateTime = parseOneRosterDateTime(value);

  if (dateTime !== undefined) {
    return dateTime;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_datetime",
      message: "OneRoster DateTime values must match YYYY-MM-DDTHH:MM:SS.sssZ.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field: "dateLastModified",
      expected: "YYYY-MM-DDTHH:MM:SS.sssZ",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster GUID field with requiredness diagnostics. */
export function parseGuidField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterGuid | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const guid = parseOneRosterGuid(value);

  if (guid !== undefined) {
    return guid;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_guid",
      message: "OneRoster GUID values must be 1-255 permitted characters.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "1-255 characters from 0-9 A-Z a-z . - _ / @",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster Date field with requiredness diagnostics. */
export function parseDateField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterDate | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const date = parseOneRosterDate(value);

  if (date !== undefined) {
    return date;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_date",
      message: "OneRoster Date values must match YYYY-MM-DD.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "YYYY-MM-DD",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster Year field with requiredness diagnostics. */
export function parseYearField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterYear | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const year = parseOneRosterYear(value);

  if (year !== undefined) {
    return year;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_year",
      message: "OneRoster Year values must match YYYY.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "YYYY",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster boolean vocabulary field with requiredness diagnostics. */
export function parseBooleanField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): boolean | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const booleanValue = parseOneRosterBooleanToken(value);

  if (booleanValue !== undefined) {
    return booleanValue;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_boolean",
      message: 'OneRoster boolean vocabulary values must be "true" or "false".',
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "true|false",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster integer field with requiredness diagnostics. */
export function parseIntegerField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterInteger | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const integer = parseOneRosterInteger(value);

  if (integer !== undefined) {
    return integer;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_integer",
      message: "OneRoster Integer values must be safe base-10 integers.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "base-10 integer",
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a OneRoster float field with requiredness diagnostics. */
export function parseFloatField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterFloat | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const float = parseOneRosterFloat(value);

  if (float !== undefined) {
    return float;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_float",
      message: "OneRoster Float values must be finite base-10 numbers.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: "finite base-10 number",
      actual: "invalid value",
    }),
  );
  return undefined;
}

export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: true,
): TValue | OneRosterExtensionVocabularyToken | undefined;

export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: false,
): TValue | undefined;

/** Parse a OneRoster vocabulary field with optional ext:* support. */
export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: boolean,
): TValue | OneRosterExtensionVocabularyToken | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  if (isAllowedVocabularyValue(value, allowedValues)) {
    return value;
  }

  if (allowExtension && isExtensionVocabularyToken(value)) {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_enum",
      message: "OneRoster vocabulary value is not permitted for this field.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: formatVocabularyExpected(allowedValues, allowExtension),
      actual: "invalid value",
    }),
  );
  return undefined;
}

/** Parse a required string field, preserving the original CSV cell text. */
export function parseRequiredStringField(
  context: OneRosterCsvRecordRowContext,
  field: string,
): string | undefined {
  return readPossiblyRequiredCell(context, field, "required");
}

/** Parse an optional string field, normalizing blank cells to undefined. */
export function parseOptionalStringField(
  context: OneRosterCsvRecordRowContext,
  field: string,
): string | undefined {
  const value = readCell(context, field);

  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}

/** Parse a comma-delimited OneRoster string list field. */
export function parseStringListField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): ReadonlyArray<string> | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined) {
    return undefined;
  }

  return splitOneRosterList(context, field, value, requiredness);
}

/** Parse a comma-delimited OneRoster GUID list field. */
export function parseGuidListField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): ReadonlyArray<OneRosterGuid> | undefined {
  const values = parseStringListField(context, field, requiredness);

  if (values === undefined) {
    return undefined;
  }

  const guids: OneRosterGuid[] = [];
  let valid = true;

  for (const value of values) {
    const guid = parseOneRosterGuid(value);

    if (guid === undefined) {
      valid = false;
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.invalid_guid",
          message: "OneRoster GUID list items must be 1-255 permitted characters.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field,
          expected: "comma-delimited GUID values",
          actual: "invalid list item",
        }),
      );
      continue;
    }

    guids.push(guid);
  }

  return valid ? guids : undefined;
}

function splitOneRosterList(
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

function readPossiblyRequiredCell(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): string | undefined {
  const value = readCell(context, field);

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

function readCell(context: OneRosterCsvRecordRowContext, field: string): string | undefined {
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

function extractMetadata(context: OneRosterCsvRecordRowContext): OneRosterCsvRecordMetadata {
  const metadata: Record<string, string> = {};

  for (const header of context.metadataHeaders) {
    const value = context.row.valuesByHeader[header];

    if (value !== undefined) {
      metadata[header] = value;
    }
  }

  return metadata;
}

function isAllowedVocabularyValue<TValue extends string>(
  value: string,
  allowedValues: readonly TValue[],
): value is TValue {
  for (const allowedValue of allowedValues) {
    if (value === allowedValue) {
      return true;
    }
  }

  return false;
}

function isExtensionVocabularyToken(value: string): value is OneRosterExtensionVocabularyToken {
  return value.startsWith("ext:") && value.length > "ext:".length;
}
