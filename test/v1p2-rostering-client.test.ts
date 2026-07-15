import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2RosteringClient,
  findOneRosterV1p2Operation,
  oneRosterV1p2Operations,
  type OneRosterV1p2RosteringClient,
} from "../src/v1p2/index.js";
import { rosteringPayload, rosteringEntities } from "./fixtures/v1p2-rostering-payloads.js";
import { OneRosterV1p2FetchHarness } from "./fixtures/v1p2-fetch-harness.js";

function createClient(
  harness: OneRosterV1p2FetchHarness,
  scopes: Array<ReadonlyArray<string>> = [],
): OneRosterV1p2RosteringClient {
  const token = createOneRosterV1p2AccessToken("test-token");
  if (token._tag === "err") throw new Error("Expected test token.");
  const result = createOneRosterV1p2RosteringClient({
    serviceBaseUrls: { rostering: "https://sis.example/ims/oneroster/rostering/v1p2" },
    accessTokenProvider: async (requiredScopes: ReadonlyArray<string>) => {
      scopes.push([...requiredScopes]);
      return ok(token.value);
    },
    fetch: harness.fetch,
  });
  if (result._tag === "err") throw new Error("Expected valid Rostering client configuration.");
  return result.value;
}

function responseFor(operationId: string, empty = false): Response {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected operation registry entry.");
  return new Response(JSON.stringify(rosteringPayload(operation.responseCodec, empty)), {
    status: 200,
    headers: { "content-type": "application/json", "X-Total-Count": empty ? "0" : "1" },
  });
}

function invoke(
  client: OneRosterV1p2RosteringClient,
  operationId: string,
  options: Readonly<Record<string, unknown>> = {},
) {
  const operation = findOneRosterV1p2Operation(operationId);
  if (operation === undefined) throw new Error("Expected operation registry entry.");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: registry parity test accesses a known public client operation key.
  const method = client[operationId as keyof OneRosterV1p2RosteringClient];
  if (typeof method !== "function") throw new Error(`Missing client method: ${operationId}`);
  const parameters = operation.pathParameters.map(() => "reference-example");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: parity test invokes the generated mapped method through its registry key.
  return (method as (...args: ReadonlyArray<unknown>) => Promise<unknown>)(...parameters, options);
}

describe("OneRoster 1.2 Rostering client", () => {
  it("has exactly one registry-driven method for every official Rostering GET operation", () => {
    const official = oneRosterV1p2Operations
      .filter((operation) => operation.service === "rostering")
      .map((operation) => operation.operationId)
      .toSorted();
    const harness = new OneRosterV1p2FetchHarness([]);
    const client = createClient(harness);
    const methods = Object.keys(client)
      .filter((key) => findOneRosterV1p2Operation(key)?.service === "rostering")
      .toSorted();
    expect(methods).toEqual(official);
    expect(official).toHaveLength(41);
  });

  it("delegates every official operation to its registry path, query, and scopes", async () => {
    const operations = oneRosterV1p2Operations.filter(
      (operation) => operation.service === "rostering",
    );
    const harness = new OneRosterV1p2FetchHarness(
      operations.map((operation) => responseFor(operation.operationId)),
    );
    const scopes: Array<ReadonlyArray<string>> = [];
    const client = createClient(harness, scopes);
    const results = await Promise.all(
      operations.map((operation) =>
        invoke(
          client,
          operation.operationId,
          operation.responseKind === "collection" ? { query: { limit: 1, offset: 0 } } : {},
        ),
      ),
    );
    for (const [index, operation] of operations.entries()) {
      const result = results[index];
      expect(result).toMatchObject({ _tag: "ok" });
      const call = harness.calls[index];
      expect(call?.url).toContain(operation.path.replace(/\{[^}]+\}/g, "reference-example"));
      expect(call?.hasAuthorization).toBe(true);
      expect(scopes[index]).toEqual(operation.requiredScopes);
    }
    expect(harness.calls).toHaveLength(operations.length);
  });

  it("supports a bounded multi-page read, empty collections, and field selection", async () => {
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(rosteringPayload("userCollection")), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: '<https://sis.example/ims/oneroster/rostering/v1p2/users?offset=1>; rel="next"',
        },
      }),
      new Response(JSON.stringify(rosteringPayload("userCollection", true)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const client = createClient(harness);
    expect(typeof client.iterateAllUsers).toBe("function");
    const result = await client.collectAllUsers({ maxPages: 3, maxItems: 3 });
    expect(result).toMatchObject({ _tag: "ok", value: [{ sourcedId: "user-example" }] });

    const emptyHarness = new OneRosterV1p2FetchHarness([responseFor("getAllUsers", true)]);
    const emptyClient = createClient(emptyHarness);
    const empty = await emptyClient.getAllUsers({ query: { limit: 1, offset: 0 } });
    expect(empty).toMatchObject({ _tag: "ok", value: { items: [], totalCount: 0 } });

    const projectedHarness = new OneRosterV1p2FetchHarness([responseFor("getAllUsers")]);
    const projectedClient = createClient(projectedHarness);
    const projected = await projectedClient.getAllUsers({ query: { fields: ["givenName"] } });
    expect(projected).toMatchObject({
      _tag: "ok",
      value: { items: [{ givenName: "Example" }], limit: 100 },
    });
    expect(projectedHarness.calls[0]?.url).toContain("fields=givenName");
  });

  it("returns typed errors for malformed runtime options", async () => {
    const harness = new OneRosterV1p2FetchHarness([]);
    const client = createClient(harness);
    const malformedQuery = await Reflect.apply(client.getAllUsers, client, [
      { query: { limit: "not-a-number" } },
    ]);
    expect(malformedQuery).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2QueryError", diagnostics: [{ path: "$.limit" }] },
    });

    const malformedOptions = await Reflect.apply(client.getAllUsers, client, [null]);
    expect(malformedOptions).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2QueryError", diagnostics: [{ path: "$" }] },
    });

    const missingIterationBound = await Reflect.apply(client.iterateAllUsers, client, []).next();
    expect(missingIterationBound.value).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2QueryError", diagnostics: [{ path: "$.maxPages" }] },
    });

    const missingCollectPageBound = await Reflect.apply(client.collectAllUsers, client, [{}]);
    expect(missingCollectPageBound).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2QueryError", diagnostics: [{ path: "$.maxPages" }] },
    });

    const missingCollectItemBound = await Reflect.apply(client.collectAllUsers, client, [
      { maxPages: 1 },
    ]);
    expect(missingCollectItemBound).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2QueryError", diagnostics: [{ path: "$.maxItems" }] },
    });
    expect(harness.calls).toHaveLength(0);
  });

  it("returns typed singleton, malformed-payload, HTTP, and cancellation outcomes", async () => {
    const singletonHarness = new OneRosterV1p2FetchHarness([responseFor("getUser")]);
    const singletonClient = createClient(singletonHarness);
    const singleton = await singletonClient.getUser("user-example");
    expect(singleton).toMatchObject({
      _tag: "ok",
      value: { sourcedId: rosteringEntities.user.sourcedId },
    });

    const malformed = rosteringPayload("userCollection");
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the fixture has the known user envelope shape.
    const users = malformed["users"] as Array<Record<string, unknown>>;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the fixture has the known user role shape.
    const roles = users[0]?.["roles"] as Array<Record<string, unknown>>;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the fixture has the known reference shape.
    const org = roles[0]?.["org"] as Record<string, unknown>;
    delete org["sourcedId"];
    const malformedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(malformed), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const malformedResult = await createClient(malformedHarness).getAllUsers();
    expect(malformedResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2PayloadError" },
    });

    const httpHarness = new OneRosterV1p2FetchHarness([
      new Response("not-retained", { status: 404 }),
    ]);
    const httpResult = await createClient(httpHarness).getUser("user-example");
    expect(httpResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 404 },
    });
    expect(JSON.stringify(httpResult)).not.toContain("not-retained");

    const controller = new AbortController();
    controller.abort();
    const cancelledHarness = new OneRosterV1p2FetchHarness([]);
    const cancelled = await createClient(cancelledHarness).getAllUsers({
      signal: controller.signal,
    });
    expect(cancelled).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(cancelledHarness.calls).toHaveLength(0);
  });
});
