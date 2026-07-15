import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2AssessmentLineItemWritePayload,
  createOneRosterV1p2AssessmentResultsClient,
  createOneRosterV1p2AssessmentResultWritePayload,
  findOneRosterV1p2Operation,
  oneRosterV1p2Operations,
  parseOneRosterV1p2AssessmentLineItem,
  parseOneRosterV1p2AssessmentLineItemCollection,
  parseOneRosterV1p2AssessmentResult,
  type OneRosterV1p2AssessmentResultsClient,
} from "../src/v1p2/index.js";
import {
  assessmentResultsEntities,
  assessmentResultsPayload,
} from "./fixtures/v1p2-assessment-results-payloads.js";

interface AssessmentResultsCall {
  readonly url: string;
  readonly method: string;
  readonly body: string;
  readonly hasAuthorization: boolean;
}

class AssessmentResultsFetchHarness {
  readonly calls: Array<AssessmentResultsCall> = [];
  private readonly responses: Array<Response | Error>;

  public constructor(responses: ReadonlyArray<Response | Error>) {
    this.responses = [...responses];
  }

  public readonly fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const headers = new Headers(init?.headers);
    this.calls.push({
      url: input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url,
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : "",
      hasAuthorization: headers.has("authorization"),
    });
    const response = this.responses.shift();
    if (response === undefined) throw new Error("Assessment Results response queue was empty.");
    if (response instanceof Error) throw response;
    return response;
  };
}

function createClient(
  harness: AssessmentResultsFetchHarness,
  scopes: Array<ReadonlyArray<string>> = [],
): OneRosterV1p2AssessmentResultsClient {
  const token = createOneRosterV1p2AccessToken("test-token");
  if (token._tag === "err") throw new Error("Expected test token.");
  const result = createOneRosterV1p2AssessmentResultsClient({
    serviceBaseUrls: { gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2" },
    accessTokenProvider: async (requiredScopes: ReadonlyArray<string>) => {
      scopes.push([...requiredScopes]);
      return ok(token.value);
    },
    fetch: harness.fetch,
  });
  if (result._tag === "err")
    throw new Error("Expected valid Assessment Results client configuration.");
  return result.value;
}

function responseFor(operationId: string, empty = false): Response {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Assessment Results operation.");
  if (operation.responseKind === "noContent") {
    return new Response(null, { status: operation.method === "DELETE" ? 204 : 201 });
  }
  return new Response(JSON.stringify(assessmentResultsPayload(operation.responseCodec, empty)), {
    status: 200,
    headers: { "content-type": "application/json", "X-Total-Count": empty ? "0" : "1" },
  });
}

function invokeRead(
  client: OneRosterV1p2AssessmentResultsClient,
  operationId: string,
): Promise<unknown> {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Assessment Results operation.");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: registry parity invokes a known public operation key.
  const method = client[operationId as keyof OneRosterV1p2AssessmentResultsClient] as (
    ...args: ReadonlyArray<unknown>
  ) => Promise<unknown>;
  const args = operation.pathParameters.map(() => "reference-example");
  const options = operation.responseKind === "collection" ? { query: { limit: 1 } } : {};
  return method(...args, options);
}

describe("OneRoster 1.2 Assessment Results Profile", () => {
  it("parses complete profile entities, nested objectives, and exact envelopes", () => {
    const lineItem = parseOneRosterV1p2AssessmentLineItem(
      assessmentResultsEntities.assessmentLineItem,
    );
    const result = parseOneRosterV1p2AssessmentResult(assessmentResultsEntities.assessmentResult);
    expect(lineItem).toMatchObject({
      _tag: "ok",
      value: {
        sourcedId: "assessment-line-item-example",
        parentAssessmentLineItem: { type: "assessmentLineItem" },
        learningObjectiveSet: [{ source: "case", learningObjectiveIds: ["objective-example"] }],
      },
    });
    expect(result).toMatchObject({
      _tag: "ok",
      value: {
        assessmentLineItem: { type: "assessmentLineItem" },
        student: { type: "user" },
        learningObjectiveSet: [{ learningObjectiveResults: [{ textScore: "mastered" }] }],
      },
    });
    expect(
      createOneRosterV1p2AssessmentLineItemWritePayload(
        lineItem._tag === "ok" ? lineItem.value : {},
      ),
    ).toMatchObject({
      _tag: "ok",
      value: { assessmentLineItem: { sourcedId: "assessment-line-item-example" } },
    });
    expect(
      createOneRosterV1p2AssessmentResultWritePayload(result._tag === "ok" ? result.value : {}),
    ).toMatchObject({
      _tag: "ok",
      value: { assessmentResult: { sourcedId: "assessment-result-example" } },
    });
    expect(
      parseOneRosterV1p2AssessmentLineItemCollection({ assessmentLineItems: [] }),
    ).toMatchObject({
      _tag: "ok",
      value: { assessmentLineItems: [] },
    });
  });

  it("rejects missing, wrong-type, vocabulary, reference, and nested objective values", () => {
    const missingTitle = { ...assessmentResultsEntities.assessmentLineItem };
    delete (missingTitle as { title?: string }).title;
    expect(parseOneRosterV1p2AssessmentLineItem(missingTitle)).toMatchObject({
      _tag: "err",
      error: [{ code: "payload.missing_property", path: "$.title" }],
    });

    const invalidResult = {
      ...assessmentResultsEntities.assessmentResult,
      scoreStatus: "not-a-score-status",
      assessmentLineItem: {
        ...assessmentResultsEntities.assessmentResult.assessmentLineItem,
        type: "lineItem",
      },
      learningObjectiveSet: [
        {
          source: "case",
          learningObjectiveResults: [],
        },
      ],
    };
    const rejected = parseOneRosterV1p2AssessmentResult(invalidResult);
    expect(rejected).toMatchObject({ _tag: "err", error: [{ code: "payload.invalid_value" }] });
    expect(JSON.stringify(rejected)).not.toContain("not-a-score-status");
    expect(JSON.stringify(rejected)).not.toContain("user-example");
  });

  it("covers every official profile operation with exact paths, query categories, and scopes", async () => {
    const operations = oneRosterV1p2Operations.filter(
      (operation) =>
        operation.service === "gradebook" &&
        operation.method === "GET" &&
        operation.responseCodec.startsWith("assessment"),
    );
    const harness = new AssessmentResultsFetchHarness(
      operations.map((operation) => responseFor(operation.operationId)),
    );
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    for (const [index, operation] of operations.entries()) {
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: parity loop matches each response to one operation.
      const response = await invokeRead(client, operation.operationId);
      expect(response).toMatchObject({ _tag: "ok" });
      expect(harness.calls[index]?.url).toContain(
        operation.path.replace(/\{[^}]+\}/g, "reference-example"),
      );
      expect(harness.calls[index]?.url).toContain(
        operation.responseKind === "collection" ? "limit=1" : "",
      );
      expect(scopes[index]).toEqual(operation.requiredScopes);
    }
    expect(operations).toHaveLength(4);
    expect(harness.calls).toHaveLength(operations.length);
  });

  it("supports projected paged reads and one-call PUT/DELETE mutations", async () => {
    const lineItem = entity(
      parseOneRosterV1p2AssessmentLineItem(assessmentResultsEntities.assessmentLineItem),
    );
    const resultEntity = entity(
      parseOneRosterV1p2AssessmentResult(assessmentResultsEntities.assessmentResult),
    );
    const harness = new AssessmentResultsFetchHarness([
      new Response(JSON.stringify(assessmentResultsPayload("assessmentLineItemCollection")), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "X-Total-Count": "1",
          Link: '<https://sis.example/next>; rel="next"',
        },
      }),
      responseFor("deleteAssessmentLineItem"),
      responseFor("putAssessmentLineItem"),
      responseFor("deleteAssessmentResult"),
      responseFor("putAssessmentResult"),
    ]);
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    const page = await client.getAllAssessmentLineItems({ query: { fields: ["title"] } });
    expect(page).toMatchObject({
      _tag: "ok",
      value: {
        items: [{ title: "Example Assessment" }],
        links: { next: "https://sis.example/next" },
      },
    });
    const signal = new AbortController().signal;
    const deletedLineItem = await client.deleteAssessmentLineItem("assessment-line-item-example", {
      signal,
    });
    const putLineItem = await client.putAssessmentLineItem(
      "assessment-line-item-example",
      lineItem,
      { signal },
    );
    const deletedResult = await client.deleteAssessmentResult("assessment-result-example", {
      signal,
    });
    const putResult = await client.putAssessmentResult("assessment-result-example", resultEntity, {
      signal,
    });
    expect([deletedLineItem, putLineItem, deletedResult, putResult].every(isOkResult)).toBe(true);
    expect(harness.calls.map((call) => call.method)).toEqual([
      "GET",
      "DELETE",
      "PUT",
      "DELETE",
      "PUT",
    ]);
    expect(JSON.parse(harness.calls[2]?.body ?? "{}")).toMatchObject({
      assessmentLineItem: { sourcedId: "assessment-line-item-example" },
    });
    expect(JSON.parse(harness.calls[4]?.body ?? "{}")).toMatchObject({
      assessmentResult: { sourcedId: "assessment-result-example" },
    });
    expect(harness.calls.filter((call) => call.body.length === 0)).toHaveLength(3);
    expect(scopes).toEqual([
      findOneRosterV1p2Operation("getAllAssessmentLineItems")?.requiredScopes,
      findOneRosterV1p2Operation("deleteAssessmentLineItem")?.requiredScopes,
      findOneRosterV1p2Operation("putAssessmentLineItem")?.requiredScopes,
      findOneRosterV1p2Operation("deleteAssessmentResult")?.requiredScopes,
      findOneRosterV1p2Operation("putAssessmentResult")?.requiredScopes,
    ]);

    const mismatchHarness = new AssessmentResultsFetchHarness([]);
    const mismatch = await createClient(mismatchHarness).putAssessmentResult(
      "different-result",
      resultEntity,
      { signal },
    );
    expect(mismatch).toMatchObject({ _tag: "err", error: { _tag: "OneRosterV1p2PayloadError" } });
    expect(mismatchHarness.calls).toHaveLength(0);
  });

  it("returns safe HTTP and cancellation errors without retrying", async () => {
    const lineItem = entity(
      parseOneRosterV1p2AssessmentLineItem(assessmentResultsEntities.assessmentLineItem),
    );
    const failureHarness = new AssessmentResultsFetchHarness([
      new Response("not-retained", { status: 429 }),
    ]);
    const failure = await createClient(failureHarness).deleteAssessmentResult("result-example", {
      signal: new AbortController().signal,
    });
    expect(failure).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 429 },
    });
    expect(JSON.stringify(failure)).not.toContain("not-retained");
    expect(failureHarness.calls).toHaveLength(1);

    const controller = new AbortController();
    controller.abort();
    const cancelledHarness = new AssessmentResultsFetchHarness([]);
    const cancelled = await createClient(cancelledHarness).putAssessmentLineItem(
      "assessment-line-item-example",
      lineItem,
      { signal: controller.signal },
    );
    expect(cancelled).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(cancelledHarness.calls).toHaveLength(0);
  });
});

function entity<T>(
  result: { readonly _tag: "ok"; readonly value: T } | { readonly _tag: "err" },
): T {
  if (result._tag === "err") throw new Error("Expected valid Assessment Results fixture entity.");
  return result.value;
}

function isOkResult(input: unknown): boolean {
  return input !== null && typeof input === "object" && "_tag" in input && input._tag === "ok";
}
