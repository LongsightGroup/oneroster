import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseBooleanField,
  parseCommonRecordFields,
  parseDateField,
  parseGuidField,
  parseGuidListField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseStringListField,
  parseVocabularyField,
  parseYearField,
} from "./one-roster-csv-record-fields.js";
import { hasNewRowDiagnostics } from "./one-roster-csv-record-row.js";
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
  const commonFields = parseCommonRecordFields(context);
  const title = parseRequiredStringField(context, "title");
  const type = parseVocabularyField(context, "type", "required", academicSessionTypeValues, true);
  const startDate = parseDateField(context, "startDate", "required");
  const endDate = parseDateField(context, "endDate", "required");
  const parentSourcedId = parseGuidField(context, "parentSourcedId", "optional");
  const schoolYear = parseYearField(context, "schoolYear", "required");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined ||
    type === undefined ||
    startDate === undefined ||
    endDate === undefined ||
    schoolYear === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    type,
    startDate,
    endDate,
    parentSourcedId,
    schoolYear,
  };
}

/** Parse one orgs.csv row into a typed OneRoster record. */
export function parseOrgRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterOrgRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const name = parseRequiredStringField(context, "name");
  const type = parseVocabularyField(context, "type", "required", orgTypeValues, true);
  const identifier = parseOptionalStringField(context, "identifier");
  const parentSourcedId = parseGuidField(context, "parentSourcedId", "optional");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    name === undefined ||
    type === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    name,
    type,
    identifier,
    parentSourcedId,
  };
}

/** Parse one courses.csv row into a typed OneRoster record. */
export function parseCourseRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterCourseRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const schoolYearSourcedId = parseGuidField(context, "schoolYearSourcedId", "optional");
  const title = parseRequiredStringField(context, "title");
  const courseCode = parseOptionalStringField(context, "courseCode");
  const grades = parseStringListField(context, "grades", "optional");
  const orgSourcedId = parseGuidField(context, "orgSourcedId", "required");
  const subjects = parseStringListField(context, "subjects", "optional");
  const subjectCodes = parseStringListField(context, "subjectCodes", "optional");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined ||
    grades === undefined ||
    orgSourcedId === undefined ||
    subjects === undefined ||
    subjectCodes === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    schoolYearSourcedId,
    title,
    courseCode,
    grades,
    orgSourcedId,
    subjects,
    subjectCodes,
  };
}

/** Parse one classes.csv row into a typed OneRoster record. */
export function parseClassRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterClassRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseRequiredStringField(context, "title");
  const grades = parseStringListField(context, "grades", "optional");
  const courseSourcedId = parseGuidField(context, "courseSourcedId", "required");
  const classCode = parseOptionalStringField(context, "classCode");
  const classType = parseVocabularyField(context, "classType", "required", classTypeValues, true);
  const location = parseOptionalStringField(context, "location");
  const schoolSourcedId = parseGuidField(context, "schoolSourcedId", "required");
  const termSourcedIds = parseGuidListField(context, "termSourcedIds", "required");
  const subjects = parseStringListField(context, "subjects", "optional");
  const subjectCodes = parseStringListField(context, "subjectCodes", "optional");
  const periods = parseStringListField(context, "periods", "optional");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined ||
    grades === undefined ||
    courseSourcedId === undefined ||
    classType === undefined ||
    schoolSourcedId === undefined ||
    termSourcedIds === undefined ||
    subjects === undefined ||
    subjectCodes === undefined ||
    periods === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    grades,
    courseSourcedId,
    classCode,
    classType,
    location,
    schoolSourcedId,
    termSourcedIds,
    subjects,
    subjectCodes,
    periods,
  };
}

/** Parse one users.csv row into a typed OneRoster record. */
export function parseUserRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const enabledUser = parseBooleanField(context, "enabledUser", "required");
  const username = parseRequiredStringField(context, "username");
  const userIds = parseStringListField(context, "userIds", "optional");
  const givenName = parseRequiredStringField(context, "givenName");
  const familyName = parseRequiredStringField(context, "familyName");
  const middleName = parseOptionalStringField(context, "middleName");
  const identifier = parseOptionalStringField(context, "identifier");
  const email = parseOptionalStringField(context, "email");
  const sms = parseOptionalStringField(context, "sms");
  const phone = parseOptionalStringField(context, "phone");
  const agentSourcedIds = parseGuidListField(context, "agentSourcedIds", "optional");
  const grades = parseStringListField(context, "grades", "optional");
  const password = parseOptionalStringField(context, "password");
  const userMasterIdentifier = parseOptionalStringField(context, "userMasterIdentifier");
  const preferredGivenName = parseOptionalStringField(context, "preferredGivenName");
  const preferredMiddleName = parseOptionalStringField(context, "preferredMiddleName");
  const preferredFamilyName = parseOptionalStringField(context, "preferredFamilyName");
  const primaryOrgSourcedId = parseGuidField(context, "primaryOrgSourcedId", "optional");
  const pronouns = parseOptionalStringField(context, "pronouns");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    enabledUser === undefined ||
    username === undefined ||
    userIds === undefined ||
    givenName === undefined ||
    familyName === undefined ||
    agentSourcedIds === undefined ||
    grades === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    enabledUser,
    username,
    userIds,
    givenName,
    familyName,
    middleName,
    identifier,
    email,
    sms,
    phone,
    agentSourcedIds,
    grades,
    password,
    userMasterIdentifier,
    preferredGivenName,
    preferredMiddleName,
    preferredFamilyName,
    primaryOrgSourcedId,
    pronouns,
  };
}

/** Parse one roles.csv row into a typed OneRoster record. */
export function parseRoleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterRoleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const userSourcedId = parseGuidField(context, "userSourcedId", "required");
  const roleType = parseVocabularyField(context, "roleType", "required", roleTypeValues, false);
  const role = parseVocabularyField(context, "role", "required", roleValues, true);
  const beginDate = parseDateField(context, "beginDate", "optional");
  const endDate = parseDateField(context, "endDate", "optional");
  const orgSourcedId = parseGuidField(context, "orgSourcedId", "required");
  const userProfileSourcedId = parseGuidField(context, "userProfileSourcedId", "optional");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    userSourcedId === undefined ||
    roleType === undefined ||
    role === undefined ||
    orgSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    userSourcedId,
    roleType,
    role,
    beginDate,
    endDate,
    orgSourcedId,
    userProfileSourcedId,
  };
}

/** Parse one enrollments.csv row into a typed OneRoster record. */
export function parseEnrollmentRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterEnrollmentRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const classSourcedId = parseGuidField(context, "classSourcedId", "required");
  const schoolSourcedId = parseGuidField(context, "schoolSourcedId", "required");
  const userSourcedId = parseGuidField(context, "userSourcedId", "required");
  const role = parseVocabularyField(context, "role", "required", enrollmentRoleValues, true);
  const primary = parseBooleanField(context, "primary", "optional");
  const beginDate = parseDateField(context, "beginDate", "optional");
  const endDate = parseDateField(context, "endDate", "optional");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    classSourcedId === undefined ||
    schoolSourcedId === undefined ||
    userSourcedId === undefined ||
    role === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    classSourcedId,
    schoolSourcedId,
    userSourcedId,
    role,
    primary,
    beginDate,
    endDate,
  };
}

/** Parse one demographics.csv row into a typed OneRoster record. */
export function parseDemographicsRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterDemographicsRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const birthDate = parseDateField(context, "birthDate", "optional");
  const sex = parseVocabularyField(context, "sex", "optional", demographicsSexValues, true);
  const americanIndianOrAlaskaNative = parseBooleanField(
    context,
    "americanIndianOrAlaskaNative",
    "optional",
  );
  const asian = parseBooleanField(context, "asian", "optional");
  const blackOrAfricanAmerican = parseBooleanField(context, "blackOrAfricanAmerican", "optional");
  const nativeHawaiianOrOtherPacificIslander = parseBooleanField(
    context,
    "nativeHawaiianOrOtherPacificIslander",
    "optional",
  );
  const white = parseBooleanField(context, "white", "optional");
  const demographicRaceTwoOrMoreRaces = parseBooleanField(
    context,
    "demographicRaceTwoOrMoreRaces",
    "optional",
  );
  const hispanicOrLatinoEthnicity = parseBooleanField(
    context,
    "hispanicOrLatinoEthnicity",
    "optional",
  );
  const countryOfBirthCode = parseOptionalStringField(context, "countryOfBirthCode");
  const stateOfBirthAbbreviation = parseOptionalStringField(context, "stateOfBirthAbbreviation");
  const cityOfBirth = parseOptionalStringField(context, "cityOfBirth");
  const publicSchoolResidenceStatus = parseOptionalStringField(
    context,
    "publicSchoolResidenceStatus",
  );

  if (hasNewRowDiagnostics(context, diagnosticStart) || commonFields === undefined) {
    return undefined;
  }

  return {
    ...commonFields,
    birthDate,
    sex,
    americanIndianOrAlaskaNative,
    asian,
    blackOrAfricanAmerican,
    nativeHawaiianOrOtherPacificIslander,
    white,
    demographicRaceTwoOrMoreRaces,
    hispanicOrLatinoEthnicity,
    countryOfBirthCode,
    stateOfBirthAbbreviation,
    cityOfBirth,
    publicSchoolResidenceStatus,
  };
}

/** Parse one userProfiles.csv row into a typed OneRoster record. */
export function parseUserProfileRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterUserProfileRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const userSourcedId = parseGuidField(context, "userSourcedId", "required");
  const profileType = parseRequiredStringField(context, "profileType");
  const vendorId = parseRequiredStringField(context, "vendorId");
  const applicationId = parseOptionalStringField(context, "applicationId");
  const description = parseOptionalStringField(context, "description");
  const credentialType = parseRequiredStringField(context, "credentialType");
  const username = parseRequiredStringField(context, "username");
  const password = parseOptionalStringField(context, "password");

  if (
    hasNewRowDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    userSourcedId === undefined ||
    profileType === undefined ||
    vendorId === undefined ||
    credentialType === undefined ||
    username === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    userSourcedId,
    profileType,
    vendorId,
    applicationId,
    description,
    credentialType,
    username,
    password,
  };
}
