import { parseOneRosterCsvRosteringZip } from "./one-roster-csv-rostering.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { isManifestDataFilePresent } from "./one-roster-csv-manifest.js";
import {
  defineOneRosterCsvReferenceRule,
  optionalOneRosterCsvReference,
  validateOneRosterCsvReferences,
  type OneRosterCsvReferenceRule,
  type OneRosterCsvReferenceTarget,
  type OneRosterCsvReferenceValidationContext,
  type OneRosterCsvReferenceValidationOptions,
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
export type {
  OneRosterCsvReferenceValidationMode,
  OneRosterCsvReferenceValidationOptions,
  OneRosterCsvReferenceValidationOptions as OneRosterCsvRosteringValidationOptions,
} from "./one-roster-csv-record-reference-validation.js";

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

function rosteringRecordSetTarget<TRecord extends OneRosterCsvRosteringRecordBase>(
  recordSet: RosteringRecordSet<TRecord>,
): OneRosterCsvReferenceTarget<ReferenceValidationContext> {
  return {
    fileName: recordSet.fileName,
    getIndex: (context) => recordSet.getIndex(context.indexes),
  };
}

const ROSTERING_REFERENCE_RULES: readonly ReferenceRule[] = [
  defineOneRosterCsvReferenceRule({
    source: academicSessionsRecordSet,
    field: "parentSourcedId",
    target: rosteringRecordSetTarget(academicSessionsRecordSet),
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.parentSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: orgsRecordSet,
    field: "parentSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.parentSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: coursesRecordSet,
    field: "schoolYearSourcedId",
    target: rosteringRecordSetTarget(academicSessionsRecordSet),
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.schoolYearSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: coursesRecordSet,
    field: "orgSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: classesRecordSet,
    field: "courseSourcedId",
    target: rosteringRecordSetTarget(coursesRecordSet),
    getReferenceValues: (record) => [record.courseSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: classesRecordSet,
    field: "schoolSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: classesRecordSet,
    field: "termSourcedIds",
    target: rosteringRecordSetTarget(academicSessionsRecordSet),
    getReferenceValues: (record) => record.termSourcedIds,
  }),
  defineOneRosterCsvReferenceRule({
    source: usersRecordSet,
    field: "agentSourcedIds",
    target: rosteringRecordSetTarget(usersRecordSet),
    getReferenceValues: (record) => record.agentSourcedIds,
  }),
  defineOneRosterCsvReferenceRule({
    source: usersRecordSet,
    field: "primaryOrgSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.primaryOrgSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: rolesRecordSet,
    field: "userSourcedId",
    target: rosteringRecordSetTarget(usersRecordSet),
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: rolesRecordSet,
    field: "orgSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => [record.orgSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: rolesRecordSet,
    field: "userProfileSourcedId",
    target: rosteringRecordSetTarget(userProfilesRecordSet),
    getReferenceValues: (record) => optionalOneRosterCsvReference(record.userProfileSourcedId),
  }),
  defineOneRosterCsvReferenceRule({
    source: enrollmentsRecordSet,
    field: "classSourcedId",
    target: rosteringRecordSetTarget(classesRecordSet),
    getReferenceValues: (record) => [record.classSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: enrollmentsRecordSet,
    field: "schoolSourcedId",
    target: rosteringRecordSetTarget(orgsRecordSet),
    getReferenceValues: (record) => [record.schoolSourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: enrollmentsRecordSet,
    field: "userSourcedId",
    target: rosteringRecordSetTarget(usersRecordSet),
    getReferenceValues: (record) => [record.userSourcedId],
  }),
  // demographics.csv sourcedId must match a users.csv sourcedId (1:1 extension of user identity).
  defineOneRosterCsvReferenceRule({
    source: demographicsRecordSet,
    field: "sourcedId",
    target: rosteringRecordSetTarget(usersRecordSet),
    getReferenceValues: (record) => [record.sourcedId],
  }),
  defineOneRosterCsvReferenceRule({
    source: userProfilesRecordSet,
    field: "userSourcedId",
    target: rosteringRecordSetTarget(usersRecordSet),
    getReferenceValues: (record) => [record.userSourcedId],
  }),
];

/** Collect duplicate and reference validation diagnostics for typed rostering records. */
export function collectOneRosterCsvRosteringValidation(
  packageValue: OneRosterCsvRosteringPackage,
  options: OneRosterCsvReferenceValidationOptions = {},
): OneRosterCsvRosteringValidationState {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const indexes = buildRosteringReferenceIndexes(packageValue, diagnostics);
  const context: ReferenceValidationContext = {
    packageValue,
    indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
    isTargetFilePresent: (targetFileName) =>
      isManifestDataFilePresent(packageValue.rawPackage.manifest.fileModes, targetFileName),
  };

  validateOneRosterCsvReferences(ROSTERING_REFERENCE_RULES, context);

  return {
    indexes,
    diagnostics,
  };
}

/** Parse a OneRoster CSV ZIP archive and validate core rostering references. */
export function parseAndValidateOneRosterCsvRosteringZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions & OneRosterCsvReferenceValidationOptions = {},
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
  options: OneRosterCsvReferenceValidationOptions = {},
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
