import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterDate, OneRosterGuid, OneRosterYear } from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvRecordBase,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-record-types.js";

export type {
  OneRosterCsvBulkLifecycle,
  OneRosterCsvDeltaLifecycle,
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordBase,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRowLifecycle,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-record-types.js";

/** OneRoster 1.2 CSV rostering files supported by the typed row parser. */
export type OneRosterCsvRosteringFileName =
  | "academicSessions.csv"
  | "orgs.csv"
  | "courses.csv"
  | "classes.csv"
  | "users.csv"
  | "roles.csv"
  | "enrollments.csv"
  | "demographics.csv"
  | "userProfiles.csv";

/** Common fields shared by typed OneRoster CSV rostering records. */
export type OneRosterCsvRosteringRecordBase = OneRosterCsvRecordBase;

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

/** OneRoster demographics.csv sex values. */
export type OneRosterDemographicsSex =
  | "male"
  | "female"
  | "unspecified"
  | "other"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster demographics.csv record. */
export type OneRosterDemographicsRecord = OneRosterCsvRosteringRecordBase & {
  readonly birthDate: OneRosterDate | undefined;
  readonly sex: OneRosterDemographicsSex | undefined;
  readonly americanIndianOrAlaskaNative: boolean | undefined;
  readonly asian: boolean | undefined;
  readonly blackOrAfricanAmerican: boolean | undefined;
  readonly nativeHawaiianOrOtherPacificIslander: boolean | undefined;
  readonly white: boolean | undefined;
  readonly demographicRaceTwoOrMoreRaces: boolean | undefined;
  readonly hispanicOrLatinoEthnicity: boolean | undefined;
  readonly countryOfBirthCode: string | undefined;
  readonly stateOfBirthAbbreviation: string | undefined;
  readonly cityOfBirth: string | undefined;
  readonly publicSchoolResidenceStatus: string | undefined;
};

/** Typed OneRoster userProfiles.csv record. */
export type OneRosterUserProfileRecord = OneRosterCsvRosteringRecordBase & {
  readonly userSourcedId: OneRosterGuid;
  /** Vendor-defined profile type string from userProfiles.csv. */
  readonly profileType: string;
  readonly vendorId: string;
  readonly applicationId: string | undefined;
  readonly description: string | undefined;
  /** Vendor-defined credential type string from userProfiles.csv. */
  readonly credentialType: string;
  readonly username: string;
  readonly password: string | undefined;
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
  readonly demographics: ReadonlyArray<OneRosterDemographicsRecord>;
  readonly userProfiles: ReadonlyArray<OneRosterUserProfileRecord>;
};

/** Lookup indexes for typed OneRoster CSV rostering records keyed by sourcedId. */
export type OneRosterCsvRosteringReferenceIndexes = {
  readonly academicSessionsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterAcademicSessionRecord>;
  readonly orgsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterOrgRecord>;
  readonly coursesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterCourseRecord>;
  readonly classesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterClassRecord>;
  readonly usersBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterUserRecord>;
  readonly rolesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterRoleRecord>;
  readonly enrollmentsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterEnrollmentRecord>;
  readonly demographicsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterDemographicsRecord>;
  readonly userProfilesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterUserProfileRecord>;
};
