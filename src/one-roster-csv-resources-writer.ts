import type { OneRosterCsvResourcesPackage } from "./one-roster-csv-resources-types.js";
import { writeOneRosterCsvLayeredPackageZip } from "./one-roster-csv-layered-package.js";
import type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
import { writeResourcesPackageTables } from "./one-roster-csv-resources-tables.js";
import { writeRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";
import type { Result } from "./result.js";

/** Write a typed OneRoster CSV resources package into ZIP bytes. */
export function writeOneRosterCsvResourcesZip(
  packageValue: OneRosterCsvResourcesPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvLayeredPackageZip(
    packageValue.rosteringPackage,
    (rosteringPackage, diagnostics) => [
      ...writeRosteringPackageTables(rosteringPackage, diagnostics),
      ...writeResourcesPackageTables(packageValue, diagnostics),
    ],
    options,
  );
}
