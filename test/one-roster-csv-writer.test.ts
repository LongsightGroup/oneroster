import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvFullZip,
  parseAndValidateOneRosterCsvGradebookZip,
  parseAndValidateOneRosterCsvResourcesZip,
  parseAndValidateOneRosterCsvRosteringZip,
  parseOneRosterCsvFullZip,
  parseOneRosterCsvGradebookZip,
  parseOneRosterCsvResourcesZip,
  parseOneRosterCsvRosteringZip,
  parseOneRosterCsvZip,
  writeOneRosterCsvFullZip,
  writeOneRosterCsvGradebookZip,
  writeOneRosterCsvResourcesZip,
  writeOneRosterCsvRosteringZip,
  type OneRosterCsvPackageWriteDiagnostic,
  type OneRosterCsvRosteringPackage,
  type Result,
} from "../src/index.js";
import { expectFullOk, expectValidatedFullOk } from "./fixtures/one-roster-csv-full-assertions.js";
import {
  fullCsvModes,
  validBulkFullGraphFiles,
  validBulkFullGraphZip,
} from "./fixtures/one-roster-csv-full-packages.js";
import {
  expectGradebookOk,
  expectValidatedGradebookOk,
} from "./fixtures/one-roster-csv-gradebook-assertions.js";
import { validBulkGradebookGraphZip } from "./fixtures/one-roster-csv-gradebook-packages.js";
import {
  csvDocument,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectResourcesOk,
  expectValidatedResourcesOk,
} from "./fixtures/one-roster-csv-resources-assertions.js";
import { validBulkResourcesGraphZip } from "./fixtures/one-roster-csv-resources-packages.js";
import { userHeader } from "./fixtures/one-roster-csv-rostering-headers.js";
import {
  expectRosteringOk,
  expectValidatedOk,
} from "./fixtures/one-roster-csv-rostering-assertions.js";
import {
  usersOnlyPackage,
  validBulkGraphZip,
} from "./fixtures/one-roster-csv-rostering-packages.js";
import { userRow, usersCsv } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("typed OneRoster CSV writers", () => {
  it("writes parseable typed rostering, gradebook, resources, and full ZIP packages", () => {
    const rosteringPackage = expectRosteringOk(parseOneRosterCsvRosteringZip(validBulkGraphZip()));
    const gradebookPackage = expectGradebookOk(
      parseOneRosterCsvGradebookZip(validBulkGradebookGraphZip()),
    );
    const resourcesPackage = expectResourcesOk(
      parseOneRosterCsvResourcesZip(validBulkResourcesGraphZip()),
    );
    const fullPackage = expectFullOk(parseOneRosterCsvFullZip(validBulkFullGraphZip()));

    expectValidatedOk(
      parseAndValidateOneRosterCsvRosteringZip(
        expectPackageWriteOk(writeOneRosterCsvRosteringZip(rosteringPackage)),
      ),
    );
    expectValidatedGradebookOk(
      parseAndValidateOneRosterCsvGradebookZip(
        expectPackageWriteOk(writeOneRosterCsvGradebookZip(gradebookPackage)),
      ),
    );
    expectValidatedResourcesOk(
      parseAndValidateOneRosterCsvResourcesZip(
        expectPackageWriteOk(writeOneRosterCsvResourcesZip(resourcesPackage)),
      ),
    );
    const validatedFull = expectValidatedFullOk(
      parseAndValidateOneRosterCsvFullZip(
        expectPackageWriteOk(writeOneRosterCsvFullZip(fullPackage)),
      ),
    );

    expect(validatedFull.fullPackage).toEqual(fullPackage);
  });

  it("round trips a valid full package through parse-write-parse", () => {
    const original = expectFullOk(parseOneRosterCsvFullZip(validBulkFullGraphZip()));
    const generatedZip = expectPackageWriteOk(writeOneRosterCsvFullZip(original));
    const roundTrip = expectValidatedFullOk(parseAndValidateOneRosterCsvFullZip(generatedZip));

    expect(roundTrip.fullPackage).toEqual(original);
  });

  it("preserves metadata columns after spec headers in deterministic order", () => {
    const userRows = [
      [
        ...userRow({
          sourcedId: "user-agent",
          username: "user-agent",
          primaryOrgSourcedId: "org-1",
        }),
        "z-agent",
        "a-agent",
      ],
      [
        ...userRow({
          sourcedId: "user-1",
          username: "user-1",
          agentSourcedIds: "user-agent",
          primaryOrgSourcedId: "org-1",
        }),
        "z-user",
        "a-user",
      ],
    ];
    const packageValue = expectFullOk(
      parseOneRosterCsvFullZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
          ...validBulkFullGraphFiles(),
          "users.csv": csvDocument([...userHeader, "metadata.zeta", "metadata.alpha"], userRows),
        }),
      ),
    );

    const generatedZip = expectPackageWriteOk(writeOneRosterCsvFullZip(packageValue));
    const rawRoundTrip = expectPackageOk(parseOneRosterCsvZip(generatedZip));
    const usersTable = rawRoundTrip.tables.find((table) => table.fileName === "users.csv");
    const typedRoundTrip = expectFullOk(parseOneRosterCsvFullZip(generatedZip));

    expect(usersTable?.header.slice(-2)).toEqual(["metadata.alpha", "metadata.zeta"]);
    expect(typedRoundTrip.rosteringPackage.users[0]?.metadata).toEqual({
      "metadata.alpha": "a-agent",
      "metadata.zeta": "z-agent",
    });
    expect(typedRoundTrip.rosteringPackage.users[1]?.metadata).toEqual({
      "metadata.alpha": "a-user",
      "metadata.zeta": "z-user",
    });
  });

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

  it("rejects mixed lifecycle modes within one output file", () => {
    const bulkPackage = expectRosteringOk(
      parseOneRosterCsvRosteringZip(usersOnlyPackage(usersCsv([userRow({ sourcedId: "user-1" })]))),
    );
    const deltaPackage = expectRosteringOk(
      parseOneRosterCsvRosteringZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
          "users.csv": usersCsv([
            userRow({
              sourcedId: "user-2",
              status: "active",
              dateLastModified: "2025-01-01T00:00:00.000Z",
            }),
          ]),
        }),
      ),
    );
    const bulkUser = onlyRecord(bulkPackage.users);
    const deltaUser = onlyRecord(deltaPackage.users);
    const mixedPackage: OneRosterCsvRosteringPackage = {
      ...bulkPackage,
      users: [bulkUser, deltaUser],
    };

    expect(expectPackageWriteErr(writeOneRosterCsvRosteringZip(mixedPackage))).toContainEqual(
      expect.objectContaining({
        code: "write.mixed_lifecycle_modes",
        fileName: "users.csv",
        field: "status",
      }),
    );
  });

  it("rejects invalid metadata headers on user-constructed records", () => {
    const packageValue = expectRosteringOk(
      parseOneRosterCsvRosteringZip(usersOnlyPackage(usersCsv([userRow()]))),
    );
    const user = onlyRecord(packageValue.users);
    const invalidPackage: OneRosterCsvRosteringPackage = {
      ...packageValue,
      users: [{ ...user, metadata: { localCode: "x" } }],
    };

    expect(expectPackageWriteErr(writeOneRosterCsvRosteringZip(invalidPackage))).toContainEqual(
      expect.objectContaining({
        code: "write.invalid_metadata_header",
        fileName: "users.csv",
        rowNumber: 2,
        expected: "metadata.*",
        actual: "invalid metadata header",
      }),
    );
  });

  it("rejects output cells containing CR or LF", () => {
    const packageValue = expectRosteringOk(
      parseOneRosterCsvRosteringZip(usersOnlyPackage(usersCsv([userRow()]))),
    );
    const user = onlyRecord(packageValue.users);
    const invalidPackage: OneRosterCsvRosteringPackage = {
      ...packageValue,
      users: [{ ...user, username: "bad\nname" }],
    };

    expect(expectPackageWriteErr(writeOneRosterCsvRosteringZip(invalidPackage))).toContainEqual(
      expect.objectContaining({
        code: "csv.field_line_break",
        fileName: "users.csv",
        rowNumber: 2,
        columnNumber: 5,
      }),
    );
  });
});

function onlyRecord<T>(records: readonly T[]): T {
  const record = records[0];

  if (record === undefined || records.length !== 1) {
    throw new Error("Expected exactly one record.");
  }

  return record;
}

function expectPackageWriteOk<T>(
  result: Result<T, readonly OneRosterCsvPackageWriteDiagnostic[]>,
): T {
  if (result._tag === "err") {
    throw new Error(
      `Expected package write to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

function expectPackageWriteErr<T>(
  result: Result<T, readonly OneRosterCsvPackageWriteDiagnostic[]>,
): readonly OneRosterCsvPackageWriteDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected package write to fail.");
  }

  return result.error;
}
