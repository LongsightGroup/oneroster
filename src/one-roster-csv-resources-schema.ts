import type { OneRosterCsvResourcesFileName } from "./one-roster-csv-resources-types.js";

/** Spec-defined headers for resources.csv in exact order. */
export const resourceHeaders = [
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

/** Spec-defined headers for classResources.csv in exact order. */
export const classResourceHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "classSourcedId",
  "resourceSourcedId",
] as const;

/** Spec-defined headers for courseResources.csv in exact order. */
export const courseResourceHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "courseSourcedId",
  "resourceSourcedId",
] as const;

/** Spec-defined headers for userResources.csv in exact order. */
export const userResourceHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "userSourcedId",
  "orgSourcedId",
  "classSourcedId",
  "resourceSourcedId",
] as const;

/** All resource table headers keyed by file name for tests and tooling. */
export const resourcesTableHeaders: Readonly<
  Record<OneRosterCsvResourcesFileName, readonly string[]>
> = {
  "resources.csv": resourceHeaders,
  "classResources.csv": classResourceHeaders,
  "courseResources.csv": courseResourceHeaders,
  "userResources.csv": userResourceHeaders,
};

/** OneRoster resources.csv roles vocabulary values. */
export const resourceRoleValues = [
  "administrator",
  "aide",
  "guardian",
  "parent",
  "proctor",
  "relative",
  "student",
  "teacher",
] as const;

/** OneRoster resources.csv importance vocabulary values. */
export const resourceImportanceValues = ["primary", "secondary"] as const;
