import { parseOneRosterCsvResourcesZip } from "./one-roster-csv-resources.js";
import {
  buildResourcesReferenceIndexes,
  classResourcesRecordSet,
  courseResourcesRecordSet,
  resourcesRecordSet,
  type ResourcesRecordSet,
  userResourcesRecordSet,
} from "./one-roster-csv-resources-tables.js";
import type {
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesRecordBase,
  OneRosterCsvResourcesReferenceIndexes,
} from "./one-roster-csv-resources-types.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  defineOneRosterCsvReferenceRule,
  optionalOneRosterCsvReference,
  validateOneRosterCsvReferences,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationContext,
} from "./one-roster-csv-record-reference-validation.js";
import {
  collectOneRosterCsvRosteringValidation,
  type OneRosterCsvReferenceValidationMode,
  type OneRosterCsvRosteringValidationOptions,
  type OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";

/** Options for semantic validation of typed OneRoster CSV resources records. */
export type OneRosterCsvResourcesValidationOptions = {
  readonly referenceMode?: OneRosterCsvReferenceValidationMode;
};

/** OneRoster CSV resources package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedResourcesPackage = {
  readonly resourcesPackage: OneRosterCsvResourcesPackage;
  readonly rosteringValidation: OneRosterCsvValidatedRosteringPackage;
  readonly indexes: OneRosterCsvResourcesReferenceIndexes;
};

type ResourcesReferenceValidationContext =
  OneRosterCsvReferenceValidationContext<OneRosterCsvResourcesPackage> & {
    readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
    readonly indexes: OneRosterCsvResourcesReferenceIndexes;
  };

type ResourcesReferenceRule = OneRosterCsvReferenceRule<ResourcesReferenceValidationContext>;

function defineResourcesReferenceRule<TRecord extends OneRosterCsvResourcesRecordBase>(rule: {
  readonly source: ResourcesRecordSet<TRecord>;
  readonly field: string;
  readonly target: OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext>;
  readonly getReferenceValues: (record: TRecord) => ReadonlyArray<TRecord["sourcedId"]>;
}): ResourcesReferenceRule {
  return defineOneRosterCsvReferenceRule({
    source: rule.source,
    field: rule.field,
    target: rule.target,
    getReferenceValues: rule.getReferenceValues,
  });
}

function resourcesTarget<TRecord extends OneRosterCsvResourcesRecordBase>(
  recordSet: ResourcesRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

const classesTarget: OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> = {
  fileName: "classes.csv",
  getIndex: (context) => context.rosteringIndexes.classesBySourcedId,
};

const coursesTarget: OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> = {
  fileName: "courses.csv",
  getIndex: (context) => context.rosteringIndexes.coursesBySourcedId,
};

const orgsTarget: OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> = {
  fileName: "orgs.csv",
  getIndex: (context) => context.rosteringIndexes.orgsBySourcedId,
};

const usersTarget: OneRosterCsvReferenceTarget<ResourcesReferenceValidationContext> = {
  fileName: "users.csv",
  getIndex: (context) => context.rosteringIndexes.usersBySourcedId,
};

function isResourcesTargetFilePresent(
  packageValue: OneRosterCsvResourcesPackage,
  targetFileName: Parameters<ResourcesReferenceValidationContext["isTargetFilePresent"]>[0],
): boolean {
  return packageValue.rosteringPackage.rawPackage.manifest.fileModes[targetFileName] !== "absent";
}

const RESOURCES_REFERENCE_RULES: readonly ResourcesReferenceRule[] = [
  defineResourcesReferenceRule({
    source: classResourcesRecordSet,
    field: "classSourcedId",
    target: classesTarget,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineResourcesReferenceRule({
    source: classResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineResourcesReferenceRule({
    source: courseResourcesRecordSet,
    field: "courseSourcedId",
    target: coursesTarget,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineResourcesReferenceRule({
    source: courseResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
  defineResourcesReferenceRule({
    source: userResourcesRecordSet,
    field: "userSourcedId",
    target: usersTarget,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  defineResourcesReferenceRule({
    source: userResourcesRecordSet,
    field: "orgSourcedId",
    target: orgsTarget,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.orgSourcedId),
  }),
  defineResourcesReferenceRule({
    source: userResourcesRecordSet,
    field: "classSourcedId",
    target: classesTarget,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.classSourcedId),
  }),
  defineResourcesReferenceRule({
    source: userResourcesRecordSet,
    field: "resourceSourcedId",
    target: resourcesTarget(resourcesRecordSet),
    getReferenceValues: (record) => [record.resourceSourcedId],
  }),
];

/** Parse a OneRoster CSV ZIP archive and validate resources plus rostering references. */
export function parseAndValidateOneRosterCsvResourcesZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvResourcesValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const parsedPackage = parseOneRosterCsvResourcesZip(bytes, options);

  if (parsedPackage._tag === "err") {
    return err(parsedPackage.error);
  }

  return validateOneRosterCsvResourcesPackage(parsedPackage.value, options);
}

/** Validate duplicate sourcedIds and direct references in a typed resources package. */
export function validateOneRosterCsvResourcesPackage(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvResourcesValidationOptions = {},
): Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const rosteringOptions: OneRosterCsvRosteringValidationOptions =
    options.referenceMode === undefined ? {} : { referenceMode: options.referenceMode };
  const rosteringValidation = collectOneRosterCsvRosteringValidation(
    packageValue.rosteringPackage,
    rosteringOptions,
  );
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [...rosteringValidation.diagnostics];
  const indexes = buildResourcesReferenceIndexes(packageValue, diagnostics);
  const context: ResourcesReferenceValidationContext = {
    packageValue,
    rosteringIndexes: rosteringValidation.indexes,
    indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
    isTargetFilePresent: (targetFileName) =>
      isResourcesTargetFilePresent(packageValue, targetFileName),
  };

  validateOneRosterCsvReferences(RESOURCES_REFERENCE_RULES, context);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    resourcesPackage: packageValue,
    rosteringValidation: {
      rosteringPackage: packageValue.rosteringPackage,
      indexes: rosteringValidation.indexes,
    },
    indexes,
  });
}
