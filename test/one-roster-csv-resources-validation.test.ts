import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvResourcesZip,
  parseOneRosterCsvResourcesZip,
  validateOneRosterCsvResourcesPackage,
} from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectResourcesOk,
  expectValidatedResourcesErr,
  expectValidatedResourcesOk,
} from "./fixtures/one-roster-csv-resources-assertions.js";
import {
  resourcesAndRosteringModes,
  validBulkResourcesFiles,
  validBulkResourcesGraphZip,
} from "./fixtures/one-roster-csv-resources-packages.js";
import {
  classResourceRow,
  classResourcesCsv,
  courseResourceRow,
  courseResourcesCsv,
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./fixtures/one-roster-csv-resources-rows.js";
import { fixtureGuid } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { validBulkGraphFiles } from "./fixtures/one-roster-csv-rostering-packages.js";
import { usersCsv, userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("validateOneRosterCsvResourcesPackage", () => {
  it("accepts a complete bulk reference graph and exposes readonly indexes", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(validBulkResourcesGraphZip());

    const validatedPackage = expectValidatedResourcesOk(result);

    expect(validatedPackage.resourcesPackage.resources[0]?.rowNumber).toBe(2);
    expect(
      validatedPackage.rosteringValidation.indexes.classesBySourcedId.has(fixtureGuid("class-1")),
    ).toBe(true);
    expect(
      validatedPackage.indexes.resourcesBySourcedId.get(fixtureGuid("resource-1"))
        ?.vendorResourceId,
    ).toBe("vendor-resource-1");
    expect(
      validatedPackage.indexes.classResourcesBySourcedId.get(fixtureGuid("class-resource-1"))
        ?.classSourcedId,
    ).toBe(fixtureGuid("class-1"));
    expect(
      validatedPackage.indexes.userResourcesBySourcedId.get(fixtureGuid("user-resource-1"))
        ?.resourceSourcedId,
    ).toBe(fixtureGuid("resource-1"));
  });

  it("rejects duplicate sourcedId values within each typed resources file", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        "resources.csv": resourcesCsv([
          resourceRow({ sourcedId: "resource-1" }),
          resourceRow({ sourcedId: "resource-1" }),
        ]),
        "classResources.csv": classResourcesCsv([
          classResourceRow({ sourcedId: "class-resource-1" }),
          classResourceRow({ sourcedId: "class-resource-1" }),
        ]),
        "courseResources.csv": courseResourcesCsv([
          courseResourceRow({ sourcedId: "course-resource-1" }),
          courseResourceRow({ sourcedId: "course-resource-1" }),
        ]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ sourcedId: "user-resource-1" }),
          userResourceRow({ sourcedId: "user-resource-1" }),
        ]),
      }),
    );

    expect(expectValidatedResourcesErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "resources.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "classResources.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "courseResources.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "userResources.csv",
        }),
      ]),
    );
  });

  it("accumulates rostering and resources validation diagnostics", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkResourcesFiles(),
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
            primaryOrgSourcedId: "org-1",
          }),
          userRow({
            sourcedId: "user-1",
            username: "user-duplicate",
            primaryOrgSourcedId: "org-1",
          }),
        ]),
        "resources.csv": resourcesCsv([
          resourceRow({ sourcedId: "resource-1" }),
          resourceRow({ sourcedId: "resource-1" }),
        ]),
      }),
    );

    expect(expectValidatedResourcesErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "users.csv",
          rowNumber: 4,
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "resources.csv",
          rowNumber: 3,
        }),
      ]),
    );
  });

  it("rejects bulk references to absent target files", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["classResources.csv", "bulk"]]) }),
        "classResources.csv": classResourcesCsv([classResourceRow()]),
      }),
    );

    expect(expectValidatedResourcesErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classResources.csv",
          rowNumber: 2,
          field: "classSourcedId",
          expected: "classes.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classResources.csv",
          rowNumber: 2,
          field: "resourceSourcedId",
          expected: "resources.csv",
          actual: "absent",
        }),
      ]),
    );
  });

  for (const scenario of missingResourcesReferenceRecordScenarios()) {
    it(`rejects missing target record for ${scenario.name}`, () => {
      const result = parseAndValidateOneRosterCsvResourcesZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
          ...scenario.files,
        }),
      );

      expect(expectValidatedResourcesErr(result)).toContainEqual(
        expect.objectContaining({
          code: "reference.missing_target_record",
          fileName: scenario.sourceFile,
          rowNumber: 2,
          field: scenario.field,
          expected: scenario.targetFile,
          actual: "missing",
        }),
      );
    });
  }

  it("does not validate blank optional userResources org or class references", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: resourcesAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkResourcesFiles(),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ orgSourcedId: "", classSourcedId: "" }),
        ]),
      }),
    );

    const userResource = expectValidatedResourcesOk(result).resourcesPackage.userResources[0];

    expect(userResource?.orgSourcedId).toBeUndefined();
    expect(userResource?.classSourcedId).toBeUndefined();
  });

  it("skips delta reference validation by default and validates it in allRows mode", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv({ modes: new Map([["userResources.csv", "delta"]]) }),
      "userResources.csv": userResourcesCsv([
        userResourceRow({
          status: "active",
          dateLastModified: "2025-01-02T03:04:05.006Z",
          userSourcedId: "user-missing",
          resourceSourcedId: "resource-missing",
        }),
      ]),
    });

    expectValidatedResourcesOk(parseAndValidateOneRosterCsvResourcesZip(bytes));

    expect(
      expectValidatedResourcesErr(
        parseAndValidateOneRosterCsvResourcesZip(bytes, { referenceMode: "allRows" }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "reference.missing_target_file",
        fileName: "userResources.csv",
        rowNumber: 2,
        field: "userSourcedId",
        expected: "users.csv",
      }),
    );
  });

  it("validates already parsed packages through a separate public boundary", () => {
    const resourcesPackage = expectResourcesOk(
      parseOneRosterCsvResourcesZip(validBulkResourcesGraphZip()),
    );
    const result = validateOneRosterCsvResourcesPackage(resourcesPackage);

    expect(expectValidatedResourcesOk(result).resourcesPackage).toBe(resourcesPackage);
  });

  it("does not expose raw IDs or resources payload values in reference diagnostics", () => {
    const result = parseAndValidateOneRosterCsvResourcesZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["resources.csv", "bulk"],
            ["userResources.csv", "bulk"],
          ]),
        }),
        "resources.csv": resourcesCsv([
          resourceRow({
            sourcedId: "private-resource-id",
            vendorResourceId: "private-vendor-resource-id",
            title: "private-resource-title",
            vendorId: "private-vendor-id",
            applicationId: "private-application-id",
          }),
          resourceRow({
            sourcedId: "private-resource-id",
            vendorResourceId: "private-vendor-resource-id-duplicate",
            title: "private-resource-title-duplicate",
          }),
        ]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({
            sourcedId: "private-user-resource-id",
            userSourcedId: "private-user-id",
            orgSourcedId: "private-org-id",
            classSourcedId: "private-class-id",
            resourceSourcedId: "private-resource-id",
          }),
        ]),
      }),
    );

    const diagnosticsJson = JSON.stringify(expectValidatedResourcesErr(result));

    expect(diagnosticsJson).not.toContain("private-resource-id");
    expect(diagnosticsJson).not.toContain("private-vendor-resource-id");
    expect(diagnosticsJson).not.toContain("private-resource-title");
    expect(diagnosticsJson).not.toContain("private-vendor-id");
    expect(diagnosticsJson).not.toContain("private-application-id");
    expect(diagnosticsJson).not.toContain("private-user-resource-id");
    expect(diagnosticsJson).not.toContain("private-user-id");
    expect(diagnosticsJson).not.toContain("private-org-id");
    expect(diagnosticsJson).not.toContain("private-class-id");
  });
});

type MissingResourcesReferenceRecordScenario = {
  readonly name: string;
  readonly files: Readonly<Record<string, string>>;
  readonly sourceFile: string;
  readonly field: string;
  readonly targetFile: string;
};

function missingResourcesReferenceRecordScenarios(): readonly MissingResourcesReferenceRecordScenario[] {
  return [
    {
      name: "classResources.classSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "classResources.csv": classResourcesCsv([
          classResourceRow({ classSourcedId: "class-missing" }),
        ]),
      }),
      sourceFile: "classResources.csv",
      field: "classSourcedId",
      targetFile: "classes.csv",
    },
    {
      name: "classResources.resourceSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "classResources.csv": classResourcesCsv([
          classResourceRow({ resourceSourcedId: "resource-missing" }),
        ]),
      }),
      sourceFile: "classResources.csv",
      field: "resourceSourcedId",
      targetFile: "resources.csv",
    },
    {
      name: "courseResources.courseSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "courseResources.csv": courseResourcesCsv([
          courseResourceRow({ courseSourcedId: "course-missing" }),
        ]),
      }),
      sourceFile: "courseResources.csv",
      field: "courseSourcedId",
      targetFile: "courses.csv",
    },
    {
      name: "courseResources.resourceSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "courseResources.csv": courseResourcesCsv([
          courseResourceRow({ resourceSourcedId: "resource-missing" }),
        ]),
      }),
      sourceFile: "courseResources.csv",
      field: "resourceSourcedId",
      targetFile: "resources.csv",
    },
    {
      name: "userResources.userSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "userResources.csv": userResourcesCsv([userResourceRow({ userSourcedId: "user-missing" })]),
      }),
      sourceFile: "userResources.csv",
      field: "userSourcedId",
      targetFile: "users.csv",
    },
    {
      name: "userResources.orgSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "userResources.csv": userResourcesCsv([userResourceRow({ orgSourcedId: "org-missing" })]),
      }),
      sourceFile: "userResources.csv",
      field: "orgSourcedId",
      targetFile: "orgs.csv",
    },
    {
      name: "userResources.classSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "userResources.csv": userResourcesCsv([
          userResourceRow({ classSourcedId: "class-missing" }),
        ]),
      }),
      sourceFile: "userResources.csv",
      field: "classSourcedId",
      targetFile: "classes.csv",
    },
    {
      name: "userResources.resourceSourcedId",
      files: validResourcesReferenceScenarioFiles({
        "userResources.csv": userResourcesCsv([
          userResourceRow({ resourceSourcedId: "resource-missing" }),
        ]),
      }),
      sourceFile: "userResources.csv",
      field: "resourceSourcedId",
      targetFile: "resources.csv",
    },
  ];
}

function validResourcesReferenceScenarioFiles(
  overrides: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return {
    ...validBulkGraphFiles(),
    ...validBulkResourcesFiles(),
    ...overrides,
  };
}
