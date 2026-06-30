/** Canonical OneRoster 1.2 CSV data file names, excluding manifest.csv. */
export const oneRosterCsvDataFileNames = [
  "academicSessions.csv",
  "categories.csv",
  "classes.csv",
  "classResources.csv",
  "courseResources.csv",
  "courses.csv",
  "demographics.csv",
  "enrollments.csv",
  "lineItemLearningObjectiveIds.csv",
  "lineItems.csv",
  "lineItemScoreScales.csv",
  "orgs.csv",
  "resources.csv",
  "resultLearningObjectiveIds.csv",
  "results.csv",
  "resultScoreScales.csv",
  "roles.csv",
  "scoreScales.csv",
  "userProfiles.csv",
  "userResources.csv",
  "users.csv",
] as const;

/** Canonical OneRoster 1.2 CSV data file name, excluding manifest.csv. */
export type OneRosterCsvDataFileName = (typeof oneRosterCsvDataFileNames)[number];

/** Canonical OneRoster 1.2 CSV file name. */
export type OneRosterCsvFileName = "manifest.csv" | OneRosterCsvDataFileName;

/** Canonical OneRoster 1.2 CSV file names. */
export const oneRosterCsvFileNames: readonly OneRosterCsvFileName[] = [
  "manifest.csv",
  ...oneRosterCsvDataFileNames,
];

const oneRosterCsvDataFileNameSet = new Set<string>(oneRosterCsvDataFileNames);
const oneRosterCsvFileNameSet = new Set<string>(oneRosterCsvFileNames);

/** Return whether a string is a canonical OneRoster 1.2 CSV data file name. */
export function isOneRosterCsvDataFileName(input: string): input is OneRosterCsvDataFileName {
  return oneRosterCsvDataFileNameSet.has(input);
}

/** Return whether a string is a canonical OneRoster 1.2 CSV file name. */
export function isOneRosterCsvFileName(input: string): input is OneRosterCsvFileName {
  return oneRosterCsvFileNameSet.has(input);
}
