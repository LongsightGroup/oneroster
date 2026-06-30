import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type {
  OneRosterCategoryRecord,
  OneRosterCsvGradebookPackage,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";
import { writeGradebookPackageTables } from "./one-roster-csv-gradebook-tables.js";
import { writeOneRosterCsvLayeredPackageZip } from "./one-roster-csv-layered-package.js";
import { type OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import type {
  OneRosterManifest,
  OneRosterManifestFileMode,
  OneRosterManifestSource,
} from "./one-roster-csv-manifest.js";
import type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
import {
  createAbsentManifestFileModes,
  writeWritablePackageEntries,
  writeZipEntries,
} from "./one-roster-csv-package-writer.js";
import type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterCsvResourcesPackage,
  OneRosterResourceRecord,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources-types.js";
import { writeResourcesPackageTables } from "./one-roster-csv-resources-tables.js";
import type {
  OneRosterAcademicSessionRecord,
  OneRosterClassRecord,
  OneRosterCourseRecord,
  OneRosterCsvRosteringPackage,
  OneRosterDemographicsRecord,
  OneRosterEnrollmentRecord,
  OneRosterOrgRecord,
  OneRosterRoleRecord,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering-types.js";
import { writeRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";
import { err, type Result } from "./result.js";
import type { ZipEntry } from "./zip.js";

/** Typed record collections accepted by full-package CSV record writers. */
export type OneRosterCsvFullPackageRecordCollections = {
  readonly academicSessions?: readonly OneRosterAcademicSessionRecord[];
  readonly orgs?: readonly OneRosterOrgRecord[];
  readonly courses?: readonly OneRosterCourseRecord[];
  readonly classes?: readonly OneRosterClassRecord[];
  readonly users?: readonly OneRosterUserRecord[];
  readonly roles?: readonly OneRosterRoleRecord[];
  readonly enrollments?: readonly OneRosterEnrollmentRecord[];
  readonly demographics?: readonly OneRosterDemographicsRecord[];
  readonly userProfiles?: readonly OneRosterUserProfileRecord[];
  readonly categories?: readonly OneRosterCategoryRecord[];
  readonly lineItems?: readonly OneRosterLineItemRecord[];
  readonly results?: readonly OneRosterResultRecord[];
  readonly scoreScales?: readonly OneRosterScoreScaleRecord[];
  readonly lineItemLearningObjectiveIds?: readonly OneRosterLineItemLearningObjectiveIdRecord[];
  readonly lineItemScoreScales?: readonly OneRosterLineItemScoreScaleRecord[];
  readonly resultLearningObjectiveIds?: readonly OneRosterResultLearningObjectiveIdRecord[];
  readonly resultScoreScales?: readonly OneRosterResultScoreScaleRecord[];
  readonly resources?: readonly OneRosterResourceRecord[];
  readonly classResources?: readonly OneRosterClassResourceRecord[];
  readonly courseResources?: readonly OneRosterCourseResourceRecord[];
  readonly userResources?: readonly OneRosterUserResourceRecord[];
};

/** Options for writing a full OneRoster CSV package from typed record collections. */
export type OneRosterCsvFullPackageRecordWriteOptions = OneRosterCsvWriteOptions & {
  readonly source?: OneRosterManifestSource;
  readonly fileModes?: Partial<
    Record<OneRosterCsvDataFileName, Exclude<OneRosterManifestFileMode, "absent">>
  >;
};

/** Write a typed OneRoster CSV full package into ZIP bytes. */
export function writeOneRosterCsvFullZip(
  packageValue: OneRosterCsvFullPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvLayeredPackageZip(
    packageValue.rosteringPackage,
    (rosteringPackage, diagnostics) => [
      ...writeRosteringPackageTables(rosteringPackage, diagnostics),
      ...writeGradebookPackageTables(packageValue.gradebookPackage, diagnostics),
      ...writeResourcesPackageTables(packageValue.resourcesPackage, diagnostics),
    ],
    options,
  );
}

/** Write typed OneRoster record collections into deterministic package entries. */
export function writeOneRosterCsvFullPackageEntriesFromRecords(
  records: OneRosterCsvFullPackageRecordCollections,
  options: OneRosterCsvFullPackageRecordWriteOptions = {},
): Result<readonly ZipEntry[], readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageWriteDiagnostic[] = [];
  const rosteringPackage = createRosteringPackageFromRecordCollections(records, options.source);
  const gradebookPackage = createGradebookPackageFromRecordCollections(rosteringPackage, records);
  const resourcesPackage = createResourcesPackageFromRecordCollections(rosteringPackage, records);
  const tables = [
    ...writeRosteringPackageTables(rosteringPackage, diagnostics),
    ...writeGradebookPackageTables(gradebookPackage, diagnostics),
    ...writeResourcesPackageTables(resourcesPackage, diagnostics),
  ];

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return writeWritablePackageEntries(
    tables,
    { source: options.source, fileModes: options.fileModes },
    options,
  );
}

/** Write typed OneRoster record collections into deterministic ZIP bytes. */
export function writeOneRosterCsvFullPackageZipFromRecords(
  records: OneRosterCsvFullPackageRecordCollections,
  options: OneRosterCsvFullPackageRecordWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  const entries = writeOneRosterCsvFullPackageEntriesFromRecords(records, options);

  if (entries._tag === "err") {
    return entries;
  }

  return writeZipEntries(entries.value);
}

function createWriterManifest(source: OneRosterManifestSource | undefined): OneRosterManifest {
  return {
    manifestVersion: "1.0",
    oneRosterVersion: "1.2",
    fileModes: createAbsentManifestFileModes(),
    ...(source !== undefined ? { source } : {}),
  };
}

function createRosteringPackageFromRecordCollections(
  records: OneRosterCsvFullPackageRecordCollections,
  source: OneRosterManifestSource | undefined,
): OneRosterCsvRosteringPackage {
  const manifest = createWriterManifest(source);
  const rawPackage = { manifest, tables: [] };

  return {
    rawPackage,
    manifest,
    academicSessions: records.academicSessions ?? [],
    orgs: records.orgs ?? [],
    courses: records.courses ?? [],
    classes: records.classes ?? [],
    users: records.users ?? [],
    roles: records.roles ?? [],
    enrollments: records.enrollments ?? [],
    demographics: records.demographics ?? [],
    userProfiles: records.userProfiles ?? [],
  };
}

function createGradebookPackageFromRecordCollections(
  rosteringPackage: OneRosterCsvRosteringPackage,
  records: OneRosterCsvFullPackageRecordCollections,
): OneRosterCsvGradebookPackage {
  return {
    rosteringPackage,
    categories: records.categories ?? [],
    lineItems: records.lineItems ?? [],
    results: records.results ?? [],
    scoreScales: records.scoreScales ?? [],
    lineItemLearningObjectiveIds: records.lineItemLearningObjectiveIds ?? [],
    lineItemScoreScales: records.lineItemScoreScales ?? [],
    resultLearningObjectiveIds: records.resultLearningObjectiveIds ?? [],
    resultScoreScales: records.resultScoreScales ?? [],
  };
}

function createResourcesPackageFromRecordCollections(
  rosteringPackage: OneRosterCsvRosteringPackage,
  records: OneRosterCsvFullPackageRecordCollections,
): OneRosterCsvResourcesPackage {
  return {
    rosteringPackage,
    resources: records.resources ?? [],
    classResources: records.classResources ?? [],
    courseResources: records.courseResources ?? [],
    userResources: records.userResources ?? [],
  };
}
