/** Canonical OneRoster 1.2 CSV file names. */
export const oneRosterCsvFileNames = [
  "manifest.csv",
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

/** Canonical OneRoster 1.2 CSV file name. */
export type OneRosterCsvFileName = (typeof oneRosterCsvFileNames)[number];

const oneRosterCsvFileNameSet = new Set<string>(oneRosterCsvFileNames);

/** Return whether a string is a canonical OneRoster 1.2 CSV file name. */
export function isOneRosterCsvFileName(input: string): input is OneRosterCsvFileName {
  return oneRosterCsvFileNameSet.has(input);
}
