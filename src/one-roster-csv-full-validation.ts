import {
  collectOneRosterCsvGradebookValidation,
  type OneRosterCsvGradebookValidationState,
  type OneRosterCsvValidatedGradebookPackage,
} from "./one-roster-csv-gradebook-validation.js";
import { parseOneRosterCsvFullZip, type OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import { validateOneRosterCsvFullSemanticRules } from "./one-roster-csv-full-semantics.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { validatedRosteringPackage } from "./one-roster-csv-profile-validator.js";
import type { OneRosterCsvReferenceValidationOptions } from "./one-roster-csv-record-reference-validation.js";
import {
  collectOneRosterCsvResourcesValidation,
  type OneRosterCsvResourcesValidationState,
  type OneRosterCsvValidatedResourcesPackage,
} from "./one-roster-csv-resources-validation.js";
import {
  collectOneRosterCsvRosteringValidation,
  type OneRosterCsvRosteringValidationState,
  type OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvReferenceValidationOptions as OneRosterCsvFullValidationOptions } from "./one-roster-csv-record-reference-validation.js";

/** OneRoster CSV full package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedFullPackage = {
  readonly fullPackage: OneRosterCsvFullPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly gradebookValidation: OneRosterCsvValidatedGradebookPackage;
  readonly resourcesValidation: OneRosterCsvValidatedResourcesPackage;
};

/** Parse a OneRoster CSV ZIP archive and validate all supported CSV record layers. */
export function parseAndValidateOneRosterCsvFullZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const parsedPackage = parseOneRosterCsvFullZip(bytes, options);

  if (parsedPackage._tag === "err") {
    return err(parsedPackage.error);
  }

  return validateOneRosterCsvFullPackage(parsedPackage.value, options);
}

/** Validate duplicate sourcedIds and direct references in all supported CSV record layers. */
export function validateOneRosterCsvFullPackage(
  packageValue: OneRosterCsvFullPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedFullPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const validation = collectOneRosterCsvFullValidation(packageValue, options);

  if (validation.diagnostics.length > 0) {
    return err(validation.diagnostics);
  }

  const rosteringValidation = validatedRosteringPackage(
    packageValue.rosteringPackage,
    validation.rosteringValidation,
  );

  return ok({
    fullPackage: packageValue,
    rosteringValidation,
    gradebookValidation: {
      gradebookPackage: packageValue.gradebookPackage,
      rosteringValidation,
      indexes: validation.gradebookValidation.indexes,
    },
    resourcesValidation: {
      resourcesPackage: packageValue.resourcesPackage,
      rosteringValidation,
      indexes: validation.resourcesValidation.indexes,
    },
  });
}

/** Accumulated full-package validation state, including semantic diagnostics. */
export type OneRosterCsvFullValidationState = {
  readonly rosteringValidation: OneRosterCsvRosteringValidationState;
  readonly gradebookValidation: OneRosterCsvGradebookValidationState;
  readonly resourcesValidation: OneRosterCsvResourcesValidationState;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

function collectOneRosterCsvFullValidation(
  packageValue: OneRosterCsvFullPackage,
  options: OneRosterCsvReferenceValidationOptions,
): OneRosterCsvFullValidationState {
  const rosteringValidation = collectOneRosterCsvRosteringValidation(
    packageValue.rosteringPackage,
    options,
  );
  const gradebookValidation = collectOneRosterCsvGradebookValidation(
    packageValue.gradebookPackage,
    {
      referenceOptions: options,
      rosteringValidation,
    },
  );
  const resourcesValidation = collectOneRosterCsvResourcesValidation(
    packageValue.resourcesPackage,
    {
      referenceOptions: options,
      rosteringValidation,
    },
  );

  const diagnostics: OneRosterCsvPackageDiagnostic[] = [
    ...rosteringValidation.diagnostics,
    ...gradebookValidation.diagnostics,
    ...resourcesValidation.diagnostics,
  ];

  validateOneRosterCsvFullSemanticRules({
    packageValue,
    rosteringIndexes: rosteringValidation.indexes,
    gradebookIndexes: gradebookValidation.indexes,
    resourcesIndexes: resourcesValidation.indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
  });

  return {
    rosteringValidation,
    gradebookValidation,
    resourcesValidation,
    diagnostics,
  };
}
