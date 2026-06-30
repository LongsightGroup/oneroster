import { parseOneRosterCsvRosteringZip } from "./one-roster-csv-rostering.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  defineOneRosterCsvReferenceRule,
  optionalOneRosterCsvReference,
  validateOneRosterCsvReferences,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationContext,
  type OneRosterCsvReferenceValidationMode,
} from "./one-roster-csv-record-reference-validation.js";
import {
  academicSessionsRecordSet,
  buildRosteringReferenceIndexes,
  classesRecordSet,
  coursesRecordSet,
  demographicsRecordSet,
  enrollmentsRecordSet,
  orgsRecordSet,
  rolesRecordSet,
  type RosteringRecordSet,
  userProfilesRecordSet,
  usersRecordSet,
} from "./one-roster-csv-rostering-tables.js";
import type {
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringRecordBase,
  OneRosterCsvRosteringReferenceIndexes,
} from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";
export type { OneRosterCsvReferenceValidationMode } from "./one-roster-csv-record-reference-validation.js";

/** Options for semantic validation of typed OneRoster CSV rostering records. */
export type OneRosterCsvRosteringValidationOptions = {
  readonly referenceMode?: OneRosterCsvReferenceValidationMode;
};

/** OneRoster CSV rostering package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedRosteringPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly indexes: OneRosterCsvRosteringReferenceIndexes;
};

/** Accumulated rostering validation state, including indexes even when diagnostics exist. */
export type OneRosterCsvRosteringValidationState = {
  readonly indexes: OneRosterCsvRosteringReferenceIndexes;
  readonly diagnostics: readonly OneRosterCsvPackageDiagnostic[];
};

type ReferenceValidationContext =
  OneRosterCsvReferenceValidationContext<OneRosterCsvRosteringPackage> & {
    readonly indexes: OneRosterCsvRosteringReferenceIndexes;
  };

type ReferenceRule = OneRosterCsvReferenceRule<ReferenceValidationContext>;

function defineReferenceRule<
  TRecord extends OneRosterCsvRosteringRecordBase,
  TTargetRecord extends OneRosterCsvRosteringRecordBase,
>(rule: {
  readonly source: RosteringRecordSet<TRecord>;
  readonly field: string;
  readonly target: RosteringRecordSet<TTargetRecord>;
  readonly getReferenceValues: (record: TRecord) => ReadonlyArray<TRecord["sourcedId"]>;
}): ReferenceRule {
  return defineOneRosterCsvReferenceRule({
    source: rule.source,
    field: rule.field,
    target: targetFromRecordSet(rule.target),
    getReferenceValues: rule.getReferenceValues,
  });
}

function targetFromRecordSet<TRecord extends OneRosterCsvRosteringRecordBase>(
  recordSet: RosteringRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<ReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

function isRosteringTargetFilePresent(
  packageValue: OneRosterCsvRosteringPackage,
  targetFileName: Parameters<ReferenceValidationContext["isTargetFilePresent"]>[0],
): boolean {
  return packageValue.rawPackage.manifest.fileModes[targetFileName] !== "absent";
}

/** Collect duplicate and reference validation diagnostics for typed rostering records. */
export function collectOneRosterCsvRosteringValidation(
  packageValue: OneRosterCsvRosteringPackage,
  options: OneRosterCsvRosteringValidationOptions = {},
): OneRosterCsvRosteringValidationState {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const indexes = buildRosteringReferenceIndexes(packageValue, diagnostics);
  const context: ReferenceValidationContext = {
    packageValue,
    indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
    isTargetFilePresent: (targetFileName) =>
      isRosteringTargetFilePresent(packageValue, targetFileName),
  };

  validateOneRosterCsvReferences(ROSTERING_REFERENCE_RULES, context);

  return {
    indexes,
    diagnostics,
  };
}

const ROSTERING_REFERENCE_RULES: readonly ReferenceRule[] = [
  defineReferenceRule({
    source: academicSessionsRecordSet,
    field: "parentSourcedId",
    target: academicSessionsRecordSet,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.parentSourcedId),
  }),
  defineReferenceRule({
    source: orgsRecordSet,
    field: "parentSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.parentSourcedId),
  }),
  defineReferenceRule({
    source: coursesRecordSet,
    field: "schoolYearSourcedId",
    target: academicSessionsRecordSet,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.schoolYearSourcedId),
  }),
  defineReferenceRule({
    source: coursesRecordSet,
    field: "orgSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineReferenceRule({
    source: classesRecordSet,
    field: "courseSourcedId",
    target: coursesRecordSet,
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineReferenceRule({
    source: classesRecordSet,
    field: "schoolSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineReferenceRule({
    source: classesRecordSet,
    field: "termSourcedIds",
    target: academicSessionsRecordSet,
    getReferenceValues: (record) => record.termSourcedIds,
  }),
  defineReferenceRule({
    source: usersRecordSet,
    field: "agentSourcedIds",
    target: usersRecordSet,
    getReferenceValues: (record) => record.agentSourcedIds,
  }),
  defineReferenceRule({
    source: usersRecordSet,
    field: "primaryOrgSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.primaryOrgSourcedId),
  }),
  defineReferenceRule({
    source: rolesRecordSet,
    field: "userSourcedId",
    target: usersRecordSet,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  defineReferenceRule({
    source: rolesRecordSet,
    field: "orgSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineReferenceRule({
    source: rolesRecordSet,
    field: "userProfileSourcedId",
    target: userProfilesRecordSet,
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.userProfileSourcedId),
  }),
  defineReferenceRule({
    source: enrollmentsRecordSet,
    field: "classSourcedId",
    target: classesRecordSet,
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineReferenceRule({
    source: enrollmentsRecordSet,
    field: "schoolSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineReferenceRule({
    source: enrollmentsRecordSet,
    field: "userSourcedId",
    target: usersRecordSet,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  // demographics.csv sourcedId must match a users.csv sourcedId (1:1 extension of user identity).
  defineReferenceRule({
    source: demographicsRecordSet,
    field: "sourcedId",
    target: usersRecordSet,
    getReferenceValues: (record) => [record.sourcedId],
  }),
  defineReferenceRule({
    source: userProfilesRecordSet,
    field: "userSourcedId",
    target: usersRecordSet,
    getReferenceValues: (record) => [record.userSourcedId],
  }),
];

/** Parse a OneRoster CSV ZIP archive and validate core rostering references. */
export function parseAndValidateOneRosterCsvRosteringZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvRosteringValidationOptions = {},
): Result<OneRosterCsvValidatedRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const parsedPackage = parseOneRosterCsvRosteringZip(bytes, options);

  if (parsedPackage._tag === "err") {
    return err(parsedPackage.error);
  }

  return validateOneRosterCsvRosteringPackage(parsedPackage.value, options);
}

/** Validate duplicate sourcedIds and core rostering references in a typed package. */
export function validateOneRosterCsvRosteringPackage(
  packageValue: OneRosterCsvRosteringPackage,
  options: OneRosterCsvRosteringValidationOptions = {},
): Result<OneRosterCsvValidatedRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const validation = collectOneRosterCsvRosteringValidation(packageValue, options);

  if (validation.diagnostics.length > 0) {
    return err(validation.diagnostics);
  }

  return ok({
    rosteringPackage: packageValue,
    indexes: validation.indexes,
  });
}
