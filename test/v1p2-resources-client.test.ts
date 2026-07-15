import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2ResourcesClient,
  findOneRosterV1p2Operation,
  oneRosterV1p2Operations,
  parseOneRosterV1p2Resource,
  parseOneRosterV1p2ResourceCollection,
  parseOneRosterV1p2ResourceSingleton,
  type OneRosterV1p2ResourcesClient,
} from "../src/v1p2/index.js";
import {
  createOneRosterV1p2CollectionDefinition,
  createOneRosterV1p2RestClientFromRegistry,
  createOneRosterV1p2SingletonDefinition,
} from "../src/v1p2/rest/client-factory.js";
import { resourcesEntities, resourcesPayload } from "./fixtures/v1p2-resources-payloads.js";
import { OneRosterV1p2FetchHarness } from "./fixtures/v1p2-fetch-harness.js";

function createClient(
  harness: OneRosterV1p2FetchHarness,
  scopes: Array<ReadonlyArray<string>> = [],
): OneRosterV1p2ResourcesClient {
  const token = createOneRosterV1p2AccessToken("test-token");
  if (token._tag === "err") throw new Error("Expected test token.");
  const result = createOneRosterV1p2ResourcesClient({
    serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
    accessTokenProvider: async (requiredScopes: ReadonlyArray<string>) => {
      scopes.push([...requiredScopes]);
      return ok(token.value);
    },
    fetch: harness.fetch,
  });
  if (result._tag === "err") throw new Error("Expected valid Resources client configuration.");
  return result.value;
}

function responseFor(operationId: string, empty = false): Response {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Resources operation registry entry.");
  return new Response(JSON.stringify(resourcesPayload(operation.responseCodec, empty)), {
    status: 200,
    headers: { "content-type": "application/json", "X-Total-Count": empty ? "0" : "1" },
  });
}

function invoke(
  client: OneRosterV1p2ResourcesClient,
  operationId: string,
  options: Readonly<Record<string, unknown>> = {},
) {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected Resources operation registry entry.");
  const method = client[operationId as keyof OneRosterV1p2ResourcesClient];
  if (typeof method !== "function") throw new Error(`Missing client method: ${operationId}`);
  const parameters = operation.pathParameters.map(() => "reference-example");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: parity test invokes the generated mapped method through its registry key.
  return (method as (...args: ReadonlyArray<unknown>) => Promise<unknown>)(...parameters, options);
}

describe("OneRoster 1.2 Resources client", () => {
  it("preserves caller-provided diagnostic paths through generated envelope parsers", () => {
    expect(parseOneRosterV1p2ResourceCollection({}, "$.response")).toMatchObject({
      _tag: "err",
      error: [{ path: "$.response.resources" }],
    });
  });

  it("rejects client definitions that disagree with generated operation metadata", () => {
    const token = createOneRosterV1p2AccessToken("test-token");
    if (token._tag === "err") throw new Error("Expected test token.");

    const result = createOneRosterV1p2RestClientFromRegistry(
      {
        serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
        accessTokenProvider: async () => ok(token.value),
        fetch: new OneRosterV1p2FetchHarness([]).fetch,
      },
      {
        getAllResources: createOneRosterV1p2SingletonDefinition(
          "resource",
          parseOneRosterV1p2ResourceSingleton,
        ),
      },
      {
        singletonPayloadMessage: "Invalid singleton.",
        writePayloadMessage: "Invalid write.",
        sourcedIdMessage: "Invalid sourcedId.",
      },
    );

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        _tag: "OneRosterV1p2ConfigurationError",
        code: "invalid_operation_registry",
        operationId: "getAllResources",
      },
    });
  });

  it("installs the iterate method name declared by collection metadata", () => {
    const token = createOneRosterV1p2AccessToken("test-token");
    if (token._tag === "err") throw new Error("Expected test token.");

    const result = createOneRosterV1p2RestClientFromRegistry(
      {
        serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
        accessTokenProvider: async () => ok(token.value),
        fetch: new OneRosterV1p2FetchHarness([]).fetch,
      },
      {
        getAllResources: createOneRosterV1p2CollectionDefinition(
          "resources",
          parseOneRosterV1p2ResourceCollection,
          "streamResources",
        ),
      },
      {
        singletonPayloadMessage: "Invalid singleton.",
        writePayloadMessage: "Invalid write.",
        sourcedIdMessage: "Invalid sourcedId.",
      },
    );

    if (result._tag === "err") throw new Error("Expected valid Resources client configuration.");
    expect(typeof result.value.streamResources).toBe("function");
    expect(Object.keys(result.value).toSorted()).toEqual(["getAllResources", "streamResources"]);
  });

  it("rejects runtime argument counts that cannot satisfy registry metadata", async () => {
    const harness = new OneRosterV1p2FetchHarness([]);
    const client = createClient(harness);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: this deliberately bypasses the public compile-time signature to verify the runtime registry guard.
    const getResource = client.getResource as (...args: ReadonlyArray<unknown>) => Promise<unknown>;

    await expect(getResource()).resolves.toMatchObject({
      _tag: "err",
      error: {
        _tag: "OneRosterV1p2ConfigurationError",
        code: "invalid_operation_registry",
        operationId: "getResource",
      },
    });
    expect(harness.calls).toHaveLength(0);
  });

  it("has exactly one registry-driven method for every official Resources GET operation", () => {
    const official = oneRosterV1p2Operations
      .filter((operation) => operation.service === "resources")
      .map((operation) => operation.operationId)
      .toSorted();
    const client = createClient(new OneRosterV1p2FetchHarness([]));
    const methods = Object.keys(client)
      .filter((key) => findOneRosterV1p2Operation(key)?.service === "resources")
      .toSorted();
    expect(methods).toEqual(official);
    expect(official).toHaveLength(5);
  });

  it("delegates every official operation to its registry path, query, and scopes", async () => {
    const operations = oneRosterV1p2Operations.filter(
      (operation) => operation.service === "resources",
    );
    const harness = new OneRosterV1p2FetchHarness(
      operations.map((operation) => responseFor(operation.operationId)),
    );
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    for (const [index, operation] of operations.entries()) {
      const options =
        operation.responseKind === "collection"
          ? { query: { limit: 1, fields: ["title"] } }
          : { query: { fields: ["title"] } };
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: this parity loop intentionally matches each response to one operation.
      const result = await invoke(client, operation.operationId, options);
      expect(result).toMatchObject({ _tag: "ok" });
      expect(harness.calls[index]?.url).toContain(
        operation.path.replace(/\{[^}]+\}/g, "reference-example"),
      );
      expect(harness.calls[index]?.hasAuthorization).toBe(true);
      expect(scopes[index]).toEqual(operation.requiredScopes);
    }
    expect(harness.calls).toHaveLength(operations.length);
  });

  it("parses extensible roles and supports empty, projected, and singleton reads", async () => {
    const parsed = parseOneRosterV1p2Resource(resourcesEntities.resource);
    expect(parsed).toMatchObject({
      _tag: "ok",
      value: {
        sourcedId: "resource-example",
        vendorResourceId: "vendor-resource-example",
        roles: ["teacher", "ext:example-role"],
        metadata: { source: "fixture" },
      },
    });

    const harness = new OneRosterV1p2FetchHarness([
      responseFor("getAllResources"),
      responseFor("getAllResources", true),
      responseFor("getResource"),
    ]);
    const client = createClient(harness);
    expect(typeof client.iterateAllResources).toBe("function");
    const projected = await client.getAllResources({ query: { fields: ["title"] } });
    expect(projected).toMatchObject({
      _tag: "ok",
      value: { items: [{ title: "Example Resource" }], limit: 100 },
    });
    const empty = await client.getAllResources({ query: { limit: 1 } });
    expect(empty).toMatchObject({
      _tag: "ok",
      value: { items: [], totalCount: 0, limit: 1 },
    });
    const singleton = await client.getResource("resource-example", {
      query: { fields: ["title"] },
    });
    expect(singleton).toMatchObject({ _tag: "ok", value: { title: "Example Resource" } });
    expect(harness.calls[0]?.url).toContain("fields=title");
  });

  it("returns typed malformed-payload, HTTP, and cancellation outcomes", async () => {
    const malformed = resourcesPayload("resourceCollection");
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the fixture has the known resource envelope shape.
    const resources = malformed["resources"] as Array<Record<string, unknown>>;
    delete resources[0]?.["vendorResourceId"];
    const malformedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(malformed), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const malformedResult = await createClient(malformedHarness).getAllResources();
    expect(malformedResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2PayloadError" },
    });

    const httpHarness = new OneRosterV1p2FetchHarness([
      new Response("not-retained", { status: 404 }),
    ]);
    const httpResult = await createClient(httpHarness).getResource("resource-example");
    expect(httpResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 404 },
    });
    expect(JSON.stringify(httpResult)).not.toContain("not-retained");

    const controller = new AbortController();
    controller.abort();
    const cancelledHarness = new OneRosterV1p2FetchHarness([]);
    const cancelled = await createClient(cancelledHarness).getResourcesForUser("user-example", {
      signal: controller.signal,
    });
    expect(cancelled).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(cancelledHarness.calls).toHaveLength(0);
  });
});
