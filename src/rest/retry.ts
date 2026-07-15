import { err, ok, type Result } from "../result.js";

/** Context supplied to a caller-configured retry backoff function. */
export interface OneRosterRestRetryBackoffContext {
  readonly attempt: number;
  readonly retryAfterMilliseconds?: number;
}

/** Explicit, read-only retry policy accepted by versioned REST clients. */
export interface OneRosterRestRetryPolicyInput {
  readonly maxAttempts: number;
  readonly maxElapsedMilliseconds: number;
  readonly statusCodes?: ReadonlyArray<number>;
  readonly retryConnectionErrors?: boolean;
  readonly backoffMilliseconds?: (context: OneRosterRestRetryBackoffContext) => number;
}

/** Validated retry policy used by the shared transport mechanics. */
export interface OneRosterRestRetryPolicy {
  readonly maxAttempts: number;
  readonly maxElapsedMilliseconds: number;
  readonly statusCodes: ReadonlySet<number>;
  readonly retryConnectionErrors: boolean;
  readonly backoffMilliseconds: (context: OneRosterRestRetryBackoffContext) => number;
}

/** Clock used to evaluate retry headers and elapsed-time bounds. */
export interface OneRosterRestRetryClock {
  readonly nowMilliseconds: () => number;
}

/** Inputs used to decide and schedule the next safe read attempt. */
export interface OneRosterRestRetryScheduleInput {
  readonly policy: OneRosterRestRetryPolicy | undefined;
  readonly method: string;
  readonly attempt: number;
  readonly startedAtMilliseconds: number;
  readonly retryAfterMilliseconds: number | undefined;
  readonly clock: OneRosterRestRetryClock;
  readonly signal: AbortSignal;
}

/** Web Platform system clock used when callers do not inject one. */
export const oneRosterRestSystemRetryClock: OneRosterRestRetryClock = {
  nowMilliseconds: () => Date.now(),
};

/** Validate and normalize an explicitly configured read retry policy. */
export function parseOneRosterRestRetryPolicy(
  input: unknown,
): Result<OneRosterRestRetryPolicy, "invalid_retry_policy"> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return err("invalid_retry_policy");
  }
  const value = input as Partial<OneRosterRestRetryPolicyInput>;
  if (!positiveSafeInteger(value.maxAttempts) || value.maxAttempts < 2) {
    return err("invalid_retry_policy");
  }
  if (!positiveSafeInteger(value.maxElapsedMilliseconds)) {
    return err("invalid_retry_policy");
  }
  const statusCodes = value.statusCodes ?? [429, 502, 503];
  if (
    !Array.isArray(statusCodes) ||
    statusCodes.length === 0 ||
    statusCodes.some((status) => !Number.isSafeInteger(status) || status < 400 || status > 599)
  ) {
    return err("invalid_retry_policy");
  }
  if (
    value.retryConnectionErrors !== undefined &&
    typeof value.retryConnectionErrors !== "boolean"
  ) {
    return err("invalid_retry_policy");
  }
  if (value.backoffMilliseconds !== undefined && typeof value.backoffMilliseconds !== "function") {
    return err("invalid_retry_policy");
  }
  return ok({
    maxAttempts: value.maxAttempts,
    maxElapsedMilliseconds: value.maxElapsedMilliseconds,
    statusCodes: new Set(statusCodes),
    retryConnectionErrors: value.retryConnectionErrors ?? true,
    backoffMilliseconds:
      value.backoffMilliseconds ??
      ((context) =>
        context.retryAfterMilliseconds ?? Math.min(2 ** (context.attempt - 1) * 100, 5_000)),
  });
}

/** Parse an HTTP Retry-After value as a non-negative delay. */
export function parseOneRosterRestRetryAfter(
  value: string | null,
  nowMilliseconds: number,
): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    const milliseconds = seconds * 1_000;
    return Number.isSafeInteger(seconds) && Number.isSafeInteger(milliseconds)
      ? milliseconds
      : undefined;
  }
  const date = Date.parse(trimmed);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, date - nowMilliseconds);
}

/** Decide whether a safe read can retry and wait for its cancellation-aware backoff. */
export async function scheduleOneRosterRestRetry(
  input: OneRosterRestRetryScheduleInput,
): Promise<"retry" | "stop" | "cancelled"> {
  if (
    input.policy === undefined ||
    input.method !== "GET" ||
    input.attempt >= input.policy.maxAttempts
  ) {
    return "stop";
  }

  let delayMilliseconds: number;
  try {
    delayMilliseconds = input.policy.backoffMilliseconds({
      attempt: input.attempt,
      ...(input.retryAfterMilliseconds === undefined
        ? {}
        : { retryAfterMilliseconds: input.retryAfterMilliseconds }),
    });
  } catch (cause: unknown) {
    void cause;
    return "stop";
  }
  if (!Number.isFinite(delayMilliseconds) || delayMilliseconds < 0) return "stop";
  if (
    input.clock.nowMilliseconds() - input.startedAtMilliseconds + delayMilliseconds >
    input.policy.maxElapsedMilliseconds
  ) {
    return "stop";
  }
  return (await waitForOneRosterRestRetry(delayMilliseconds, { signal: input.signal }))
    ? "retry"
    : "cancelled";
}

async function waitForOneRosterRestRetry(
  delayMilliseconds: number,
  options: { readonly signal: AbortSignal },
): Promise<boolean> {
  if (options.signal.aborted) return false;
  return await new Promise<boolean>((resolve) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (value: boolean): void => {
      if (settled) return;
      settled = true;
      if (timeout !== undefined) clearTimeout(timeout);
      options.signal.removeEventListener("abort", cancel);
      // oxlint-disable-next-line promise/no-multiple-resolved -- SAFETY: the settled guard permits exactly one completion path.
      resolve(value);
    };
    const cancel = (): void => finish(false);
    timeout = setTimeout(() => finish(true), delayMilliseconds);
    options.signal.addEventListener("abort", cancel, { once: true });
  });
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value > 0;
}
