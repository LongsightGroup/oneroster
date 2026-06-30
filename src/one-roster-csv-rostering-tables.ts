import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterManifest } from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  defineProfileTables,
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

const rosteringProfileTables = defineProfileTables<
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringReferenceIndexes,
  {
    readonly academicSessions: RosteringTableDefinition<OneRosterAcademicSessionRecord>;
    readonly orgs: RosteringTableDefinition<OneRosterOrgRecord>;
    readonly courses: RosteringTableDefinition<OneRosterCourseRecord>;
    readonly classes: RosteringTableDefinition<OneRosterClassRecord>;
    readonly users: RosteringTableDefinition<OneRosterUserRecord>;
    readonly roles: RosteringTableDefinition<OneRosterRoleRecord>;
    readonly enrollments: RosteringTableDefinition<OneRosterEnrollmentRecord>;
    readonly demographics: RosteringTableDefinition<OneRosterDemographicsRecord>;
    readonly userProfiles: RosteringTableDefinition<OneRosterUserProfileRecord>;
  }
>({
  academicSessions: {
    fileName: "academicSessions.csv",
    headers: academicSessionHeaders,
    getRecords: (packageValue) => packageValue.academicSessions,
    getIndex: (indexes) => indexes.academicSessionsBySourcedId,
    parse: parseAcademicSessionRecord,
  },
  orgs: {
    fileName: "orgs.csv",
    headers: orgHeaders,
    getRecords: (packageValue) => packageValue.orgs,
    getIndex: (indexes) => indexes.orgsBySourcedId,
    parse: parseOrgRecord,
  },
  courses: {
    fileName: "courses.csv",
    headers: courseHeaders,
    getRecords: (packageValue) => packageValue.courses,
    getIndex: (indexes) => indexes.coursesBySourcedId,
    parse: parseCourseRecord,
  },
  classes: {
    fileName: "classes.csv",
    headers: classHeaders,
    getRecords: (packageValue) => packageValue.classes,
    getIndex: (indexes) => indexes.classesBySourcedId,
    parse: parseClassRecord,
  },
  users: {
    fileName: "users.csv",
    headers: userHeaders,
    getRecords: (packageValue) => packageValue.users,
    getIndex: (indexes) => indexes.usersBySourcedId,
    parse: parseUserRecord,
  },
  roles: {
    fileName: "roles.csv",
    headers: roleHeaders,
    getRecords: (packageValue) => packageValue.roles,
    getIndex: (indexes) => indexes.rolesBySourcedId,
    parse: parseRoleRecord,
  },
  enrollments: {
    fileName: "enrollments.csv",
    headers: enrollmentHeaders,
    getRecords: (packageValue) => packageValue.enrollments,
    getIndex: (indexes) => indexes.enrollmentsBySourcedId,
    parse: parseEnrollmentRecord,
  },
  demographics: {
    fileName: "demographics.csv",
    headers: demographicsHeaders,
    getRecords: (packageValue) => packageValue.demographics,
    getIndex: (indexes) => indexes.demographicsBySourcedId,
    parse: parseDemographicsRecord,
  },
  userProfiles: {
    fileName: "userProfiles.csv",
    headers: userProfileHeaders,
    getRecords: (packageValue) => packageValue.userProfiles,
    getIndex: (indexes) => indexes.userProfilesBySourcedId,
    parse: parseUserProfileRecord,
  },
});

export const academicSessionsRecordSet: RosteringRecordSet<OneRosterAcademicSessionRecord> =
  rosteringProfileTables.tables.academicSessions;
export const orgsRecordSet: RosteringRecordSet<OneRosterOrgRecord> =
  rosteringProfileTables.tables.orgs;
export const coursesRecordSet: RosteringRecordSet<OneRosterCourseRecord> =
  rosteringProfileTables.tables.courses;
export const classesRecordSet: RosteringRecordSet<OneRosterClassRecord> =
  rosteringProfileTables.tables.classes;
export const usersRecordSet: RosteringRecordSet<OneRosterUserRecord> =
  rosteringProfileTables.tables.users;
export const rolesRecordSet: RosteringRecordSet<OneRosterRoleRecord> =
  rosteringProfileTables.tables.roles;
export const enrollmentsRecordSet: RosteringRecordSet<OneRosterEnrollmentRecord> =
  rosteringProfileTables.tables.enrollments;
export const demographicsRecordSet: RosteringRecordSet<OneRosterDemographicsRecord> =
  rosteringProfileTables.tables.demographics;
export const userProfilesRecordSet: RosteringRecordSet<OneRosterUserProfileRecord> =
  rosteringProfileTables.tables.userProfiles;

/** Parse every registered rostering table from a normalized CSV package. */
export function parseRosteringPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): RosteringPackageRecords {
  return rosteringProfileTables.parsePackageRecords(packageValue, diagnostics);
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
  return rosteringProfileTables.buildReferenceIndexes(packageValue, diagnostics);
}

export type { OneRosterManifest };
