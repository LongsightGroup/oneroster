import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";
import type { RosteringRowContext } from "./one-roster-csv-rostering-context.js";
import { validateRosteringHeader } from "./one-roster-csv-rostering-header.js";
import {
  parseAcademicSessionRecord,
  parseClassRecord,
  parseCourseRecord,
  parseEnrollmentRecord,
  parseOrgRecord,
  parseRoleRecord,
  parseUserRecord,
} from "./one-roster-csv-rostering-record-engine.js";
import {
  academicSessionHeaders,
  classHeaders,
  courseHeaders,
  enrollmentHeaders,
  orgHeaders,
  roleHeaders,
  userHeaders,
} from "./one-roster-csv-rostering-schema.js";
import type {
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringPackage,
} from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

export type {
  OneRosterAcademicSessionRecord,
  OneRosterAcademicSessionType,
  OneRosterClassRecord,
  OneRosterClassType,
  OneRosterCourseRecord,
  OneRosterCsvBulkLifecycle,
  OneRosterCsvDeltaLifecycle,
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringRecordBase,
  OneRosterCsvRowLifecycle,
  OneRosterEnrollmentRecord,
  OneRosterEnrollmentRole,
  OneRosterExtensionVocabularyToken,
  OneRosterOrgRecord,
  OneRosterOrgType,
  OneRosterRole,
  OneRosterRoleRecord,
  OneRosterRoleType,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

/** Parse a OneRoster CSV ZIP archive into typed core rostering records. */
export function parseOneRosterCsvRosteringZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const packageResult = parseOneRosterCsvZip(bytes, options);

  if (packageResult._tag === "err") {
    return err(packageResult.error);
  }

  return parseOneRosterCsvRosteringPackage(packageResult.value);
}

/** Parse an already-normalized OneRoster CSV package into typed core rostering records. */
export function parseOneRosterCsvRosteringPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];

  const academicSessions = parseRosteringTable(
    packageValue,
    "academicSessions.csv",
    academicSessionHeaders,
    parseAcademicSessionRecord,
    diagnostics,
  );
  const orgs = parseRosteringTable(
    packageValue,
    "orgs.csv",
    orgHeaders,
    parseOrgRecord,
    diagnostics,
  );
  const courses = parseRosteringTable(
    packageValue,
    "courses.csv",
    courseHeaders,
    parseCourseRecord,
    diagnostics,
  );
  const classes = parseRosteringTable(
    packageValue,
    "classes.csv",
    classHeaders,
    parseClassRecord,
    diagnostics,
  );
  const users = parseRosteringTable(
    packageValue,
    "users.csv",
    userHeaders,
    parseUserRecord,
    diagnostics,
  );
  const roles = parseRosteringTable(
    packageValue,
    "roles.csv",
    roleHeaders,
    parseRoleRecord,
    diagnostics,
  );
  const enrollments = parseRosteringTable(
    packageValue,
    "enrollments.csv",
    enrollmentHeaders,
    parseEnrollmentRecord,
    diagnostics,
  );

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    rawPackage: packageValue,
    academicSessions,
    orgs,
    courses,
    classes,
    users,
    roles,
    enrollments,
  });
}

function parseRosteringTable<TRecord>(
  packageValue: OneRosterCsvPackage,
  fileName: OneRosterCsvRosteringFileName,
  expectedHeaders: readonly string[],
  parseRecord: (context: RosteringRowContext) => TRecord | undefined,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyArray<TRecord> {
  const table = findTable(packageValue, fileName);

  if (table === undefined) {
    return [];
  }

  const metadataHeaders = validateRosteringHeader(table, expectedHeaders, diagnostics);

  if (metadataHeaders === undefined) {
    return [];
  }

  const records: TRecord[] = [];

  for (const row of table.rows) {
    const context: RosteringRowContext = {
      table,
      row,
      metadataHeaders,
      diagnostics,
    };
    const record = parseRecord(context);

    if (record !== undefined) {
      records.push(record);
    }
  }

  return records;
}

function findTable(
  packageValue: OneRosterCsvPackage,
  fileName: OneRosterCsvRosteringFileName,
): OneRosterCsvTable | undefined {
  for (const table of packageValue.tables) {
    if (table.fileName === fileName) {
      return table;
    }
  }

  return undefined;
}
