import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type {
  OneRosterCsvReferenceRule,
  OneRosterCsvReferenceValidationContext,
  OneRosterCsvReferenceValidationMode,
  OneRosterCsvReferenceValidationOptions,
} from "./one-roster-csv-record-reference-validation.js";
import { validateOneRosterCsvReferences } from "./one-roster-csv-record-reference-validation.js";
import {
  collectOneRosterCsvRosteringValidation,
  type OneRosterCsvRosteringValidationState,
} from "./one-roster-csv-rostering-validation.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";

export type { OneRosterCsvReferenceValidationOptions } from "./one-roster-csv-record-reference-validation.js";

/** Optional shared rostering validation state for composed profile validators. */
export type OneRosterCsvProfileValidationCollectionOptions = {
  readonly referenceOptions?: OneRosterCsvReferenceValidationOptions;
  readonly rosteringValidation?: OneRosterCsvRosteringValidationState | undefined;
  readonly includeRosteringDiagnostics?: boolean;
};

/** Accumulated profile validation state, including rostering and profile indexes. */
export type OneRosterCsvProfileValidationState<TIndexes> = {
  readonly rosteringValidation: OneRosterCsvRosteringValidationState;
  readonly indexes: TIndexes;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

/** Collect rostering validation, profile indexes, and profile reference diagnostics. */
export function collectProfileReferenceValidation<
  TPackage,
  TContext extends OneRosterCsvReferenceValidationContext<TPackage>,
  TIndexes,
>(input: {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly packageValue: TPackage;
  readonly options?: OneRosterCsvReferenceValidationOptions;
  readonly rosteringValidation?: OneRosterCsvRosteringValidationState | undefined;
  readonly includeRosteringDiagnostics?: boolean;
  readonly buildIndexes: (
    packageValue: TPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ) => TIndexes;
  readonly buildContext: (state: {
    readonly packageValue: TPackage;
    readonly rosteringValidation: OneRosterCsvRosteringValidationState;
    readonly indexes: TIndexes;
    readonly diagnostics: OneRosterCsvPackageDiagnostic[];
    readonly referenceMode: OneRosterCsvReferenceValidationMode;
  }) => TContext;
  readonly rules: readonly OneRosterCsvReferenceRule<TContext>[];
}): OneRosterCsvProfileValidationState<TIndexes> {
  const rosteringValidation =
    input.rosteringValidation ??
    collectOneRosterCsvRosteringValidation(input.rosteringPackage, input.options ?? {});
  const diagnostics: OneRosterCsvPackageDiagnostic[] =
    input.includeRosteringDiagnostics === false ? [] : [...rosteringValidation.diagnostics];
  const indexes = input.buildIndexes(input.packageValue, diagnostics);
  const referenceMode = input.options?.referenceMode ?? "bulkOnly";
  const context = input.buildContext({
    packageValue: input.packageValue,
    rosteringValidation,
    indexes,
    diagnostics,
    referenceMode,
  });

  validateOneRosterCsvReferences(input.rules, context);

  return {
    rosteringValidation,
    indexes,
    diagnostics,
  };
}
