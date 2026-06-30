import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import { isManifestDataFilePresent } from "./one-roster-csv-manifest.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type {
  OneRosterCsvReferenceValidationContext,
  OneRosterCsvReferenceValidationMode,
} from "./one-roster-csv-record-reference-validation.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";

/** Base context shared by profile reference validators. */
export type OneRosterCsvProfileReferenceValidationContextBase<TPackage, TIndexes> =
  OneRosterCsvReferenceValidationContext<TPackage> & {
    readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
    readonly indexes: TIndexes;
  };

/** Return whether a manifest-backed profile target file is present in the package. */
export function createProfileManifestPresenceChecker(
  rosteringPackage: OneRosterCsvRosteringPackage,
): (targetFileName: OneRosterCsvDataFileName) => boolean {
  return (targetFileName) =>
    isManifestDataFilePresent(rosteringPackage.manifest.fileModes, targetFileName);
}

/** Build the shared profile reference-validation context fields. */
export function buildProfileReferenceValidationContextBase<TPackage, TIndexes>(
  packageValue: TPackage,
  rosteringPackage: OneRosterCsvRosteringPackage,
  rosteringIndexes: OneRosterCsvRosteringReferenceIndexes,
  indexes: TIndexes,
  diagnostics: OneRosterCsvPackageDiagnostic[],
  referenceMode: OneRosterCsvReferenceValidationMode,
): OneRosterCsvProfileReferenceValidationContextBase<TPackage, TIndexes> {
  return {
    packageValue,
    rosteringIndexes,
    indexes,
    diagnostics,
    referenceMode,
    isTargetFilePresent: createProfileManifestPresenceChecker(rosteringPackage),
  };
}
