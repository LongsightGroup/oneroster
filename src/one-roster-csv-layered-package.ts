import {
  parseOneRosterCsvZip,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageOptions,
} from "./one-roster-csv-package.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import { assembleOneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-tables.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import { err, ok, type Result } from "./result.js";

type LayeredProfileParser<TProfileRecords> = (
  packageValue: OneRosterCsvPackage,
  rosteringPackage: OneRosterCsvRosteringPackage | undefined,
  diagnostics: OneRosterCsvPackageDiagnostic[],
) => TProfileRecords;

/** Parse a OneRoster CSV ZIP archive into rostering records plus profile record layers. */
export function parseOneRosterCsvLayeredZip<TProfileRecords>(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions,
  parseProfileRecords: LayeredProfileParser<TProfileRecords>,
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

/** Parse a normalized CSV package into rostering records plus profile record layers. */
export function parseOneRosterCsvLayeredPackage<TProfileRecords>(
  packageValue: OneRosterCsvPackage,
  parseProfileRecords: LayeredProfileParser<TProfileRecords>,
): Result<
  { readonly rosteringPackage: OneRosterCsvRosteringPackage } & TProfileRecords,
  readonly OneRosterCsvPackageDiagnostic[]
> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const rosteringPackage = assembleOneRosterCsvRosteringPackage(packageValue, diagnostics);
  const profileRecords = parseProfileRecords(packageValue, rosteringPackage, diagnostics);

  if (rosteringPackage === undefined || diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    rosteringPackage,
    ...profileRecords,
  });
}
