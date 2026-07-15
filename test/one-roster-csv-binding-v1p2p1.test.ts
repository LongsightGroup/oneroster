import { describe, expect, it } from "vitest";

import {
  oneRosterCsvBindingVersion,
  oneRosterCsvManifestOneRosterVersion,
  oneRosterCsvTableHeaders,
  parseOneRosterCsvRosteringZip,
  parseOneRosterCsvZip,
} from "../src/index.js";
import {
  csvDocument,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import { userHeader } from "./fixtures/one-roster-csv-rostering-headers.js";
import {
  expectRosteringErr,
  expectRosteringOk,
} from "./fixtures/one-roster-csv-rostering-assertions.js";
import { userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("OneRoster CSV Binding 1.2.1 corrections", () => {
  it("distinguishes the binding correction level from the manifest OneRoster version", () => {
    expect(oneRosterCsvBindingVersion).toBe("1.2.1");
    expect(oneRosterCsvManifestOneRosterVersion).toBe("1.2");

    const packageValue = expectPackageOk(
      parseOneRosterCsvZip(
        zipPackage({
          "manifest.csv": manifestCsv(),
        }),
      ),
    );

    expect(packageValue.manifest.oneRosterVersion).toBe(oneRosterCsvManifestOneRosterVersion);
  });

  it("uses the corrected users.csv schema without resourceSourcedIds", () => {
    expect(oneRosterCsvTableHeaders["users.csv"]).not.toContain("resourceSourcedIds");

    const legacyHeader = [
      ...userHeader.slice(0, 15),
      "resourceSourcedIds",
      ...userHeader.slice(15),
    ];
    const currentRow = userRow();
    const legacyRow = [...currentRow.slice(0, 15), "resource-1", ...currentRow.slice(15)];
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": csvDocument(legacyHeader, [legacyRow]),
      }),
    );

    expect(expectRosteringErr(result)).toContainEqual(
      expect.objectContaining({
        code: "schema.header_order_mismatch",
        fileName: "users.csv",
        rowNumber: 1,
        expected: "password",
        actual: "resourceSourcedIds",
      }),
    );
  });

  it("parses users grades as a string list and true/false vocabulary as normalized booleans", () => {
    const currentRow = userRow({ enabledUser: "false" });
    const correctedRow = [...currentRow.slice(0, 14), "9,10", ...currentRow.slice(15)];
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": csvDocument(userHeader, [correctedRow]),
      }),
    );
    const packageValue = expectRosteringOk(result);

    expect(packageValue.users[0]?.grades).toEqual(["9", "10"]);
    expect(packageValue.users[0]?.enabledUser).toBe(false);
  });

  it("reports invalid true/false enumeration values with vocabulary terminology", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": csvDocument(userHeader, [userRow({ enabledUser: "False" })]),
      }),
    );

    expect(expectRosteringErr(result)).toContainEqual(
      expect.objectContaining({
        code: "row.invalid_boolean",
        fileName: "users.csv",
        rowNumber: 2,
        field: "enabledUser",
        message: 'OneRoster true/false enumeration values must be "true" or "false".',
      }),
    );
  });
});
