import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordSet } from "./one-roster-csv-record-tables.js";
import type { OneRosterCsvRecordBase } from "./one-roster-csv-record-types.js";

/** Controls which row lifecycles participate in reference validation. */
export type OneRosterCsvReferenceValidationMode = "bulkOnly" | "allRows";

/** Options for semantic OneRoster CSV reference validation. */
export type OneRosterCsvReferenceValidationOptions = {
  readonly referenceMode?: OneRosterCsvReferenceValidationMode;
};

/** Base context required by the generic OneRoster CSV reference validator. */
export type OneRosterCsvReferenceValidationContext<TPackage> = {
  readonly packageValue: TPackage;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
  readonly isTargetFilePresent: (targetFileName: OneRosterCsvDataFileName) => boolean;
};

/** Target record index descriptor for a OneRoster CSV reference rule. */
export type OneRosterCsvReferenceTarget<TContext> = {
  readonly fileName: OneRosterCsvDataFileName;
  readonly getIndex: (context: TContext) => ReadonlyMap<OneRosterGuid, OneRosterCsvRecordBase>;
};

/** Executable OneRoster CSV reference validation rule. */
export type OneRosterCsvReferenceRule<TContext> = {
  readonly validate: (context: TContext) => void;
};

/** Declarative input for one OneRoster CSV reference validation rule. */
export type OneRosterCsvReferenceRuleInput<
  TContext extends OneRosterCsvReferenceValidationContext<TPackage>,
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
> = {
  readonly source: OneRosterCsvRecordSet<TPackage, TIndexes, TRecord>;
  readonly field: string;
  readonly target: OneRosterCsvReferenceTarget<TContext>;
  readonly getReferenceValues: (record: TRecord) => ReadonlyArray<OneRosterGuid>;
};

/** Build a reference target backed by one typed record-set index. */
export function oneRosterCsvRecordSetTarget<
  TContext,
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
>(
  recordSet: OneRosterCsvRecordSet<TPackage, TIndexes, TRecord>,
  getIndexes: (context: TContext) => TIndexes,
): OneRosterCsvReferenceTarget<TContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(getIndexes(context)),
  };
}

/** Build an executable reference rule from declarative source, target, and field descriptors. */
export function defineOneRosterCsvReferenceRule<
  TContext extends OneRosterCsvReferenceValidationContext<TPackage>,
  TPackage,
  TIndexes,
  TRecord extends OneRosterCsvRecordBase,
>(
  rule: OneRosterCsvReferenceRuleInput<TContext, TPackage, TIndexes, TRecord>,
): OneRosterCsvReferenceRule<TContext> {
  return {
    validate(context) {
      for (const record of rule.source.getRecords(context.packageValue)) {
        if (!shouldValidateReferences(context, record)) {
          continue;
        }

        const values = rule.getReferenceValues(record);
        if (values.length === 0) {
          continue;
        }

        if (!context.isTargetFilePresent(rule.target.fileName)) {
          addMissingTargetFileDiagnostic(
            context,
            record,
            rule.source.fileName,
            rule.field,
            rule.target.fileName,
          );
          continue;
        }

        const targetIndex = rule.target.getIndex(context);
        for (const value of values) {
          if (targetIndex.has(value)) {
            continue;
          }

          addMissingTargetRecordDiagnostic(
            context,
            record,
            rule.source.fileName,
            rule.field,
            rule.target.fileName,
          );
        }
      }
    },
  };
}

/** Validate all supplied OneRoster CSV reference rules against a package context. */
export function validateOneRosterCsvReferences<TContext>(
  rules: readonly OneRosterCsvReferenceRule<TContext>[],
  context: TContext,
): void {
  for (const rule of rules) {
    rule.validate(context);
  }
}

/** Return a singleton reference list for a present optional reference. */
export function optionalOneRosterCsvReference(
  value: OneRosterGuid | undefined,
): ReadonlyArray<OneRosterGuid> {
  if (value === undefined) {
    return [];
  }

  return [value];
}

function shouldValidateReferences<TPackage>(
  context: OneRosterCsvReferenceValidationContext<TPackage>,
  sourceRecord: OneRosterCsvRecordBase,
): boolean {
  return context.referenceMode === "allRows" || sourceRecord.lifecycle.mode === "bulk";
}

function addMissingTargetFileDiagnostic<TPackage>(
  context: OneRosterCsvReferenceValidationContext<TPackage>,
  sourceRecord: OneRosterCsvRecordBase,
  sourceFileName: OneRosterCsvDataFileName,
  field: string,
  targetFileName: OneRosterCsvDataFileName,
): void {
  context.diagnostics.push(
    packageDiagnostic({
      code: "reference.missing_target_file",
      message: "OneRoster reference target file is not supplied by the package.",
      fileName: sourceFileName,
      rowNumber: sourceRecord.rowNumber,
      field,
      expected: targetFileName,
      actual: "absent",
    }),
  );
}

function addMissingTargetRecordDiagnostic<TPackage>(
  context: OneRosterCsvReferenceValidationContext<TPackage>,
  sourceRecord: OneRosterCsvRecordBase,
  sourceFileName: OneRosterCsvDataFileName,
  field: string,
  targetFileName: OneRosterCsvDataFileName,
): void {
  context.diagnostics.push(
    packageDiagnostic({
      code: "reference.missing_target_record",
      message: "OneRoster reference target record is missing from the supplied target file.",
      fileName: sourceFileName,
      rowNumber: sourceRecord.rowNumber,
      field,
      expected: targetFileName,
      actual: "missing",
    }),
  );
}
