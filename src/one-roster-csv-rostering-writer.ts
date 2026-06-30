import { writeOneRosterCsvLayeredPackageZip } from "./one-roster-csv-layered-package.js";
import type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
import { writeRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";
import type { Result } from "./result.js";

/** Write a typed OneRoster CSV rostering package into ZIP bytes. */
export function writeOneRosterCsvRosteringZip(
  packageValue: OneRosterCsvRosteringPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvLayeredPackageZip(
    packageValue,
    (rosteringPackage, diagnostics) => writeRosteringPackageTables(rosteringPackage, diagnostics),
    options,
  );
}
