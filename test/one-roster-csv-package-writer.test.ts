import { describe, expect, it } from "vitest";

import {
  createOneRosterManifestFileModes,
  parseOneRosterCsvPackageEntries,
  parseOneRosterCsvZip,
  readZipEntries,
  writeOneRosterCsvPackageEntries,
  writeOneRosterCsvPackageZip,
  writeOneRosterCsvPackageZipFromEntries,
  writeOneRosterCsvPackageZipFromFiles,
  type OneRosterCsvPackage,
  type OneRosterManifestFileModes,
} from "../src/index.js";
import {
  csvDocument,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectOk,
  expectPackageWriteErr,
  expectPackageWriteOk,
} from "./fixtures/result-assertions.js";

describe("writeOneRosterCsvPackageEntries", () => {
  it("builds complete manifest modes from supplied files and overrides", () => {
    const modes = createOneRosterManifestFileModes(["users.csv"], {
      "users.csv": "delta",
      "classes.csv": "absent",
      "orgs.csv": "bulk",
    });

    expect(Object.keys(modes)).toEqual([
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
    expect(modes["users.csv"]).toBe("delta");
    expect(modes["orgs.csv"]).toBe("bulk");
    expect(modes["classes.csv"]).toBe("absent");
    expect(modes["courses.csv"]).toBe("absent");
  });

  it("writes a manifest-only package", () => {
    const packageValue = expectPackageOk(
      parseOneRosterCsvZip(
        zipPackage({
          "manifest.csv": manifestCsv(),
        }),
      ),
    );

    const entries = expectPackageWriteOk(writeOneRosterCsvPackageEntries(packageValue));

    expect(entries.map((entry) => entry.path)).toEqual(["manifest.csv"]);
    expectPackageOk(parseOneRosterCsvPackageEntries(entries));
  });

  it("writes caller-supplied file maps directly into deterministic ZIP bytes", () => {
    const zipBytes = expectPackageWriteOk(
      writeOneRosterCsvPackageZipFromFiles({
        "users.csv": csvDocument(["sourcedId"], [["u1"]]),
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
      }),
    );
    const entries = expectOk(readZipEntries(zipBytes));

    expect(entries.map((entry) => entry.path)).toEqual(["manifest.csv", "users.csv"]);
    expectPackageOk(parseOneRosterCsvPackageEntries(entries));
  });

  it("rejects invalid direct ZIP entries before writing bytes", () => {
    expect(
      expectPackageWriteErr(
        writeOneRosterCsvPackageZipFromEntries([
          { path: "nested/users.csv", bytes: new Uint8Array() },
          { path: "extra.csv", bytes: new Uint8Array() },
          { path: "users.csv", bytes: new Uint8Array() },
          { path: "users.csv", bytes: new Uint8Array() },
        ]),
      ).map((diagnostic) => diagnostic.code),
    ).toEqual([
      "write.zip_entry_nested_path",
      "write.zip_unknown_file",
      "write.zip_entry_duplicate_name",
    ]);
  });

  it("writes supplied raw data tables into a parseable package ZIP", () => {
    const packageValue = expectPackageOk(
      parseOneRosterCsvZip(
        zipPackage({
          "manifest.csv": manifestCsv({
            modes: new Map([["users.csv", "bulk"]]),
            extraRows: ["source.systemName,Test SIS", "source.systemCode,SIS-1"],
          }),
          "users.csv": csvDocument(
            ["sourcedId", "username", "note"],
            [["u1", "O'Connor\tOne", 'comma, quote "ok"']],
          ),
        }),
      ),
    );

    const zipBytes = expectPackageWriteOk(writeOneRosterCsvPackageZip(packageValue));
    const roundTrip = expectPackageOk(parseOneRosterCsvZip(zipBytes));

    expect(roundTrip.manifest.source).toEqual({
      systemName: "Test SIS",
      systemCode: "SIS-1",
    });
    expect(roundTrip.tables).toEqual(packageValue.tables);
  });

  it("rejects a manifest-supplied file without a matching raw table", () => {
    const packageValue = expectPackageOk(
      parseOneRosterCsvZip(
        zipPackage({
          "manifest.csv": manifestCsv(),
        }),
      ),
    );
    const fileModes: OneRosterManifestFileModes = {
      ...packageValue.manifest.fileModes,
      "users.csv": "bulk",
    };
    const invalidPackage: OneRosterCsvPackage = {
      ...packageValue,
      manifest: {
        ...packageValue.manifest,
        fileModes,
      },
    };

    expect(expectPackageWriteErr(writeOneRosterCsvPackageEntries(invalidPackage))).toContainEqual(
      expect.objectContaining({
        code: "write.missing_table",
        fileName: "users.csv",
        expected: "bulk",
        actual: "missing",
      }),
    );
  });
});
