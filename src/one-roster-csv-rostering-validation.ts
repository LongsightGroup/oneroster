import { parseOneRosterCsvRosteringZip } from "./one-roster-csv-rostering.js";
import type { OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
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
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringRecordBase,
  OneRosterCsvRosteringReferenceIndexes,
} from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";

/** Controls which row lifecycles participate in reference validation. */
export type OneRosterCsvReferenceValidationMode = "bulkOnly" | "allRows";

/** Options for semantic validation of typed OneRoster CSV rostering records. */
export type OneRosterCsvRosteringValidationOptions = {
  readonly referenceMode?: OneRosterCsvReferenceValidationMode;
};

/** OneRoster CSV rostering package that has passed duplicate and reference validation. */
export type OneRosterCsvValidatedRosteringPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly indexes: OneRosterCsvRosteringReferenceIndexes;
};

type ReferenceValidationContext = {
  readonly packageValue: OneRosterCsvRosteringPackage;
  readonly indexes: OneRosterCsvRosteringReferenceIndexes;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
};

type ReferenceRule = {
  readonly validate: (context: ReferenceValidationContext) => void;
};

function defineReferenceRule<TRecord extends OneRosterCsvRosteringRecordBase>(rule: {
  readonly source: RosteringRecordSet<TRecord>;
  readonly field: string;
  readonly target: RosteringRecordSet<OneRosterCsvRosteringRecordBase>;
  readonly getReferenceValues: (record: TRecord) => ReadonlyArray<OneRosterGuid>;
}): ReferenceRule {
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

        if (!isTargetFilePresent(context.packageValue, rule.target.fileName)) {
          addMissingTargetFileDiagnostic(
            context,
            record,
            rule.source.fileName,
            rule.field,
            rule.target.fileName,
          );
          continue;
        }

        const targetIndex = rule.target.getIndex(context.indexes);
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

const ROSTERING_REFERENCE_RULES: readonly ReferenceRule[] = [
  defineReferenceRule({
    source: academicSessionsRecordSet,
    field: "parentSourcedId",
    target: academicSessionsRecordSet,
    getReferenceValues: (record) => optionalReference(record.parentSourcedId),
  }),
  defineReferenceRule({
    source: orgsRecordSet,
    field: "parentSourcedId",
    target: orgsRecordSet,
    getReferenceValues: (record) => optionalReference(record.parentSourcedId),
  }),
  defineReferenceRule({
    source: coursesRecordSet,
    field: "schoolYearSourcedId",
    target: academicSessionsRecordSet,
    getReferenceValues: (record) => optionalReference(record.schoolYearSourcedId),
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
    getReferenceValues: (record) => optionalReference(record.primaryOrgSourcedId),
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
    getReferenceValues: (record) => optionalReference(record.userProfileSourcedId),
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
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const indexes = buildRosteringReferenceIndexes(packageValue, diagnostics);
  const context: ReferenceValidationContext = {
    packageValue,
    indexes,
    diagnostics,
    referenceMode: options.referenceMode ?? "bulkOnly",
  };

  validatePackageReferences(context);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    rosteringPackage: packageValue,
    indexes,
  });
}

function validatePackageReferences(context: ReferenceValidationContext): void {
  for (const rule of ROSTERING_REFERENCE_RULES) {
    rule.validate(context);
  }
}

function optionalReference(value: OneRosterGuid | undefined): ReadonlyArray<OneRosterGuid> {
  if (value === undefined) {
    return [];
  }

  return [value];
}

function shouldValidateReferences(
  context: ReferenceValidationContext,
  sourceRecord: OneRosterCsvRosteringRecordBase,
): boolean {
  return context.referenceMode === "allRows" || sourceRecord.lifecycle.mode === "bulk";
}

function isTargetFilePresent(
  packageValue: OneRosterCsvRosteringPackage,
  targetFileName: OneRosterCsvRosteringFileName,
): boolean {
  return packageValue.rawPackage.manifest.fileModes[targetFileName] !== "absent";
}

function addMissingTargetFileDiagnostic(
  context: ReferenceValidationContext,
  sourceRecord: OneRosterCsvRosteringRecordBase,
  sourceFileName: OneRosterCsvRosteringFileName,
  field: string,
  targetFileName: OneRosterCsvRosteringFileName,
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

function addMissingTargetRecordDiagnostic(
  context: ReferenceValidationContext,
  sourceRecord: OneRosterCsvRosteringRecordBase,
  sourceFileName: OneRosterCsvRosteringFileName,
  field: string,
  targetFileName: OneRosterCsvRosteringFileName,
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
