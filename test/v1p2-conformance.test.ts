import { describe, expect, it } from "vitest";

import {
  combineOneRosterV1p2Filters,
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2ProviderPage,
  createOneRosterV1p2Query,
  createOneRosterV1p2ProviderStatusResponse,
  oneRosterV1p2Operations,
  oneRosterV1p2Scope,
  parseOneRosterV1p2StatusInfo,
} from "../src/v1p2/index.js";

describe("OneRoster 1.2 conformance-oriented scenarios", () => {
  it("covers pagination, sorting, filtering, and field-selection vocabulary", () => {
    const collections = oneRosterV1p2Operations.filter(
      (operation) => operation.responseKind === "collection",
    );
    expect(collections.length).toBeGreaterThan(0);
    expect(
      collections.every((operation) =>
        ["limit", "offset", "sort", "orderBy", "filter", "fields"].every((category) =>
          operation.allowedQuery.some((candidate) => candidate === category),
        ),
      ),
    ).toBe(true);
    const active = createOneRosterV1p2FilterClause("status", "=", "active");
    const source = createOneRosterV1p2FilterClause("source", "~", "example");
    if (active._tag === "err" || source._tag === "err") throw new Error("Expected valid filters.");
    const combined = combineOneRosterV1p2Filters(active.value, "AND", source.value);
    expect(combined._tag).toBe("ok");
    const query = createOneRosterV1p2Query({
      limit: 100,
      offset: 200,
      sort: "dateLastModified",
      orderBy: "asc",
      filter: combined._tag === "ok" ? combined.value : active.value,
      fields: ["sourcedId", "dateLastModified"],
    });
    expect(query).toMatchObject({ _tag: "ok", value: { limit: 100, offset: 200 } });
    expect(createOneRosterV1p2Query({ fields: ["not safe field"] })).toMatchObject({
      _tag: "err",
      error: [{ code: "query.invalid_field" }],
    });
    expect(createOneRosterV1p2FilterClause("not safe field", "=", "active")).toMatchObject({
      _tag: "err",
      error: [{ code: "query.invalid_field" }],
    });
  });

  it("covers provider page bounds and every standard status-info mapping", () => {
    const largePage = createOneRosterV1p2ProviderPage({
      items: Array.from({ length: 10000 }, (_, index) => ({ sourcedId: `synthetic-${index}` })),
      limit: 100,
      offset: 0,
      totalCount: 10000,
    });
    expect(largePage._tag).toBe("ok");
    expect(largePage._tag === "ok" ? largePage.value.items : []).toHaveLength(10000);
    for (const status of [400, 401, 403, 404, 405, 422, 429, 500, 501, 503]) {
      const response = createOneRosterV1p2ProviderStatusResponse(status);
      const body = JSON.parse(response.body ?? "{}");
      expect(parseOneRosterV1p2StatusInfo(body["imsx_StatusInfo"])._tag).toBe("ok");
    }
  });

  it("keeps required scopes and profile operation groups explicit", () => {
    const assessment = oneRosterV1p2Operations.filter((operation) =>
      operation.operationId.includes("Assessment"),
    );
    const resources = oneRosterV1p2Operations.filter(
      (operation) => operation.service === "resources",
    );
    const gradebookWrites = oneRosterV1p2Operations.filter(
      (operation) => operation.service === "gradebook" && operation.method !== "GET",
    );
    expect(assessment).toHaveLength(8);
    expect(resources).toHaveLength(5);
    expect(gradebookWrites.length).toBeGreaterThan(0);
    expect(
      assessment.every((operation) =>
        operation.requiredScopes.every((scope) =>
          scope.startsWith(oneRosterV1p2Scope("assessment")),
        ),
      ),
    ).toBe(true);
    expect(
      resources.every((operation) =>
        operation.requiredScopes.every((scope) => scope.includes("/scope/resource")),
      ),
    ).toBe(true);
  });
});
