import { describe, expect, it } from "vitest";

import {
  parseOneRosterCsvRosteringPackage,
  parseOneRosterCsvRosteringZip,
  parseOneRosterCsvZip,
  type OneRosterCsvPackageDiagnostic,
  type OneRosterCsvRosteringPackage,
  type Result,
} from "../src/index.js";
import {
  csvDocument,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";

const academicSessionHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "type",
  "startDate",
  "endDate",
  "parentSourcedId",
  "schoolYear",
] as const;

const orgHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "name",
  "type",
  "identifier",
  "parentSourcedId",
] as const;

const courseHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "schoolYearSourcedId",
  "title",
  "courseCode",
  "grades",
  "orgSourcedId",
  "subjects",
  "subjectCodes",
] as const;

const classHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "grades",
  "courseSourcedId",
  "classCode",
  "classType",
  "location",
  "schoolSourcedId",
  "termSourcedIds",
  "subjects",
  "subjectCodes",
  "periods",
] as const;

const userHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "enabledUser",
  "username",
  "userIds",
  "givenName",
  "familyName",
  "middleName",
  "identifier",
  "email",
  "sms",
  "phone",
  "agentSourcedIds",
  "grades",
  "password",
  "userMasterIdentifier",
  "preferredGivenName",
  "preferredMiddleName",
  "preferredFamilyName",
  "primaryOrgSourcedId",
  "pronouns",
] as const;

const roleHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "userSourcedId",
  "roleType",
  "role",
  "beginDate",
  "endDate",
  "orgSourcedId",
  "userProfileSourcedId",
] as const;

const enrollmentHeader = [
  "sourcedId",
  "status",
  "dateLastModified",
  "classSourcedId",
  "schoolSourcedId",
  "userSourcedId",
  "role",
  "primary",
  "beginDate",
  "endDate",
] as const;

describe("parseOneRosterCsvRosteringZip", () => {
  it("parses valid bulk records for the seven core rostering files", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: rosteringModes("bulk") }),
        ...validBulkRosteringFiles(),
      }),
    );

    const packageValue = expectRosteringOk(result);

    expect(packageValue.academicSessions).toHaveLength(1);
    expect(packageValue.orgs).toHaveLength(1);
    expect(packageValue.courses).toHaveLength(1);
    expect(packageValue.classes).toHaveLength(1);
    expect(packageValue.users).toHaveLength(1);
    expect(packageValue.roles).toHaveLength(1);
    expect(packageValue.enrollments).toHaveLength(1);
    expect(packageValue.academicSessions[0]?.lifecycle).toEqual({ mode: "bulk" });
    expect(packageValue.classes[0]?.termSourcedIds).toEqual(["as-1"]);
    expect(packageValue.users[0]?.enabledUser).toBe(true);
    expect(packageValue.users[0]?.grades).toEqual(["9"]);
    expect(packageValue.roles[0]?.role).toBe("teacher");
    expect(packageValue.enrollments[0]?.primary).toBe(true);
  });

  it("parses valid delta lifecycle fields", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
        "users.csv": usersCsv([
          [
            "user-2",
            "active",
            "2025-01-02T03:04:05.006Z",
            "false",
            "user-2",
            "",
            "Given",
            "Family",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]),
      }),
    );

    const packageValue = expectRosteringOk(result);

    expect(packageValue.users[0]?.lifecycle).toEqual({
      mode: "delta",
      status: "active",
      dateLastModified: "2025-01-02T03:04:05.006Z",
    });
    expect(packageValue.users[0]?.enabledUser).toBe(false);
  });

  it("rejects lifecycle values that violate bulk and delta mode rules", () => {
    const bulkResult = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": usersCsv([
          [
            "user-3",
            "active",
            "2025-01-02T03:04:05.006Z",
            "true",
            "user-3",
            "",
            "Given",
            "Family",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]),
      }),
    );
    const deltaResult = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
        "users.csv": usersCsv([
          [
            "user-4",
            "",
            "",
            "true",
            "user-4",
            "",
            "Given",
            "Family",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]),
      }),
    );

    expect(expectRosteringErr(bulkResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "users.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "users.csv",
          field: "dateLastModified",
        }),
      ]),
    );
    expect(expectRosteringErr(deltaResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "users.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "users.csv",
          field: "dateLastModified",
        }),
      ]),
    );
  });

  it("validates exact headers and metadata placement", () => {
    const metadataResult = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
        "users.csv": csvDocument(
          [...userHeader, "metadata.localCode"],
          [
            [
              "user-5",
              "",
              "",
              "true",
              "user-5",
              "",
              "Given",
              "Family",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "local-5",
            ],
          ],
        ),
      }),
    );
    const wrongCaseResult = parseOneRosterCsvRosteringZip(
      usersOnlyPackage(csvDocument(["SourcedId", ...userHeader.slice(1)], [validBulkUserRow()])),
    );
    const missingHeaderResult = parseOneRosterCsvRosteringZip(
      usersOnlyPackage(csvDocument(userHeader.slice(0, -1), [validBulkUserRow().slice(0, -1)])),
    );
    const metadataInWrongPositionResult = parseOneRosterCsvRosteringZip(
      usersOnlyPackage(
        csvDocument(
          [
            "sourcedId",
            "status",
            "dateLastModified",
            "enabledUser",
            "metadata.localCode",
            ...userHeader.slice(4),
          ],
          [["user-6", "", "", "true", "local-6", ...validBulkUserRow().slice(4)]],
        ),
      ),
    );
    const invalidExtraHeaderResult = parseOneRosterCsvRosteringZip(
      usersOnlyPackage(csvDocument([...userHeader, "extra"], [[...validBulkUserRow(), "x"]])),
    );

    expect(expectRosteringOk(metadataResult).users[0]?.metadata).toEqual({
      "metadata.localCode": "local-5",
    });
    expect(expectRosteringErr(wrongCaseResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "schema.header_order_mismatch",
          fileName: "users.csv",
          field: "sourcedId",
        }),
        expect.objectContaining({
          code: "schema.missing_header",
          fileName: "users.csv",
          field: "sourcedId",
        }),
      ]),
    );
    expect(expectRosteringErr(missingHeaderResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.missing_header",
        fileName: "users.csv",
        field: "pronouns",
      }),
    );
    expect(expectRosteringErr(metadataInWrongPositionResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.metadata_column_position",
        fileName: "users.csv",
        field: "username",
      }),
    );
    expect(expectRosteringErr(invalidExtraHeaderResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.invalid_metadata_header",
        fileName: "users.csv",
        field: "extra",
      }),
    );
  });

  it("validates required values, primitives, vocabularies, and list cells", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["academicSessions.csv", "bulk"],
            ["roles.csv", "bulk"],
            ["users.csv", "bulk"],
          ]),
        }),
        "academicSessions.csv": csvDocument(academicSessionHeader, [
          ["bad|id", "", "", "", "quarter", "2025-02-30", "2025-06-01", "", "20A5"],
        ]),
        "roles.csv": csvDocument(roleHeader, [
          ["role-2", "", "", "user-1", "ext:primary", "teacher", "", "", "org-1", ""],
        ]),
        "users.csv": usersCsv([
          [
            "user-7",
            "",
            "",
            "yes",
            "user-7",
            "a,,b",
            "Given",
            "Family",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]),
      }),
    );

    const codes = expectRosteringErr(result).map((diagnostic) => diagnostic.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "row.invalid_guid",
        "row.missing_required_value",
        "row.invalid_enum",
        "row.invalid_date",
        "row.invalid_year",
        "row.invalid_boolean",
        "row.invalid_list",
      ]),
    );
  });

  it("accepts ext vocabulary only on spec-allowed rostering fields", () => {
    const classResult = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["classes.csv", "bulk"]]) }),
        "classes.csv": csvDocument(classHeader, [
          [
            "class-2",
            "",
            "",
            "Class Two",
            "",
            "course-1",
            "",
            "ext:lab",
            "",
            "org-1",
            "as-1",
            "",
            "",
            "",
          ],
        ]),
      }),
    );
    const roleTypeResult = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["roles.csv", "bulk"]]) }),
        "roles.csv": csvDocument(roleHeader, [
          ["role-3", "", "", "user-1", "ext:primary", "teacher", "", "", "org-1", ""],
        ]),
      }),
    );

    expect(expectRosteringOk(classResult).classes[0]?.classType).toBe("ext:lab");
    expect(expectRosteringErr(roleTypeResult)).toContainEqual(
      expect.objectContaining({
        code: "row.invalid_enum",
        fileName: "roles.csv",
        field: "roleType",
      }),
    );
  });

  it("keeps non-rostering tables raw and ignores them in typed rostering output", () => {
    const rawPackage = expectPackageOk(
      parseOneRosterCsvZip(
        zipPackage({
          "manifest.csv": manifestCsv({
            modes: new Map([
              ["categories.csv", "bulk"],
              ["users.csv", "bulk"],
            ]),
          }),
          "categories.csv": "sourcedId,title\ncategory-1,Category One",
          "users.csv": usersCsv([validBulkUserRow()]),
        }),
      ),
    );

    const packageValue = expectRosteringOk(parseOneRosterCsvRosteringPackage(rawPackage));

    expect(packageValue.rawPackage.tables.map((table) => table.fileName)).toEqual(
      expect.arrayContaining(["categories.csv", "users.csv"]),
    );
    expect(packageValue.users).toHaveLength(1);
    expect(packageValue.academicSessions).toEqual([]);
  });

  it("does not expose raw row values in diagnostics", () => {
    const result = parseOneRosterCsvRosteringZip(
      usersOnlyPackage(
        usersCsv([
          [
            "private|user",
            "",
            "",
            "maybe",
            "credential-user",
            "",
            "Given",
            "Family",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]),
      ),
    );

    const diagnosticsJson = JSON.stringify(expectRosteringErr(result));

    expect(diagnosticsJson).not.toContain("private|user");
    expect(diagnosticsJson).not.toContain("credential-user");
  });
});

function validBulkRosteringFiles(): Readonly<Record<string, string>> {
  return {
    "academicSessions.csv": csvDocument(academicSessionHeader, [
      ["as-1", "", "", "School Year", "schoolYear", "2024-08-01", "2025-06-01", "", "2025"],
    ]),
    "orgs.csv": csvDocument(orgHeader, [["org-1", "", "", "North School", "school", "NCES-1", ""]]),
    "courses.csv": csvDocument(courseHeader, [
      ["course-1", "", "", "as-1", "Algebra One", "ALG1", "9", "org-1", "Math", "MATH"],
    ]),
    "classes.csv": csvDocument(classHeader, [
      [
        "class-1",
        "",
        "",
        "Algebra One A",
        "9",
        "course-1",
        "A1",
        "scheduled",
        "Room 101",
        "org-1",
        "as-1",
        "Math",
        "MATH",
        "1",
      ],
    ]),
    "users.csv": usersCsv([validBulkUserRow()]),
    "roles.csv": csvDocument(roleHeader, [
      ["role-1", "", "", "user-1", "primary", "teacher", "2024-08-01", "", "org-1", ""],
    ]),
    "enrollments.csv": csvDocument(enrollmentHeader, [
      ["enrollment-1", "", "", "class-1", "org-1", "user-1", "teacher", "true", "2024-08-01", ""],
    ]),
  };
}

function validBulkUserRow(): readonly string[] {
  return [
    "user-1",
    "",
    "",
    "true",
    "user-1",
    "",
    "Given",
    "Family",
    "",
    "",
    "",
    "",
    "",
    "",
    "9",
    "",
    "",
    "",
    "",
    "",
    "org-1",
    "",
  ];
}

function usersCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(userHeader, rows);
}

function usersOnlyPackage(users: string): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
    "users.csv": users,
  });
}

function rosteringModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([
    ["academicSessions.csv", mode],
    ["orgs.csv", mode],
    ["courses.csv", mode],
    ["classes.csv", mode],
    ["users.csv", mode],
    ["roles.csv", mode],
    ["enrollments.csv", mode],
  ]);
}

function expectRosteringOk(
  result: Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvRosteringPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected rostering parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

function expectRosteringErr(
  result: Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected rostering parse to fail.");
  }

  return result.error;
}
