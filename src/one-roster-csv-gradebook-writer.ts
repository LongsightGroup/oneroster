import type { OneRosterCsvGradebookPackage } from "./one-roster-csv-gradebook-types.js";
import { writeGradebookPackageTables } from "./one-roster-csv-gradebook-tables.js";
import { writeOneRosterCsvLayeredPackageZip } from "./one-roster-csv-layered-package.js";
import type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
import { writeRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";
import type { Result } from "./result.js";

/** Write a typed OneRoster CSV gradebook package into ZIP bytes. */
export function writeOneRosterCsvGradebookZip(
  packageValue: OneRosterCsvGradebookPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvLayeredPackageZip(
    packageValue.rosteringPackage,
    (rosteringPackage, diagnostics) => [
      ...writeRosteringPackageTables(rosteringPackage, diagnostics),
      ...writeGradebookPackageTables(packageValue, diagnostics),
    ],
    options,
  );
}
