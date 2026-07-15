import { describe, expect, it } from "vitest";

import {
  oneRosterV1p1GradebookOperationIds,
  oneRosterV1p1Operations,
  oneRosterV1p1RosteringOperationIds,
} from "../src/v1p1/index.js";

describe("generated OneRoster v1.1 operation registry", () => {
  it("contains every operation from the pinned official endpoint tables", () => {
    expect(oneRosterV1p1Operations).toHaveLength(61);
    expect(oneRosterV1p1RosteringOperationIds).toHaveLength(41);
    expect(oneRosterV1p1GradebookOperationIds).toHaveLength(16);
    expect(new Set(oneRosterV1p1Operations.map(({ operationId }) => operationId)).size).toBe(61);
  });

  it("normalizes wrapped official paths without retaining document whitespace", () => {
    expect(
      oneRosterV1p1Operations.find(
        ({ operationId }) => operationId === "getEnrollmentsForClassInSchool",
      )?.path,
    ).toBe("/schools/{school_id}/classes/{class_id}/enrollments");
    expect(
      oneRosterV1p1Operations.find(
        ({ operationId }) => operationId === "getResultsForLineItemForClass",
      )?.path,
    ).toBe("/classes/{class_id}/lineItems/{li_id}/results");
  });

  it("derives query and scope policy from endpoint shape and service", () => {
    const singleton = oneRosterV1p1Operations.find(
      ({ operationId }) => operationId === "getAcademicSession",
    );
    const relationship = oneRosterV1p1Operations.find(
      ({ operationId }) => operationId === "getClassesForCourse",
    );
    const write = oneRosterV1p1Operations.find(({ operationId }) => operationId === "putResult");

    expect(singleton?.allowedQuery).toEqual(["fields"]);
    expect(singleton?.requiredScopes).toEqual([
      "https://purl.imsglobal.org/spec/or/v1p1/scope/roster-core.readonly",
    ]);
    expect(relationship?.requiredScopes).toEqual([
      "https://purl.imsglobal.org/spec/or/v1p1/scope/roster.readonly",
    ]);
    expect(write).toMatchObject({
      requestCodec: "result",
      responseCodec: "none",
      successStatuses: [200, 201],
    });
  });
});
