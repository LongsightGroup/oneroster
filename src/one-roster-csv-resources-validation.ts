import { parseOneRosterCsvResourcesZip } from "./one-roster-csv-resources.js";
import {
  buildResourcesReferenceIndexes,
  classResourcesRecordSet,
  courseResourcesRecordSet,
  resourcesRecordSet,
  userResourcesRecordSet,
  type ResourcesRecordSet,
} from "./one-roster-csv-resources-tables.js";
import type {
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesRecordBase,
  OneRosterCsvResourcesReferenceIndexes,
} from "./one-roster-csv-resources-types.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvProfileReferenceValidationContextBase } from "./one-roster-csv-profile-reference-context.js";
import {
  createProfilePackageValidator,
  createProfileReferenceValidator,
  validatedRosteringPackage,
} from "./one-roster-csv-profile-validator.js";
import type { OneRosterCsvProfileValidationCollectionOptions } from "./one-roster-csv-profile-validation.js";
import {
  defineOneRosterCsvReferenceRule,
  oneRosterCsvRecordSetTarget,
  optionalOneRosterCsvReference,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationOptions,
} from "./one-roster-csv-record-reference-validation.js";
import { rosteringIndexTargets } from "./one-roster-csv-rostering-reference-targets.js";
import type {
  OneRosterCsvRosteringValidationState,
  OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import type { Result } from "./result.js";

export type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
export type { OneRosterCsvProfileValidationCollectionOptions as OneRosterCsvResourcesValidationCollectionOptions } from "./one-roster-csv-profile-validation.js";
export type { OneRosterCsvReferenceValidationOptions as OneRosterCsvResourcesValidationOptions } from "./one-roster-csv-profile-validation.js";

/** OneRoster CSV resources package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedResourcesPackage = {
  readonly resourcesPackage: OneRosterCsvResourcesPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly indexes: OneRosterCsvResourcesReferenceIndexes;
};

/** Accumulated resources validation state, including indexes even when diagnostics exist. */
export type OneRosterCsvResourcesValidationState = {
  readonly rosteringValidation: OneRosterCsvRosteringValidationState;
  readonly indexes: OneRosterCsvResourcesReferenceIndexes;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

type ResourcesReferenceValidationContext = OneRosterCsvProfileReferenceValidationContextBase<
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesReferenceIndexes
>;

type ResourcesReferenceRule = OneRosterCsvReferenceRule<ResourcesReferenceValidationContext>;

function resourcesRecordSetTarget<TRecord extends OneRosterCsvResourcesRecordBase>(
  recordSet: ResourcesRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> {
  return oneRosterCsvRecordSetTarget(recordSet, (context) => context.indexes);
}

const rosteringTargets = rosteringIndexTargets<ResourcesReferenceValidationContext>();

const RESOURCES_REFERENCE_RULES: readonly ResourcesReferenceRule[] = [
  defineOneRosterCsvReferenceRule({
    source: classResourcesRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: classResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: courseResourcesRecordSet,
    field: "courseSourcedId",
    target: rosteringTargets.courses,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: courseResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "userSourcedId",
    target: rosteringTargets.users,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "orgSourcedId",
    target: rosteringTargets.orgs,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.orgSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "classSourcedId",
    target: rosteringTargets.classes,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.classSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: userResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesRecordSetTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
];

const resourcesValidator = createProfilePackageValidator<
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesReferenceIndexes,
  OneRosterCsvValidatedResourcesPackage
>({
  parseZip: parseOneRosterCsvResourcesZip,
  collectValidation: createProfileReferenceValidator<
    OneRosterCsvResourcesPackage,
    OneRosterCsvResourcesReferenceIndexes
  >({
    buildIndexes: buildResourcesReferenceIndexes,
    rules: RESOURCES_REFERENCE_RULES,
  }),
  toValidatedPackage: (packageValue, validation) => ({
    resourcesPackage: packageValue,
    rosteringValidation: validatedRosteringPackage(
      packageValue.rosteringPackage,
      validation.rosteringValidation,
    ),
    indexes: validation.indexes,
  }),
});

/** Parse a OneRoster CSV ZIP archive and validate resources plus rostering references. */
export function parseAndValidateOneRosterCsvResourcesZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return resourcesValidator.parseAndValidateZip(bytes, options);
}

/** Validate duplicate sourcedIds and direct references in a typed resources package. */
export function validateOneRosterCsvResourcesPackage(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return resourcesValidator.validatePackage(packageValue, options);
}

/** Collect duplicate and reference validation diagnostics for typed resources records. */
export function collectOneRosterCsvResourcesValidation(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvProfileValidationCollectionOptions = {},
): OneRosterCsvResourcesValidationState {
  return resourcesValidator.collectValidation(packageValue, options);
}
