import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  parseOneRosterBooleanToken,
  parseOneRosterDate,
  parseOneRosterDateTime,
  parseOneRosterGuid,
  parseOneRosterYear,
  type OneRosterDate,
  type OneRosterDateTime,
  type OneRosterGuid,
  type OneRosterYear,
} from "./one-roster-csv-primitive.js";
import type {
  CommonRecordFields,
  RosteringRowContext,
} from "./one-roster-csv-rostering-context.js";
import {
  formatVocabularyExpected,
  type FieldRequiredness,
} from "./one-roster-csv-rostering-schema.js";
import type {
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-rostering-types.js";

/** Parse common sourcedId, lifecycle, and metadata fields for a rostering row. */
export function parseCommonRecordFields(
  context: RosteringRowContext,
): CommonRecordFields | undefined {
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
    sourcedId,
    lifecycle,
    metadata: extractMetadata(context),
  };
}

function parseLifecycle(context: RosteringRowContext): OneRosterCsvRowLifecycle | undefined {
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
  context: RosteringRowContext,
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
  context: RosteringRowContext,
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

export function parseGuidField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

export function parseDateField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

export function parseYearField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

export function parseBooleanField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

export function parseVocabularyField<TValue extends string>(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: true,
): TValue | OneRosterExtensionVocabularyToken | undefined;

export function parseVocabularyField<TValue extends string>(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: false,
): TValue | undefined;

export function parseVocabularyField<TValue extends string>(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

export function parseRequiredStringField(
  context: RosteringRowContext,
  field: string,
): string | undefined {
  return readPossiblyRequiredCell(context, field, "required");
}

export function parseOptionalStringField(
  context: RosteringRowContext,
  field: string,
): string | undefined {
  const value = readCell(context, field);

  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}

export function parseStringListField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
): ReadonlyArray<string> | undefined {
  const value = readPossiblyRequiredCell(context, field, requiredness);

  if (value === undefined) {
    return undefined;
  }

  return splitOneRosterList(context, field, value, requiredness);
}

export function parseGuidListField(
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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
  context: RosteringRowContext,
  field: string,
  value: string,
  requiredness: FieldRequiredness,
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
  context: RosteringRowContext,
  field: string,
  requiredness: FieldRequiredness,
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

function readCell(context: RosteringRowContext, field: string): string | undefined {
  const value = context.row.valuesByHeader[field];

  if (value !== undefined) {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "schema.missing_header",
      message: "OneRoster rostering CSV table is missing a spec-defined header.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
    }),
  );
  return undefined;
}

function extractMetadata(context: RosteringRowContext): OneRosterCsvRecordMetadata {
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
