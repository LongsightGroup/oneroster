import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p1FilterClause,
  createOneRosterV1p1GradebookClient,
  createOneRosterV1p1Query,
  createOneRosterV1p1RosteringClient,
  oneRosterV1p1Operations,
  oneRosterV1p1RosteringOperationIds,
  parseOneRosterV1p1AcademicSession,
  parseOneRosterV1p1Category,
  parseOneRosterV1p1Course,
  serializeOneRosterV1p1Filter,
  serializeOneRosterV1p1Query,
} from "../src/v1p1/index.js";
import type { OneRosterV1p1AuthorizationInput } from "../src/v1p1/index.js";
import type { OneRosterV1p1User } from "../src/v1p1/index.js";
import type { OneRosterV1p2User } from "../src/v1p2/index.js";

type V1p1UserAssignableToV1p2User = OneRosterV1p1User extends OneRosterV1p2User ? true : false;
const versionsAreNotStructurallyInterchangeable: V1p1UserAssignableToV1p2User = false;

const baseUrl = "https://provider.example/ims/oneroster/v1p1";

function authorization(input: OneRosterV1p1AuthorizationInput) {
  expect(input.request.url).toContain(baseUrl);
  return ok<HeadersInit>({ "X-Test-Authorization": "synthetic" });
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "X-Total-Count": "1" },
  });
}

describe("OneRoster 1.1 compatibility boundary", () => {
  it("keeps the official operation groups and combined root explicit", () => {
    expect(oneRosterV1p1Operations).toHaveLength(61);
    expect(oneRosterV1p1RosteringOperationIds).toHaveLength(41);
    expect(oneRosterV1p1Operations.filter(({ service }) => service === "resources")).toHaveLength(
      4,
    );
    expect(oneRosterV1p1Operations.filter(({ service }) => service === "gradebook")).toHaveLength(
      16,
    );
    expect(versionsAreNotStructurallyInterchangeable).toBe(false);
  });

  it("installs a collect-all method for every Rostering collection operation", () => {
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: authorization,
      fetch: async () => response({}),
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const expected = [
      "collectAllAcademicSessions",
      "collectAllClasses",
      "collectAllCourses",
      "collectAllDemographics",
      "collectAllEnrollments",
      "collectAllGradingPeriods",
      "collectAllOrgs",
      "collectAllResources",
      "collectAllSchools",
      "collectAllStudents",
      "collectAllTeachers",
      "collectAllTerms",
      "collectAllUsers",
      "collectClassesForCourse",
      "collectClassesForSchool",
      "collectClassesForStudent",
      "collectClassesForTeacher",
      "collectClassesForTerm",
      "collectClassesForUser",
      "collectCoursesForSchool",
      "collectEnrollmentsForClassInSchool",
      "collectEnrollmentsForSchool",
      "collectGradingPeriodsForTerm",
      "collectResourcesForClass",
      "collectResourcesForCourse",
      "collectStudentsForClass",
      "collectStudentsForClassInSchool",
      "collectStudentsForSchool",
      "collectTeachersForClass",
      "collectTeachersForClassInSchool",
      "collectTeachersForSchool",
      "collectTermsForSchool",
    ];
    const installed = Object.keys(client.value)
      .filter((key) => key.startsWith("collect"))
      .toSorted();
    expect(installed).toEqual(expected);
    expect(typeof client.value.iterateAllUsers).toBe("function");
    expect(typeof client.value.iterateResourcesForClass).toBe("function");
  });

  it("rejects missing v1.1 traversal bounds at the option boundary", async () => {
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: authorization,
      fetch: async () => response({}),
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");

    const iteration = await Reflect.apply(client.value.iterateAllUsers, client.value, []).next();
    expect(iteration.value).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p1QueryError", diagnostics: [{ path: "$.maxPages" }] },
    });

    const collection = await Reflect.apply(client.value.collectAllUsers, client.value, [
      { maxPages: 1 },
    ]);
    expect(collection).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p1QueryError", diagnostics: [{ path: "$.maxItems" }] },
    });
  });

  it("parses v1.1 model fields without aliasing the v1.2 model", () => {
    const academicSession = parseOneRosterV1p1AcademicSession({
      sourcedId: "session-synthetic",
      status: "active",
      dateLastModified: "2025-01-01T00:00:00Z",
      title: "session",
      startDate: "2025-01-01",
      endDate: "2025-06-01",
      type: "term",
      schoolYear: "2025",
    });
    expect(academicSession).toMatchObject({ _tag: "ok", value: { schoolYear: "2025" } });
    const course = parseOneRosterV1p1Course({
      sourcedId: "course-synthetic",
      status: "active",
      dateLastModified: "2025-01-01T00:00:00Z",
      title: "course",
      courseCode: "course-code",
    });
    expect(course).toMatchObject({ _tag: "ok", value: { courseCode: "course-code" } });
  });

  it("serializes the v1.1 query and filter grammar", () => {
    const filter = createOneRosterV1p1FilterClause("familyName", "~", "synthetic");
    if (filter._tag === "err") throw new Error("Expected a valid filter.");
    expect(serializeOneRosterV1p1Filter(filter.value)).toBe("familyName~'synthetic'");
    const query = createOneRosterV1p1Query({
      limit: 10,
      offset: 20,
      filter: filter.value,
      fields: ["title"],
    });
    if (query._tag === "err") throw new Error("Expected a valid query.");
    const serialized = serializeOneRosterV1p1Query(query.value);
    if (serialized._tag === "err") throw new Error("Expected a valid serialized query.");
    expect(serialized.value).toBe(
      "limit=10&offset=20&filter=familyName%7E%27synthetic%27&fields=title",
    );
  });

  it("routes Rostering reads through the v1.1 root and authorizer", async () => {
    let requestedUrl = "";
    let authorizedOperation = "";
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: async (input: OneRosterV1p1AuthorizationInput) => {
        authorizedOperation = input.operation.operationId;
        return authorization(input);
      },
      fetch: async (input: RequestInfo | URL) => {
        requestedUrl =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        return response({
          courses: [
            {
              sourcedId: "course-synthetic",
              status: "active",
              dateLastModified: "2025-01-01T00:00:00Z",
              title: "course",
              courseCode: "course-code",
            },
          ],
        });
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const result = await client.value.getAllCourses({ query: { limit: 10, fields: ["title"] } });
    expect(result).toMatchObject({
      _tag: "ok",
      value: { items: [{ sourcedId: "course-synthetic" }], limit: 10 },
    });
    expect(requestedUrl).toBe(`${baseUrl}/courses?limit=10&fields=title`);
    expect(authorizedOperation).toBe("getAllCourses");
  });

  it("uses the shared opt-in retry policy for v1.1 reads", async () => {
    let calls = 0;
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: authorization,
      retryPolicy: {
        maxAttempts: 2,
        maxElapsedMilliseconds: 1_000,
        backoffMilliseconds: () => 0,
      },
      fetch: async () => {
        calls += 1;
        if (calls === 1) return response({}, 503);
        return response({ courses: [] });
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const result = await client.value.getAllCourses();
    expect(result._tag).toBe("ok");
    expect(calls).toBe(2);
  });

  it("keeps the current v1.1 limit when a next link supplies one", async () => {
    const requestedUrls: Array<string> = [];
    let calls = 0;
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: authorization,
      fetch: async (input: RequestInfo | URL) => {
        requestedUrls.push(
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
        );
        calls += 1;
        return new Response(JSON.stringify({ courses: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            ...(calls === 1
              ? { Link: '<https://provider.example/courses?limit=99&offset=1>; rel="next"' }
              : {}),
          },
        });
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const result = await client.value.collectAllCourses({
      query: { limit: 1 },
      maxPages: 2,
      maxItems: 2,
    });
    expect(result).toMatchObject({ _tag: "ok", value: [] });
    expect(requestedUrls).toHaveLength(2);
    const nextSearch = new URL(requestedUrls[1] ?? "").searchParams;
    expect(nextSearch.get("limit")).toBe("1");
    expect(nextSearch.get("offset")).toBe("1");
  });

  it("uses the injected retry clock for v1.1 elapsed-time bounds", async () => {
    let calls = 0;
    const readings = [0, 0, 2_000];
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: authorization,
      retryPolicy: {
        maxAttempts: 3,
        maxElapsedMilliseconds: 1_000,
        backoffMilliseconds: () => 0,
      },
      retryClock: { nowMilliseconds: () => readings.shift() ?? 2_000 },
      fetch: async () => {
        calls += 1;
        return response({}, 503);
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const result = await client.value.getAllCourses();
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p1HttpError", status: 503 },
    });
    expect(calls).toBe(1);
  });

  it("never retries v1.1 mutations even when a retry policy is configured", async () => {
    let calls = 0;
    const client = createOneRosterV1p1GradebookClient({
      baseUrl,
      authorizer: authorization,
      retryPolicy: {
        maxAttempts: 3,
        maxElapsedMilliseconds: 1_000,
        backoffMilliseconds: () => 0,
      },
      fetch: async () => {
        calls += 1;
        return response({}, 503);
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const category = parseOneRosterV1p1Category({
      sourcedId: "category-synthetic",
      status: "active",
      dateLastModified: "2025-01-01T00:00:00Z",
      title: "category",
    });
    if (category._tag === "err") throw new Error("Expected a valid category.");
    const result = await client.value.putCategory("category-synthetic", category.value, {
      signal: new AbortController().signal,
    });
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p1HttpError", status: 503 },
    });
    expect(calls).toBe(1);
  });

  it("routes Gradebook writes without retrying or requiring an implicit token helper", async () => {
    const requests: Array<{ readonly method: string; readonly url: string }> = [];
    const client = createOneRosterV1p1GradebookClient({
      baseUrl,
      authorizer: authorization,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        requests.push({
          method: init?.method ?? (input instanceof Request ? input.method : "GET"),
          url,
        });
        return new Response(null, { status: init?.method === "DELETE" ? 204 : 201 });
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const controller = new AbortController();
    const category = parseOneRosterV1p1Category({
      sourcedId: "category-synthetic",
      status: "active",
      dateLastModified: "2025-01-01T00:00:00Z",
      title: "category",
    });
    if (category._tag === "err") throw new Error("Expected a valid category.");
    const result = await client.value.putCategory("category-synthetic", category.value, {
      signal: controller.signal,
    });
    expect(result).toMatchObject({ _tag: "ok", value: { status: 201 } });
    expect(requests).toEqual([{ method: "PUT", url: `${baseUrl}/categories/category-synthetic` }]);

    const deleted = await client.value.deleteCategory("category-synthetic");
    expect(deleted).toMatchObject({ _tag: "ok", value: { status: 204 } });

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: this test intentionally crosses the public TypeScript boundary to verify runtime rejection of malformed options.
    const deleteCategory = client.value.deleteCategory as (
      sourcedId: string,
      options: unknown,
    ) => Promise<unknown>;
    const invalidSignal = await deleteCategory("category-synthetic", { signal: "invalid" });
    expect(invalidSignal).toMatchObject({
      _tag: "err",
      error: {
        _tag: "OneRosterV1p1QueryError",
        diagnostics: [{ path: "$.signal" }],
      },
    });
    expect(requests).toHaveLength(2);
  });

  it("returns cancellation before calling the authorizer or fetch", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const client = createOneRosterV1p1RosteringClient({
      baseUrl,
      authorizer: async (_input: OneRosterV1p1AuthorizationInput) => {
        calls += 1;
        return ok<HeadersInit>({});
      },
      fetch: async (_input: RequestInfo | URL) => {
        calls += 1;
        return response({ courses: [] });
      },
    });
    if (client._tag === "err") throw new Error("Expected a valid client.");
    const result = await client.value.getAllCourses({ signal: controller.signal });
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p1CancellationError" },
    });
    expect(calls).toBe(0);
  });
});
