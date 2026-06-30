import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { parseOneRosterCsvRosteringPackage } from "./one-roster-csv-rostering.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

/** Parse a OneRoster CSV ZIP archive into rostering records plus one profile record layer. */
export function parseOneRosterCsvLayeredZip<TProfileRecords>(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions,
  parseProfileRecords: (
    packageValue: OneRosterCsvPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ) => TProfileRecords,
): Result<
  { readonly rosteringPackage: OneRosterCsvRosteringPackage } & TProfileRecords,
  readonly OneRosterCsvPackageDiagnostic[]
> {
  const packageResult = parseOneRosterCsvZip(bytes, options);

  if (packageResult._tag === "err") {
    return err(packageResult.error);
  }

  return parseOneRosterCsvLayeredPackage(packageResult.value, parseProfileRecords);
}

/** Parse a normalized CSV package into rostering records plus one profile record layer. */
export function parseOneRosterCsvLayeredPackage<TProfileRecords>(
  packageValue: OneRosterCsvPackage,
  parseProfileRecords: (
    packageValue: OneRosterCsvPackage,
    diagnostics: OneRosterCsvPackageDiagnostic[],
  ) => TProfileRecords,
): Result<
  { readonly rosteringPackage: OneRosterCsvRosteringPackage } & TProfileRecords,
  readonly OneRosterCsvPackageDiagnostic[]
> {
  const rosteringResult = parseOneRosterCsvRosteringPackage(packageValue);
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];

  if (rosteringResult._tag === "err") {
    diagnostics.push(...rosteringResult.error);
  }

  const profileRecords = parseProfileRecords(packageValue, diagnostics);

  if (rosteringResult._tag === "err" || diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    rosteringPackage: rosteringResult.value,
    ...profileRecords,
  });
}
