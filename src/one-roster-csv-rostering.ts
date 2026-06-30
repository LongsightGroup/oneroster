import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseRosteringPackageRecords } from "./one-roster-csv-rostering-tables.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

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
} from "./one-roster-csv-rostering-types.js";

/** Parse a OneRoster CSV ZIP archive into typed core rostering records. */
export function parseOneRosterCsvRosteringZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const packageResult = parseOneRosterCsvZip(bytes, options);

  if (packageResult._tag === "err") {
    return err(packageResult.error);
  }

  return parseOneRosterCsvRosteringPackage(packageResult.value);
}

/** Parse an already-normalized OneRoster CSV package into typed core rostering records. */
export function parseOneRosterCsvRosteringPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const records = parseRosteringPackageRecords(packageValue, diagnostics);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    rawPackage: packageValue,
    ...records,
  });
}
