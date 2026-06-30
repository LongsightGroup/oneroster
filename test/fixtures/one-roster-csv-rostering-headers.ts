export const academicSessionHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "type",
  "startDate",
  "endDate",
  "parentSourcedId",
  "schoolYear",
] as const;

export const orgHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "name",
  "type",
  "identifier",
  "parentSourcedId",
] as const;

export const courseHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "schoolYearSourcedId",
  "title",
  "courseCode",
  "grades",
  "orgSourcedId",
  "subjects",
  "subjectCodes",
] as const;

export const classHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "grades",
  "courseSourcedId",
  "classCode",
  "classType",
  "location",
  "schoolSourcedId",
  "termSourcedIds",
  "subjects",
  "subjectCodes",
  "periods",
] as const;

export const userHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "enabledUser",
  "username",
  "userIds",
  "givenName",
  "familyName",
  "middleName",
  "identifier",
  "email",
  "sms",
  "phone",
  "agentSourcedIds",
  "grades",
  "password",
  "userMasterIdentifier",
  "preferredGivenName",
  "preferredMiddleName",
  "preferredFamilyName",
  "primaryOrgSourcedId",
  "pronouns",
] as const;

export const roleHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "userSourcedId",
  "roleType",
  "role",
  "beginDate",
  "endDate",
  "orgSourcedId",
  "userProfileSourcedId",
] as const;

export const enrollmentHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "classSourcedId",
  "schoolSourcedId",
  "userSourcedId",
  "role",
  "primary",
  "beginDate",
  "endDate",
] as const;
