import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseGradebookPackageRecords } from "./one-roster-csv-gradebook-tables.js";
import type { OneRosterCsvGradebookPackage } from "./one-roster-csv-gradebook-types.js";
import { parseOneRosterCsvRosteringPackage } from "./one-roster-csv-rostering.js";
import { err, ok, type Result } from "./result.js";

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
  const packageResult = parseOneRosterCsvZip(bytes, options);

  if (packageResult._tag === "err") {
    return err(packageResult.error);
  }

  return parseOneRosterCsvGradebookPackage(packageResult.value);
}

/** Parse an already-normalized OneRoster CSV package into typed gradebook records. */
export function parseOneRosterCsvGradebookPackage(
  packageValue: OneRosterCsvPackage,
): Result<OneRosterCsvGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const rosteringResult = parseOneRosterCsvRosteringPackage(packageValue);
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];

  if (rosteringResult._tag === "err") {
    diagnostics.push(...rosteringResult.error);
  }

  const records = parseGradebookPackageRecords(packageValue, diagnostics);

  if (diagnostics.length > 0 || rosteringResult._tag === "err") {
    return err(diagnostics);
  }

  return ok({
    rosteringPackage: rosteringResult.value,
    ...records,
  });
}
