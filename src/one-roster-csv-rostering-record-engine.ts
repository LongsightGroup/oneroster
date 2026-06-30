import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseBooleanField,
  parseDateField,
  parseGuidField,
  parseGuidListField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseStringListField,
  parseVocabularyField,
  parseYearField,
} from "./one-roster-csv-record-field-parsers.js";
import { parseCommonRecordFields } from "./one-roster-csv-record-lifecycle.js";
import { commonRecordCells, listCell, optionalCell } from "./one-roster-csv-record-cell-write.js";
import { parseOneRosterCsvRecordRow } from "./one-roster-csv-record-row.js";
import {
  academicSessionTypeValues,
  classTypeValues,
  demographicsSexValues,
  enrollmentRoleValues,
  orgTypeValues,
  roleTypeValues,
  roleValues,
} from "./one-roster-csv-rostering-schema.js";
import type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterDemographicsRecord,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterRoleRecord,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";

/** Parse one academicSessions.csv row into a typed OneRoster record. */
export function parseAcademicSessionRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterAcademicSessionRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseRequiredStringField(context, "title"),
      type: parseVocabularyField(context, "type", "required", academicSessionTypeValues, true),
      startDate: parseDateField(context, "startDate", "required"),
      endDate: parseDateField(context, "endDate", "required"),
      parentSourcedId: parseGuidField(context, "parentSourcedId", "optional"),
      schoolYear: parseYearField(context, "schoolYear", "required"),
    },
    ["common", "title", "type", "startDate", "endDate", "schoolYear"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      type: fields.type,
      startDate: fields.startDate,
      endDate: fields.endDate,
      parentSourcedId: fields.parentSourcedId,
      schoolYear: fields.schoolYear,
    }),
  );
}

/** Parse one orgs.csv row into a typed OneRoster record. */
export function parseOrgRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterOrgRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      name: parseRequiredStringField(context, "name"),
      type: parseVocabularyField(context, "type", "required", orgTypeValues, true),
      identifier: parseOptionalStringField(context, "identifier"),
      parentSourcedId: parseGuidField(context, "parentSourcedId", "optional"),
    },
    ["common", "name", "type"],
    (fields) => ({
      ...fields.common,
      name: fields.name,
      type: fields.type,
      identifier: fields.identifier,
      parentSourcedId: fields.parentSourcedId,
    }),
  );
}

/** Parse one courses.csv row into a typed OneRoster record. */
export function parseCourseRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterCourseRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      schoolYearSourcedId: parseGuidField(context, "schoolYearSourcedId", "optional"),
      title: parseRequiredStringField(context, "title"),
      courseCode: parseOptionalStringField(context, "courseCode"),
      grades: parseStringListField(context, "grades", "optional"),
      orgSourcedId: parseGuidField(context, "orgSourcedId", "required"),
      subjects: parseStringListField(context, "subjects", "optional"),
      subjectCodes: parseStringListField(context, "subjectCodes", "optional"),
    },
    ["common", "title", "orgSourcedId"],
    (fields) => ({
      ...fields.common,
      schoolYearSourcedId: fields.schoolYearSourcedId,
      title: fields.title,
      courseCode: fields.courseCode,
      grades: fields.grades,
      orgSourcedId: fields.orgSourcedId,
      subjects: fields.subjects,
      subjectCodes: fields.subjectCodes,
    }),
  );
}

/** Parse one classes.csv row into a typed OneRoster record. */
export function parseClassRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterClassRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseRequiredStringField(context, "title"),
      grades: parseStringListField(context, "grades", "optional"),
      courseSourcedId: parseGuidField(context, "courseSourcedId", "required"),
      classCode: parseOptionalStringField(context, "classCode"),
      classType: parseVocabularyField(context, "classType", "required", classTypeValues, true),
      location: parseOptionalStringField(context, "location"),
      schoolSourcedId: parseGuidField(context, "schoolSourcedId", "required"),
      termSourcedIds: parseGuidListField(context, "termSourcedIds", "required"),
      subjects: parseStringListField(context, "subjects", "optional"),
      subjectCodes: parseStringListField(context, "subjectCodes", "optional"),
      periods: parseStringListField(context, "periods", "optional"),
    },
    ["common", "title", "courseSourcedId", "classType", "schoolSourcedId", "termSourcedIds"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      grades: fields.grades,
      courseSourcedId: fields.courseSourcedId,
      classCode: fields.classCode,
      classType: fields.classType,
      location: fields.location,
      schoolSourcedId: fields.schoolSourcedId,
      termSourcedIds: fields.termSourcedIds,
      subjects: fields.subjects,
      subjectCodes: fields.subjectCodes,
      periods: fields.periods,
    }),
  );
}

/** Parse one users.csv row into a typed OneRoster record. */
export function parseUserRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      enabledUser: parseBooleanField(context, "enabledUser", "required"),
      username: parseRequiredStringField(context, "username"),
      userIds: parseStringListField(context, "userIds", "optional"),
      givenName: parseRequiredStringField(context, "givenName"),
      familyName: parseRequiredStringField(context, "familyName"),
      middleName: parseOptionalStringField(context, "middleName"),
      identifier: parseOptionalStringField(context, "identifier"),
      email: parseOptionalStringField(context, "email"),
      sms: parseOptionalStringField(context, "sms"),
      phone: parseOptionalStringField(context, "phone"),
      agentSourcedIds: parseGuidListField(context, "agentSourcedIds", "optional"),
      grades: parseStringListField(context, "grades", "optional"),
      password: parseOptionalStringField(context, "password"),
      userMasterIdentifier: parseOptionalStringField(context, "userMasterIdentifier"),
      preferredGivenName: parseOptionalStringField(context, "preferredGivenName"),
      preferredMiddleName: parseOptionalStringField(context, "preferredMiddleName"),
      preferredFamilyName: parseOptionalStringField(context, "preferredFamilyName"),
      primaryOrgSourcedId: parseGuidField(context, "primaryOrgSourcedId", "optional"),
      pronouns: parseOptionalStringField(context, "pronouns"),
    },
    ["common", "enabledUser", "username", "givenName", "familyName"],
    (fields) => ({
      ...fields.common,
      enabledUser: fields.enabledUser,
      username: fields.username,
      userIds: fields.userIds,
      givenName: fields.givenName,
      familyName: fields.familyName,
      middleName: fields.middleName,
      identifier: fields.identifier,
      email: fields.email,
      sms: fields.sms,
      phone: fields.phone,
      agentSourcedIds: fields.agentSourcedIds,
      grades: fields.grades,
      password: fields.password,
      userMasterIdentifier: fields.userMasterIdentifier,
      preferredGivenName: fields.preferredGivenName,
      preferredMiddleName: fields.preferredMiddleName,
      preferredFamilyName: fields.preferredFamilyName,
      primaryOrgSourcedId: fields.primaryOrgSourcedId,
      pronouns: fields.pronouns,
    }),
  );
}

/** Parse one roles.csv row into a typed OneRoster record. */
export function parseRoleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterRoleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      userSourcedId: parseGuidField(context, "userSourcedId", "required"),
      roleType: parseVocabularyField(context, "roleType", "required", roleTypeValues, false),
      role: parseVocabularyField(context, "role", "required", roleValues, true),
      beginDate: parseDateField(context, "beginDate", "optional"),
      endDate: parseDateField(context, "endDate", "optional"),
      orgSourcedId: parseGuidField(context, "orgSourcedId", "required"),
      userProfileSourcedId: parseGuidField(context, "userProfileSourcedId", "optional"),
    },
    ["common", "userSourcedId", "roleType", "role", "orgSourcedId"],
    (fields) => ({
      ...fields.common,
      userSourcedId: fields.userSourcedId,
      roleType: fields.roleType,
      role: fields.role,
      beginDate: fields.beginDate,
      endDate: fields.endDate,
      orgSourcedId: fields.orgSourcedId,
      userProfileSourcedId: fields.userProfileSourcedId,
    }),
  );
}

/** Parse one enrollments.csv row into a typed OneRoster record. */
export function parseEnrollmentRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterEnrollmentRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      classSourcedId: parseGuidField(context, "classSourcedId", "required"),
      schoolSourcedId: parseGuidField(context, "schoolSourcedId", "required"),
      userSourcedId: parseGuidField(context, "userSourcedId", "required"),
      role: parseVocabularyField(context, "role", "required", enrollmentRoleValues, true),
      primary: parseBooleanField(context, "primary", "optional"),
      beginDate: parseDateField(context, "beginDate", "optional"),
      endDate: parseDateField(context, "endDate", "optional"),
    },
    ["common", "classSourcedId", "schoolSourcedId", "userSourcedId", "role"],
    (fields) => ({
      ...fields.common,
      classSourcedId: fields.classSourcedId,
      schoolSourcedId: fields.schoolSourcedId,
      userSourcedId: fields.userSourcedId,
      role: fields.role,
      primary: fields.primary,
      beginDate: fields.beginDate,
      endDate: fields.endDate,
    }),
  );
}

/** Parse one demographics.csv row into a typed OneRoster record. */
export function parseDemographicsRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterDemographicsRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      birthDate: parseDateField(context, "birthDate", "optional"),
      sex: parseVocabularyField(context, "sex", "optional", demographicsSexValues, true),
      americanIndianOrAlaskaNative: parseBooleanField(
        context,
        "americanIndianOrAlaskaNative",
        "optional",
      ),
      asian: parseBooleanField(context, "asian", "optional"),
      blackOrAfricanAmerican: parseBooleanField(context, "blackOrAfricanAmerican", "optional"),
      nativeHawaiianOrOtherPacificIslander: parseBooleanField(
        context,
        "nativeHawaiianOrOtherPacificIslander",
        "optional",
      ),
      white: parseBooleanField(context, "white", "optional"),
      demographicRaceTwoOrMoreRaces: parseBooleanField(
        context,
        "demographicRaceTwoOrMoreRaces",
        "optional",
      ),
      hispanicOrLatinoEthnicity: parseBooleanField(
        context,
        "hispanicOrLatinoEthnicity",
        "optional",
      ),
      countryOfBirthCode: parseOptionalStringField(context, "countryOfBirthCode"),
      stateOfBirthAbbreviation: parseOptionalStringField(context, "stateOfBirthAbbreviation"),
      cityOfBirth: parseOptionalStringField(context, "cityOfBirth"),
      publicSchoolResidenceStatus: parseOptionalStringField(context, "publicSchoolResidenceStatus"),
    },
    ["common"],
    (fields) => ({
      ...fields.common,
      birthDate: fields.birthDate,
      sex: fields.sex,
      americanIndianOrAlaskaNative: fields.americanIndianOrAlaskaNative,
      asian: fields.asian,
      blackOrAfricanAmerican: fields.blackOrAfricanAmerican,
      nativeHawaiianOrOtherPacificIslander: fields.nativeHawaiianOrOtherPacificIslander,
      white: fields.white,
      demographicRaceTwoOrMoreRaces: fields.demographicRaceTwoOrMoreRaces,
      hispanicOrLatinoEthnicity: fields.hispanicOrLatinoEthnicity,
      countryOfBirthCode: fields.countryOfBirthCode,
      stateOfBirthAbbreviation: fields.stateOfBirthAbbreviation,
      cityOfBirth: fields.cityOfBirth,
      publicSchoolResidenceStatus: fields.publicSchoolResidenceStatus,
    }),
  );
}

/** Parse one userProfiles.csv row into a typed OneRoster record. */
export function parseUserProfileRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserProfileRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      userSourcedId: parseGuidField(context, "userSourcedId", "required"),
      profileType: parseRequiredStringField(context, "profileType"),
      vendorId: parseRequiredStringField(context, "vendorId"),
      applicationId: parseOptionalStringField(context, "applicationId"),
      description: parseOptionalStringField(context, "description"),
      credentialType: parseRequiredStringField(context, "credentialType"),
      username: parseRequiredStringField(context, "username"),
      password: parseOptionalStringField(context, "password"),
    },
    ["common", "userSourcedId", "profileType", "vendorId", "credentialType", "username"],
    (fields) => ({
      ...fields.common,
      userSourcedId: fields.userSourcedId,
      profileType: fields.profileType,
      vendorId: fields.vendorId,
      applicationId: fields.applicationId,
      description: fields.description,
      credentialType: fields.credentialType,
      username: fields.username,
      password: fields.password,
    }),
  );
}

/** Serialize one academicSessions.csv record into CSV cells. */
export function serializeAcademicSessionRecord(
  record: OneRosterAcademicSessionRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.title,
    record.type,
    record.startDate,
    record.endDate,
    optionalCell(record.parentSourcedId),
    record.schoolYear,
  ];
}

/** Serialize one orgs.csv record into CSV cells. */
export function serializeOrgRecord(record: OneRosterOrgRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.name,
    record.type,
    optionalCell(record.identifier),
    optionalCell(record.parentSourcedId),
  ];
}

/** Serialize one courses.csv record into CSV cells. */
export function serializeCourseRecord(record: OneRosterCourseRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    optionalCell(record.schoolYearSourcedId),
    record.title,
    optionalCell(record.courseCode),
    listCell(record.grades),
    record.orgSourcedId,
    listCell(record.subjects),
    listCell(record.subjectCodes),
  ];
}

/** Serialize one classes.csv record into CSV cells. */
export function serializeClassRecord(record: OneRosterClassRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.title,
    listCell(record.grades),
    record.courseSourcedId,
    optionalCell(record.classCode),
    record.classType,
    optionalCell(record.location),
    record.schoolSourcedId,
    listCell(record.termSourcedIds),
    listCell(record.subjects),
    listCell(record.subjectCodes),
    listCell(record.periods),
  ];
}

/** Serialize one users.csv record into CSV cells. */
export function serializeUserRecord(record: OneRosterUserRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    optionalCell(record.enabledUser),
    record.username,
    listCell(record.userIds),
    record.givenName,
    record.familyName,
    optionalCell(record.middleName),
    optionalCell(record.identifier),
    optionalCell(record.email),
    optionalCell(record.sms),
    optionalCell(record.phone),
    listCell(record.agentSourcedIds),
    listCell(record.grades),
    optionalCell(record.password),
    optionalCell(record.userMasterIdentifier),
    optionalCell(record.preferredGivenName),
    optionalCell(record.preferredMiddleName),
    optionalCell(record.preferredFamilyName),
    optionalCell(record.primaryOrgSourcedId),
    optionalCell(record.pronouns),
  ];
}

/** Serialize one roles.csv record into CSV cells. */
export function serializeRoleRecord(record: OneRosterRoleRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.userSourcedId,
    record.roleType,
    record.role,
    optionalCell(record.beginDate),
    optionalCell(record.endDate),
    record.orgSourcedId,
    optionalCell(record.userProfileSourcedId),
  ];
}

/** Serialize one enrollments.csv record into CSV cells. */
export function serializeEnrollmentRecord(record: OneRosterEnrollmentRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.classSourcedId,
    record.schoolSourcedId,
    record.userSourcedId,
    record.role,
    optionalCell(record.primary),
    optionalCell(record.beginDate),
    optionalCell(record.endDate),
  ];
}

/** Serialize one demographics.csv record into CSV cells. */
export function serializeDemographicsRecord(
  record: OneRosterDemographicsRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    optionalCell(record.birthDate),
    optionalCell(record.sex),
    optionalCell(record.americanIndianOrAlaskaNative),
    optionalCell(record.asian),
    optionalCell(record.blackOrAfricanAmerican),
    optionalCell(record.nativeHawaiianOrOtherPacificIslander),
    optionalCell(record.white),
    optionalCell(record.demographicRaceTwoOrMoreRaces),
    optionalCell(record.hispanicOrLatinoEthnicity),
    optionalCell(record.countryOfBirthCode),
    optionalCell(record.stateOfBirthAbbreviation),
    optionalCell(record.cityOfBirth),
    optionalCell(record.publicSchoolResidenceStatus),
  ];
}

/** Serialize one userProfiles.csv record into CSV cells. */
export function serializeUserProfileRecord(record: OneRosterUserProfileRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.userSourcedId,
    record.profileType,
    record.vendorId,
    optionalCell(record.applicationId),
    optionalCell(record.description),
    record.credentialType,
    record.username,
    optionalCell(record.password),
  ];
}
