export const resourceHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "vendorResourceId",
  "title",
  "roles",
  "importance",
  "vendorId",
  "applicationId",
] as const;

export const classResourceHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "classSourcedId",
  "resourceSourcedId",
] as const;

export const courseResourceHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "courseSourcedId",
  "resourceSourcedId",
] as const;

export const userResourceHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "userSourcedId",
  "orgSourcedId",
  "classSourcedId",
  "resourceSourcedId",
] as const;
