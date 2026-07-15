import { describe, expect, it } from "vitest";

import { ok } from "../src/result.js";
import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2RestTransport,
  findOneRosterV1p2Operation,
  parseOneRosterV1p2UserCollection,
  type OneRosterRestRetryPolicyInput,
  type OneRosterRestRetryClock,
  type OneRosterV1p2RestTransport,
} from "../src/v1p2/index.js";
import { OneRosterV1p2FetchHarness } from "./fixtures/v1p2-fetch-harness.js";

function tokenProvider() {
  const token = createOneRosterV1p2AccessToken("x");
  if (token._tag === "err") throw new Error("Test token construction failed.");
  return async () => ok(token.value);
}

function userPayload(...sourcedIds: ReadonlyArray<string>) {
  const ids = sourcedIds.length === 0 ? ["user-1"] : sourcedIds;
  return {
    users: ids.map((sourcedId) => ({
      sourcedId,
      status: "active",
      dateLastModified: "2025-01-01T00:00:00Z",
      enabledUser: "true",
      givenName: "Example",
      familyName: "Learner",
      roles: [
        {
          roleType: "primary",
          role: "student",
          org: { href: "https://sis.example/orgs/org-1", sourcedId: "org-1", type: "org" },
        },
      ],
    })),
  };
}

function usersParser(input: unknown, _path: string) {
  const parsed = parseOneRosterV1p2UserCollection(input);
  if (parsed._tag === "err") return parsed;
  return ok(parsed.value.users);
}

function usersOperation() {
  const operation = findOneRosterV1p2Operation("getAllUsers");
  if (operation === undefined) throw new Error("Expected registry operation.");
  return operation;
}

function createTransport(
  harness: OneRosterV1p2FetchHarness,
  retryPolicy?: OneRosterRestRetryPolicyInput,
  retryClock?: OneRosterRestRetryClock,
): OneRosterV1p2RestTransport {
  const result = createOneRosterV1p2RestTransport({
    serviceBaseUrls: { rostering: "https://sis.example/ims/oneroster/rostering/v1p2" },
    accessTokenProvider: tokenProvider(),
    fetch: harness.fetch,
    ...(retryPolicy === undefined ? {} : { retryPolicy }),
    ...(retryClock === undefined ? {} : { retryClock }),
  });
  if (result._tag === "err") throw new Error("Expected valid transport configuration.");
  return result.value;
}

describe("OneRoster 1.2 REST transport", () => {
  it("uses injected fetch, bearer authorization, JSON negotiation, and page headers", async () => {
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "X-Total-Count": "1",
          Link: '<https://sis.example/users?limit=1&offset=0>; rel="first"',
        },
      }),
    ]);
    const page = await createTransport(harness).requestPage({
      operation: usersOperation(),
      query: { limit: 1, offset: 0 },
      parsePayload: usersParser,
    });
    expect(page).toMatchObject({
      _tag: "ok",
      value: { items: [{ sourcedId: "user-1" }], totalCount: 1, limit: 1, offset: 0 },
    });
    expect(harness.calls).toHaveLength(1);
    expect(harness.calls[0]).toMatchObject({
      method: "GET",
      hasAuthorization: true,
      bodyPresent: false,
    });
  });

  it("reports the binding default page limit when the request omits limit", async () => {
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const page = await createTransport(harness).requestPage({
      operation: usersOperation(),
      parsePayload: usersParser,
    });
    expect(page).toMatchObject({
      _tag: "ok",
      value: { limit: 100, offset: 0 },
    });
  });

  it("returns redacted typed failures for malformed JSON, HTTP status, and fetch rejection", async () => {
    const malformed = new OneRosterV1p2FetchHarness([
      new Response("not-json", { status: 200, headers: { "content-type": "application/json" } }),
    ]);
    const malformedResult = await createTransport(malformed).request({
      operation: usersOperation(),
      responseParser: usersParser,
    });
    expect(malformedResult._tag).toBe("err");
    expect(JSON.stringify(malformedResult)).not.toContain("not-json");

    const http = new OneRosterV1p2FetchHarness([
      new Response(
        JSON.stringify({
          imsx_codeMajor: "failure",
          imsx_severity: "error",
          imsx_description: "safe failure",
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    ]);
    const httpResult = await createTransport(http).request({
      operation: usersOperation(),
      responseParser: usersParser,
    });
    expect(httpResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 401 },
    });

    const rejected = new OneRosterV1p2FetchHarness([new Error("untrusted cause")]);
    const rejectedResult = await createTransport(rejected).request({
      operation: usersOperation(),
      responseParser: usersParser,
    });
    expect(rejectedResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2NetworkError" },
    });
    expect(JSON.stringify(rejectedResult)).not.toContain("untrusted cause");
    expect(rejected.calls).toHaveLength(1);
  });

  it("retries selected read failures within explicit bounds", async () => {
    const policy: OneRosterRestRetryPolicyInput = {
      maxAttempts: 3,
      maxElapsedMilliseconds: 1_000,
      backoffMilliseconds: () => 0,
    };
    const throttled = new OneRosterV1p2FetchHarness([
      new Response("", { status: 429, headers: { "Retry-After": "0" } }),
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const throttledResult = await createTransport(throttled, policy).requestPage({
      operation: usersOperation(),
      parsePayload: usersParser,
    });
    expect(throttledResult._tag).toBe("ok");
    expect(throttled.calls).toHaveLength(2);

    const exhausted = new OneRosterV1p2FetchHarness([
      new Response("{}", { status: 503, headers: { "content-type": "application/json" } }),
      new Response("{}", { status: 503, headers: { "content-type": "application/json" } }),
      new Response("{}", { status: 503, headers: { "content-type": "application/json" } }),
    ]);
    const exhaustedResult = await createTransport(exhausted, policy).requestPage({
      operation: usersOperation(),
      parsePayload: usersParser,
    });
    expect(exhaustedResult).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 503 },
    });
    expect(exhausted.calls).toHaveLength(3);

    const disconnected = new OneRosterV1p2FetchHarness([
      new Error("private connection failure"),
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const disconnectedResult = await createTransport(disconnected, policy).requestPage({
      operation: usersOperation(),
      parsePayload: usersParser,
    });
    expect(disconnectedResult._tag).toBe("ok");
    expect(disconnected.calls).toHaveLength(2);
    expect(JSON.stringify(disconnectedResult)).not.toContain("private connection failure");
  });

  it("uses the injected retry clock for elapsed-time bounds", async () => {
    const readings = [0, 0, 2_000];
    const retryClock: OneRosterRestRetryClock = {
      nowMilliseconds: () => readings.shift() ?? 2_000,
    };
    const harness = new OneRosterV1p2FetchHarness([
      new Response("{}", { status: 503, headers: { "content-type": "application/json" } }),
    ]);
    const result = await createTransport(
      harness,
      {
        maxAttempts: 3,
        maxElapsedMilliseconds: 1_000,
        backoffMilliseconds: () => 0,
      },
      retryClock,
    ).requestPage({ operation: usersOperation(), parsePayload: usersParser });
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2HttpError", status: 503 },
    });
    expect(harness.calls).toHaveLength(1);
  });

  it("ignores malformed Retry-After values", async () => {
    let retryAfter: number | undefined = 1;
    const harness = new OneRosterV1p2FetchHarness([
      new Response("", { status: 429, headers: { "Retry-After": "not-a-delay" } }),
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const result = await createTransport(harness, {
      maxAttempts: 2,
      maxElapsedMilliseconds: 1_000,
      backoffMilliseconds: (context) => {
        retryAfter = context.retryAfterMilliseconds;
        return 0;
      },
    }).requestPage({ operation: usersOperation(), parsePayload: usersParser });
    expect(result._tag).toBe("ok");
    expect(retryAfter).toBeUndefined();
  });

  it("cancels during retry backoff before another fetch", async () => {
    const harness = new OneRosterV1p2FetchHarness([new Response("", { status: 429 })]);
    const controller = new AbortController();
    const pending = createTransport(harness, {
      maxAttempts: 2,
      maxElapsedMilliseconds: 20_000,
      backoffMilliseconds: () => 10_000,
    }).requestPage({
      operation: usersOperation(),
      parsePayload: usersParser,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 0);
    const result = await pending;
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(harness.calls).toHaveLength(1);
  });

  it("propagates pre-cancelled signals without acquiring a request", async () => {
    const harness = new OneRosterV1p2FetchHarness([]);
    const controller = new AbortController();
    controller.abort();
    const result = await createTransport(harness).request({
      operation: usersOperation(),
      signal: controller.signal,
      responseParser: usersParser,
    });
    expect(result).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(harness.calls).toHaveLength(0);
  });

  it("collects bounded pages through a next link", async () => {
    const link = "Link";
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: {
          "content-type": "application/json",
          [link]: '<https://sis.example/users?limit=2&offset=1>; rel="next"',
        },
      }),
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const result = await createTransport(harness).collectAll({
      operation: usersOperation(),
      query: { limit: 1 },
      parsePayload: usersParser,
      maxPages: 3,
      maxItems: 3,
    });
    expect(result).toMatchObject({ _tag: "ok", value: [{ sourcedId: "user-1" }] });
    expect(harness.calls).toHaveLength(2);
    expect(new URL(harness.calls[0]?.url ?? "").searchParams.get("limit")).toBe("1");
    const nextSearch = new URL(harness.calls[1]?.url ?? "").searchParams;
    expect(nextSearch.get("limit")).toBe("2");
    expect(nextSearch.get("offset")).toBe("1");
  });

  it("terminates from empty pages and exact totals without an extra fetch", async () => {
    const emptyHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const emptyResult = await createTransport(emptyHarness).collectAll({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
      maxItems: 3,
    });
    expect(emptyResult).toMatchObject({ _tag: "ok", value: [] });
    expect(emptyHarness.calls).toHaveLength(1);

    const exactHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json", "X-Total-Count": "1" },
      }),
    ]);
    const exactResult = await createTransport(exactHarness).collectAll({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
      maxItems: 3,
    });
    expect(exactResult).toMatchObject({ _tag: "ok", value: [{ sourcedId: "user-1" }] });
    expect(exactHarness.calls).toHaveLength(1);

    const shortHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const shortResult = await createTransport(shortHarness).collectAll({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
      maxItems: 3,
    });
    expect(shortResult._tag).toBe("ok");
    expect(shortHarness.calls).toHaveLength(2);
  });

  it("follows a next link even when the current page is empty", async () => {
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: '<https://sis.example/users?offset=1>; rel="next"',
        },
      }),
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const result = await createTransport(harness).collectAll({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
      maxItems: 3,
    });
    expect(result).toMatchObject({ _tag: "ok", value: [] });
    expect(harness.calls).toHaveLength(2);
  });

  it("iterates pages in order and stops fetching when the caller stops early", async () => {
    const next = '<https://sis.example/users?offset=1>; rel="next"';
    const orderedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload("user-1")), {
        status: 200,
        headers: { "content-type": "application/json", Link: next },
      }),
      new Response(JSON.stringify(userPayload("user-2")), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const sourcedIds: Array<string> = [];
    for await (const page of createTransport(orderedHarness).iteratePages({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
    })) {
      if (page._tag === "err") throw new Error("Expected valid page iteration.");
      for (const user of page.value.items) sourcedIds.push(user.sourcedId);
    }
    expect(sourcedIds).toEqual(["user-1", "user-2"]);
    expect(orderedHarness.calls).toHaveLength(3);

    const earlyHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: { "content-type": "application/json", Link: next },
      }),
    ]);
    for await (const page of createTransport(earlyHarness).iteratePages({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 3,
    })) {
      expect(page._tag).toBe("ok");
      break;
    }
    expect(earlyHarness.calls).toHaveLength(1);
  });

  it("yields typed iteration failures for bounds, repeated links, and invalid payloads", async () => {
    const repeatedUrl = "https://sis.example/users?offset=1";
    const repeatedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload("user-1")), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: `<${repeatedUrl}>; rel="next"`,
        },
      }),
      new Response(JSON.stringify(userPayload("user-2")), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: `<${repeatedUrl}>; rel="next"`,
        },
      }),
    ]);
    const repeatedResults = [];
    for await (const page of createTransport(repeatedHarness).iteratePages({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 4,
    })) {
      repeatedResults.push(page);
    }
    expect(repeatedResults.at(-1)).toMatchObject({
      _tag: "err",
      error: { limitKind: "repeatedUrl" },
    });
    expect(repeatedHarness.calls).toHaveLength(2);

    const boundedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: '<https://sis.example/users?offset=1>; rel="next"',
        },
      }),
    ]);
    const boundedResults = [];
    for await (const page of createTransport(boundedHarness).iteratePages({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 1,
    })) {
      boundedResults.push(page);
    }
    expect(boundedResults.at(-1)).toMatchObject({
      _tag: "err",
      error: { limitKind: "maxPages" },
    });
    expect(boundedHarness.calls).toHaveLength(1);

    const itemBoundHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload("user-1", "user-2")), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const itemBound = await createTransport(itemBoundHarness)
      .iteratePages({
        operation: usersOperation(),
        parsePayload: usersParser,
        maxPages: 2,
        maxItems: 1,
      })
      .next();
    expect(itemBound.value).toMatchObject({
      _tag: "err",
      error: { limitKind: "maxItems" },
    });
    expect(itemBoundHarness.calls).toHaveLength(1);

    const malformedHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify({ users: "not-a-collection" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const malformed = await createTransport(malformedHarness)
      .iteratePages({ operation: usersOperation(), parsePayload: usersParser, maxPages: 2 })
      .next();
    expect(malformed.value).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2PayloadError" },
    });
  });

  it("observes cancellation before fetching the next iterated page", async () => {
    const harness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(userPayload()), {
        status: 200,
        headers: {
          "content-type": "application/json",
          Link: '<https://sis.example/users?offset=1>; rel="next"',
        },
      }),
    ]);
    const controller = new AbortController();
    const pages = createTransport(harness).iteratePages({
      operation: usersOperation(),
      parsePayload: usersParser,
      maxPages: 2,
      signal: controller.signal,
    });
    expect((await pages.next()).value).toMatchObject({ _tag: "ok" });
    controller.abort();
    expect((await pages.next()).value).toMatchObject({
      _tag: "err",
      error: { _tag: "OneRosterV1p2CancellationError" },
    });
    expect(harness.calls).toHaveLength(1);
  });
});
