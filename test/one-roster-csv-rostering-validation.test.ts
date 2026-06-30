import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvRosteringZip,
  parseOneRosterCsvRosteringZip,
  validateOneRosterCsvRosteringPackage,
} from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectRosteringOk,
  expectValidatedErr,
  expectValidatedOk,
  fixtureGuid,
} from "./fixtures/one-roster-csv-rostering-assertions.js";
import { rosteringModes, validBulkGraphZip } from "./fixtures/one-roster-csv-rostering-packages.js";
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
