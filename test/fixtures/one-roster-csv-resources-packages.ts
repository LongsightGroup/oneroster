import {
  conformanceLifecycleFields,
  type ConformanceLifecycleMode,
} from "./conformance-lifecycle.js";
import { manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import { rosteringModes, validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";
import {
  classResourceRow,
  classResourcesCsv,
  courseResourceRow,
  courseResourcesCsv,
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./one-roster-csv-resources-rows.js";

/** Build manifest file modes for all typed resources CSV files. */
export function resourcesModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([
    ["resources.csv", mode],
    ["classResources.csv", mode],
    ["courseResources.csv", mode],
    ["userResources.csv", mode],
  ]);
}

/** Build manifest file modes for all typed rostering and resources CSV files. */
export function resourcesAndRosteringModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([...rosteringModes(mode), ...resourcesModes(mode)]);
}

/** Build a minimal valid typed resources package with one record per file. */
export function validBulkResourcesFiles(
  mode: ConformanceLifecycleMode = "bulk",
): Readonly<Record<string, string>> {
  const lifecycle = conformanceLifecycleFields(mode);

  return {
    "resources.csv": resourcesCsv([resourceRow(lifecycle)]),
    "classResources.csv": classResourcesCsv([classResourceRow(lifecycle)]),
    "courseResources.csv": courseResourcesCsv([courseResourceRow(lifecycle)]),
    "userResources.csv": userResourcesCsv([userResourceRow(lifecycle)]),
  };
}

/** Build a ZIP archive containing a complete bulk rostering plus resources graph. */
export function validBulkResourcesGraphZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
    ...validBulkGraphFiles(),
    ...validBulkResourcesFiles(),
  });
}
