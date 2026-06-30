import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type {
  OneRosterDate,
  OneRosterDateTime,
  OneRosterGuid,
  OneRosterYear,
} from "./one-roster-csv-primitive.js";

/** OneRoster 1.2 CSV rostering files supported by the typed row parser. */
export type OneRosterCsvRosteringFileName =
  | "academicSessions.csv"
  | "orgs.csv"
  | "courses.csv"
  | "classes.csv"
  | "users.csv"
  | "roles.csv"
  | "enrollments.csv";

/** OneRoster extension vocabulary token accepted only on spec-allowed fields. */
export type OneRosterExtensionVocabularyToken = `ext:${string}`;

/** Delta lifecycle status values allowed by the OneRoster CSV binding. */
export type OneRosterCsvDeltaStatus = "active" | "tobedeleted";

/** Row lifecycle for a bulk CSV table. */
export type OneRosterCsvBulkLifecycle = {
  readonly mode: "bulk";
};

/** Row lifecycle for a delta CSV table. */
export type OneRosterCsvDeltaLifecycle = {
  readonly mode: "delta";
  readonly status: OneRosterCsvDeltaStatus;
  readonly dateLastModified: OneRosterDateTime;
};

/** Row lifecycle normalized from the table manifest mode and lifecycle columns. */
export type OneRosterCsvRowLifecycle = OneRosterCsvBulkLifecycle | OneRosterCsvDeltaLifecycle;

/** Metadata extension column values carried by a typed OneRoster CSV record. */
export type OneRosterCsvRecordMetadata = Readonly<Record<string, string>>;

/** Common fields shared by typed OneRoster CSV rostering records. */
export type OneRosterCsvRosteringRecordBase = {
  readonly rowNumber: number;
  readonly sourcedId: OneRosterGuid;
  readonly lifecycle: OneRosterCsvRowLifecycle;
  readonly metadata: OneRosterCsvRecordMetadata;
};

/** OneRoster academicSessions.csv type values. */
export type OneRosterAcademicSessionType =
  | "gradingPeriod"
  | "semester"
  | "schoolYear"
  | "term"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster academicSessions.csv record. */
export type OneRosterAcademicSessionRecord = OneRosterCsvRosteringRecordBase & {
  readonly title: string;
  readonly type: OneRosterAcademicSessionType;
  readonly startDate: OneRosterDate;
  readonly endDate: OneRosterDate;
  readonly parentSourcedId: OneRosterGuid | undefined;
  readonly schoolYear: OneRosterYear;
};

/** OneRoster orgs.csv type values. */
export type OneRosterOrgType =
  | "department"
  | "school"
  | "district"
  | "local"
  | "state"
  | "national"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster orgs.csv record. */
export type OneRosterOrgRecord = OneRosterCsvRosteringRecordBase & {
  readonly name: string;
  readonly type: OneRosterOrgType;
  readonly identifier: string | undefined;
  readonly parentSourcedId: OneRosterGuid | undefined;
};

/** Typed OneRoster courses.csv record. */
export type OneRosterCourseRecord = OneRosterCsvRosteringRecordBase & {
  readonly schoolYearSourcedId: OneRosterGuid | undefined;
  readonly title: string;
  readonly courseCode: string | undefined;
  readonly grades: ReadonlyArray<string>;
  readonly orgSourcedId: OneRosterGuid;
  readonly subjects: ReadonlyArray<string>;
  readonly subjectCodes: ReadonlyArray<string>;
};

/** OneRoster classes.csv classType values. */
export type OneRosterClassType = "homeroom" | "scheduled" | OneRosterExtensionVocabularyToken;

/** Typed OneRoster classes.csv record. */
export type OneRosterClassRecord = OneRosterCsvRosteringRecordBase & {
  readonly title: string;
  readonly grades: ReadonlyArray<string>;
  readonly courseSourcedId: OneRosterGuid;
  readonly classCode: string | undefined;
  readonly classType: OneRosterClassType;
  readonly location: string | undefined;
  readonly schoolSourcedId: OneRosterGuid;
  readonly termSourcedIds: ReadonlyArray<OneRosterGuid>;
  readonly subjects: ReadonlyArray<string>;
  readonly subjectCodes: ReadonlyArray<string>;
  readonly periods: ReadonlyArray<string>;
};

/** Typed OneRoster users.csv record. */
export type OneRosterUserRecord = OneRosterCsvRosteringRecordBase & {
  readonly enabledUser: boolean;
  readonly username: string;
  readonly userIds: ReadonlyArray<string>;
  readonly givenName: string;
  readonly familyName: string;
  readonly middleName: string | undefined;
  readonly identifier: string | undefined;
  readonly email: string | undefined;
  readonly sms: string | undefined;
  readonly phone: string | undefined;
  readonly agentSourcedIds: ReadonlyArray<OneRosterGuid>;
  readonly grades: ReadonlyArray<string>;
  readonly password: string | undefined;
  readonly userMasterIdentifier: string | undefined;
  readonly preferredGivenName: string | undefined;
  readonly preferredMiddleName: string | undefined;
  readonly preferredFamilyName: string | undefined;
  readonly primaryOrgSourcedId: OneRosterGuid | undefined;
  readonly pronouns: string | undefined;
};

/** OneRoster roles.csv roleType values. */
export type OneRosterRoleType = "primary" | "secondary";

/** OneRoster roles.csv role values. */
export type OneRosterRole =
  | "aide"
  | "counselor"
  | "districtAdministrator"
  | "guardian"
  | "parent"
  | "principal"
  | "proctor"
  | "relative"
  | "siteAdministrator"
  | "student"
  | "systemAdministrator"
  | "teacher"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster roles.csv record. */
export type OneRosterRoleRecord = OneRosterCsvRosteringRecordBase & {
  readonly userSourcedId: OneRosterGuid;
  readonly roleType: OneRosterRoleType;
  readonly role: OneRosterRole;
  readonly beginDate: OneRosterDate | undefined;
  readonly endDate: OneRosterDate | undefined;
  readonly orgSourcedId: OneRosterGuid;
  readonly userProfileSourcedId: OneRosterGuid | undefined;
};

/** OneRoster enrollments.csv role values. */
export type OneRosterEnrollmentRole =
  | "administrator"
  | "proctor"
  | "student"
  | "teacher"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster enrollments.csv record. */
export type OneRosterEnrollmentRecord = OneRosterCsvRosteringRecordBase & {
  readonly classSourcedId: OneRosterGuid;
  readonly schoolSourcedId: OneRosterGuid;
  readonly userSourcedId: OneRosterGuid;
  readonly role: OneRosterEnrollmentRole;
  readonly primary: boolean | undefined;
  readonly beginDate: OneRosterDate | undefined;
  readonly endDate: OneRosterDate | undefined;
};

/** Typed OneRoster CSV rostering package over the raw normalized package. */
export type OneRosterCsvRosteringPackage = {
  readonly rawPackage: OneRosterCsvPackage;
  readonly academicSessions: ReadonlyArray<OneRosterAcademicSessionRecord>;
  readonly orgs: ReadonlyArray<OneRosterOrgRecord>;
  readonly courses: ReadonlyArray<OneRosterCourseRecord>;
  readonly classes: ReadonlyArray<OneRosterClassRecord>;
  readonly users: ReadonlyArray<OneRosterUserRecord>;
  readonly roles: ReadonlyArray<OneRosterRoleRecord>;
  readonly enrollments: ReadonlyArray<OneRosterEnrollmentRecord>;
};
