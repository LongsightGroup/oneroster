import type { OneRosterCsvPackage, OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseOneRosterCsvLayeredZip } from "./one-roster-csv-layered-package.js";
import { assembleOneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-tables.js";
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
  const result = parseOneRosterCsvLayeredZip(bytes, options, emptyProfileRecords);

  if (result._tag === "err") {
    return err(result.error);
  }

  return ok(result.value.rosteringPackage);
}

/** Parse an already-normalized OneRoster CSV package into typed core rostering records. */
export function parseOneRosterCsvRosteringPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const rosteringPackage = assembleOneRosterCsvRosteringPackage(packageValue, diagnostics);

  if (rosteringPackage === undefined) {
    return err(diagnostics);
  }

  return ok(rosteringPackage);
}

function emptyProfileRecords(): Record<string, never> {
  return {};
}
