import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterGuid } from "./one-roster-csv-primitive.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";
import type { RosteringRowContext } from "./one-roster-csv-rostering-context.js";
import { validateRosteringHeader } from "./one-roster-csv-rostering-header.js";
import {
  parseAcademicSessionRecord,
  parseClassRecord,
  parseCourseRecord,
  parseDemographicsRecord,
  parseEnrollmentRecord,
  parseOrgRecord,
  parseRoleRecord,
  parseUserProfileRecord,
  parseUserRecord,
} from "./one-roster-csv-rostering-record-engine.js";
import {
  academicSessionHeaders,
  classHeaders,
  courseHeaders,
  demographicsHeaders,
  enrollmentHeaders,
  orgHeaders,
  roleHeaders,
  userProfileHeaders,
  userHeaders,
} from "./one-roster-csv-rostering-schema.js";
import type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringRecordBase,
  OneRosterCsvRosteringReferenceIndexes,
  OneRosterDemographicsRecord,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterRoleRecord,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

export type RosteringPackageRecords = Omit<OneRosterCsvRosteringPackage, "rawPackage">;

export type RosteringRecordSet<TRecord extends OneRosterCsvRosteringRecordBase> = {
  readonly fileName: OneRosterCsvRosteringFileName;
  readonly getRecords: (packageValue: OneRosterCsvRosteringPackage) => ReadonlyArray<TRecord>;
  readonly getIndex: (
    indexes: OneRosterCsvRosteringReferenceIndexes,
  ) => ReadonlyMap<OneRosterGuid, TRecord>;
};

type RosteringTableDefinition<TRecord extends OneRosterCsvRosteringRecordBase> = {
  readonly fileName: OneRosterCsvRosteringFileName;
  readonly headers: readonly string[];
  readonly getRecords: (packageValue: OneRosterCsvRosteringPackage) => ReadonlyArray<TRecord>;
  readonly getIndex: (
    indexes: OneRosterCsvRosteringReferenceIndexes,
  ) => ReadonlyMap<OneRosterGuid, TRecord>;
  readonly parse: (context: RosteringRowContext) => TRecord | undefined;
};

function defineRosteringTable<TRecord extends OneRosterCsvRosteringRecordBase>(
  definition: RosteringTableDefinition<TRecord>,
): RosteringTableDefinition<TRecord> {
  return definition;
}

const academicSessionsTable = defineRosteringTable<OneRosterAcademicSessionRecord>({
  fileName: "academicSessions.csv",
  headers: academicSessionHeaders,
  getRecords: (packageValue) => packageValue.academicSessions,
  getIndex: (indexes) => indexes.academicSessionsBySourcedId,
  parse: parseAcademicSessionRecord,
});

const orgsTable = defineRosteringTable<OneRosterOrgRecord>({
  fileName: "orgs.csv",
  headers: orgHeaders,
  getRecords: (packageValue) => packageValue.orgs,
  getIndex: (indexes) => indexes.orgsBySourcedId,
  parse: parseOrgRecord,
});

const coursesTable = defineRosteringTable<OneRosterCourseRecord>({
  fileName: "courses.csv",
  headers: courseHeaders,
  getRecords: (packageValue) => packageValue.courses,
  getIndex: (indexes) => indexes.coursesBySourcedId,
  parse: parseCourseRecord,
});

const classesTable = defineRosteringTable<OneRosterClassRecord>({
  fileName: "classes.csv",
  headers: classHeaders,
  getRecords: (packageValue) => packageValue.classes,
  getIndex: (indexes) => indexes.classesBySourcedId,
  parse: parseClassRecord,
});

const usersTable = defineRosteringTable<OneRosterUserRecord>({
  fileName: "users.csv",
  headers: userHeaders,
  getRecords: (packageValue) => packageValue.users,
  getIndex: (indexes) => indexes.usersBySourcedId,
  parse: parseUserRecord,
});

const rolesTable = defineRosteringTable<OneRosterRoleRecord>({
  fileName: "roles.csv",
  headers: roleHeaders,
  getRecords: (packageValue) => packageValue.roles,
  getIndex: (indexes) => indexes.rolesBySourcedId,
  parse: parseRoleRecord,
});

const enrollmentsTable = defineRosteringTable<OneRosterEnrollmentRecord>({
  fileName: "enrollments.csv",
  headers: enrollmentHeaders,
  getRecords: (packageValue) => packageValue.enrollments,
  getIndex: (indexes) => indexes.enrollmentsBySourcedId,
  parse: parseEnrollmentRecord,
});

const demographicsTable = defineRosteringTable<OneRosterDemographicsRecord>({
  fileName: "demographics.csv",
  headers: demographicsHeaders,
  getRecords: (packageValue) => packageValue.demographics,
  getIndex: (indexes) => indexes.demographicsBySourcedId,
  parse: parseDemographicsRecord,
});

const userProfilesTable = defineRosteringTable<OneRosterUserProfileRecord>({
  fileName: "userProfiles.csv",
  headers: userProfileHeaders,
  getRecords: (packageValue) => packageValue.userProfiles,
  getIndex: (indexes) => indexes.userProfilesBySourcedId,
  parse: parseUserProfileRecord,
});

export const academicSessionsRecordSet: RosteringRecordSet<OneRosterAcademicSessionRecord> =
  academicSessionsTable;
export const orgsRecordSet: RosteringRecordSet<OneRosterOrgRecord> = orgsTable;
export const coursesRecordSet: RosteringRecordSet<OneRosterCourseRecord> = coursesTable;
export const classesRecordSet: RosteringRecordSet<OneRosterClassRecord> = classesTable;
export const usersRecordSet: RosteringRecordSet<OneRosterUserRecord> = usersTable;
export const rolesRecordSet: RosteringRecordSet<OneRosterRoleRecord> = rolesTable;
export const enrollmentsRecordSet: RosteringRecordSet<OneRosterEnrollmentRecord> = enrollmentsTable;
export const demographicsRecordSet: RosteringRecordSet<OneRosterDemographicsRecord> =
  demographicsTable;
export const userProfilesRecordSet: RosteringRecordSet<OneRosterUserProfileRecord> =
  userProfilesTable;

/** Parse every registered rostering table from a normalized CSV package. */
export function parseRosteringPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): RosteringPackageRecords {
  return {
    academicSessions: parseRosteringTable(
      packageValue,
      academicSessionsTable.fileName,
      academicSessionsTable.headers,
      academicSessionsTable.parse,
      diagnostics,
    ),
    orgs: parseRosteringTable(
      packageValue,
      orgsTable.fileName,
      orgsTable.headers,
      orgsTable.parse,
      diagnostics,
    ),
    courses: parseRosteringTable(
      packageValue,
      coursesTable.fileName,
      coursesTable.headers,
      coursesTable.parse,
      diagnostics,
    ),
    classes: parseRosteringTable(
      packageValue,
      classesTable.fileName,
      classesTable.headers,
      classesTable.parse,
      diagnostics,
    ),
    users: parseRosteringTable(
      packageValue,
      usersTable.fileName,
      usersTable.headers,
      usersTable.parse,
      diagnostics,
    ),
    roles: parseRosteringTable(
      packageValue,
      rolesTable.fileName,
      rolesTable.headers,
      rolesTable.parse,
      diagnostics,
    ),
    enrollments: parseRosteringTable(
      packageValue,
      enrollmentsTable.fileName,
      enrollmentsTable.headers,
      enrollmentsTable.parse,
      diagnostics,
    ),
    demographics: parseRosteringTable(
      packageValue,
      demographicsTable.fileName,
      demographicsTable.headers,
      demographicsTable.parse,
      diagnostics,
    ),
    userProfiles: parseRosteringTable(
      packageValue,
      userProfilesTable.fileName,
      userProfilesTable.headers,
      userProfilesTable.parse,
      diagnostics,
    ),
  };
}

/** Build sourcedId lookup indexes for every registered rostering table. */
export function buildRosteringReferenceIndexes(
  packageValue: OneRosterCsvRosteringPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvRosteringReferenceIndexes {
  return {
    academicSessionsBySourcedId: buildRecordSetIndex(
      academicSessionsTable,
      packageValue,
      diagnostics,
    ),
    orgsBySourcedId: buildRecordSetIndex(orgsTable, packageValue, diagnostics),
    coursesBySourcedId: buildRecordSetIndex(coursesTable, packageValue, diagnostics),
    classesBySourcedId: buildRecordSetIndex(classesTable, packageValue, diagnostics),
    usersBySourcedId: buildRecordSetIndex(usersTable, packageValue, diagnostics),
    rolesBySourcedId: buildRecordSetIndex(rolesTable, packageValue, diagnostics),
    enrollmentsBySourcedId: buildRecordSetIndex(enrollmentsTable, packageValue, diagnostics),
    demographicsBySourcedId: buildRecordSetIndex(demographicsTable, packageValue, diagnostics),
    userProfilesBySourcedId: buildRecordSetIndex(userProfilesTable, packageValue, diagnostics),
  };
}

function buildRecordSetIndex<TRecord extends OneRosterCsvRosteringRecordBase>(
  recordSet: RosteringRecordSet<TRecord>,
  packageValue: OneRosterCsvRosteringPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyMap<OneRosterGuid, TRecord> {
  const index = new Map<OneRosterGuid, TRecord>();

  for (const record of recordSet.getRecords(packageValue)) {
    if (index.has(record.sourcedId)) {
      diagnostics.push(
        packageDiagnostic({
          code: "reference.duplicate_sourced_id",
          message: "OneRoster sourcedId values must be unique within a CSV file.",
          fileName: recordSet.fileName,
          rowNumber: record.rowNumber,
          field: "sourcedId",
          expected: "unique sourcedId",
          actual: "duplicate",
        }),
      );
      continue;
    }

    index.set(record.sourcedId, record);
  }

  return index;
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
