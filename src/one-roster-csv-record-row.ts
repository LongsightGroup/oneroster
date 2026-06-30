import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";

/** Return whether new diagnostics were appended after a parsing checkpoint. */
export function hasNewRowDiagnostics(
  context: OneRosterCsvRecordRowContext,
  diagnosticStart: number,
): boolean {
  return context.diagnostics.length > diagnosticStart;
}

type WithRequiredFields<
  TFields extends Record<string, unknown>,
  TRequired extends keyof TFields,
> = {
  readonly [K in keyof TFields]: K extends TRequired ? Exclude<TFields[K], undefined> : TFields[K];
};

function allRequiredScalarsPresent<
  TFields extends Record<string, unknown>,
  TRequired extends keyof TFields,
>(
  fields: { readonly [K in keyof TFields]: TFields[K] | undefined },
  requiredScalars: readonly TRequired[],
): fields is WithRequiredFields<TFields, TRequired> {
  for (const key of requiredScalars) {
    if (fields[key] === undefined) {
      return false;
    }
  }

  return true;
}

function pushMissingRequiredScalarDiagnostics<TFields extends Record<string, unknown>>(
  context: OneRosterCsvRecordRowContext,
  fields: { readonly [K in keyof TFields]: TFields[K] | undefined },
  requiredScalars: readonly (keyof TFields)[],
): void {
  for (const key of requiredScalars) {
    if (fields[key] === undefined) {
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.missing_required_value",
          message: "Required OneRoster CSV field values must be present.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field: String(key),
          expected: "present value",
          actual: "missing",
        }),
      );
    }
  }
}

/** Parse a typed OneRoster CSV row after field parsers have run. */
export function parseOneRosterCsvRecordRow<
  TFields extends Record<string, unknown>,
  TRequired extends keyof TFields,
  TRecord,
>(
  context: OneRosterCsvRecordRowContext,
  diagnosticStart: number,
  fields: { readonly [K in keyof TFields]: TFields[K] | undefined },
  requiredScalars: readonly TRequired[],
  build: (fields: WithRequiredFields<TFields, TRequired>) => TRecord,
): TRecord | undefined {
  if (hasNewRowDiagnostics(context, diagnosticStart)) {
    return undefined;
  }

  if (!allRequiredScalarsPresent(fields, requiredScalars)) {
    pushMissingRequiredScalarDiagnostics(context, fields, requiredScalars);
    return undefined;
  }

  return build(fields);
}
