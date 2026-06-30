import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterManifest } from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
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

export type RosteringPackageRecords = Omit<OneRosterCsvRosteringPackage, "rawPackage" | "manifest">;

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

const academicSessionsTable = {
  fileName: "academicSessions.csv",
  headers: academicSessionHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.academicSessions,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.academicSessionsBySourcedId,
  parse: parseAcademicSessionRecord,
} satisfies RosteringTableDefinition<OneRosterAcademicSessionRecord>;

const orgsTable = {
  fileName: "orgs.csv",
  headers: orgHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.orgs,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.orgsBySourcedId,
  parse: parseOrgRecord,
} satisfies RosteringTableDefinition<OneRosterOrgRecord>;

const coursesTable = {
  fileName: "courses.csv",
  headers: courseHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.courses,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.coursesBySourcedId,
  parse: parseCourseRecord,
} satisfies RosteringTableDefinition<OneRosterCourseRecord>;

const classesTable = {
  fileName: "classes.csv",
  headers: classHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.classes,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.classesBySourcedId,
  parse: parseClassRecord,
} satisfies RosteringTableDefinition<OneRosterClassRecord>;

const usersTable = {
  fileName: "users.csv",
  headers: userHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.users,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.usersBySourcedId,
  parse: parseUserRecord,
} satisfies RosteringTableDefinition<OneRosterUserRecord>;

const rolesTable = {
  fileName: "roles.csv",
  headers: roleHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.roles,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.rolesBySourcedId,
  parse: parseRoleRecord,
} satisfies RosteringTableDefinition<OneRosterRoleRecord>;

const enrollmentsTable = {
  fileName: "enrollments.csv",
  headers: enrollmentHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.enrollments,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.enrollmentsBySourcedId,
  parse: parseEnrollmentRecord,
} satisfies RosteringTableDefinition<OneRosterEnrollmentRecord>;

const demographicsTable = {
  fileName: "demographics.csv",
  headers: demographicsHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.demographics,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.demographicsBySourcedId,
  parse: parseDemographicsRecord,
} satisfies RosteringTableDefinition<OneRosterDemographicsRecord>;

const userProfilesTable = {
  fileName: "userProfiles.csv",
  headers: userProfileHeaders,
  getRecords: (packageValue: OneRosterCsvRosteringPackage) => packageValue.userProfiles,
  getIndex: (indexes: OneRosterCsvRosteringReferenceIndexes) => indexes.userProfilesBySourcedId,
  parse: parseUserProfileRecord,
} satisfies RosteringTableDefinition<OneRosterUserProfileRecord>;

const rosteringRecordTables = {
  academicSessions: academicSessionsTable,
  orgs: orgsTable,
  courses: coursesTable,
  classes: classesTable,
  users: usersTable,
  roles: rolesTable,
  enrollments: enrollmentsTable,
  demographics: demographicsTable,
  userProfiles: userProfilesTable,
} as const;

const rosteringIndexTables = {
  academicSessionsBySourcedId: academicSessionsTable,
  orgsBySourcedId: orgsTable,
  coursesBySourcedId: coursesTable,
  classesBySourcedId: classesTable,
  usersBySourcedId: usersTable,
  rolesBySourcedId: rolesTable,
  enrollmentsBySourcedId: enrollmentsTable,
  demographicsBySourcedId: demographicsTable,
  userProfilesBySourcedId: userProfilesTable,
} as const;

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
      rosteringRecordTables.academicSessions,
      diagnostics,
    ),
    orgs: parseOneRosterCsvRecordTable(packageValue, rosteringRecordTables.orgs, diagnostics),
    courses: parseOneRosterCsvRecordTable(packageValue, rosteringRecordTables.courses, diagnostics),
    classes: parseOneRosterCsvRecordTable(packageValue, rosteringRecordTables.classes, diagnostics),
    users: parseOneRosterCsvRecordTable(packageValue, rosteringRecordTables.users, diagnostics),
    roles: parseOneRosterCsvRecordTable(packageValue, rosteringRecordTables.roles, diagnostics),
    enrollments: parseOneRosterCsvRecordTable(
      packageValue,
      rosteringRecordTables.enrollments,
      diagnostics,
    ),
    demographics: parseOneRosterCsvRecordTable(
      packageValue,
      rosteringRecordTables.demographics,
      diagnostics,
    ),
    userProfiles: parseOneRosterCsvRecordTable(
      packageValue,
      rosteringRecordTables.userProfiles,
      diagnostics,
    ),
  };
}

/** Build a typed rostering package from parsed records when diagnostics are clean. */
export function assembleOneRosterCsvRosteringPackage(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvRosteringPackage | undefined {
  const records = parseRosteringPackageRecords(packageValue, diagnostics);

  if (diagnostics.length > 0) {
    return undefined;
  }

  return {
    rawPackage: packageValue,
    manifest: packageValue.manifest,
    ...records,
  };
}

/** Build sourcedId lookup indexes for every registered rostering table. */
export function buildRosteringReferenceIndexes(
  packageValue: OneRosterCsvRosteringPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvRosteringReferenceIndexes {
  return {
    academicSessionsBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.academicSessionsBySourcedId,
      packageValue,
      diagnostics,
    ),
    orgsBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.orgsBySourcedId,
      packageValue,
      diagnostics,
    ),
    coursesBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.coursesBySourcedId,
      packageValue,
      diagnostics,
    ),
    classesBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.classesBySourcedId,
      packageValue,
      diagnostics,
    ),
    usersBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.usersBySourcedId,
      packageValue,
      diagnostics,
    ),
    rolesBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.rolesBySourcedId,
      packageValue,
      diagnostics,
    ),
    enrollmentsBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.enrollmentsBySourcedId,
      packageValue,
      diagnostics,
    ),
    demographicsBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.demographicsBySourcedId,
      packageValue,
      diagnostics,
    ),
    userProfilesBySourcedId: buildOneRosterCsvRecordSetIndex(
      rosteringIndexTables.userProfilesBySourcedId,
      packageValue,
      diagnostics,
    ),
  };
}

export type { OneRosterManifest };
