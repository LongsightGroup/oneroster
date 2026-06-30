import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseOneRosterDateTime, type OneRosterDateTime } from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvCommonRecordFields,
  OneRosterCsvRecordRowContext,
} from "./one-roster-csv-record-context.js";
import { readOneRosterCsvRecordCell } from "./one-roster-csv-record-cell-access.js";
import { parseGuidField } from "./one-roster-csv-record-field-parsers.js";
import type {
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
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
  const status = readOneRosterCsvRecordCell(context, "status");
  const dateLastModified = readOneRosterCsvRecordCell(context, "dateLastModified");

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
