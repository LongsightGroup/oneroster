import type { OneRosterCsvDataFileName } from "../../src/one-roster-csv-file.js";
import type { OneRosterCsvPackageDiagnosticCode } from "../../src/one-roster-csv-package-diagnostic.js";
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

const rosteringSuppliedFiles = [
  "academicSessions.csv",
  "orgs.csv",
  "courses.csv",
  "classes.csv",
  "users.csv",
  "roles.csv",
  "enrollments.csv",
  "demographics.csv",
  "userProfiles.csv",
] as const satisfies readonly OneRosterCsvDataFileName[];

const gradebookOnlySuppliedFiles = [
  "categories.csv",
  "lineItems.csv",
  "results.csv",
  "scoreScales.csv",
  "lineItemLearningObjectiveIds.csv",
  "lineItemScoreScales.csv",
  "resultLearningObjectiveIds.csv",
  "resultScoreScales.csv",
] as const satisfies readonly OneRosterCsvDataFileName[];

const resourcesOnlySuppliedFiles = [
  "resources.csv",
  "classResources.csv",
  "courseResources.csv",
  "userResources.csv",
] as const satisfies readonly OneRosterCsvDataFileName[];

const gradebookSuppliedFiles = [
  ...rosteringSuppliedFiles,
  ...gradebookOnlySuppliedFiles,
] as const satisfies readonly OneRosterCsvDataFileName[];

const resourcesSuppliedFiles = [
  ...rosteringSuppliedFiles,
  ...resourcesOnlySuppliedFiles,
] as const satisfies readonly OneRosterCsvDataFileName[];

const fullSuppliedFiles = [
  ...rosteringSuppliedFiles,
  ...gradebookOnlySuppliedFiles,
  ...resourcesOnlySuppliedFiles,
] as const satisfies readonly OneRosterCsvDataFileName[];

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
