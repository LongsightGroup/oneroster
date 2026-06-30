import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
  defineOneRosterCsvRecordTable,
  parseOneRosterCsvRecordTable,
  type OneRosterCsvRecordSet,
  type OneRosterCsvRecordTableDefinition,
} from "./one-roster-csv-record-tables.js";
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

export type RosteringRecordSet<TRecord extends OneRosterCsvRosteringRecordBase> =
  OneRosterCsvRecordSet<
    OneRosterCsvRosteringPackage,
    OneRosterCsvRosteringReferenceIndexes,
    TRecord
  >;

type RosteringTableDefinition<TRecord extends OneRosterCsvRosteringRecordBase> =
  OneRosterCsvRecordTableDefinition<
    OneRosterCsvRosteringPackage,
    OneRosterCsvRosteringReferenceIndexes,
    TRecord
  >;

function defineRosteringTable<TRecord extends OneRosterCsvRosteringRecordBase>(
  definition: RosteringTableDefinition<TRecord>,
): RosteringTableDefinition<TRecord> {
  return defineOneRosterCsvRecordTable(definition);
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
    academicSessions: parseOneRosterCsvRecordTable(
      packageValue,
      academicSessionsTable,
      diagnostics,
    ),
    orgs: parseOneRosterCsvRecordTable(packageValue, orgsTable, diagnostics),
    courses: parseOneRosterCsvRecordTable(packageValue, coursesTable, diagnostics),
    classes: parseOneRosterCsvRecordTable(packageValue, classesTable, diagnostics),
    users: parseOneRosterCsvRecordTable(packageValue, usersTable, diagnostics),
    roles: parseOneRosterCsvRecordTable(packageValue, rolesTable, diagnostics),
    enrollments: parseOneRosterCsvRecordTable(packageValue, enrollmentsTable, diagnostics),
    demographics: parseOneRosterCsvRecordTable(packageValue, demographicsTable, diagnostics),
    userProfiles: parseOneRosterCsvRecordTable(packageValue, userProfilesTable, diagnostics),
  };
}

/** Build sourcedId lookup indexes for every registered rostering table. */
export function buildRosteringReferenceIndexes(
  packageValue: OneRosterCsvRosteringPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvRosteringReferenceIndexes {
  return {
    academicSessionsBySourcedId: buildOneRosterCsvRecordSetIndex(
      academicSessionsTable,
      packageValue,
      diagnostics,
    ),
    orgsBySourcedId: buildOneRosterCsvRecordSetIndex(orgsTable, packageValue, diagnostics),
    coursesBySourcedId: buildOneRosterCsvRecordSetIndex(coursesTable, packageValue, diagnostics),
    classesBySourcedId: buildOneRosterCsvRecordSetIndex(classesTable, packageValue, diagnostics),
    usersBySourcedId: buildOneRosterCsvRecordSetIndex(usersTable, packageValue, diagnostics),
    rolesBySourcedId: buildOneRosterCsvRecordSetIndex(rolesTable, packageValue, diagnostics),
    enrollmentsBySourcedId: buildOneRosterCsvRecordSetIndex(
      enrollmentsTable,
      packageValue,
      diagnostics,
    ),
    demographicsBySourcedId: buildOneRosterCsvRecordSetIndex(
      demographicsTable,
      packageValue,
      diagnostics,
    ),
    userProfilesBySourcedId: buildOneRosterCsvRecordSetIndex(
      userProfilesTable,
      packageValue,
      diagnostics,
    ),
  };
}
