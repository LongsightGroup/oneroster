import {
  isOneRosterCsvDataFileName,
  type OneRosterCsvDataFileName,
} from "../../src/one-roster-csv-file.js";
import type { OneRosterCsvPackageDiagnosticCode } from "../../src/one-roster-csv-package-diagnostic.js";
import { validBulkFullGraphFiles } from "./one-roster-csv-full-packages.js";
import { validBulkGradebookFiles } from "./one-roster-csv-gradebook-packages.js";
import { validBulkResourcesFiles } from "./one-roster-csv-resources-packages.js";
import { validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";
import {
  fullConformanceZip,
  gradebookConformanceZip,
  manifestOnlyConformanceZip,
  resourcesConformanceZip,
  rosteringConformanceZip,
} from "./conformance-zip-builders.js";

export type OneRosterCsvConformanceMode = "bulk" | "delta";
export type OneRosterCsvConformanceProfile =
  | "package"
  | "rostering"
  | "gradebook"
  | "resources"
  | "full";

export type OneRosterCsvConformanceValidScenario = {
  readonly name: string;
  readonly profile: OneRosterCsvConformanceProfile;
  readonly mode?: OneRosterCsvConformanceMode;
  readonly bytes: () => Uint8Array;
  readonly suppliedFiles: readonly OneRosterCsvDataFileName[];
};

export type OneRosterCsvConformanceNegativeOperation =
  | "parsePackage"
  | "parseFull"
  | "validateFull";

export type OneRosterCsvConformanceNegativeScenario = {
  readonly name: string;
  readonly operation: OneRosterCsvConformanceNegativeOperation;
  readonly bytes: () => Uint8Array;
  readonly expectedCodes: readonly OneRosterCsvPackageDiagnosticCode[];
};

export const diagnosticSafetyTokens = [
  "safety-sourced-id",
  "safety-username",
  "safety-password",
  "safety-comment",
  "999",
  "safety-text-score",
  "safety-learning-objective-id",
  "safety-vendor-resource-id",
  "safety-demographic-value",
] as const;

const rosteringSuppliedFiles = suppliedFilesFromRecord(validBulkGraphFiles("bulk"));
const gradebookSuppliedFiles = suppliedFilesFromRecord({
  ...validBulkGraphFiles("bulk"),
  ...validBulkGradebookFiles("bulk"),
});
const resourcesSuppliedFiles = suppliedFilesFromRecord({
  ...validBulkGraphFiles("bulk"),
  ...validBulkResourcesFiles("bulk"),
});
const fullSuppliedFiles = suppliedFilesFromRecord(validBulkFullGraphFiles("bulk"));

export const validConformanceScenarios: readonly OneRosterCsvConformanceValidScenario[] = [
  {
    name: "manifest-only package",
    profile: "package",
    bytes: manifestOnlyConformanceZip,
    suppliedFiles: [],
  },
  {
    name: "rostering bulk package",
    profile: "rostering",
    mode: "bulk",
    bytes: () => rosteringConformanceZip("bulk"),
    suppliedFiles: rosteringSuppliedFiles,
  },
  {
    name: "rostering delta package",
    profile: "rostering",
    mode: "delta",
    bytes: () => rosteringConformanceZip("delta"),
    suppliedFiles: rosteringSuppliedFiles,
  },
  {
    name: "gradebook bulk package",
    profile: "gradebook",
    mode: "bulk",
    bytes: () => gradebookConformanceZip("bulk"),
    suppliedFiles: gradebookSuppliedFiles,
  },
  {
    name: "gradebook delta package",
    profile: "gradebook",
    mode: "delta",
    bytes: () => gradebookConformanceZip("delta"),
    suppliedFiles: gradebookSuppliedFiles,
  },
  {
    name: "resources bulk package",
    profile: "resources",
    mode: "bulk",
    bytes: () => resourcesConformanceZip("bulk"),
    suppliedFiles: resourcesSuppliedFiles,
  },
  {
    name: "resources delta package",
    profile: "resources",
    mode: "delta",
    bytes: () => resourcesConformanceZip("delta"),
    suppliedFiles: resourcesSuppliedFiles,
  },
  {
    name: "full bulk package",
    profile: "full",
    mode: "bulk",
    bytes: () => fullConformanceZip("bulk"),
    suppliedFiles: fullSuppliedFiles,
  },
  {
    name: "full delta package",
    profile: "full",
    mode: "delta",
    bytes: () => fullConformanceZip("delta"),
    suppliedFiles: fullSuppliedFiles,
  },
];

function suppliedFilesFromRecord(
  files: Readonly<Record<string, string>>,
): readonly OneRosterCsvDataFileName[] {
  return Object.keys(files).filter((fileName): fileName is OneRosterCsvDataFileName =>
    isOneRosterCsvDataFileName(fileName),
  );
}
