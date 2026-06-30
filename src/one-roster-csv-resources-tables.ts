import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  defineProfileTables,
  type OneRosterCsvRecordSet,
  type OneRosterCsvRecordTableDefinition,
} from "./one-roster-csv-record-tables.js";
import {
  parseClassResourceRecord,
  parseCourseResourceRecord,
  parseResourceRecord,
  parseUserResourceRecord,
} from "./one-roster-csv-resources-record-engine.js";
import {
  classResourceHeaders,
  courseResourceHeaders,
  resourceHeaders,
  userResourceHeaders,
} from "./one-roster-csv-resources-schema.js";
import type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesRecordBase,
  OneRosterCsvResourcesReferenceIndexes,
  OneRosterResourceRecord,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources-types.js";

export type ResourcesPackageRecords = Omit<OneRosterCsvResourcesPackage, "rosteringPackage">;

export type ResourcesRecordSet<TRecord extends OneRosterCsvResourcesRecordBase> =
  OneRosterCsvRecordSet<
    OneRosterCsvResourcesPackage,
    OneRosterCsvResourcesReferenceIndexes,
    TRecord
  >;

type ResourcesTableDefinition<TRecord extends OneRosterCsvResourcesRecordBase> =
  OneRosterCsvRecordTableDefinition<
    OneRosterCsvResourcesPackage,
    OneRosterCsvResourcesReferenceIndexes,
    TRecord
  >;

const resourcesProfileTables = defineProfileTables<
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesReferenceIndexes,
  {
    readonly resources: ResourcesTableDefinition<OneRosterResourceRecord>;
    readonly classResources: ResourcesTableDefinition<OneRosterClassResourceRecord>;
    readonly courseResources: ResourcesTableDefinition<OneRosterCourseResourceRecord>;
    readonly userResources: ResourcesTableDefinition<OneRosterUserResourceRecord>;
  }
>({
  resources: {
    fileName: "resources.csv",
    headers: resourceHeaders,
    getRecords: (packageValue) => packageValue.resources,
    getIndex: (indexes) => indexes.resourcesBySourcedId,
    parse: parseResourceRecord,
  },
  classResources: {
    fileName: "classResources.csv",
    headers: classResourceHeaders,
    getRecords: (packageValue) => packageValue.classResources,
    getIndex: (indexes) => indexes.classResourcesBySourcedId,
    parse: parseClassResourceRecord,
  },
  courseResources: {
    fileName: "courseResources.csv",
    headers: courseResourceHeaders,
    getRecords: (packageValue) => packageValue.courseResources,
    getIndex: (indexes) => indexes.courseResourcesBySourcedId,
    parse: parseCourseResourceRecord,
  },
  userResources: {
    fileName: "userResources.csv",
    headers: userResourceHeaders,
    getRecords: (packageValue) => packageValue.userResources,
    getIndex: (indexes) => indexes.userResourcesBySourcedId,
    parse: parseUserResourceRecord,
  },
});

export const resourcesRecordSet: ResourcesRecordSet<OneRosterResourceRecord> =
  resourcesProfileTables.tables.resources;
export const classResourcesRecordSet: ResourcesRecordSet<OneRosterClassResourceRecord> =
  resourcesProfileTables.tables.classResources;
export const courseResourcesRecordSet: ResourcesRecordSet<OneRosterCourseResourceRecord> =
  resourcesProfileTables.tables.courseResources;
export const userResourcesRecordSet: ResourcesRecordSet<OneRosterUserResourceRecord> =
  resourcesProfileTables.tables.userResources;

/** Parse every registered resources table from a normalized CSV package. */
export function parseResourcesPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ResourcesPackageRecords {
  return resourcesProfileTables.parsePackageRecords(packageValue, diagnostics);
}

/** Build sourcedId lookup indexes for every registered resources table. */
export function buildResourcesReferenceIndexes(
  packageValue: OneRosterCsvResourcesPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvResourcesReferenceIndexes {
  return resourcesProfileTables.buildReferenceIndexes(packageValue, diagnostics);
}
