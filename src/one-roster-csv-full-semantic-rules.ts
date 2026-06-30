import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";
import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import {
  addSemanticDiagnostic,
  shouldValidateSemanticRecord,
  type SemanticDiagnosticInput,
} from "./one-roster-csv-full-semantic-diagnostic.js";

/** Declarative semantic validation rule for a typed record collection. */
export type SemanticRowRule<TRecord extends OneRosterCsvRecordBase> = {
  readonly records: ReadonlyArray<TRecord>;
  readonly when?: (record: TRecord, context: OneRosterCsvFullSemanticContext) => boolean;
  readonly satisfies: (record: TRecord, context: OneRosterCsvFullSemanticContext) => boolean;
  readonly diagnostic: (record: TRecord) => SemanticDiagnosticInput;
};

/** Run declarative semantic row rules against a shared validation context. */
export function runSemanticRowRules<TRecord extends OneRosterCsvRecordBase>(
  context: OneRosterCsvFullSemanticContext,
  rules: ReadonlyArray<SemanticRowRule<TRecord>>,
): void {
  for (const rule of rules) {
    for (const record of rule.records) {
      if (!shouldValidateSemanticRecord(context, record)) {
        continue;
      }

      if (rule.when !== undefined && !rule.when(record, context)) {
        continue;
      }

      if (rule.satisfies(record, context)) {
        continue;
      }

      addSemanticDiagnostic(context, rule.diagnostic(record));
    }
  }
}
