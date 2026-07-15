import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2CategoryWritePayload,
  createOneRosterV1p2GradebookClient,
  createOneRosterV1p2LineItemCollectionWritePayload,
  createOneRosterV1p2ResultWritePayload,
  findOneRosterV1p2Operation,
  oneRosterV1p2Operations,
  parseOneRosterV1p2Category,
  parseOneRosterV1p2LineItem,
  parseOneRosterV1p2Result,
  parseOneRosterV1p2ScoreScale,
  type OneRosterV1p2GradebookClient,
} from "../src/v1p2/index.js";
import { gradebookEntities, gradebookPayload } from "./fixtures/v1p2-gradebook-payloads.js";
import { parseOneRosterV1p2GuidPairSet } from "../src/v1p2/gradebook/guid-pair-set.js";

interface GradebookCall {
  readonly url: string;
  readonly method: string;
  readonly body: string;
  readonly hasAuthorization: boolean;
}

class GradebookFetchHarness {
  readonly calls: Array<GradebookCall> = [];
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
    if (response === undefined) throw new Error("Gradebook response queue was empty.");
    if (response instanceof Error) throw response;
    return response;
  };
}

function responseFor(operationId: string): Response {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Gradebook operation.");
  if (operation.responseKind === "noContent")
    return new Response(null, { status: operation.method === "DELETE" ? 204 : 201 });
  if (operation.responseKind === "write") {
    return new Response(JSON.stringify({ sourcedIdPairs: [] }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify(gradebookPayload(operation.responseCodec)), {
    status: 200,
    headers: { "content-type": "application/json", "X-Total-Count": "1" },
  });
}

function createClient(
  harness: GradebookFetchHarness,
  scopes: Array<ReadonlyArray<string>> = [],
): OneRosterV1p2GradebookClient {
  const token = createOneRosterV1p2AccessToken("test-token");
  if (token._tag === "err") throw new Error("Expected test token.");
  const result = createOneRosterV1p2GradebookClient({
    serviceBaseUrls: { gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2" },
    accessTokenProvider: async (requiredScopes: ReadonlyArray<string>) => {
      scopes.push([...requiredScopes]);
      return ok(token.value);
    },
    fetch: harness.fetch,
  });
  if (result._tag === "err") throw new Error("Expected valid Gradebook client configuration.");
  return result.value;
}

function entity<T>(
  result: { readonly _tag: "ok"; readonly value: T } | { readonly _tag: "err" },
): T {
  if (result._tag === "err") throw new Error("Expected valid Gradebook fixture entity.");
  return result.value;
}

function invokeRead(client: OneRosterV1p2GradebookClient, operationId: string) {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Gradebook operation.");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: registry parity test invokes a known public read method.
  const method = client[operationId as keyof OneRosterV1p2GradebookClient] as (
    ...args: ReadonlyArray<unknown>
  ) => Promise<unknown>;
  const args = operation.pathParameters.map(() => "reference-example");
  const options = operation.responseKind === "collection" ? { query: { limit: 1, offset: 0 } } : {};
  return method(...args, options);
}

describe("OneRoster 1.2 Gradebook client", () => {
  it("covers every non-assessment Gradebook registry read exactly once", async () => {
    const reads = oneRosterV1p2Operations.filter(
      (operation) =>
        operation.service === "gradebook" &&
        operation.method === "GET" &&
        !operation.responseCodec.startsWith("assessment"),
    );
    const harness = new GradebookFetchHarness(
      reads.map((operation) => responseFor(operation.operationId)),
    );
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    expect(typeof client.iterateAllCategories).toBe("function");
    for (const [index, operation] of reads.entries()) {
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: this parity loop intentionally matches each response to one operation.
      const result = await invokeRead(client, operation.operationId);
      expect(result).toMatchObject({ _tag: "ok" });
      expect(harness.calls[index]?.url).toContain(
        operation.path.replace(/\{[^}]+\}/g, "reference-example"),
      );
      expect(harness.calls[index]?.hasAuthorization).toBe(true);
      expect(scopes[index]).toEqual(operation.requiredScopes);
    }
    expect(reads).toHaveLength(15);
    expect(harness.calls).toHaveLength(reads.length);
  });

  it("reports the binding default limit for an unbounded collection read", async () => {
    const harness = new GradebookFetchHarness([responseFor("getAllCategories")]);
    const result = await createClient(harness).getAllCategories();
    expect(result).toMatchObject({
      _tag: "ok",
      value: { limit: 100, offset: 0 },
    });
  });

  it("builds exact singleton and collection write envelopes with typed diagnostics", () => {
    const category = createOneRosterV1p2CategoryWritePayload({
      ...gradebookEntities.category,
      metadata: { source: "fixture" },
    });
    const lineItems = createOneRosterV1p2LineItemCollectionWritePayload([
      gradebookEntities.lineItem,
    ]);
    const result = createOneRosterV1p2ResultWritePayload(gradebookEntities.result);
    expect(category).toMatchObject({
      _tag: "ok",
      value: { category: { sourcedId: "category-example", metadata: { source: "fixture" } } },
    });
    expect(lineItems).toMatchObject({
      _tag: "ok",
      value: { lineItems: [{ sourcedId: "line-item-example" }] },
    });
    expect(result).toMatchObject({
      _tag: "ok",
      value: { result: { sourcedId: "result-example" } },
    });
    expect(createOneRosterV1p2LineItemCollectionWritePayload([])).toMatchObject({
      _tag: "err",
      error: [{ code: "payload.invalid_value", path: "$" }],
    });
    const malformed = createOneRosterV1p2CategoryWritePayload({ sourcedId: "category-example" });
    expect(malformed).toMatchObject({ _tag: "err", error: [{ code: "payload.missing_property" }] });
    expect(JSON.stringify(malformed)).not.toContain("category-example");
  });

  it("validates GUID-pair write response metadata in the codec layer", () => {
    expect(
      parseOneRosterV1p2GuidPairSet(
        {
          sourcedIdPairs: [
            { suppliedSourcedId: "supplied-example", allocatedSourcedId: "allocated-example" },
          ],
        },
        "$",
      ),
    ).toMatchObject({ _tag: "ok" });
    expect(
      parseOneRosterV1p2GuidPairSet(
        { sourcedIdPairs: [{ suppliedSourcedId: "supplied-example" }] },
        "$",
      ),
    ).toMatchObject({
      _tag: "err",
      error: [{ code: "payload.missing_property", path: "$.sourcedIdPairs[0]" }],
    });
  });

  it("uses exact mutation verbs, paths, bodies, scopes, and one-call semantics", async () => {
    const category = entity(parseOneRosterV1p2Category(gradebookEntities.category));
    const lineItem = entity(parseOneRosterV1p2LineItem(gradebookEntities.lineItem));
    const resultEntity = entity(parseOneRosterV1p2Result(gradebookEntities.result));
    const scoreScale = entity(parseOneRosterV1p2ScoreScale(gradebookEntities.scoreScale));
    const responses = [
      responseFor("deleteCategory"),
      responseFor("putCategory"),
      responseFor("postResultsForAcademicSessionForClass"),
      responseFor("postLineItemsForClass"),
      responseFor("deleteLineItem"),
      responseFor("putLineItem"),
      responseFor("postResultsForLineItem"),
      responseFor("deleteResult"),
      responseFor("putResult"),
      responseFor("postLineItemsForSchool"),
      responseFor("deleteScoreScale"),
      responseFor("putScoreScale"),
    ];
    const harness = new GradebookFetchHarness(responses);
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    const signal = new AbortController().signal;
    const results = [] as Array<unknown>;
    results.push(await client.deleteCategory("category-example", { signal }));
    results.push(await client.putCategory("category-example", category, { signal }));
    results.push(
      await client.postResultsForAcademicSessionForClass(
        "class-example",
        "session-example",
        [resultEntity],
        { signal },
      ),
    );
    results.push(await client.postLineItemsForClass("class-example", [lineItem], { signal }));
    results.push(await client.deleteLineItem("line-item-example", { signal }));
    results.push(await client.putLineItem("line-item-example", lineItem, { signal }));
    results.push(
      await client.postResultsForLineItem("line-item-example", [resultEntity], { signal }),
    );
    results.push(await client.deleteResult("result-example", { signal }));
    results.push(await client.putResult("result-example", resultEntity, { signal }));
    results.push(await client.postLineItemsForSchool("school-example", [lineItem], { signal }));
    results.push(await client.deleteScoreScale("score-scale-example", { signal }));
    results.push(await client.putScoreScale("score-scale-example", scoreScale, { signal }));
    expect(results.every(isOkResult)).toBe(true);
    expect(harness.calls.map((call) => call.method)).toEqual([
      "DELETE",
      "PUT",
      "POST",
      "POST",
      "DELETE",
      "PUT",
      "POST",
      "DELETE",
      "PUT",
      "POST",
      "DELETE",
      "PUT",
    ]);
    expect(JSON.parse(harness.calls[1]?.body ?? "{}")).toMatchObject({
      category: { sourcedId: "category-example" },
    });
    expect(JSON.parse(harness.calls[2]?.body ?? "{}")).toMatchObject({
      results: [{ sourcedId: "result-example" }],
    });
    expect(harness.calls.filter((call) => call.body.length === 0)).toHaveLength(4);
    const mutationOperations = [
      "deleteCategory",
      "putCategory",
      "postResultsForAcademicSessionForClass",
      "postLineItemsForClass",
      "deleteLineItem",
      "putLineItem",
      "postResultsForLineItem",
      "deleteResult",
      "putResult",
      "postLineItemsForSchool",
      "deleteScoreScale",
      "putScoreScale",
    ];
    expect(scopes).toEqual(
      mutationOperations.map(
        (operationId) => findOneRosterV1p2Operation(operationId)?.requiredScopes,
      ),
    );

    const mismatchHarness = new GradebookFetchHarness([]);
    const mismatch = await createClient(mismatchHarness).putCategory("different", category, {
      signal,
    });
    expect(mismatch).toMatchObject({ _tag: "err", error: { _tag: "OneRosterV1p2PayloadError" } });
    expect(mismatchHarness.calls).toHaveLength(0);

    const failureHarness = new GradebookFetchHarness([
      new Response("not-retained", { status: 429 }),
    ]);
    const failure = await createClient(failureHarness).deleteCategory("category-example", {
      signal,
    });
    expect(failure).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 429 },
    });
    expect(failureHarness.calls).toHaveLength(1);
    expect(JSON.stringify(failure)).not.toContain("not-retained");
  });

  it("rejects mutation options without a cancellation signal before transport", async () => {
    const harness = new GradebookFetchHarness([]);
    const client = createClient(harness);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: this test intentionally crosses the public TypeScript boundary to verify runtime rejection of malformed options.
    const deleteCategory = client.deleteCategory as (
      sourcedId: string,
      options: unknown,
    ) => Promise<unknown>;

    const result = await deleteCategory("category-example", {});

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        _tag: "OneRosterV1p2QueryError",
        diagnostics: [{ path: "$.signal" }],
      },
    });
    expect(harness.calls).toHaveLength(0);
  });

  it("does not invoke a mutation after cancellation or when a batch is empty", async () => {
    const controller = new AbortController();
    controller.abort();
    const cancelledHarness = new GradebookFetchHarness([]);
    const cancelled = await createClient(cancelledHarness).deleteResult("result-example", {
      signal: controller.signal,
    });
    expect(cancelled).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(cancelledHarness.calls).toHaveLength(0);

    const emptyHarness = new GradebookFetchHarness([]);
    const empty = await createClient(emptyHarness).postLineItemsForClass("class-example", [], {
      signal: new AbortController().signal,
    });
    expect(empty).toMatchObject({ _tag: "err", error: { _tag: "OneRosterV1p2PayloadError" } });
    expect(emptyHarness.calls).toHaveLength(0);
  });
});

function isOkResult(input: unknown): boolean {
  return input !== null && typeof input === "object" && "_tag" in input && input._tag === "ok";
}
