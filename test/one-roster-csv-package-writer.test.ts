import { describe, expect, it } from "vitest";

import {
  parseOneRosterCsvPackageEntries,
  parseOneRosterCsvZip,
  writeOneRosterCsvPackageEntries,
  writeOneRosterCsvPackageZip,
  type OneRosterCsvPackage,
  type OneRosterManifestFileModes,
} from "../src/index.js";
import {
  csvDocument,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import { expectPackageWriteErr, expectPackageWriteOk } from "./fixtures/result-assertions.js";

describe("writeOneRosterCsvPackageEntries", () => {
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
