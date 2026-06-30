import { describe, expect, it } from "vitest";

import { parseOneRosterCsvGradebookZip } from "../src/index.js";
import {
  csvDocument,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectGradebookErr,
  expectGradebookOk,
} from "./fixtures/one-roster-csv-gradebook-assertions.js";
import { categoryHeader, resultHeader } from "./fixtures/one-roster-csv-gradebook-headers.js";
import {
  gradebookAndRosteringModes,
  gradebookModes,
  validBulkGradebookFiles,
  validBulkGradebookGraphZip,
} from "./fixtures/one-roster-csv-gradebook-packages.js";
import {
  categoriesCsv,
  categoryRow,
  lineItemLearningObjectiveIdRow,
  lineItemLearningObjectiveIdsCsv,
  lineItemRow,
  lineItemsCsv,
  lineItemScoreScaleRow,
  lineItemScoreScalesCsv,
  resultLearningObjectiveIdRow,
  resultLearningObjectiveIdsCsv,
  resultRow,
  resultsCsv,
  resultScoreScaleRow,
  resultScoreScalesCsv,
  scoreScaleRow,
  scoreScalesCsv,
} from "./fixtures/one-roster-csv-gradebook-rows.js";
import { validBulkGraphFiles } from "./fixtures/one-roster-csv-rostering-packages.js";
import { usersCsv, userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("parseOneRosterCsvGradebookZip", () => {
  it("parses valid bulk records for typed gradebook files", () => {
    const result = parseOneRosterCsvGradebookZip(validBulkGradebookGraphZip());

    const packageValue = expectGradebookOk(result);

    expect(packageValue.rosteringPackage.users).toHaveLength(2);
    expect(packageValue.categories).toHaveLength(1);
    expect(packageValue.lineItems).toHaveLength(1);
    expect(packageValue.results).toHaveLength(1);
    expect(packageValue.scoreScales).toHaveLength(1);
    expect(packageValue.lineItemLearningObjectiveIds).toHaveLength(1);
    expect(packageValue.lineItemScoreScales).toHaveLength(1);
    expect(packageValue.resultLearningObjectiveIds).toHaveLength(1);
    expect(packageValue.resultScoreScales).toHaveLength(1);
    expect(packageValue.categories[0]?.weight).toBe(20);
    expect(packageValue.lineItems[0]?.resultValueMax).toBe(100);
    expect(packageValue.results[0]?.scoreStatus).toBe("fully graded");
    expect(packageValue.results[0]?.score).toBe(95.5);
    expect(packageValue.results[0]?.late).toBe(false);
    expect(packageValue.scoreScales[0]?.scoreScaleValue).toEqual(["{A:94}", "{B:84}"]);
    expect(packageValue.lineItemLearningObjectiveIds[0]?.source).toBe("case");
    expect(packageValue.resultLearningObjectiveIds[0]?.score).toBe(1);
  });

  it("parses valid delta lifecycle fields", () => {
    const dateLastModified = "2025-01-02T03:04:05.006Z";
    const result = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookModes("delta") }),
        "categories.csv": categoriesCsv([categoryRow({ status: "active", dateLastModified })]),
        "lineItems.csv": lineItemsCsv([lineItemRow({ status: "active", dateLastModified })]),
        "results.csv": resultsCsv([resultRow({ status: "active", dateLastModified })]),
        "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ status: "active", dateLastModified })]),
        "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
          lineItemLearningObjectiveIdRow({ status: "active", dateLastModified }),
        ]),
        "lineItemScoreScales.csv": lineItemScoreScalesCsv([
          lineItemScoreScaleRow({ status: "active", dateLastModified }),
        ]),
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({ status: "active", dateLastModified }),
        ]),
        "resultScoreScales.csv": resultScoreScalesCsv([
          resultScoreScaleRow({ status: "active", dateLastModified }),
        ]),
      }),
    );

    const packageValue = expectGradebookOk(result);

    expect(packageValue.categories[0]?.lifecycle).toEqual({
      mode: "delta",
      status: "active",
      dateLastModified,
    });
    expect(packageValue.resultScoreScales[0]?.lifecycle).toEqual({
      mode: "delta",
      status: "active",
      dateLastModified,
    });
  });

  it("rejects lifecycle values that violate bulk and delta mode rules", () => {
    const bulkResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["categories.csv", "bulk"]]) }),
        "categories.csv": categoriesCsv([
          categoryRow({ status: "active", dateLastModified: "2025-01-02T03:04:05.006Z" }),
        ]),
      }),
    );
    const deltaResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["categories.csv", "delta"]]) }),
        "categories.csv": categoriesCsv([categoryRow()]),
      }),
    );

    expect(expectGradebookErr(bulkResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "categories.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_forbidden_in_bulk",
          fileName: "categories.csv",
          field: "dateLastModified",
        }),
      ]),
    );
    expect(expectGradebookErr(deltaResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "categories.csv",
          field: "status",
        }),
        expect.objectContaining({
          code: "row.field_required_in_delta",
          fileName: "categories.csv",
          field: "dateLastModified",
        }),
      ]),
    );
  });

  it("validates exact headers and metadata placement", () => {
    const metadataResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["categories.csv", "bulk"]]) }),
        "categories.csv": csvDocument(
          [...categoryHeader, "metadata.localCode"],
          [[...categoryRow(), "local-category"]],
        ),
      }),
    );
    const wrongCaseResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["categories.csv", "bulk"]]) }),
        "categories.csv": csvDocument(["SourcedId", ...categoryHeader.slice(1)], [categoryRow()]),
      }),
    );
    const missingHeaderResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["results.csv", "bulk"]]) }),
        "results.csv": csvDocument(resultHeader.slice(0, -1), [resultRow().slice(0, -1)]),
      }),
    );
    const metadataInWrongPositionResult = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["categories.csv", "bulk"]]) }),
        "categories.csv": csvDocument(
          ["sourcedId", "status", "metadata.localCode", ...categoryHeader.slice(2)],
          [["category-2", "", "local-category", "", "Homework", "20"]],
        ),
      }),
    );

    expect(expectGradebookOk(metadataResult).categories[0]?.metadata).toEqual({
      "metadata.localCode": "local-category",
    });
    expect(expectGradebookErr(wrongCaseResult)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "schema.header_order_mismatch",
          fileName: "categories.csv",
          field: "sourcedId",
        }),
        expect.objectContaining({
          code: "schema.missing_header",
          fileName: "categories.csv",
          field: "sourcedId",
        }),
      ]),
    );
    expect(expectGradebookErr(missingHeaderResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.missing_header",
        fileName: "results.csv",
        field: "missing",
      }),
    );
    expect(expectGradebookErr(metadataInWrongPositionResult)).toContainEqual(
      expect.objectContaining({
        code: "schema.metadata_column_position",
        fileName: "categories.csv",
        field: "dateLastModified",
      }),
    );
  });

  it("parses ext vocabularies and normalizes blank optional values", () => {
    const result = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkGradebookFiles(),
        "categories.csv": categoriesCsv([categoryRow({ weight: "" })]),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ description: "", resultValueMin: "", resultValueMax: "" }),
        ]),
        "results.csv": resultsCsv([
          resultRow({
            scoreStatus: "ext:vendor",
            score: "",
            comment: "",
            textScore: "",
            classSourcedId: "",
            inProgress: "",
            incomplete: "",
            late: "",
            missing: "",
          }),
        ]),
        "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
          lineItemLearningObjectiveIdRow({ source: "ext:case-provider" }),
        ]),
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({ source: "ext:rubric", score: "", textScore: "" }),
        ]),
      }),
    );

    const packageValue = expectGradebookOk(result);

    expect(packageValue.categories[0]?.weight).toBeUndefined();
    expect(packageValue.lineItems[0]?.description).toBeUndefined();
    expect(packageValue.lineItems[0]?.resultValueMax).toBeUndefined();
    expect(packageValue.results[0]?.scoreStatus).toBe("ext:vendor");
    expect(packageValue.results[0]?.score).toBeUndefined();
    expect(packageValue.results[0]?.classSourcedId).toBeUndefined();
    expect(packageValue.results[0]?.missing).toBeUndefined();
    expect(packageValue.lineItemLearningObjectiveIds[0]?.source).toBe("ext:case-provider");
    expect(packageValue.resultLearningObjectiveIds[0]?.score).toBeUndefined();
  });

  it("rejects invalid gradebook field values with typed diagnostics", () => {
    const result = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["categories.csv", "bulk"],
            ["lineItems.csv", "bulk"],
            ["results.csv", "bulk"],
            ["scoreScales.csv", "bulk"],
            ["lineItemLearningObjectiveIds.csv", "bulk"],
          ]),
        }),
        "categories.csv": categoriesCsv([categoryRow({ title: "", weight: "2.5" })]),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ assignDate: "2024-13-01", resultValueMin: "NaN" }),
        ]),
        "results.csv": resultsCsv([
          resultRow({
            scoreStatus: "graded",
            score: "abc",
            scoreDate: "2024-09-31",
            inProgress: "yes",
          }),
        ]),
        "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ scoreScaleValue: "a,,b" })]),
        "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
          lineItemLearningObjectiveIdRow({ source: "bad", learningObjectiveId: "" }),
        ]),
      }),
    );

    expect(expectGradebookErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "row.missing_required_value", field: "title" }),
        expect.objectContaining({ code: "row.invalid_integer", field: "weight" }),
        expect.objectContaining({ code: "row.invalid_date", field: "assignDate" }),
        expect.objectContaining({ code: "row.invalid_float", field: "resultValueMin" }),
        expect.objectContaining({ code: "row.invalid_enum", field: "scoreStatus" }),
        expect.objectContaining({ code: "row.invalid_float", field: "score" }),
        expect.objectContaining({ code: "row.invalid_boolean", field: "inProgress" }),
        expect.objectContaining({ code: "row.invalid_list", field: "scoreScaleValue" }),
        expect.objectContaining({ code: "row.invalid_enum", field: "source" }),
        expect.objectContaining({
          code: "row.missing_required_value",
          field: "learningObjectiveId",
        }),
      ]),
    );
  });

  it("accumulates rostering and gradebook parse diagnostics", () => {
    const result = parseOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkGradebookFiles(),
        "users.csv": usersCsv([userRow({ enabledUser: "not-boolean" })]),
        "categories.csv": categoriesCsv([categoryRow({ weight: "not-integer" })]),
      }),
    );

    expect(expectGradebookErr(result)).toEqual(
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
      ]),
    );
  });
});
