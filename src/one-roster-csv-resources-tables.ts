import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
  parseOneRosterCsvRecordTable,
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

const resourcesTable = {
  fileName: "resources.csv",
  headers: resourceHeaders,
  getRecords: (packageValue: OneRosterCsvResourcesPackage) => packageValue.resources,
  getIndex: (indexes: OneRosterCsvResourcesReferenceIndexes) => indexes.resourcesBySourcedId,
  parse: parseResourceRecord,
} satisfies ResourcesTableDefinition<OneRosterResourceRecord>;

const classResourcesTable = {
  fileName: "classResources.csv",
  headers: classResourceHeaders,
  getRecords: (packageValue: OneRosterCsvResourcesPackage) => packageValue.classResources,
  getIndex: (indexes: OneRosterCsvResourcesReferenceIndexes) => indexes.classResourcesBySourcedId,
  parse: parseClassResourceRecord,
} satisfies ResourcesTableDefinition<OneRosterClassResourceRecord>;

const courseResourcesTable = {
  fileName: "courseResources.csv",
  headers: courseResourceHeaders,
  getRecords: (packageValue: OneRosterCsvResourcesPackage) => packageValue.courseResources,
  getIndex: (indexes: OneRosterCsvResourcesReferenceIndexes) => indexes.courseResourcesBySourcedId,
  parse: parseCourseResourceRecord,
} satisfies ResourcesTableDefinition<OneRosterCourseResourceRecord>;

const userResourcesTable = {
  fileName: "userResources.csv",
  headers: userResourceHeaders,
  getRecords: (packageValue: OneRosterCsvResourcesPackage) => packageValue.userResources,
  getIndex: (indexes: OneRosterCsvResourcesReferenceIndexes) => indexes.userResourcesBySourcedId,
  parse: parseUserResourceRecord,
} satisfies ResourcesTableDefinition<OneRosterUserResourceRecord>;

const resourcesRecordTables = {
  resources: resourcesTable,
  classResources: classResourcesTable,
  courseResources: courseResourcesTable,
  userResources: userResourcesTable,
} as const;

const resourcesIndexTables = {
  resourcesBySourcedId: resourcesTable,
  classResourcesBySourcedId: classResourcesTable,
  courseResourcesBySourcedId: courseResourcesTable,
  userResourcesBySourcedId: userResourcesTable,
} as const;

export const resourcesRecordSet: ResourcesRecordSet<OneRosterResourceRecord> = resourcesTable;
export const classResourcesRecordSet: ResourcesRecordSet<OneRosterClassResourceRecord> =
  classResourcesTable;
export const courseResourcesRecordSet: ResourcesRecordSet<OneRosterCourseResourceRecord> =
  courseResourcesTable;
export const userResourcesRecordSet: ResourcesRecordSet<OneRosterUserResourceRecord> =
  userResourcesTable;

/** Parse every registered resources table from a normalized CSV package. */
export function parseResourcesPackageRecords(
  packageValue: OneRosterCsvPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ResourcesPackageRecords {
  return {
    resources: parseOneRosterCsvRecordTable(
      packageValue,
      resourcesRecordTables.resources,
      diagnostics,
    ),
    classResources: parseOneRosterCsvRecordTable(
      packageValue,
      resourcesRecordTables.classResources,
      diagnostics,
    ),
    courseResources: parseOneRosterCsvRecordTable(
      packageValue,
      resourcesRecordTables.courseResources,
      diagnostics,
    ),
    userResources: parseOneRosterCsvRecordTable(
      packageValue,
      resourcesRecordTables.userResources,
      diagnostics,
    ),
  };
}

/** Build sourcedId lookup indexes for every registered resources table. */
export function buildResourcesReferenceIndexes(
  packageValue: OneRosterCsvResourcesPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvResourcesReferenceIndexes {
  return {
    resourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resourcesIndexTables.resourcesBySourcedId,
      packageValue,
      diagnostics,
    ),
    classResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resourcesIndexTables.classResourcesBySourcedId,
      packageValue,
      diagnostics,
    ),
    courseResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resourcesIndexTables.courseResourcesBySourcedId,
      packageValue,
      diagnostics,
    ),
    userResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resourcesIndexTables.userResourcesBySourcedId,
      packageValue,
      diagnostics,
    ),
  };
}
