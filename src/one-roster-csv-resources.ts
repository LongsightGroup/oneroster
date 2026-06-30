import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseResourcesPackageRecords } from "./one-roster-csv-resources-tables.js";
import type { OneRosterCsvResourcesPackage } from "./one-roster-csv-resources-types.js";
import { parseOneRosterCsvRosteringPackage } from "./one-roster-csv-rostering.js";
import { err, ok, type Result } from "./result.js";

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
} from "./one-roster-csv-resources-types.js";

/** Parse a OneRoster CSV ZIP archive into typed resources records and typed rostering records. */
export function parseOneRosterCsvResourcesZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const packageResult = parseOneRosterCsvZip(bytes, options);

  if (packageResult._tag === "err") {
    return err(packageResult.error);
  }

  return parseOneRosterCsvResourcesPackage(packageResult.value);
}

/** Parse an already-normalized OneRoster CSV package into typed resources records. */
export function parseOneRosterCsvResourcesPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const rosteringResult = parseOneRosterCsvRosteringPackage(packageValue);
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];

  if (rosteringResult._tag === "err") {
    diagnostics.push(...rosteringResult.error);
  }

  const records = parseResourcesPackageRecords(packageValue, diagnostics);

  if (diagnostics.length > 0 || rosteringResult._tag === "err") {
    return err(diagnostics);
  }

  return ok({
    rosteringPackage: rosteringResult.value,
    ...records,
  });
}
