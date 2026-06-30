import { describe, expect, it } from "vitest";

import { parseAndValidateOneRosterCsvFullZip } from "../src/index.js";
import {
  expectValidatedFullErr,
  expectValidatedFullOk,
} from "./fixtures/one-roster-csv-full-assertions.js";
import { fullCsvModes, validBulkFullGraphFiles } from "./fixtures/one-roster-csv-full-packages.js";
import {
  lineItemLearningObjectiveIdRow,
  lineItemLearningObjectiveIdsCsv,
  lineItemRow,
  lineItemsCsv,
  resultLearningObjectiveIdRow,
  resultLearningObjectiveIdsCsv,
  resultRow,
  resultsCsv,
  scoreScaleRow,
  scoreScalesCsv,
} from "./fixtures/one-roster-csv-gradebook-rows.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import {
  resourceRow,
  resourcesCsv,
  userResourceRow,
  userResourcesCsv,
} from "./fixtures/one-roster-csv-resources-rows.js";
import {
  academicSessionRow,
  academicSessionsCsv,
  classRow,
  classesCsv,
  courseRow,
  coursesCsv,
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

const dateLastModified = "2025-01-02T03:04:05.006Z";

describe("OneRoster full CSV semantic validation", () => {
  it("accepts valid score scale mappings and CASE UUID URNs", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      fullSemanticZip({
        "scoreScales.csv": scoreScalesCsv([
          scoreScaleRow({ scoreScaleValue: "{Pass:50},{A:7-10},{60-69:B}" }),
        ]),
        "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
          resultLearningObjectiveIdRow({
            source: "case",
            learningObjectiveId: "urn:uuid:22222222-2222-2222-2222-222222222222",
          }),
          resultLearningObjectiveIdRow({
            sourcedId: "result-lo-ext",
            source: "ext:vendor",
            learningObjectiveId: "vendor-objective",
          }),
        ]),
      }),
    );

    expect(result._tag).toBe("ok");
    expectValidatedFullOk(result);
  });

  it("rejects malformed score scale mappings and invalid CASE UUID URNs", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "scoreScales.csv": scoreScalesCsv([
            scoreScaleRow({ sourcedId: "score-scale-1", scoreScaleValue: "A:94" }),
            scoreScaleRow({ sourcedId: "score-scale-2", scoreScaleValue: "{A94}" }),
            scoreScaleRow({ sourcedId: "score-scale-3", scoreScaleValue: "{A:B:C}" }),
            scoreScaleRow({ sourcedId: "score-scale-4", scoreScaleValue: "{:A}" }),
            scoreScaleRow({ sourcedId: "score-scale-5", scoreScaleValue: "{A:}" }),
          ]),
          "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
            lineItemLearningObjectiveIdRow({ learningObjectiveId: "not-a-uuid-urn" }),
          ]),
          "resultLearningObjectiveIds.csv": resultLearningObjectiveIdsCsv([
            resultLearningObjectiveIdRow({
              source: "case",
              learningObjectiveId: "not-a-result-uuid-urn",
            }),
          ]),
        }),
      ),
    );

    expect(
      diagnostics.filter(
        (diagnostic) => diagnostic.code === "semantic.invalid_score_scale_mapping",
      ),
    ).toHaveLength(5);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.invalid_case_learning_objective_id",
          fileName: "lineItemLearningObjectiveIds.csv",
          field: "learningObjectiveId",
          expected: "UUID URN",
          actual: "invalid",
        }),
        expect.objectContaining({
          code: "semantic.invalid_case_learning_objective_id",
          fileName: "resultLearningObjectiveIds.csv",
          field: "learningObjectiveId",
        }),
      ]),
    );
  });

  it("validates result class consistency and class membership fallback", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "results.csv": resultsCsv([
            resultRow({ sourcedId: "result-class-mismatch", classSourcedId: "class-missing" }),
            resultRow({
              sourcedId: "result-not-enrolled",
              studentSourcedId: "user-agent",
              classSourcedId: "",
            }),
          ]),
        }),
      ),
    );

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.result_class_mismatch",
          fileName: "results.csv",
          rowNumber: 2,
          field: "classSourcedId",
          expected: "lineItems.classSourcedId",
          actual: "mismatch",
        }),
        expect.objectContaining({
          code: "semantic.result_student_not_enrolled",
          fileName: "results.csv",
          rowNumber: 3,
          field: "studentSourcedId",
          expected: "enrollments.csv class/user membership",
          actual: "missing",
        }),
      ]),
    );
  });

  it("validates enrollment roles, primary roles, primary org roles, and profile ownership", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "users.csv": usersCsv([
            userRow({
              sourcedId: "user-agent",
              username: "user-agent",
              primaryOrgSourcedId: "org-root",
            }),
            userRow({ sourcedId: "user-1", username: "user-1", primaryOrgSourcedId: "org-1" }),
          ]),
          "roles.csv": rolesCsv([
            roleRow({ sourcedId: "role-1", role: "student" }),
            roleRow({ sourcedId: "role-2", role: "student" }),
            roleRow({
              sourcedId: "role-3",
              userSourcedId: "user-agent",
              userProfileSourcedId: "profile-1",
            }),
          ]),
        }),
      ),
    );

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.enrollment_role_mismatch",
          fileName: "enrollments.csv",
          field: "role",
          actual: "missing compatible role",
        }),
        expect.objectContaining({
          code: "semantic.multiple_primary_roles_for_user_org",
          fileName: "roles.csv",
          rowNumber: 3,
          field: "roleType",
        }),
        expect.objectContaining({
          code: "semantic.primary_org_missing_role",
          fileName: "users.csv",
          rowNumber: 2,
          field: "primaryOrgSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.user_profile_user_mismatch",
          fileName: "roles.csv",
          rowNumber: 4,
          field: "userProfileSourcedId",
        }),
      ]),
    );
  });

  it("accepts administrator enrollments backed by ancestor administrator roles", () => {
    const result = parseAndValidateOneRosterCsvFullZip(
      fullSemanticZip({
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-agent",
            userSourcedId: "user-agent",
            orgSourcedId: "org-1",
          }),
          roleRow({
            sourcedId: "role-1",
            role: "districtAdministrator",
            orgSourcedId: "org-root",
            userProfileSourcedId: "profile-1",
          }),
          roleRow({
            sourcedId: "role-school",
            role: "teacher",
            orgSourcedId: "org-1",
          }),
        ]),
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({ role: "administrator", primary: "false" }),
        ]),
      }),
    );

    expect(result._tag).toBe("ok");
    expectValidatedFullOk(result);
  });

  it("validates academic session and school org type constraints", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "academicSessions.csv": academicSessionsCsv([
            academicSessionRow({ sourcedId: "as-parent", title: "School Year" }),
            academicSessionRow({ sourcedId: "as-1", title: "Also School Year" }),
            academicSessionRow({ sourcedId: "as-term", title: "Fall Term", type: "term" }),
          ]),
          "orgs.csv": orgsCsv([
            orgRow({ sourcedId: "org-root", name: "District", type: "district" }),
            orgRow({
              sourcedId: "org-1",
              name: "Instruction Department",
              type: "department",
              parentSourcedId: "org-root",
            }),
          ]),
          "courses.csv": coursesCsv([
            courseRow({ schoolYearSourcedId: "as-term", orgSourcedId: "org-1" }),
          ]),
          "classes.csv": classesCsv([classRow({ termSourcedIds: "as-1" })]),
          "lineItems.csv": lineItemsCsv([lineItemRow({ academicSessionSourcedId: "as-1" })]),
        }),
      ),
    );

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.academic_session_type_mismatch",
          fileName: "courses.csv",
          field: "schoolYearSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.academic_session_type_mismatch",
          fileName: "classes.csv",
          field: "termSourcedIds",
          actual: "schoolYear",
        }),
        expect.objectContaining({
          code: "semantic.academic_session_type_mismatch",
          fileName: "lineItems.csv",
          field: "academicSessionSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.org_type_mismatch",
          fileName: "classes.csv",
          field: "schoolSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.org_type_mismatch",
          fileName: "enrollments.csv",
          field: "schoolSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.org_type_mismatch",
          fileName: "lineItems.csv",
          field: "schoolSourcedId",
        }),
      ]),
    );
  });

  it("validates userResource class/org, enrollment, and resource role semantics", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "resources.csv": resourcesCsv([resourceRow({ roles: "parent" })]),
          "userResources.csv": userResourcesCsv([
            userResourceRow({ sourcedId: "user-resource-org", orgSourcedId: "org-root" }),
            userResourceRow({
              sourcedId: "user-resource-enrollment",
              userSourcedId: "user-agent",
            }),
          ]),
        }),
      ),
    );

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.user_resource_class_org_mismatch",
          fileName: "userResources.csv",
          rowNumber: 2,
          field: "orgSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.user_resource_user_not_enrolled",
          fileName: "userResources.csv",
          rowNumber: 3,
          field: "userSourcedId",
        }),
        expect.objectContaining({
          code: "semantic.resource_role_mismatch",
          fileName: "userResources.csv",
          rowNumber: 2,
          field: "resourceSourcedId",
        }),
      ]),
    );
  });

  it("skips delta semantic rows by default and validates them in allRows mode", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv({ modes: new Map([["scoreScales.csv", "delta"]]) }),
      "scoreScales.csv": scoreScalesCsv([
        scoreScaleRow({
          status: "active",
          dateLastModified,
          scoreScaleValue: "A:94",
        }),
      ]),
    });

    expectValidatedFullOk(parseAndValidateOneRosterCsvFullZip(bytes));

    expect(
      expectValidatedFullErr(
        parseAndValidateOneRosterCsvFullZip(bytes, { referenceMode: "allRows" }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: "semantic.invalid_score_scale_mapping",
        fileName: "scoreScales.csv",
        field: "scoreScaleValue",
      }),
    );
  });

  it("keeps semantic diagnostics free of raw IDs and PII-bearing payload values", () => {
    const diagnostics = expectValidatedFullErr(
      parseAndValidateOneRosterCsvFullZip(
        fullSemanticZip({
          "users.csv": usersCsv([
            userRow({
              sourcedId: "secret-user-id",
              username: "secret-username",
              primaryOrgSourcedId: "org-1",
            }),
            userRow({ sourcedId: "user-1", username: "user-1", primaryOrgSourcedId: "org-1" }),
          ]),
          "roles.csv": rolesCsv([
            roleRow({ sourcedId: "role-1", role: "student" }),
            roleRow({ sourcedId: "role-2", userSourcedId: "secret-user-id" }),
          ]),
          "userProfiles.csv": userProfilesCsv([
            userProfileRow({ password: "secret-password" }),
            userProfileRow({
              sourcedId: "secret-profile-id",
              userSourcedId: "secret-user-id",
              username: "secret-profile-username",
            }),
          ]),
          "lineItems.csv": lineItemsCsv([
            lineItemRow({ resultValueMin: "50.25", resultValueMax: "100.75" }),
          ]),
          "results.csv": resultsCsv([
            resultRow({
              studentSourcedId: "secret-user-id",
              score: "49.75",
              comment: "secret-comment",
              textScore: "secret-text-score",
            }),
          ]),
          "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdsCsv([
            lineItemLearningObjectiveIdRow({ learningObjectiveId: "secret-learning-objective" }),
          ]),
          "resources.csv": resourcesCsv([
            resourceRow({ vendorResourceId: "secret-vendor-resource", roles: "parent" }),
          ]),
        }),
      ),
    );

    const diagnosticsJson = JSON.stringify(diagnostics);

    expect(diagnosticsJson).not.toContain("secret-user-id");
    expect(diagnosticsJson).not.toContain("secret-username");
    expect(diagnosticsJson).not.toContain("secret-password");
    expect(diagnosticsJson).not.toContain("secret-profile-id");
    expect(diagnosticsJson).not.toContain("secret-profile-username");
    expect(diagnosticsJson).not.toContain("secret-comment");
    expect(diagnosticsJson).not.toContain("secret-text-score");
    expect(diagnosticsJson).not.toContain("secret-learning-objective");
    expect(diagnosticsJson).not.toContain("secret-vendor-resource");
    expect(diagnosticsJson).not.toContain("49.75");
    expect(diagnosticsJson).not.toContain("50.25");
    expect(diagnosticsJson).not.toContain("100.75");
  });
});

function fullSemanticZip(overrides: Readonly<Record<string, string>>): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: fullCsvModes("bulk") }),
    ...validBulkFullGraphFiles(),
    ...overrides,
  });
}
