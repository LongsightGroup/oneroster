import { describe, expect, it } from "vitest";

import {
  createOneRosterV1p1OAuth1Authorizer,
  createOneRosterV1p1RosteringClient,
  findOneRosterV1p1Operation,
} from "../src/v1p1/index.js";

const credentials = {
  consumerKey: "dpf43f3p2l4k3l03",
  consumerSecret: "kd94hf93k423kf44",
  token: "nnch734d00sl2jdk",
  tokenSecret: "pfkkdhi9sl3r4s00",
};

function operation() {
  const value = findOneRosterV1p1Operation("getAllUsers");
  if (value === undefined) throw new Error("Expected v1.1 operation.");
  return value;
}

describe("OneRoster 1.1 OAuth 1.0a authorizer", () => {
  it("matches the RFC 5849 HMAC-SHA1 request example", async () => {
    const created = createOneRosterV1p1OAuth1Authorizer({
      credentials,
      nonce: () => "kllo9940pd9333jh",
      clock: () => 1_191_242_096,
    });
    if (created._tag === "err") throw new Error("Expected valid OAuth 1.0a configuration.");
    const result = await created.value({
      request: new Request("http://photos.example.net/photos?file=vacation.jpg&size=original"),
      operation: operation(),
      signal: new AbortController().signal,
    });
    expect(result).toEqual({
      _tag: "ok",
      value: {
        Authorization:
          'OAuth oauth_consumer_key="dpf43f3p2l4k3l03", oauth_nonce="kllo9940pd9333jh", oauth_signature="tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1191242096", oauth_token="nnch734d00sl2jdk", oauth_version="1.0"',
      },
    });
  });

  it("plugs into the canonical authorizer seam", async () => {
    const authorizer = createOneRosterV1p1OAuth1Authorizer({
      credentials: { consumerKey: "consumer", consumerSecret: "consumer-secret" },
      nonce: () => "fixed-nonce",
      clock: () => 1_700_000_000,
    });
    if (authorizer._tag === "err") throw new Error("Expected valid OAuth 1.0a configuration.");
    let authorization = "";
    const client = createOneRosterV1p1RosteringClient({
      baseUrl: "https://provider.example/ims/oneroster/v1p1",
      authorizer: authorizer.value,
      fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
        authorization = new Headers(init?.headers).get("authorization") ?? "";
        return new Response(JSON.stringify({ users: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    if (client._tag === "err") throw new Error("Expected valid v1.1 client.");
    const result = await client.value.getAllUsers({ query: { limit: 1 } });
    expect(result._tag).toBe("ok");
    expect(authorization).toContain('oauth_nonce="fixed-nonce"');
    expect(authorization).toContain('oauth_signature_method="HMAC-SHA1"');
  });

  it("returns safe typed cancellation and signing failures", async () => {
    const cancelled = createOneRosterV1p1OAuth1Authorizer({ credentials });
    if (cancelled._tag === "err") throw new Error("Expected valid OAuth 1.0a configuration.");
    const controller = new AbortController();
    controller.abort();
    const cancelledResult = await cancelled.value({
      request: new Request("https://provider.example/users"),
      operation: operation(),
      signal: controller.signal,
    });
    expect(cancelledResult).toMatchObject({ _tag: "err", error: { code: "cancelled" } });

    const failed = createOneRosterV1p1OAuth1Authorizer({
      credentials,
      nonce: () => {
        throw new Error("consumerSecret=kd94hf93k423kf44");
      },
    });
    if (failed._tag === "err") throw new Error("Expected valid OAuth 1.0a configuration.");
    const failedResult = await failed.value({
      request: new Request("https://provider.example/users"),
      operation: operation(),
      signal: new AbortController().signal,
    });
    expect(failedResult).toMatchObject({ _tag: "err", error: { code: "signing_failed" } });
    expect(JSON.stringify(failedResult)).not.toContain("kd94hf93k423kf44");
  });

  it("rejects incomplete credentials without retaining them", () => {
    const result = createOneRosterV1p1OAuth1Authorizer({
      credentials: {
        consumerKey: "private-consumer",
        consumerSecret: "private-secret",
        token: "token-without-secret",
      },
    });
    expect(result).toMatchObject({
      _tag: "err",
      error: { code: "invalid_configuration" },
    });
    expect(JSON.stringify(result)).not.toContain("private-secret");
  });
});
