import type { OneRosterCsvPackage, OneRosterCsvPackageOptions } from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import {
  parseOneRosterCsvLayeredPackage,
  parseOneRosterCsvLayeredZip,
} from "./one-roster-csv-layered-package.js";
import { parseGradebookPackageRecords } from "./one-roster-csv-gradebook-tables.js";
import type { OneRosterCsvGradebookPackage } from "./one-roster-csv-gradebook-types.js";
import type { Result } from "./result.js";

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
} from "./one-roster-csv-gradebook-types.js";

/** Parse a OneRoster CSV ZIP archive into typed gradebook records and typed rostering records. */
export function parseOneRosterCsvGradebookZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvLayeredZip(bytes, options, (pkg, _rosteringPackage, diagnostics) =>
    parseGradebookPackageRecords(pkg, diagnostics),
  );
}

/** Parse an already-normalized OneRoster CSV package into typed gradebook records. */
export function parseOneRosterCsvGradebookPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvLayeredPackage(packageValue, (pkg, _rosteringPackage, diagnostics) =>
    parseGradebookPackageRecords(pkg, diagnostics),
  );
}
