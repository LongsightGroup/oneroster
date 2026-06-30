import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvFullZip,
  parseOneRosterCsvFullZip,
  validateOneRosterCsvFullPackage,
} from "../src/index.js";
import {
  expectFullErr,
  expectFullOk,
  expectValidatedFullErr,
  expectValidatedFullOk,
} from "./fixtures/one-roster-csv-full-assertions.js";
import {
  fullCsvModes,
  validBulkFullGraphFiles,
  validBulkFullGraphZip,
} from "./fixtures/one-roster-csv-full-packages.js";
import {
  categoryRow,
  categoriesCsv,
  lineItemRow,
  lineItemsCsv,
  resultRow,
  resultsCsv,
} from "./fixtures/one-roster-csv-gradebook-rows.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./fixtures/one-roster-csv-resources-rows.js";
import { usersCsv, userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("OneRoster full CSV package", () => {
  it("parses complete typed rostering, gradebook, and resources layers", () => {
    const result = parseOneRosterCsvFullZip(validBulkFullGraphZip());

    const packageValue = expectFullOk(result);

    expect(packageValue.rosteringPackage.users).toHaveLength(2);
    expect(packageValue.gradebookPackage.categories).toHaveLength(1);
    expect(packageValue.gradebookPackage.results).toHaveLength(1);
    expect(packageValue.resourcesPackage.resources).toHaveLength(1);
    expect(packageValue.resourcesPackage.userResources).toHaveLength(1);
    expect(packageValue.gradebookPackage.rosteringPackage).toBe(packageValue.rosteringPackage);
    expect(packageValue.resourcesPackage.rosteringPackage).toBe(packageValue.rosteringPackage);
  });

  it("accumulates parse diagnostics across rostering, gradebook, and resources", () => {
    const result = parseOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "users.csv": usersCsv([userRow({ enabledUser: "not-boolean" })]),
        "categories.csv": categoriesCsv([categoryRow({ weight: "not-integer" })]),
        "resources.csv": resourcesCsv([resourceRow({ importance: "tertiary" })]),
      }),
    );

    expect(expectFullErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.invalid_boolean",
          fileName: "users.csv",
          field: "enabledUser",
        }),
        expect.objectContaining({
          code: "row.invalid_integer",
          fileName: "categories.csv",
          field: "weight",
        }),
        expect.objectContaining({
          code: "row.invalid_enum",
          fileName: "resources.csv",
          field: "importance",
        }),
      ]),
    );
  });

  it("validates a complete bulk graph and exposes all validation indexes", () => {
    const result = parseAndValidateOneRosterCsvFullZip(validBulkFullGraphZip());

    const validatedPackage = expectValidatedFullOk(result);

    expect(validatedPackage.fullPackage.gradebookPackage.lineItems).toHaveLength(1);
    expect(validatedPackage.rosteringValidation.indexes.usersBySourcedId.size).toBe(2);
    expect(validatedPackage.gradebookValidation.indexes.lineItemsBySourcedId.size).toBe(1);
    expect(validatedPackage.resourcesValidation.indexes.resourcesBySourcedId.size).toBe(1);
    expect(validatedPackage.gradebookValidation.rosteringValidation).toBe(
      validatedPackage.rosteringValidation,
    );
    expect(validatedPackage.resourcesValidation.rosteringValidation).toBe(
      validatedPackage.rosteringValidation,
    );
  });

  it("accumulates validation diagnostics without duplicating shared rostering diagnostics", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
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
        "categories.csv": categoriesCsv([
          categoryRow({ sourcedId: "category-1" }),
          categoryRow({ sourcedId: "category-1" }),
        ]),
        "resources.csv": resourcesCsv([
          resourceRow({ sourcedId: "resource-1" }),
          resourceRow({ sourcedId: "resource-1" }),
        ]),
      }),
    );

    const diagnostics = expectValidatedFullErr(result);

    expect(
      diagnostics.filter(
        (diagnostic) =>
          diagnostic.code === "reference.duplicate_sourced_id" &&
          diagnostic.fileName === "users.csv",
      ),
    ).toHaveLength(1);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "users.csv",
          rowNumber: 4,
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "categories.csv",
          rowNumber: 3,
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "resources.csv",
          rowNumber: 3,
        }),
      ]),
    );
  });

  it("validates missing target records across gradebook and resources layers", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "lineItems.csv": lineItemsCsv([lineItemRow({ categorySourcedId: "category-missing" })]),
        "userResources.csv": userResourcesCsv([
          userResourceRow({ resourceSourcedId: "resource-missing" }),
        ]),
      }),
    );

    expect(expectValidatedFullErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.missing_target_record",
          fileName: "lineItems.csv",
          field: "categorySourcedId",
          expected: "categories.csv",
        }),
        expect.objectContaining({
          code: "reference.missing_target_record",
          fileName: "userResources.csv",
          field: "resourceSourcedId",
          expected: "resources.csv",
        }),
      ]),
    );
  });

  it("rejects lineItem score ranges where resultValueMin exceeds resultValueMax", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ resultValueMin: "100", resultValueMax: "0" }),
        ]),
      }),
    );

    expect(expectValidatedFullErr(result)).toContainEqual(
      expect.objectContaining({
        code: "semantic.invalid_score_range",
        fileName: "lineItems.csv",
        rowNumber: 2,
        field: "resultValueMin",
        expected: "resultValueMin <= resultValueMax",
        actual: "min greater than max",
      }),
    );
  });

  it("rejects numeric result scores outside the lineItem score range", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ resultValueMin: "50", resultValueMax: "100" }),
        ]),
        "results.csv": resultsCsv([
          resultRow({ sourcedId: "result-low", score: "49" }),
          resultRow({ sourcedId: "result-high", score: "101" }),
        ]),
      }),
    );

    expect(expectValidatedFullErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.score_below_min",
          fileName: "results.csv",
          rowNumber: 2,
          field: "score",
          expected: "lineItems.resultValueMin",
          actual: "below minimum",
        }),
        expect.objectContaining({
          code: "semantic.score_above_max",
          fileName: "results.csv",
          rowNumber: 3,
          field: "score",
          expected: "lineItems.resultValueMax",
          actual: "above maximum",
        }),
      ]),
    );
  });

  it("does not apply score bounds when the score or the matching lineItem bound is absent", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "lineItems.csv": lineItemsCsv([lineItemRow({ resultValueMin: "", resultValueMax: "" })]),
        "results.csv": resultsCsv([resultRow({ score: "" })]),
      }),
    );

    expect(
      expectValidatedFullOk(result).fullPackage.gradebookPackage.results[0]?.score,
    ).toBeUndefined();
  });

  it("does not expose raw score values in semantic diagnostics", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
        ...validBulkFullGraphFiles(),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ resultValueMin: "50.25", resultValueMax: "100.75" }),
        ]),
        "results.csv": resultsCsv([resultRow({ score: "49.75" })]),
      }),
    );

    const diagnosticsJson = JSON.stringify(expectValidatedFullErr(result));

    expect(diagnosticsJson).not.toContain("49.75");
    expect(diagnosticsJson).not.toContain("50.25");
    expect(diagnosticsJson).not.toContain("100.75");
  });

  it("skips delta references by default and validates all layers in allRows mode", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv({
        modes: new Map([
          ["lineItems.csv", "delta"],
          ["userResources.csv", "delta"],
        ]),
      }),
      "lineItems.csv": lineItemsCsv([
        lineItemRow({
          status: "active",
          dateLastModified: "2025-01-02T03:04:05.006Z",
          classSourcedId: "class-missing",
          categorySourcedId: "category-missing",
        }),
      ]),
      "userResources.csv": userResourcesCsv([
        userResourceRow({
          status: "active",
          dateLastModified: "2025-01-02T03:04:05.006Z",
          userSourcedId: "user-missing",
          resourceSourcedId: "resource-missing",
        }),
      ]),
    });

    expectValidatedFullOk(parseAndValidateOneRosterCsvFullZip(bytes));

    expect(
      expectValidatedFullErr(
        parseAndValidateOneRosterCsvFullZip(bytes, { referenceMode: "allRows" }),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "lineItems.csv",
          field: "classSourcedId",
          expected: "classes.csv",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "userResources.csv",
          field: "userSourcedId",
          expected: "users.csv",
        }),
      ]),
    );
  });

  it("validates already parsed full packages through a separate public boundary", () => {
    const fullPackage = expectFullOk(parseOneRosterCsvFullZip(validBulkFullGraphZip()));
    const result = validateOneRosterCsvFullPackage(fullPackage);

    expect(expectValidatedFullOk(result).fullPackage).toBe(fullPackage);
  });
});
