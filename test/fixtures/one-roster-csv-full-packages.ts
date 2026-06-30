import {
  gradebookAndRosteringModes,
  validBulkGradebookFiles,
} from "./one-roster-csv-gradebook-packages.js";
import { manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import { resourcesModes, validBulkResourcesFiles } from "./one-roster-csv-resources-packages.js";
import { validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";

/** Build manifest file modes for all typed OneRoster CSV files. */
export function fullCsvModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([...gradebookAndRosteringModes(mode), ...resourcesModes(mode)]);
}

/** Build a ZIP archive containing complete bulk rostering, gradebook, and resources graphs. */
export function validBulkFullGraphZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkGraphFiles(),
    ...validBulkGradebookFiles(),
    ...validBulkResourcesFiles(),
  });
}

/** Build complete rostering, gradebook, and resources files. */
export function validBulkFullGraphFiles(
  mode: "bulk" | "delta" = "bulk",
): Readonly<Record<string, string>> {
  return {
    ...validBulkGraphFiles(mode),
    ...validBulkGradebookFiles(mode),
    ...validBulkResourcesFiles(mode),
  };
}
