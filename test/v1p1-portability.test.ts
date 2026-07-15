import { describe, expect, it } from "vitest";

import {
  createOneRosterV1p1OAuth1Authorizer,
  createOneRosterV1p1RosteringClient,
} from "../src/v1p1/index.js";

describe("OneRoster 1.1 Web API portability", () => {
  it("uses Request, Response, URL, URLSearchParams, and AbortSignal only", async () => {
    let requestedUrl = "";
    const authorizer = createOneRosterV1p1OAuth1Authorizer({
      credentials: { consumerKey: "portable-consumer", consumerSecret: "portable-secret" },
      nonce: () => "portable-nonce",
      clock: () => 1_700_000_000,
    });
    if (authorizer._tag === "err") throw new Error("Expected an OAuth 1.0a authorizer.");
    const client = createOneRosterV1p1RosteringClient({
      baseUrl: "https://provider.example/ims/oneroster/v1p1",
      authorizer: authorizer.value,
      fetch: async (input: RequestInfo | URL) => {
        requestedUrl =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        return new Response(JSON.stringify({ courses: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    if (client._tag === "err") throw new Error("Expected a v1.1 client.");
    const result = await client.value.getAllCourses({ query: { limit: 1 } });
    expect(result).toMatchObject({ _tag: "ok", value: { items: [], limit: 1 } });
    expect(requestedUrl).toBe("https://provider.example/ims/oneroster/v1p1/courses?limit=1");
  });
});
