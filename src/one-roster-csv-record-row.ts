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

function allRequiredFieldsPresent<
  TFields extends Record<string, unknown>,
  TRequired extends keyof TFields,
>(
  fields: { readonly [K in keyof TFields]: TFields[K] | undefined },
  required: readonly TRequired[],
): fields is WithRequiredFields<TFields, TRequired> {
  for (const key of required) {
    if (fields[key] === undefined) {
      return false;
    }
  }

  return true;
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
  required: readonly TRequired[],
  build: (fields: WithRequiredFields<TFields, TRequired>) => TRecord,
): TRecord | undefined {
  if (hasNewRowDiagnostics(context, diagnosticStart)) {
    return undefined;
  }

  if (!allRequiredFieldsPresent(fields, required)) {
    return undefined;
  }

  return build(fields);
}
