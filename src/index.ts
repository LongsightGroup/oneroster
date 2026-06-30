/** Current package planning status. */
export const packageStatus = "planning" as const;

export { parseCsv, parseCsvBytes } from "./csv.js";
export type {
  CsvDocument,
  CsvParseDiagnostic,
  CsvParseDiagnosticCode,
  CsvParseOptions,
} from "./csv.js";
export { writeCsv, writeCsvBytes } from "./csv-write.js";
export type {
  CsvWriteDiagnostic,
  CsvWriteDiagnosticCode,
  CsvWriteLineEnding,
  CsvWriteOptions,
} from "./csv-write.js";
export {
  isOneRosterCsvDataFileName,
  isOneRosterCsvFileName,
  oneRosterCsvDataFileNames,
  oneRosterCsvFileNames,
} from "./one-roster-csv-file.js";
export type { OneRosterCsvDataFileName, OneRosterCsvFileName } from "./one-roster-csv-file.js";
export { parseOneRosterCsvPackageEntries, parseOneRosterCsvZip } from "./one-roster-csv-package.js";
export {
  manifestPropertyNameForDataFileName,
  oneRosterManifestRows,
} from "./one-roster-csv-manifest.js";
export {
  createOneRosterManifestFileModes,
  writeOneRosterCsvPackageEntries,
  writeOneRosterCsvPackageZip,
  writeOneRosterCsvPackageZipFromEntries,
  writeOneRosterCsvPackageZipFromFiles,
} from "./one-roster-csv-package-writer.js";
export type {
  OneRosterCsvPackage,
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvPackageDiagnosticCode,
  OneRosterCsvPackageEntriesOptions,
  OneRosterCsvPackageOptions,
  OneRosterCsvTable,
  OneRosterCsvTableRow,
  OneRosterManifest,
  OneRosterManifestFileMode,
  OneRosterManifestFileModes,
  OneRosterManifestSource,
  OneRosterSuppliedFileMode,
} from "./one-roster-csv-package.js";
export type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvPackageWriteDiagnosticCode,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
export {
  formatOneRosterUserDisplayName,
  formatOneRosterDiagnosticLocation,
  getOneRosterRecordStatus,
  getOneRosterUserStatus,
} from "./one-roster-csv-display.js";
export type {
  OneRosterDiagnosticLocationInput,
  OneRosterRecordStatus,
  OneRosterUserDisplayNameFallbackField,
  OneRosterUserDisplayNameOptions,
} from "./one-roster-csv-display.js";
export {
  oneRosterRecordToCsvCells,
  oneRosterRecordToCsvObject,
} from "./one-roster-csv-record-projection.js";
export type {
  OneRosterCsvRecordByFileName,
  OneRosterCsvRecordObject,
  OneRosterCsvSerializableFileName,
} from "./one-roster-csv-record-projection.js";
export {
  gradebookTableHeaders,
  oneRosterCsvTableHeaders,
  resourcesTableHeaders,
  rosteringTableHeaders,
} from "./one-roster-csv-schema.js";
export {
  parseOneRosterBooleanToken,
  parseOneRosterDate,
  parseOneRosterDateTime,
  parseOneRosterFloat,
  parseOneRosterGuid,
  parseOneRosterInteger,
  parseOneRosterYear,
} from "./one-roster-csv-primitive.js";
export type {
  OneRosterDate,
  OneRosterDateTime,
  OneRosterFloat,
  OneRosterGuid,
  OneRosterInteger,
  OneRosterYear,
} from "./one-roster-csv-primitive.js";
export {
  parseOneRosterCsvGradebookPackage,
  parseOneRosterCsvGradebookZip,
} from "./one-roster-csv-gradebook.js";
export { writeOneRosterCsvGradebookZip } from "./one-roster-csv-gradebook-writer.js";
export {
  parseAndValidateOneRosterCsvGradebookZip,
  validateOneRosterCsvGradebookPackage,
} from "./one-roster-csv-gradebook-validation.js";
export type {
  OneRosterCategoryRecord,
  OneRosterCsvGradebookFileName,
  OneRosterCsvGradebookPackage,
  OneRosterCsvGradebookRecordBase,
  OneRosterCsvGradebookReferenceIndexes,
  OneRosterLearningObjectiveSource,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterResultScoreStatus,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook.js";
export type {
  OneRosterCsvGradebookValidationOptions,
  OneRosterCsvValidatedGradebookPackage,
} from "./one-roster-csv-gradebook-validation.js";
export {
  parseOneRosterCsvResourcesPackage,
  parseOneRosterCsvResourcesZip,
} from "./one-roster-csv-resources.js";
export { writeOneRosterCsvResourcesZip } from "./one-roster-csv-resources-writer.js";
export {
  parseAndValidateOneRosterCsvResourcesZip,
  validateOneRosterCsvResourcesPackage,
} from "./one-roster-csv-resources-validation.js";
export type {
  OneRosterClassResourceRecord,
  OneRosterCourseResourceRecord,
  OneRosterCsvResourcesFileName,
  OneRosterCsvResourcesPackage,
  OneRosterCsvResourcesRecordBase,
  OneRosterCsvResourcesReferenceIndexes,
  OneRosterResourceImportance,
  OneRosterResourceRecord,
  OneRosterResourceRole,
  OneRosterUserResourceRecord,
} from "./one-roster-csv-resources.js";
export type {
  OneRosterCsvResourcesValidationOptions,
  OneRosterCsvValidatedResourcesPackage,
} from "./one-roster-csv-resources-validation.js";
export { parseOneRosterCsvFullPackage, parseOneRosterCsvFullZip } from "./one-roster-csv-full.js";
export {
  writeOneRosterCsvFullPackageEntriesFromRecords,
  writeOneRosterCsvFullPackageZipFromRecords,
  writeOneRosterCsvFullZip,
} from "./one-roster-csv-full-writer.js";
export {
  parseAndValidateOneRosterCsvFullEntries,
  parseAndValidateOneRosterCsvFullZip,
  validateOneRosterCsvFullPackage,
} from "./one-roster-csv-full-validation.js";
export {
  getFirstActiveOneRosterResultScoreScale,
  getOneRosterLineItemLearningObjectiveLinks,
  getOneRosterLineItemScoreScales,
  getOneRosterResultLearningObjectiveLinks,
  getOneRosterResultScoreScales,
  getResultScoreScaleSourcedIdsByResultSourcedId,
  iterateResolvedStudentEnrollments,
} from "./one-roster-csv-full-resolved.js";
export type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
export type {
  OneRosterCsvFullPackageRecordCollections,
  OneRosterCsvFullPackageRecordWriteOptions,
} from "./one-roster-csv-full-writer.js";
export type {
  OneRosterCsvFullEntriesValidationOptions,
  OneRosterCsvFullPackageValidationOptions,
  OneRosterCsvFullValidationOptions,
  OneRosterCsvFullZipValidationOptions,
  OneRosterCsvValidatedFullPackage,
} from "./one-roster-csv-full-validation.js";
export type {
  OneRosterCsvFullResolvedIndexInput,
  OneRosterCsvFullResolvedIndexes,
  OneRosterCsvResolvedFullPackage,
  OneRosterResolvedLineItemScoreScale,
  OneRosterResolvedRelationshipOptions,
  OneRosterResolvedResultScoreScale,
  OneRosterResolvedStudentEnrollment,
} from "./one-roster-csv-full-resolved.js";
export {
  parseOneRosterCsvRosteringPackage,
  parseOneRosterCsvRosteringZip,
} from "./one-roster-csv-rostering.js";
export { writeOneRosterCsvRosteringZip } from "./one-roster-csv-rostering-writer.js";
export {
  parseAndValidateOneRosterCsvRosteringZip,
  validateOneRosterCsvRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
export type {
  OneRosterAcademicSessionRecord,
  OneRosterAcademicSessionType,
  OneRosterClassRecord,
  OneRosterClassType,
  OneRosterCourseRecord,
  OneRosterCsvBulkLifecycle,
  OneRosterCsvDeltaLifecycle,
  OneRosterCsvDeltaStatus,
  OneRosterCsvRecordMetadata,
  OneRosterCsvRosteringFileName,
  OneRosterCsvRosteringPackage,
  OneRosterCsvRosteringRecordBase,
  OneRosterCsvRowLifecycle,
  OneRosterDemographicsRecord,
  OneRosterDemographicsSex,
  OneRosterEnrollmentRecord,
  OneRosterEnrollmentRole,
  OneRosterExtensionVocabularyToken,
  OneRosterOrgRecord,
  OneRosterOrgType,
  OneRosterRole,
  OneRosterRoleRecord,
  OneRosterRoleType,
  OneRosterUserProfileRecord,
  OneRosterUserRecord,
} from "./one-roster-csv-rostering.js";
export type {
  OneRosterCsvReferenceValidationMode,
  OneRosterCsvReferenceValidationOptions,
  OneRosterCsvRosteringReferenceIndexes,
  OneRosterCsvRosteringValidationOptions,
  OneRosterCsvValidatedRosteringPackage,
} from "./one-roster-csv-rostering-validation.js";
export { err, ok } from "./result.js";
export type { Result } from "./result.js";
export { defaultZipReadLimits, readZipEntries } from "./zip.js";
export type {
  ZipDiagnostic,
  ZipDiagnosticCode,
  ZipEntry,
  ZipReadLimits,
  ZipReadOptions,
} from "./zip.js";

/** Severity for parse, normalization, and validation diagnostics. */
export type OneRosterDiagnosticSeverity = "error" | "warning";

/** Stable diagnostic emitted for expected package, file, header, row, or reference failures. */
export type OneRosterDiagnostic = {
  readonly severity: OneRosterDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly fileName?: string;
  readonly rowNumber?: number;
  readonly field?: string;
};
