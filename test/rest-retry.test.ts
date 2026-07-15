import { describe, expect, it } from "vitest";

import {
  parseOneRosterRestRetryAfter,
  parseOneRosterRestRetryPolicy,
  scheduleOneRosterRestRetry,
  type OneRosterRestRetryPolicy,
} from "../src/rest/retry.js";

function retryPolicy(
  backoffMilliseconds: OneRosterRestRetryPolicy["backoffMilliseconds"] = () => 0,
): OneRosterRestRetryPolicy {
  return {
    maxAttempts: 3,
    maxElapsedMilliseconds: 1_000,
    statusCodes: new Set([429, 502, 503]),
    retryConnectionErrors: true,
    backoffMilliseconds,
  };
}

function scheduleInput(
  policy: OneRosterRestRetryPolicy | undefined,
  signal = new AbortController().signal,
) {
  return {
    policy,
    method: "GET",
    attempt: 1,
    startedAtMilliseconds: 0,
    retryAfterMilliseconds: undefined,
    clock: { nowMilliseconds: () => 0 },
    signal,
  };
}

describe("OneRoster REST retry mechanics", () => {
  it("validates explicit bounded retry policies", () => {
    expect(
      parseOneRosterRestRetryPolicy({ maxAttempts: 2, maxElapsedMilliseconds: 1_000 }),
    ).toMatchObject({
      _tag: "ok",
      value: { maxAttempts: 2, maxElapsedMilliseconds: 1_000, retryConnectionErrors: true },
    });
    expect(
      parseOneRosterRestRetryPolicy({ maxAttempts: 1, maxElapsedMilliseconds: 1_000 }),
    ).toEqual({ _tag: "err", error: "invalid_retry_policy" });
  });

  it("stops when retry is disabled, unsafe, or exhausted", async () => {
    expect(await scheduleOneRosterRestRetry(scheduleInput(undefined))).toBe("stop");
    expect(
      await scheduleOneRosterRestRetry({ ...scheduleInput(retryPolicy()), method: "POST" }),
    ).toBe("stop");
    expect(await scheduleOneRosterRestRetry({ ...scheduleInput(retryPolicy()), attempt: 3 })).toBe(
      "stop",
    );
  });

  it("passes attempt and Retry-After context to the configured backoff", async () => {
    let received: unknown;
    const result = await scheduleOneRosterRestRetry({
      ...scheduleInput(
        retryPolicy((context) => {
          received = context;
          return 0;
        }),
      ),
      attempt: 2,
      retryAfterMilliseconds: 250,
    });
    expect(result).toBe("retry");
    expect(received).toEqual({ attempt: 2, retryAfterMilliseconds: 250 });
  });

  it("stops for elapsed-time exhaustion and invalid backoff results", async () => {
    expect(
      await scheduleOneRosterRestRetry({
        ...scheduleInput(retryPolicy(() => 10)),
        clock: { nowMilliseconds: () => 995 },
      }),
    ).toBe("stop");
    expect(await scheduleOneRosterRestRetry(scheduleInput(retryPolicy(() => -1)))).toBe("stop");
    expect(
      await scheduleOneRosterRestRetry(
        scheduleInput(
          retryPolicy(() => {
            throw new Error("synthetic backoff failure");
          }),
        ),
      ),
    ).toBe("stop");
  });

  it("cancels an active backoff wait", async () => {
    const controller = new AbortController();
    const pending = scheduleOneRosterRestRetry(
      scheduleInput(
        retryPolicy(() => 100),
        controller.signal,
      ),
    );
    queueMicrotask(() => controller.abort());
    expect(await pending).toBe("cancelled");
  });

  it("parses Retry-After delta seconds and HTTP dates", () => {
    expect(parseOneRosterRestRetryAfter("12", 0)).toBe(12_000);
    expect(parseOneRosterRestRetryAfter("Wed, 21 Oct 2015 07:28:00 GMT", 1_445_412_470_000)).toBe(
      10_000,
    );
    expect(parseOneRosterRestRetryAfter("not-a-delay", 0)).toBeUndefined();
  });
});
