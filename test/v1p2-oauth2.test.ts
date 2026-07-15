import { describe, expect, it } from "vitest";

import {
  createOneRosterV1p2OAuth2ClientCredentialsProvider,
  type OneRosterV1p2AccessTokenProvider,
} from "../src/v1p2/index.js";

interface OAuthCall {
  readonly headers: Headers;
  readonly body: string;
}

class OAuthFetchHarness {
  readonly calls: Array<OAuthCall> = [];
  private readonly responses: Array<Response | Error>;

  public constructor(responses: ReadonlyArray<Response | Error>) {
    this.responses = [...responses];
  }

  public readonly fetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    this.calls.push({ headers: new Headers(init?.headers), body: bodyText(init?.body) });
    const response = this.responses.shift();
    if (response === undefined) throw new Error("OAuth harness response queue was empty.");
    if (response instanceof Error) throw response;
    return response;
  };
}

function provider(
  harness: OAuthFetchHarness,
  overrides: Partial<Parameters<typeof createOneRosterV1p2OAuth2ClientCredentialsProvider>[0]> = {},
): OneRosterV1p2AccessTokenProvider {
  const result = createOneRosterV1p2OAuth2ClientCredentialsProvider({
    tokenEndpoint: "https://auth.example.test/oauth/token",
    clientId: "client-id",
    clientSecret: "synthetic-secret",
    clientAuthentication: "client_secret_post",
    scopes: ["scope.b", "scope.a"],
    fetch: harness.fetch,
    expirationSkewSeconds: 10,
    clock: () => 1_000_000,
    ...overrides,
  });
  if (result._tag === "err") throw new Error("Expected valid OAuth configuration.");
  return result.value;
}

function tokenResponse(overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      access_token: "synthetic-access-token",
      token_type: "Bearer",
      expires_in: 100,
      scope: "scope.a scope.b",
      ...overrides,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("OneRoster 1.2 OAuth client credentials", () => {
  it("uses sorted form scopes and caches until the safe pre-expiry boundary", async () => {
    const harness = new OAuthFetchHarness([tokenResponse(), tokenResponse()]);
    let now = 1_000_000;
    const accessTokenProvider = provider(harness, { clock: () => now });

    const first = await accessTokenProvider(["scope.b", "scope.a"], new AbortController().signal);
    const cached = await accessTokenProvider(["scope.a", "scope.b"], new AbortController().signal);
    now += 91_000;
    const expired = await accessTokenProvider(["scope.a", "scope.b"], new AbortController().signal);

    expect(first._tag).toBe("ok");
    expect(cached).toEqual(first);
    expect(expired._tag).toBe("ok");
    expect(harness.calls).toHaveLength(2);
    expect(harness.calls[0]?.body).toBe(
      "grant_type=client_credentials&scope=scope.a+scope.b&client_id=client-id&client_secret=synthetic-secret",
    );
    expect(harness.calls[0]?.headers.get("authorization")).toBeNull();
  });

  it("supports UTF-8 basic authentication and deduplicates concurrent acquisition", async () => {
    let release: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const calls: Array<OAuthCall> = [];
    const fetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ headers: new Headers(init?.headers), body: bodyText(init?.body) });
      return pending;
    };
    const result = createOneRosterV1p2OAuth2ClientCredentialsProvider({
      tokenEndpoint: "https://auth.example.test/oauth/token",
      clientId: "päss-client",
      clientSecret: "päss-secret",
      clientAuthentication: "client_secret_basic",
      scopes: ["scope.a"],
      fetch,
    });
    if (result._tag === "err") throw new Error("Expected valid OAuth configuration.");
    const signal = new AbortController().signal;
    const first = result.value(["scope.a"], signal);
    const second = result.value(["scope.a"], signal);
    release?.(tokenResponse({ scope: "scope.a" }));
    const values = await Promise.all([first, second]);
    expect(values[0]).toEqual(values[1]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers.get("authorization")).toBe(
      `Basic ${utf8Base64("päss-client:päss-secret")}`,
    );
    expect(calls[0]?.body).toBe("grant_type=client_credentials&scope=scope.a");
  });

  it("supports cancellation and rejects unsafe token responses without secret leakage", async () => {
    const cancelledHarness = new OAuthFetchHarness([]);
    const cancelledController = new AbortController();
    cancelledController.abort();
    const cancelled = await provider(cancelledHarness)([], cancelledController.signal);
    expect(cancelled).toMatchObject({ _tag: "err", error: { code: "cancelled" } });
    expect(cancelledHarness.calls).toHaveLength(0);

    const invalid = new OAuthFetchHarness([tokenResponse({ token_type: "MAC" })]);
    const invalidResult = await provider(invalid)(["scope.a"], new AbortController().signal);
    expect(invalidResult).toMatchObject({ _tag: "err", error: { code: "token_invalid" } });

    const failed = new OAuthFetchHarness([new Response("secret-marker", { status: 401 })]);
    const failedResult = await provider(failed)(["scope.a"], new AbortController().signal);
    expect(failedResult).toMatchObject({ _tag: "err", error: { code: "token_failed" } });
    expect(JSON.stringify(failedResult)).not.toContain("secret-marker");
    expect(JSON.stringify(failedResult)).not.toContain("synthetic-secret");
  });

  it("rejects invalid provider configuration", () => {
    const result = createOneRosterV1p2OAuth2ClientCredentialsProvider({
      tokenEndpoint: "http://auth.example.test/oauth/token",
      clientId: "client-id",
      clientSecret: "synthetic-secret",
      clientAuthentication: "client_secret_basic",
      scopes: ["scope.a"],
      fetch: async () => new Response("{}"),
    });
    expect(result).toMatchObject({ _tag: "err", error: { code: "invalid_configuration" } });
  });
});

function utf8Base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bodyText(body: BodyInit | null | undefined): string {
  return typeof body === "string" ? body : "";
}
