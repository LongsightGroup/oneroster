import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvRosteringZip,
  parseOneRosterCsvRosteringZip,
  validateOneRosterCsvRosteringPackage,
  type OneRosterCsvRosteringFileName,
} from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectRosteringOk,
  expectValidatedErr,
  expectValidatedOk,
  fixtureGuid,
} from "./fixtures/one-roster-csv-rostering-assertions.js";
import {
  rosteringModes,
  validBulkGraphFiles,
  validBulkGraphZip,
} from "./fixtures/one-roster-csv-rostering-packages.js";
import {
  academicSessionRow,
  academicSessionsCsv,
  classRow,
  classesCsv,
  courseRow,
  coursesCsv,
  demographicsCsv,
  demographicsRow,
  enrollmentRow,
  enrollmentsCsv,
  orgRow,
  orgsCsv,
  roleRow,
  rolesCsv,
  userProfileRow,
  userProfilesCsv,
  userRow,
  usersCsv,
} from "./fixtures/one-roster-csv-rostering-rows.js";

describe("validateOneRosterCsvRosteringPackage", () => {
  it("accepts a complete bulk reference graph and exposes readonly indexes", () => {
    const result = parseAndValidateOneRosterCsvRosteringZip(validBulkGraphZip());

    const validatedPackage = expectValidatedOk(result);

    expect(validatedPackage.rosteringPackage.users[0]?.rowNumber).toBe(2);
    expect(
      validatedPackage.indexes.academicSessionsBySourcedId.get(fixtureGuid("as-parent"))?.title,
    ).toBe("School Year");
    expect(validatedPackage.indexes.orgsBySourcedId.get(fixtureGuid("org-root"))?.name).toBe(
      "District",
    );
    expect(validatedPackage.indexes.coursesBySourcedId.get(fixtureGuid("course-1"))?.title).toBe(
      "Algebra One",
    );
    expect(validatedPackage.indexes.classesBySourcedId.get(fixtureGuid("class-1"))?.classCode).toBe(
      "A1",
    );
    expect(
      validatedPackage.indexes.usersBySourcedId.get(fixtureGuid("user-1"))?.agentSourcedIds,
    ).toEqual(["user-agent"]);
    expect(validatedPackage.indexes.rolesBySourcedId.get(fixtureGuid("role-1"))?.role).toBe(
      "teacher",
    );
    expect(
      validatedPackage.indexes.enrollmentsBySourcedId.get(fixtureGuid("enrollment-1"))?.role,
    ).toBe("teacher");
    expect(validatedPackage.indexes.demographicsBySourcedId.get(fixtureGuid("user-1"))?.sex).toBe(
      "female",
    );
    expect(
      validatedPackage.indexes.userProfilesBySourcedId.get(fixtureGuid("profile-1"))?.userSourcedId,
    ).toBe("user-1");
  });

  it("rejects duplicate sourcedId values within each typed rostering file", () => {
    const result = parseAndValidateOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: rosteringModes("bulk") }),
        "academicSessions.csv": academicSessionsCsv([
          academicSessionRow({ sourcedId: "as-1" }),
          academicSessionRow({ sourcedId: "as-1" }),
        ]),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" }), orgRow({ sourcedId: "org-1" })]),
        "courses.csv": coursesCsv([
          courseRow({ sourcedId: "course-1", orgSourcedId: "org-1" }),
          courseRow({ sourcedId: "course-1", orgSourcedId: "org-1" }),
        ]),
        "classes.csv": classesCsv([
          classRow({
            sourcedId: "class-1",
            courseSourcedId: "course-1",
            schoolSourcedId: "org-1",
            termSourcedIds: "as-1",
          }),
          classRow({
            sourcedId: "class-1",
            courseSourcedId: "course-1",
            schoolSourcedId: "org-1",
            termSourcedIds: "as-1",
          }),
        ]),
        "users.csv": usersCsv([
          userRow({ sourcedId: "user-1", username: "user-1" }),
          userRow({ sourcedId: "user-1", username: "user-1-duplicate" }),
        ]),
        "roles.csv": rolesCsv([
          roleRow({ sourcedId: "role-1", userSourcedId: "user-1", orgSourcedId: "org-1" }),
          roleRow({ sourcedId: "role-1", userSourcedId: "user-1", orgSourcedId: "org-1" }),
        ]),
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-1",
            userSourcedId: "user-1",
          }),
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-1",
            userSourcedId: "user-1",
          }),
        ]),
        "demographics.csv": demographicsCsv([
          demographicsRow({ sourcedId: "user-1" }),
          demographicsRow({ sourcedId: "user-1" }),
        ]),
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-1" }),
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-1" }),
        ]),
      }),
    );

    const diagnostics = expectValidatedErr(result);

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "academicSessions.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "orgs.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "courses.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "classes.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "users.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "roles.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "enrollments.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "demographics.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "userProfiles.csv",
          rowNumber: 3,
          field: "sourcedId",
          actual: "duplicate",
        }),
      ]),
    );
  });

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

  it("skips delta reference validation by default and validates it in allRows mode", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "delta"]]) }),
      "users.csv": usersCsv([
        userRow({
          sourcedId: "user-delta",
          status: "active",
          dateLastModified: "2025-01-02T03:04:05.006Z",
          username: "user-delta",
          primaryOrgSourcedId: "org-missing",
        }),
      ]),
    });

    expectValidatedOk(parseAndValidateOneRosterCsvRosteringZip(bytes));

    expect(
      expectValidatedErr(
        parseAndValidateOneRosterCsvRosteringZip(bytes, {
          referenceMode: "allRows",
        }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "reference.missing_target_file",
        fileName: "users.csv",
        rowNumber: 2,
        field: "primaryOrgSourcedId",
        expected: "orgs.csv",
      }),
    );
  });

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

  it("validates already parsed packages through a separate public boundary", () => {
    const rosteringPackage = expectRosteringOk(parseOneRosterCsvRosteringZip(validBulkGraphZip()));
    const result = validateOneRosterCsvRosteringPackage(rosteringPackage);

    expect(expectValidatedOk(result).rosteringPackage).toBe(rosteringPackage);
  });

  it("does not expose raw IDs or user payload values in reference diagnostics", () => {
    const result = parseAndValidateOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["userProfiles.csv", "bulk"],
            ["users.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-available" })]),
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({
            sourcedId: "private-profile-id",
            userSourcedId: "private-profile-user-id",
            username: "private-profile-username",
            password: "private-profile-password",
          }),
        ]),
        "users.csv": usersCsv([
          userRow({
            sourcedId: "private-user-id",
            username: "private-username",
            primaryOrgSourcedId: "private-org-id",
          }),
          userRow({
            sourcedId: "private-user-id",
            username: "private-duplicate-username",
            primaryOrgSourcedId: "org-available",
          }),
        ]),
      }),
    );

    const diagnosticsJson = JSON.stringify(expectValidatedErr(result));

    expect(diagnosticsJson).not.toContain("private-user-id");
    expect(diagnosticsJson).not.toContain("private-username");
    expect(diagnosticsJson).not.toContain("private-duplicate-username");
    expect(diagnosticsJson).not.toContain("private-org-id");
    expect(diagnosticsJson).not.toContain("private-profile-id");
    expect(diagnosticsJson).not.toContain("private-profile-user-id");
    expect(diagnosticsJson).not.toContain("private-profile-username");
    expect(diagnosticsJson).not.toContain("private-profile-password");
  });
});

type MissingTargetFileScenario = {
  readonly name: string;
  readonly files: Readonly<Record<string, string>>;
  readonly expectedDiagnostics: readonly [
    ReturnType<typeof expect.objectContaining>,
    ...ReturnType<typeof expect.objectContaining>[],
  ];
};

function missingTargetFileScenarios(): readonly MissingTargetFileScenario[] {
  return [
    {
      name: "classes.csv cross-file references",
      files: {
        "manifest.csv": manifestCsv({ modes: new Map([["classes.csv", "bulk"]]) }),
        "classes.csv": classesCsv([
          classRow({
            courseSourcedId: "course-missing",
            schoolSourcedId: "org-missing",
            termSourcedIds: "as-missing",
          }),
        ]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "courseSourcedId",
          expected: "courses.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "schoolSourcedId",
          expected: "orgs.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "termSourcedIds",
          expected: "academicSessions.csv",
          actual: "absent",
        }),
      ],
    },
    {
      name: "user-backed demographics and userProfiles",
      files: {
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["demographics.csv", "bulk"],
            ["userProfiles.csv", "bulk"],
          ]),
        }),
        "demographics.csv": demographicsCsv([demographicsRow({ sourcedId: "user-missing" })]),
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-missing" }),
        ]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "demographics.csv",
          rowNumber: 2,
          field: "sourcedId",
          expected: "users.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "userProfiles.csv",
          rowNumber: 2,
          field: "userSourcedId",
          expected: "users.csv",
          actual: "absent",
        }),
      ],
    },
    {
      name: "roles.userProfileSourcedId",
      files: {
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["roles.csv", "bulk"],
            ["users.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" })]),
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-missing",
          }),
        ]),
        "users.csv": usersCsv([userRow({ sourcedId: "user-1", username: "user-1" })]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "roles.csv",
          rowNumber: 2,
          field: "userProfileSourcedId",
          expected: "userProfiles.csv",
          actual: "absent",
        }),
      ],
    },
  ];
}

type MissingReferenceRecordScenario = {
  readonly name: string;
  readonly sourceFile: OneRosterCsvRosteringFileName;
  readonly rowNumber: number;
  readonly field: string;
  readonly targetFile: OneRosterCsvRosteringFileName;
  readonly files: Readonly<Record<string, string>>;
};

function missingReferenceRecordScenarios(): readonly MissingReferenceRecordScenario[] {
  return [
    {
      name: "academicSessions.parentSourcedId",
      sourceFile: "academicSessions.csv",
      rowNumber: 3,
      field: "parentSourcedId",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "academicSessions.csv": academicSessionsCsv([
          academicSessionRow({ sourcedId: "as-parent", title: "School Year" }),
          academicSessionRow({
            sourcedId: "as-1",
            title: "Fall Term",
            type: "term",
            parentSourcedId: "as-missing",
          }),
        ]),
      }),
    },
    {
      name: "orgs.parentSourcedId",
      sourceFile: "orgs.csv",
      rowNumber: 3,
      field: "parentSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "orgs.csv": orgsCsv([
          orgRow({ sourcedId: "org-root", name: "District", type: "district" }),
          orgRow({ sourcedId: "org-1", name: "North School", parentSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "courses.schoolYearSourcedId",
      sourceFile: "courses.csv",
      rowNumber: 2,
      field: "schoolYearSourcedId",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "courses.csv": coursesCsv([
          courseRow({ sourcedId: "course-1", schoolYearSourcedId: "as-missing" }),
        ]),
      }),
    },
    {
      name: "courses.orgSourcedId",
      sourceFile: "courses.csv",
      rowNumber: 2,
      field: "orgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "courses.csv": coursesCsv([
          courseRow({ sourcedId: "course-1", orgSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "classes.courseSourcedId",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "courseSourcedId",
      targetFile: "courses.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ courseSourcedId: "course-missing" })]),
      }),
    },
    {
      name: "classes.schoolSourcedId",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "schoolSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ schoolSourcedId: "org-missing" })]),
      }),
    },
    {
      name: "classes.termSourcedIds",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "termSourcedIds",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ termSourcedIds: "as-missing" })]),
      }),
    },
    {
      name: "users.agentSourcedIds",
      sourceFile: "users.csv",
      rowNumber: 3,
      field: "agentSourcedIds",
      targetFile: "users.csv",
      files: validGraphWith({
        "users.csv": usersCsv([
          userRow({
            sourcedId: "user-agent",
            username: "user-agent",
            primaryOrgSourcedId: "org-1",
          }),
          userRow({
            sourcedId: "user-1",
            username: "user-1",
            agentSourcedIds: "user-missing",
            primaryOrgSourcedId: "org-1",
          }),
        ]),
      }),
    },
    {
      name: "users.primaryOrgSourcedId",
      sourceFile: "users.csv",
      rowNumber: 3,
      field: "primaryOrgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "users.csv": usersCsv([
          userRow({
            sourcedId: "user-agent",
            username: "user-agent",
            primaryOrgSourcedId: "org-1",
          }),
          userRow({
            sourcedId: "user-1",
            username: "user-1",
            agentSourcedIds: "user-agent",
            primaryOrgSourcedId: "org-missing",
          }),
        ]),
      }),
    },
    {
      name: "roles.userSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({ sourcedId: "role-1", userSourcedId: "user-missing", orgSourcedId: "org-1" }),
        ]),
      }),
    },
    {
      name: "roles.orgSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "orgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({ sourcedId: "role-1", userSourcedId: "user-1", orgSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "roles.userProfileSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "userProfileSourcedId",
      targetFile: "userProfiles.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-missing",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.classSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "classSourcedId",
      targetFile: "classes.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-missing",
            schoolSourcedId: "org-1",
            userSourcedId: "user-1",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.schoolSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "schoolSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-missing",
            userSourcedId: "user-1",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.userSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-1",
            userSourcedId: "user-missing",
          }),
        ]),
      }),
    },
    {
      name: "demographics.sourcedId",
      sourceFile: "demographics.csv",
      rowNumber: 2,
      field: "sourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "demographics.csv": demographicsCsv([demographicsRow({ sourcedId: "user-missing" })]),
      }),
    },
    {
      name: "userProfiles.userSourcedId",
      sourceFile: "userProfiles.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-missing" }),
        ]),
      }),
    },
  ];
}

function validGraphWith(
  overrides: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return {
    ...validBulkGraphFiles(),
    ...overrides,
  };
}
