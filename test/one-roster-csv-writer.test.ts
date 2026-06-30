import { describe, expect, it } from "vitest";

import {
  parseOneRosterCsvRosteringZip,
  parseOneRosterCsvZip,
  writeOneRosterCsvRosteringZip,
} from "../src/index.js";
import {
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import { expectRosteringOk } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { expectPackageWriteOk } from "./fixtures/result-assertions.js";
import { userRow, usersCsv } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("typed OneRoster CSV writers", () => {
  it("writes delta lifecycle cells and manifest modes", () => {
    const packageValue = expectRosteringOk(
      parseOneRosterCsvRosteringZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
          "users.csv": usersCsv([
            userRow({
              status: "active",
              dateLastModified: "2025-01-01T00:00:00.000Z",
            }),
          ]),
        }),
      ),
    );

    const generatedZip = expectPackageWriteOk(writeOneRosterCsvRosteringZip(packageValue));
    const rawRoundTrip = expectPackageOk(parseOneRosterCsvZip(generatedZip));
    const usersTable = rawRoundTrip.tables.find((table) => table.fileName === "users.csv");

    expect(rawRoundTrip.manifest.fileModes["users.csv"]).toBe("delta");
    expect(usersTable?.rows[0]?.values.slice(0, 3)).toEqual([
      "user-1",
      "active",
      "2025-01-01T00:00:00.000Z",
    ]);
  });
});
