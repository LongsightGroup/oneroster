import { describe, expect, it } from "vitest";

import {
  parseAndValidateOneRosterCsvGradebookZip,
  parseOneRosterCsvGradebookZip,
  validateOneRosterCsvGradebookPackage,
} from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  expectGradebookOk,
  expectValidatedGradebookErr,
  expectValidatedGradebookOk,
} from "./fixtures/one-roster-csv-gradebook-assertions.js";
import {
  gradebookAndRosteringModes,
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
import { fixtureGuid } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { validBulkGraphFiles } from "./fixtures/one-roster-csv-rostering-packages.js";
import { usersCsv, userRow } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("validateOneRosterCsvGradebookPackage", () => {
  it("accepts a complete bulk reference graph and exposes readonly indexes", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(validBulkGradebookGraphZip());

    const validatedPackage = expectValidatedGradebookOk(result);

    expect(validatedPackage.gradebookPackage.lineItems[0]?.rowNumber).toBe(2);
    expect(
      validatedPackage.rosteringValidation.indexes.usersBySourcedId.has(fixtureGuid("user-1")),
    ).toBe(true);
    expect(
      validatedPackage.indexes.categoriesBySourcedId.get(fixtureGuid("category-1"))?.title,
    ).toBe("Homework");
    expect(
      validatedPackage.indexes.lineItemsBySourcedId.get(fixtureGuid("line-item-1"))?.title,
    ).toBe("Unit Quiz");
    expect(validatedPackage.indexes.resultsBySourcedId.get(fixtureGuid("result-1"))?.score).toBe(
      95.5,
    );
    expect(
      validatedPackage.indexes.scoreScalesBySourcedId.get(fixtureGuid("score-scale-1"))
        ?.scoreScaleValue,
    ).toEqual(["{A:94}", "{B:84}"]);
  });

  it("rejects duplicate sourcedId values within each typed gradebook file", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        "categories.csv": categoriesCsv([
          categoryRow({ sourcedId: "category-1" }),
          categoryRow({ sourcedId: "category-1" }),
        ]),
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ sourcedId: "line-item-1" }),
          lineItemRow({ sourcedId: "line-item-1" }),
        ]),
        "results.csv": resultsCsv([
          resultRow({ sourcedId: "result-1" }),
          resultRow({ sourcedId: "result-1" }),
        ]),
        "scoreScales.csv": scoreScalesCsv([
          scoreScaleRow({ sourcedId: "score-scale-1" }),
          scoreScaleRow({ sourcedId: "score-scale-1" }),
        ]),
        "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
          lineItemLearningObjectiveIdRow({ sourcedId: "line-item-lo-1" }),
          lineItemLearningObjectiveIdRow({ sourcedId: "line-item-lo-1" }),
        ]),
        "lineItemScoreScales.csv": lineItemScoreScalesCsv([
          lineItemScoreScaleRow({ sourcedId: "line-item-score-scale-1" }),
          lineItemScoreScaleRow({ sourcedId: "line-item-score-scale-1" }),
        ]),
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({ sourcedId: "result-lo-1" }),
          resultLearningObjectiveIdRow({ sourcedId: "result-lo-1" }),
        ]),
        "resultScoreScales.csv": resultScoreScalesCsv([
          resultScoreScaleRow({ sourcedId: "result-score-scale-1" }),
          resultScoreScaleRow({ sourcedId: "result-score-scale-1" }),
        ]),
      }),
    );

    expect(expectValidatedGradebookErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "categories.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "lineItems.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "results.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "scoreScales.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "lineItemLearningObjectiveIds.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "lineItemScoreScales.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "resultLearningObjectiveIds.csv",
        }),
        expect.objectContaining({
          code: "reference.duplicate_sourced_id",
          fileName: "resultScoreScales.csv",
        }),
      ]),
    );
  });

  it("accumulates rostering and gradebook validation diagnostics", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkGradebookFiles(),
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
      }),
    );

    expect(expectValidatedGradebookErr(result)).toEqual(
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
      ]),
    );
  });

  it("rejects bulk references to absent target files", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: new Map([["lineItems.csv", "bulk"]]) }),
        "lineItems.csv": lineItemsCsv([lineItemRow()]),
      }),
    );

    expect(expectValidatedGradebookErr(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "lineItems.csv",
          rowNumber: 2,
          field: "classSourcedId",
          expected: "classes.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "lineItems.csv",
          rowNumber: 2,
          field: "categorySourcedId",
          expected: "categories.csv",
          actual: "absent",
        }),
      ]),
    );
  });

  for (const scenario of missingGradebookReferenceRecordScenarios()) {
    it(`rejects missing target record for ${scenario.name}`, () => {
      const result = parseAndValidateOneRosterCsvGradebookZip(
        zipPackage({
          "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
          ...scenario.files,
        }),
      );

      expect(expectValidatedGradebookErr(result)).toContainEqual(
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

  it("does not validate blank optional results.classSourcedId", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({ modes: gradebookAndRosteringModes("bulk") }),
        ...validBulkGraphFiles(),
        ...validBulkGradebookFiles(),
        "results.csv": resultsCsv([resultRow({ classSourcedId: "" })]),
      }),
    );

    expect(
      expectValidatedGradebookOk(result).gradebookPackage.results[0]?.classSourcedId,
    ).toBeUndefined();
  });

  it("skips delta reference validation by default and validates it in allRows mode", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv({ modes: new Map([["results.csv", "delta"]]) }),
      "results.csv": resultsCsv([
        resultRow({
          status: "active",
          dateLastModified: "2025-01-02T03:04:05.006Z",
          lineItemSourcedId: "line-item-missing",
          studentSourcedId: "user-missing",
        }),
      ]),
    });

    expectValidatedGradebookOk(parseAndValidateOneRosterCsvGradebookZip(bytes));

    expect(
      expectValidatedGradebookErr(
        parseAndValidateOneRosterCsvGradebookZip(bytes, { referenceMode: "allRows" }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "reference.missing_target_file",
        fileName: "results.csv",
        rowNumber: 2,
        field: "lineItemSourcedId",
        expected: "lineItems.csv",
      }),
    );
  });

  it("validates already parsed packages through a separate public boundary", () => {
    const gradebookPackage = expectGradebookOk(
      parseOneRosterCsvGradebookZip(validBulkGradebookGraphZip()),
    );
    const result = validateOneRosterCsvGradebookPackage(gradebookPackage);

    expect(expectValidatedGradebookOk(result).gradebookPackage).toBe(gradebookPackage);
  });

  it("does not expose raw IDs or gradebook payload values in reference diagnostics", () => {
    const result = parseAndValidateOneRosterCsvGradebookZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["results.csv", "bulk"],
            ["resultLearningObjectiveIds.csv", "bulk"],
            ["scoreScales.csv", "bulk"],
          ]),
        }),
        "results.csv": resultsCsv([
          resultRow({
            sourcedId: "private-result-id",
            lineItemSourcedId: "private-line-item-id",
            studentSourcedId: "private-student-id",
            score: "98.75",
            comment: "private-comment",
            textScore: "private-text-score",
            classSourcedId: "private-class-id",
          }),
          resultRow({
            sourcedId: "private-result-id",
            lineItemSourcedId: "private-line-item-id",
            studentSourcedId: "private-student-id",
            score: "99.5",
            comment: "private-duplicate-comment",
            textScore: "private-duplicate-text-score",
            classSourcedId: "private-class-id",
          }),
        ]),
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({
            resultSourcedId: "private-result-id",
            learningObjectiveId: "private-learning-objective-id",
            score: "7.25",
            textScore: "private-learning-objective-text-score",
          }),
        ]),
        "scoreScales.csv": scoreScalesCsv([
          scoreScaleRow({
            sourcedId: "private-score-scale-id",
            orgSourcedId: "private-org-id",
            courseSourcedId: "private-course-id",
            classSourcedId: "private-class-id",
            scoreScaleValue: "{private:A},{private:B}",
          }),
        ]),
      }),
    );

    const diagnosticsJson = JSON.stringify(expectValidatedGradebookErr(result));

    expect(diagnosticsJson).not.toContain("private-result-id");
    expect(diagnosticsJson).not.toContain("private-line-item-id");
    expect(diagnosticsJson).not.toContain("private-student-id");
    expect(diagnosticsJson).not.toContain("private-comment");
    expect(diagnosticsJson).not.toContain("private-duplicate-comment");
    expect(diagnosticsJson).not.toContain("private-text-score");
    expect(diagnosticsJson).not.toContain("98.75");
    expect(diagnosticsJson).not.toContain("private-learning-objective-id");
    expect(diagnosticsJson).not.toContain("private-learning-objective-text-score");
    expect(diagnosticsJson).not.toContain("private-score-scale-id");
    expect(diagnosticsJson).not.toContain("private-org-id");
    expect(diagnosticsJson).not.toContain("private-course-id");
    expect(diagnosticsJson).not.toContain("{private:A}");
  });
});

type MissingGradebookReferenceRecordScenario = {
  readonly name: string;
  readonly files: Readonly<Record<string, string>>;
  readonly sourceFile: string;
  readonly field: string;
  readonly targetFile: string;
};

function missingGradebookReferenceRecordScenarios(): readonly MissingGradebookReferenceRecordScenario[] {
  return [
    {
      name: "lineItems.classSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItems.csv": lineItemsCsv([lineItemRow({ classSourcedId: "class-missing" })]),
      }),
      sourceFile: "lineItems.csv",
      field: "classSourcedId",
      targetFile: "classes.csv",
    },
    {
      name: "lineItems.categorySourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItems.csv": lineItemsCsv([lineItemRow({ categorySourcedId: "category-missing" })]),
      }),
      sourceFile: "lineItems.csv",
      field: "categorySourcedId",
      targetFile: "categories.csv",
    },
    {
      name: "lineItems.academicSessionSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItems.csv": lineItemsCsv([
          lineItemRow({ academicSessionSourcedId: "academic-session-missing" }),
        ]),
      }),
      sourceFile: "lineItems.csv",
      field: "academicSessionSourcedId",
      targetFile: "academicSessions.csv",
    },
    {
      name: "lineItems.schoolSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItems.csv": lineItemsCsv([lineItemRow({ schoolSourcedId: "org-missing" })]),
      }),
      sourceFile: "lineItems.csv",
      field: "schoolSourcedId",
      targetFile: "orgs.csv",
    },
    {
      name: "results.lineItemSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "results.csv": resultsCsv([resultRow({ lineItemSourcedId: "line-item-missing" })]),
      }),
      sourceFile: "results.csv",
      field: "lineItemSourcedId",
      targetFile: "lineItems.csv",
    },
    {
      name: "results.studentSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "results.csv": resultsCsv([resultRow({ studentSourcedId: "user-missing" })]),
      }),
      sourceFile: "results.csv",
      field: "studentSourcedId",
      targetFile: "users.csv",
    },
    {
      name: "results.classSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "results.csv": resultsCsv([resultRow({ classSourcedId: "class-missing" })]),
      }),
      sourceFile: "results.csv",
      field: "classSourcedId",
      targetFile: "classes.csv",
    },
    {
      name: "scoreScales.orgSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ orgSourcedId: "org-missing" })]),
      }),
      sourceFile: "scoreScales.csv",
      field: "orgSourcedId",
      targetFile: "orgs.csv",
    },
    {
      name: "scoreScales.courseSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ courseSourcedId: "course-missing" })]),
      }),
      sourceFile: "scoreScales.csv",
      field: "courseSourcedId",
      targetFile: "courses.csv",
    },
    {
      name: "scoreScales.classSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "scoreScales.csv": scoreScalesCsv([scoreScaleRow({ classSourcedId: "class-missing" })]),
      }),
      sourceFile: "scoreScales.csv",
      field: "classSourcedId",
      targetFile: "classes.csv",
    },
    {
      name: "lineItemLearningObjectiveIds.lineItemSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
          lineItemLearningObjectiveIdRow({ lineItemSourcedId: "line-item-missing" }),
        ]),
      }),
      sourceFile: "lineItemLearningObjectiveIds.csv",
      field: "lineItemSourcedId",
      targetFile: "lineItems.csv",
    },
    {
      name: "lineItemScoreScales.lineItemSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItemScoreScales.csv": lineItemScoreScalesCsv([
          lineItemScoreScaleRow({ lineItemSourcedId: "line-item-missing" }),
        ]),
      }),
      sourceFile: "lineItemScoreScales.csv",
      field: "lineItemSourcedId",
      targetFile: "lineItems.csv",
    },
    {
      name: "lineItemScoreScales.scoreScaleSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "lineItemScoreScales.csv": lineItemScoreScalesCsv([
          lineItemScoreScaleRow({ scoreScaleSourcedId: "score-scale-missing" }),
        ]),
      }),
      sourceFile: "lineItemScoreScales.csv",
      field: "scoreScaleSourcedId",
      targetFile: "scoreScales.csv",
    },
    {
      name: "resultLearningObjectiveIds.resultSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({ resultSourcedId: "result-missing" }),
        ]),
      }),
      sourceFile: "resultLearningObjectiveIds.csv",
      field: "resultSourcedId",
      targetFile: "results.csv",
    },
    {
      name: "resultScoreScales.resultSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "resultScoreScales.csv": resultScoreScalesCsv([
          resultScoreScaleRow({ resultSourcedId: "result-missing" }),
        ]),
      }),
      sourceFile: "resultScoreScales.csv",
      field: "resultSourcedId",
      targetFile: "results.csv",
    },
    {
      name: "resultScoreScales.scoreScaleSourcedId",
      files: validGradebookReferenceScenarioFiles({
        "resultScoreScales.csv": resultScoreScalesCsv([
          resultScoreScaleRow({ scoreScaleSourcedId: "score-scale-missing" }),
        ]),
      }),
      sourceFile: "resultScoreScales.csv",
      field: "scoreScaleSourcedId",
      targetFile: "scoreScales.csv",
    },
  ];
}

function validGradebookReferenceScenarioFiles(
  overrides: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return {
    ...validBulkGraphFiles(),
    ...validBulkGradebookFiles(),
    ...overrides,
  };
}
