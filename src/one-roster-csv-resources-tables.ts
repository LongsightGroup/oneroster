import type { OneRosterCsvPackage } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  buildOneRosterCsvRecordSetIndex,
  defineOneRosterCsvRecordTable,
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

function defineResourcesTable<TRecord extends OneRosterCsvResourcesRecordBase>(
  definition: ResourcesTableDefinition<TRecord>,
): ResourcesTableDefinition<TRecord> {
  return defineOneRosterCsvRecordTable(definition);
}

const resourcesTable = defineResourcesTable<OneRosterResourceRecord>({
  fileName: "resources.csv",
  headers: resourceHeaders,
  getRecords: (packageValue) => packageValue.resources,
  getIndex: (indexes) => indexes.resourcesBySourcedId,
  parse: parseResourceRecord,
});

const classResourcesTable = defineResourcesTable<OneRosterClassResourceRecord>({
  fileName: "classResources.csv",
  headers: classResourceHeaders,
  getRecords: (packageValue) => packageValue.classResources,
  getIndex: (indexes) => indexes.classResourcesBySourcedId,
  parse: parseClassResourceRecord,
});

const courseResourcesTable = defineResourcesTable<OneRosterCourseResourceRecord>({
  fileName: "courseResources.csv",
  headers: courseResourceHeaders,
  getRecords: (packageValue) => packageValue.courseResources,
  getIndex: (indexes) => indexes.courseResourcesBySourcedId,
  parse: parseCourseResourceRecord,
});

const userResourcesTable = defineResourcesTable<OneRosterUserResourceRecord>({
  fileName: "userResources.csv",
  headers: userResourceHeaders,
  getRecords: (packageValue) => packageValue.userResources,
  getIndex: (indexes) => indexes.userResourcesBySourcedId,
  parse: parseUserResourceRecord,
});

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
    resources: parseOneRosterCsvRecordTable(packageValue, resourcesTable, diagnostics),
    classResources: parseOneRosterCsvRecordTable(packageValue, classResourcesTable, diagnostics),
    courseResources: parseOneRosterCsvRecordTable(packageValue, courseResourcesTable, diagnostics),
    userResources: parseOneRosterCsvRecordTable(packageValue, userResourcesTable, diagnostics),
  };
}

/** Build sourcedId lookup indexes for every registered resources table. */
export function buildResourcesReferenceIndexes(
  packageValue: OneRosterCsvResourcesPackage,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterCsvResourcesReferenceIndexes {
  return {
    resourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      resourcesTable,
      packageValue,
      diagnostics,
    ),
    classResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      classResourcesTable,
      packageValue,
      diagnostics,
    ),
    courseResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      courseResourcesTable,
      packageValue,
      diagnostics,
    ),
    userResourcesBySourcedId: buildOneRosterCsvRecordSetIndex(
      userResourcesTable,
      packageValue,
      diagnostics,
    ),
  };
}
