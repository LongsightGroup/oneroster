import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import { writeGradebookPackageTables } from "./one-roster-csv-gradebook-tables.js";
import { writeOneRosterCsvLayeredPackageZip } from "./one-roster-csv-layered-package.js";
import type {
  OneRosterCsvPackageWriteDiagnostic,
  OneRosterCsvWriteOptions,
} from "./one-roster-csv-package-writer.js";
import { writeResourcesPackageTables } from "./one-roster-csv-resources-tables.js";
import { writeRosteringPackageTables } from "./one-roster-csv-rostering-tables.js";
import type { Result } from "./result.js";

/** Write a typed OneRoster CSV full package into ZIP bytes. */
export function writeOneRosterCsvFullZip(
  packageValue: OneRosterCsvFullPackage,
  options: OneRosterCsvWriteOptions = {},
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvLayeredPackageZip(
    packageValue.rosteringPackage,
    (rosteringPackage, diagnostics) => [
      ...writeRosteringPackageTables(rosteringPackage, diagnostics),
      ...writeGradebookPackageTables(packageValue.gradebookPackage, diagnostics),
      ...writeResourcesPackageTables(packageValue.resourcesPackage, diagnostics),
    ],
    options,
  );
}
