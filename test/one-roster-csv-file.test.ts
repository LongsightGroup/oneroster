import { describe, expect, it } from "vitest";

import { isOneRosterCsvFileName, oneRosterCsvFileNames } from "../src/index.js";

describe("oneRosterCsvFileNames", () => {
  it("includes the complete OneRoster 1.2 CSV binding file catalog", () => {
    expect(oneRosterCsvFileNames).toEqual([
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
    ]);
  });

  it("treats names as case-sensitive", () => {
    expect(isOneRosterCsvFileName("users.csv")).toBe(true);
    expect(isOneRosterCsvFileName("Users.csv")).toBe(false);
  });
});
