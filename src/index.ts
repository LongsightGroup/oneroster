/** Current package planning status. */
export const packageStatus = "planning" as const;

export { parseCsv, parseCsvBytes } from "./csv.js";
export type {
  CsvDocument,
  CsvParseDiagnostic,
  CsvParseDiagnosticCode,
  CsvParseOptions,
} from "./csv.js";
export {
  isOneRosterCsvDataFileName,
  isOneRosterCsvFileName,
  oneRosterCsvDataFileNames,
  oneRosterCsvFileNames,
} from "./one-roster-csv-file.js";
export type { OneRosterCsvDataFileName, OneRosterCsvFileName } from "./one-roster-csv-file.js";
export { parseOneRosterCsvPackageEntries, parseOneRosterCsvZip } from "./one-roster-csv-package.js";
export type {
  OneRosterCsvPackage,
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvPackageDiagnosticCode,
  OneRosterCsvPackageOptions,
  OneRosterCsvTable,
  OneRosterCsvTableRow,
  OneRosterManifest,
  OneRosterManifestFileMode,
  OneRosterManifestFileModes,
  OneRosterManifestSource,
  OneRosterSuppliedFileMode,
} from "./one-roster-csv-package.js";
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
  parseAndValidateOneRosterCsvFullZip,
  validateOneRosterCsvFullPackage,
} from "./one-roster-csv-full-validation.js";
export type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
export type {
  OneRosterCsvFullValidationOptions,
  OneRosterCsvValidatedFullPackage,
} from "./one-roster-csv-full-validation.js";
export {
  parseOneRosterCsvRosteringPackage,
  parseOneRosterCsvRosteringZip,
} from "./one-roster-csv-rostering.js";
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

/** Normalized record status used by application consumers. */
export type OneRosterRecordStatus = "active" | "inactive";

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
