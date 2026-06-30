import type { OneRosterCsvPackage, OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  parseOneRosterCsvLayeredPackage,
  parseOneRosterCsvLayeredZip,
} from "./one-roster-csv-layered-package.js";
import { parseResourcesPackageRecords } from "./one-roster-csv-resources-tables.js";
import type { OneRosterCsvResourcesPackage } from "./one-roster-csv-resources-types.js";
import type { Result } from "./result.js";

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
  return parseOneRosterCsvLayeredZip(bytes, options, (pkg, _rosteringPackage, diagnostics) =>
    parseResourcesPackageRecords(pkg, diagnostics),
  );
}

/** Parse an already-normalized OneRoster CSV package into typed resources records. */
export function parseOneRosterCsvResourcesPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvLayeredPackage(packageValue, (pkg, _rosteringPackage, diagnostics) =>
    parseResourcesPackageRecords(pkg, diagnostics),
  );
}
