import { describe, expect, it } from "vitest";

import { parseAndValidateOneRosterCsvRosteringZip } from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import { expectValidatedErr } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { rosteringModes } from "./fixtures/one-roster-csv-rostering-packages.js";
import {
  orgRow,
  orgsCsv,
  roleRow,
  rolesCsv,
  userProfileRow,
  userProfilesCsv,
  userRow,
  usersCsv,
} from "./fixtures/one-roster-csv-rostering-rows.js";
import {
  missingReferenceRecordScenarios,
  missingTargetFileScenarios,
} from "./fixtures/one-roster-csv-rostering-validation-scenarios.js";

describe("validateOneRosterCsvRosteringPackage references", () => {
  for (const scenario of missingTargetFileScenarios()) {
    it(`rejects bulk references to absent target files for ${scenario.name}`, () => {
      const result = parseAndValidateOneRosterCsvRosteringZip(zipPackage(scenario.files));

      expect(expectValidatedErr(result)).toEqual(
        expect.arrayContaining([...scenario.expectedDiagnostics]),
      );
    });
  }

  for (const scenario of missingReferenceRecordScenarios()) {
    it(`rejects missing target records for ${scenario.name}`, () => {
      const result = parseAndValidateOneRosterCsvRosteringZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: rosteringModes("bulk") }),
          ...scenario.files,
        }),
      );

      expect(expectValidatedErr(result)).toContainEqual(
        expect.objectContaining({
          code: "reference.missing_target_record",
          fileName: scenario.sourceFile,
          rowNumber: scenario.rowNumber,
          field: scenario.field,
          expected: scenario.targetFile,
          actual: "missing",
        }),
      );
    });
  }

  it("validates roles.userProfileSourcedId against typed userProfiles.csv records", () => {
    const result = parseAndValidateOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["users.csv", "bulk"],
            ["roles.csv", "bulk"],
            ["userProfiles.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" })]),
        "users.csv": usersCsv([userRow({ sourcedId: "user-1", username: "user-1" })]),
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-not-yet-typed",
          }),
        ]),
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-1" }),
        ]),
      }),
    );

    expect(expectValidatedErr(result)).toContainEqual(
      expect.objectContaining({
        code: "reference.missing_target_record",
        fileName: "roles.csv",
        rowNumber: 2,
        field: "userProfileSourcedId",
        expected: "userProfiles.csv",
        actual: "missing",
      }),
    );
  });
});
