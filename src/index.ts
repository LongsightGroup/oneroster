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
  parseOneRosterGuid,
  parseOneRosterYear,
} from "./one-roster-csv-primitive.js";
export type {
  OneRosterDate,
  OneRosterDateTime,
  OneRosterGuid,
  OneRosterYear,
} from "./one-roster-csv-primitive.js";
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
