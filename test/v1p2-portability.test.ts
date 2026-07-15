import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2ProviderRouter,
  createOneRosterV1p2ResourcesClient,
} from "../src/v1p2/index.js";

describe("OneRoster 1.2 Web API portability", () => {
  it("constructs a client, serializes queries, handles fake fetch, and encodes JSON", async () => {
    const token = createOneRosterV1p2AccessToken("portability-token");
    if (token._tag === "err") throw new Error("Expected synthetic token.");
    let requestedUrl = "";
    const client = createOneRosterV1p2ResourcesClient({
      serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
      accessTokenProvider: async () => ok(token.value),
      fetch: async (input: RequestInfo | URL) => {
        requestedUrl =
          input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
        return new Response(
          JSON.stringify({
            resources: [
              {
                sourcedId: "resource-example",
                status: "active",
                dateLastModified: "2025-01-01T00:00:00Z",
                vendorResourceId: "vendor-example",
                title: "Example",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });
    if (client._tag === "err") throw new Error("Expected client.");
    const result = await client.value.getAllResources({ query: { fields: ["title"] } });
    expect(result).toMatchObject({ _tag: "ok", value: { items: [{ title: "Example" }] } });
    expect(requestedUrl).toContain("fields=title");
    expect(JSON.parse(JSON.stringify({ value: "portable" }))).toEqual({ value: "portable" });
  });

  it("handles abort signals and provider Request/Response routing without Node APIs", async () => {
    const controller = new AbortController();
    controller.abort();
    const token = createOneRosterV1p2AccessToken("portability-token");
    if (token._tag === "err") throw new Error("Expected synthetic token.");
    let fetchCalls = 0;
    const client = createOneRosterV1p2ResourcesClient({
      serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
      accessTokenProvider: async () => ok(token.value),
      fetch: async () => {
        fetchCalls += 1;
        return new Response(null, { status: 200 });
      },
    });
    if (client._tag === "err") throw new Error("Expected client.");
    const cancelled = await client.value.getAllResources({ signal: controller.signal });
    expect(cancelled).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(fetchCalls).toBe(0);

    const router = createOneRosterV1p2ProviderRouter({
      services: {
        resources: {
          getAllResources: async () =>
            ok({ kind: "collection", page: { items: [], limit: 20, offset: 0 } }),
        },
      },
      authorize: async () => ok({ subject: "portable-principal", scopes: [] }),
    });
    if (router._tag === "err") throw new Error("Expected provider router.");
    const response = await router.value.handle(
      new Request("https://api.example/ims/oneroster/resources/v1p2/resources"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ resources: [] });
  });
});
