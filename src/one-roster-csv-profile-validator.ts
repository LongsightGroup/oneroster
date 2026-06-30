import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildProfileReferenceValidationContextBase,
  type OneRosterCsvProfileReferenceValidationContextBase,
} from "./one-roster-csv-profile-reference-context.js";
import {
  collectProfileReferenceValidation,
  type OneRosterCsvProfileValidationCollectionOptions,
  type OneRosterCsvProfileValidationState,
} from "./one-roster-csv-profile-validation.js";
import type {
  OneRosterCsvReferenceRule,
  OneRosterCsvReferenceValidationOptions,
} from "./one-roster-csv-record-reference-validation.js";
import type {
  OneRosterCsvRosteringValidationState,
  OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

type ProfileReferenceValidationContext<TPackage, TIndexes> =
  OneRosterCsvProfileReferenceValidationContextBase<TPackage, TIndexes>;

/** Create a profile reference validator from index builders and declarative rules. */
export function createProfileReferenceValidator<
  TPackage extends { readonly rosteringPackage: OneRosterCsvRosteringPackage },
  TIndexes,
>(config: {
  readonly buildIndexes: (
    packageValue: TPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ) => TIndexes;
  readonly rules: readonly OneRosterCsvReferenceRule<
    ProfileReferenceValidationContext<TPackage, TIndexes>
  >[];
}): (
  packageValue: TPackage,
  options?: OneRosterCsvProfileValidationCollectionOptions,
) => OneRosterCsvProfileValidationState<TIndexes> {
  return (packageValue, options = {}) =>
    collectProfileReferenceValidation({
      rosteringPackage: packageValue.rosteringPackage,
      packageValue,
      ...(options.referenceOptions !== undefined ? { options: options.referenceOptions } : {}),
      ...(options.rosteringValidation !== undefined
        ? { rosteringValidation: options.rosteringValidation }
        : {}),
      buildIndexes: config.buildIndexes,
      buildContext: ({
        packageValue: currentPackage,
        rosteringValidation,
        indexes,
        diagnostics,
        referenceMode,
      }) =>
        buildProfileReferenceValidationContextBase(
          currentPackage,
          currentPackage.rosteringPackage,
          rosteringValidation.indexes,
          indexes,
          diagnostics,
          referenceMode,
        ),
      rules: config.rules,
    });
}

/** Create parse, validate, and collect entry points for a typed profile package. */
export function createProfilePackageValidator<
  TPackage extends { readonly rosteringPackage: OneRosterCsvRosteringPackage },
  TIndexes,
  TValidatedPackage,
>(config: {
  readonly parseZip: (
    bytes: Uint8Array,
    options: OneRosterCsvPackageOptions,
  ) => Result<TPackage, readonly OneRosterCsvPackageDiagnostic[]>;
  readonly collectValidation: (
    packageValue: TPackage,
    options?: OneRosterCsvProfileValidationCollectionOptions,
  ) => OneRosterCsvProfileValidationState<TIndexes>;
  readonly toValidatedPackage: (
    packageValue: TPackage,
    validation: OneRosterCsvProfileValidationState<TIndexes>,
  ) => TValidatedPackage;
}): {
  readonly parseAndValidateZip: (
    bytes: Uint8Array,
    options?: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions,
  ) => Result<TValidatedPackage, readonly OneRosterCsvPackageDiagnostic[]>;
  readonly validatePackage: (
    packageValue: TPackage,
    options?: OneRosterCsvReferenceValidationOptions,
  ) => Result<TValidatedPackage, readonly OneRosterCsvPackageDiagnostic[]>;
  readonly collectValidation: (
    packageValue: TPackage,
    options?: OneRosterCsvProfileValidationCollectionOptions,
  ) => OneRosterCsvProfileValidationState<TIndexes>;
} {
  const collectValidation = (
    packageValue: TPackage,
    options: OneRosterCsvProfileValidationCollectionOptions = {},
  ): OneRosterCsvProfileValidationState<TIndexes> =>
    config.collectValidation(packageValue, options);

  const validatePackage = (
    packageValue: TPackage,
    options: OneRosterCsvReferenceValidationOptions = {},
  ): Result<TValidatedPackage, readonly OneRosterCsvPackageDiagnostic[]> => {
    const validation = collectValidation(packageValue, {
      referenceOptions: options,
    });

    if (validation.diagnostics.length > 0) {
      return err(validation.diagnostics);
    }

    return ok(config.toValidatedPackage(packageValue, validation));
  };

  const parseAndValidateZip = (
    bytes: Uint8Array,
    options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
  ): Result<TValidatedPackage, readonly OneRosterCsvPackageDiagnostic[]> => {
    const parsedPackage = config.parseZip(bytes, options);

    if (parsedPackage._tag === "err") {
      return err(parsedPackage.error);
    }

    return validatePackage(parsedPackage.value, options);
  };

  return {
    collectValidation,
    parseAndValidateZip,
    validatePackage,
  };
}

/** Build the rostering slice shared by validated profile packages. */
export function validatedRosteringPackage(
  rosteringPackage: OneRosterCsvRosteringPackage,
  validation: OneRosterCsvRosteringValidationState,
): OneRosterCsvValidatedRosteringPackage {
  return {
    rosteringPackage,
    indexes: validation.indexes,
  };
}
