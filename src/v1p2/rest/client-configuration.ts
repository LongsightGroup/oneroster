import { err, ok, type Result } from "../../result.js";
import {
  oneRosterRestSystemRetryClock,
  parseOneRosterRestRetryPolicy,
  type OneRosterRestRetryClock,
  type OneRosterRestRetryPolicy,
  type OneRosterRestRetryPolicyInput,
} from "../../rest/retry.js";
import type { OneRosterV1p2AccessTokenProvider } from "./access-token.js";
import type { OneRosterV1p2ConfigurationError } from "./error.js";
import type { OneRosterV1p2Service } from "./operation.js";

/** A portable fetch-compatible function seam. */
export type OneRosterV1p2Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Explicit service roots used by a v1.2 REST client. */
export interface OneRosterV1p2ServiceBaseUrls {
  readonly rostering?: string;
  readonly gradebook?: string;
  readonly resources?: string;
}

/** Host-supplied inputs for validating a REST client configuration. */
export interface OneRosterV1p2ClientConfigurationInput {
  readonly serviceBaseUrls: OneRosterV1p2ServiceBaseUrls;
  readonly accessTokenProvider: OneRosterV1p2AccessTokenProvider;
  readonly fetch?: OneRosterV1p2Fetch;
  readonly retryPolicy?: OneRosterRestRetryPolicyInput;
  readonly retryClock?: OneRosterRestRetryClock;
}

/** Immutable validated configuration used by the REST transport. */
export interface OneRosterV1p2ClientConfiguration {
  readonly serviceBaseUrls: Readonly<Partial<Record<OneRosterV1p2Service, string>>>;
  readonly accessTokenProvider: OneRosterV1p2AccessTokenProvider;
  readonly fetch: OneRosterV1p2Fetch;
  readonly retryPolicy?: OneRosterRestRetryPolicy;
  readonly retryClock: OneRosterRestRetryClock;
}

/** Validate explicit service roots and host-owned transport seams. */
export function createOneRosterV1p2ClientConfiguration(
  input: unknown,
): Result<OneRosterV1p2ClientConfiguration, OneRosterV1p2ConfigurationError> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return err(
      configurationError("invalid_service_url", "", "REST client configuration must be an object."),
    );
  }
  const value = input as Partial<OneRosterV1p2ClientConfigurationInput>;
  if (
    value.serviceBaseUrls === undefined ||
    value.serviceBaseUrls === null ||
    typeof value.serviceBaseUrls !== "object"
  ) {
    return err(
      configurationError("invalid_service_url", "", "serviceBaseUrls must be provided explicitly."),
    );
  }
  if (typeof value.accessTokenProvider !== "function") {
    return err(
      configurationError(
        "invalid_token_provider",
        "",
        "An access-token provider must be supplied.",
      ),
    );
  }
  if (value.fetch !== undefined && typeof value.fetch !== "function") {
    return err(
      configurationError("invalid_fetch", "", "The injected fetch seam must be callable."),
    );
  }
  if (value.retryClock !== undefined && !isRetryClock(value.retryClock)) {
    return err(
      configurationError(
        "invalid_retry_policy",
        "",
        "The retry clock must expose nowMilliseconds().",
      ),
    );
  }
  const baseUrls: Partial<Record<OneRosterV1p2Service, string>> = {};
  for (const service of ["rostering", "gradebook", "resources"] as const) {
    const baseUrl = value.serviceBaseUrls[service];
    if (baseUrl === undefined) continue;
    if (!isValidServiceUrl(baseUrl)) {
      return err(
        configurationError(
          "invalid_service_url",
          service,
          "A service base URL must be an absolute HTTP(S) URL without credentials or query state.",
        ),
      );
    }
    baseUrls[service] = normalizeBaseUrl(baseUrl);
  }
  const fetchFunction = value.fetch ?? globalThis.fetch;
  if (typeof fetchFunction !== "function") {
    return err(
      configurationError("invalid_fetch", "", "No Web Platform fetch implementation is available."),
    );
  }
  const retryPolicy =
    value.retryPolicy === undefined ? undefined : parseOneRosterRestRetryPolicy(value.retryPolicy);
  if (retryPolicy?._tag === "err") {
    return err(
      configurationError(
        "invalid_retry_policy",
        "",
        "The read retry policy must be explicitly bounded and valid.",
      ),
    );
  }
  return ok({
    serviceBaseUrls: baseUrls,
    accessTokenProvider: value.accessTokenProvider,
    fetch: fetchFunction,
    retryClock: value.retryClock ?? oneRosterRestSystemRetryClock,
    ...(retryPolicy === undefined ? {} : { retryPolicy: retryPolicy.value }),
  });
}

function isRetryClock(input: unknown): input is OneRosterRestRetryClock {
  return (
    input !== null &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    "nowMilliseconds" in input &&
    typeof input.nowMilliseconds === "function"
  );
}

function isValidServiceUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function configurationError(
  code: OneRosterV1p2ConfigurationError["code"],
  operationId: string,
  message: string,
): OneRosterV1p2ConfigurationError {
  return { _tag: "OneRosterV1p2ConfigurationError", code, operationId, message };
}
