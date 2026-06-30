import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvFullZip,
  parseAndValidateOneRosterCsvRosteringZip,
  parseOneRosterCsvPackageEntries,
  parseOneRosterCsvRosteringZip,
  parseOneRosterCsvZip,
  writeCsv,
  writeOneRosterCsvFullZip,
  writeOneRosterCsvRosteringZip,
  type OneRosterCsvDataFileName,
  type OneRosterManifestFileModes,
  type OneRosterCsvRosteringPackage,
} from "../src/index.js";
import {
  expectConformanceProfileValid,
  expectConformanceScenarioDiagnostics,
  roundTripConformanceProfile,
} from "./fixtures/conformance-profile-handlers.js";
import {
  diagnosticSafetyTokens,
  diagnosticSafetyZip,
  metadataConformanceZip,
  negativeConformanceScenarios,
  validConformanceScenarios,
  type OneRosterCsvConformanceValidScenario,
} from "./fixtures/one-roster-csv-conformance.js";
import {
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectRosteringOk,
  expectValidatedOk,
} from "./fixtures/one-roster-csv-rostering-assertions.js";
import { usersOnlyPackage } from "./fixtures/one-roster-csv-rostering-packages.js";
import { userRow, usersCsv } from "./fixtures/one-roster-csv-rostering-rows.js";
import {
  expectErr,
  expectOk,
  expectPackageWriteErr,
  onlyRecord,
} from "./fixtures/result-assertions.js";

describe("OneRoster CSV conformance corpus", () => {
  it.each(validConformanceScenarios)("accepts $name", (scenario) => {
    const bytes = scenario.bytes();
    const rawPackage = expectPackageOk(parseOneRosterCsvZip(bytes));

    expectSuppliedFiles(
      rawPackage.tables.map((table) => table.fileName),
      scenario.suppliedFiles,
    );
    expect(manifestModesForScenario(rawPackage.manifest.fileModes, scenario)).toEqual(
      expectedManifestModesForScenario(scenario),
    );

    expectConformanceProfileValid(scenario.profile, bytes);
  });

  it.each(validConformanceScenarios)("round trips $name through writer APIs", (scenario) => {
    const comparison = roundTripConformanceProfile(scenario.profile, scenario.bytes());

    expect(comparison.roundTrip).toEqual(comparison.original);
  });

  it.each(negativeConformanceScenarios)("rejects $name", (scenario) => {
    const diagnostics = expectConformanceScenarioDiagnostics(scenario);
    const codes = diagnostics.map((diagnostic) => diagnostic.code);

    for (const expectedCode of scenario.expectedCodes) {
      expect(codes).toContain(expectedCode);
    }
  });

  it("preserves metadata after spec headers and sorts metadata deterministically on write", () => {
    const parsed = expectOk(
      parseAndValidateOneRosterCsvFullZip(metadataConformanceZip(), {
        referenceMode: "allRows",
      }),
    );
    const written = expectOk(writeOneRosterCsvFullZip(parsed.fullPackage));
    const rawRoundTrip = expectPackageOk(parseOneRosterCsvZip(written));
    const usersTable = rawRoundTrip.tables.find((table) => table.fileName === "users.csv");

    expect(usersTable?.header.slice(-2)).toEqual(["metadata.alpha", "metadata.zeta"]);
    expect(parsed.fullPackage.rosteringPackage.users[0]?.metadata).toEqual({
      "metadata.alpha": "a-agent",
      "metadata.zeta": "z-agent",
    });
    expect(parsed.fullPackage.rosteringPackage.users[1]?.metadata).toEqual({
      "metadata.alpha": "a-user",
      "metadata.zeta": "z-user",
    });
  });

  it("keeps sensitive row payloads out of diagnostics", () => {
    const diagnostics = expectErr(
      parseAndValidateOneRosterCsvFullZip(diagnosticSafetyZip(), { referenceMode: "allRows" }),
    );
    const serializedDiagnostics = JSON.stringify(diagnostics);

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        "reference.duplicate_sourced_id",
        "reference.missing_target_record",
        "semantic.score_above_max",
        "semantic.invalid_case_learning_objective_id",
      ]),
    );

    for (const token of diagnosticSafetyTokens) {
      expect(serializedDiagnostics).not.toContain(token);
    }
  });

  it("accepts apostrophes, tabs, UTF-8, commas, quotes, and BOM text through public CSV APIs", () => {
    const csv = expectOk(
      writeCsv([
        ["sourcedId", "name", "note"],
        ["u1", "O'Connor\tTabbed", "Café"],
        ["u2", 'comma, quote "ok"', ""],
      ]),
    );

    expect(
      parseOneRosterCsvPackageEntries([
        {
          path: "manifest.csv",
          bytes: new TextEncoder().encode(
            `\uFEFF${manifestCsv({ modes: new Map([["users.csv", "bulk"]]) })}`,
          ),
        },
        {
          path: "users.csv",
          bytes: new TextEncoder().encode(csv),
        },
      ]),
    ).toMatchObject({
      _tag: "ok",
      value: {
        tables: [
          expect.objectContaining({
            rows: [
              expect.objectContaining({
                valuesByHeader: expect.objectContaining({
                  name: "O'Connor\tTabbed",
                  note: "Café",
                }),
              }),
              expect.objectContaining({
                valuesByHeader: expect.objectContaining({
                  name: 'comma, quote "ok"',
                }),
              }),
            ],
          }),
        ],
      },
    });
  });

  it("keeps writer failure diagnostics stable for unsafe constructed records", () => {
    const bulkPackage = expectRosteringOk(
      parseOneRosterCsvRosteringZip(usersOnlyPackage(usersCsv([userRow({ sourcedId: "user-1" })]))),
    );
    const deltaPackage = expectValidatedOk(
      parseAndValidateOneRosterCsvRosteringZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
          "users.csv": usersCsv([
            userRow({
              sourcedId: "user-2",
              status: "active",
              dateLastModified: "2025-01-02T03:04:05.006Z",
            }),
          ]),
        }),
      ),
    ).rosteringPackage;
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

    expect(
      expectPackageWriteErr(
        writeOneRosterCsvRosteringZip({
          ...bulkPackage,
          users: [{ ...bulkUser, metadata: { localCode: "unsafe" } }],
        }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "write.invalid_metadata_header",
        fileName: "users.csv",
        rowNumber: 2,
        expected: "metadata.*",
        actual: "invalid metadata header",
      }),
    );

    expect(
      expectPackageWriteErr(
        writeOneRosterCsvRosteringZip({
          ...bulkPackage,
          users: [{ ...bulkUser, username: "unsafe\nline" }],
        }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "csv.field_line_break",
        fileName: "users.csv",
        rowNumber: 2,
        columnNumber: 5,
      }),
    );
  });
});

function manifestModesForScenario(
  fileModes: OneRosterManifestFileModes,
  scenario: OneRosterCsvConformanceValidScenario,
): readonly string[] {
  const mode = scenario.mode;

  if (mode === undefined) {
    return [];
  }

  return scenario.suppliedFiles.map((fileName) => fileModes[fileName]);
}

function expectedManifestModesForScenario(
  scenario: OneRosterCsvConformanceValidScenario,
): readonly string[] {
  const mode = scenario.mode;

  if (mode === undefined) {
    return [];
  }

  return scenario.suppliedFiles.map(() => mode);
}

function expectSuppliedFiles(
  actual: readonly OneRosterCsvDataFileName[],
  expected: readonly OneRosterCsvDataFileName[],
): void {
  expect([...actual].toSorted()).toEqual([...expected].toSorted());
}
