import { err, ok, type Result } from "../../result.js";
import {
  createOneRosterV1p2AccessToken,
  type OneRosterV1p2AccessToken,
  type OneRosterV1p2AccessTokenProvider,
  type OneRosterV1p2AuthenticationError,
} from "./access-token.js";
import type { OneRosterV1p2Fetch } from "./client-configuration.js";

/** Standard OAuth 2 client authentication methods supported by this portable provider. */
export type OneRosterV1p2OAuth2ClientAuthentication = "client_secret_basic" | "client_secret_post";

/** Host-owned inputs for an OAuth 2 client-credentials provider. */
export interface OneRosterV1p2OAuth2ClientCredentialsOptions {
  readonly tokenEndpoint: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly clientAuthentication: OneRosterV1p2OAuth2ClientAuthentication;
  readonly scopes: ReadonlyArray<string>;
  readonly fetch: OneRosterV1p2Fetch;
  readonly clock?: () => number;
  readonly expirationSkewSeconds?: number;
}

interface CachedAccessToken {
  readonly token: OneRosterV1p2AccessToken;
  readonly safeUntil: number;
}

interface ParsedTokenResponse {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly scopes: ReadonlyArray<string>;
}

/**
 * Create a Web-API-only OAuth 2 client-credentials provider.
 *
 * Client credentials remain owned by the host application and are never read
 * from environment variables, browser storage, or other global state. This
 * provider must not be embedded in browser-delivered code with a secret.
 */
export function createOneRosterV1p2OAuth2ClientCredentialsProvider(
  options: OneRosterV1p2OAuth2ClientCredentialsOptions,
): Result<OneRosterV1p2AccessTokenProvider, OneRosterV1p2AuthenticationError> {
  const configuration = validateOptions(options);
  if (configuration._tag === "err") return configuration;
  const configuredScopes = configuration.value.scopes;
  const clock = options.clock ?? Date.now;
  const expirationSkewSeconds = options.expirationSkewSeconds ?? 60;
  const cache = new Map<string, CachedAccessToken>();
  const inFlight = new Map<
    string,
    Promise<Result<OneRosterV1p2AccessToken, OneRosterV1p2AuthenticationError>>
  >();

  const provider: OneRosterV1p2AccessTokenProvider = async (requestedScopes, signal) => {
    if (signal.aborted) return err(authenticationError("cancelled"));
    const normalizedScopes = normalizeRequestedScopes(requestedScopes, configuredScopes);
    if (normalizedScopes === undefined) return err(authenticationError("invalid_configuration"));
    const key = normalizedScopes.join("\u001f");
    const now = clock();
    const cached = cache.get(key);
    if (cached !== undefined && cached.safeUntil > now) return ok(cached.token);
    const current = inFlight.get(key);
    if (current !== undefined) return current;

    const request = fetchAccessToken(options, normalizedScopes, signal).then((result) => {
      if (result._tag === "ok") {
        const safeUntil =
          clock() + Math.max(0, result.value.expiresInSeconds - expirationSkewSeconds) * 1000;
        cache.set(key, { token: result.value.token, safeUntil });
        return ok(result.value.token);
      }
      return result;
    });
    inFlight.set(key, request);
    try {
      return await request;
    } finally {
      if (inFlight.get(key) === request) inFlight.delete(key);
    }
  };
  return ok(provider);
}

function validateOptions(
  options: OneRosterV1p2OAuth2ClientCredentialsOptions,
): Result<OneRosterV1p2OAuth2ClientCredentialsOptions, OneRosterV1p2AuthenticationError> {
  if (
    !isHttpsUrl(options.tokenEndpoint) ||
    options.clientId.length === 0 ||
    options.clientSecret.length === 0 ||
    /[\r\n]/.test(options.clientId) ||
    /[\r\n]/.test(options.clientSecret) ||
    (options.clientAuthentication !== "client_secret_basic" &&
      options.clientAuthentication !== "client_secret_post") ||
    typeof options.fetch !== "function"
  ) {
    return err(authenticationError("invalid_configuration"));
  }
  const scopes = normalizeScopeList(options.scopes);
  if (scopes === undefined || scopes.length === 0)
    return err(authenticationError("invalid_configuration"));
  const skew = options.expirationSkewSeconds;
  if (skew !== undefined && (!Number.isSafeInteger(skew) || skew < 0)) {
    return err(authenticationError("invalid_configuration"));
  }
  return ok({ ...options, scopes });
}

async function fetchAccessToken(
  options: OneRosterV1p2OAuth2ClientCredentialsOptions,
  scopes: ReadonlyArray<string>,
  signal: AbortSignal,
): Promise<
  Result<
    { readonly token: CachedAccessToken["token"]; readonly expiresInSeconds: number },
    OneRosterV1p2AuthenticationError
  >
> {
  const form = new URLSearchParams({ grant_type: "client_credentials", scope: scopes.join(" ") });
  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  });
  if (options.clientAuthentication === "client_secret_basic") {
    headers.set(
      "Authorization",
      `Basic ${encodeBasicCredentials(options.clientId, options.clientSecret)}`,
    );
  } else {
    form.set("client_id", options.clientId);
    form.set("client_secret", options.clientSecret);
  }
  let response: Response;
  try {
    response = await options.fetch(options.tokenEndpoint, {
      method: "POST",
      headers,
      body: form.toString(),
      signal,
    });
  } catch (cause: unknown) {
    if (signal.aborted || isAbortCause(cause)) return err(authenticationError("cancelled"));
    return err(authenticationError("token_failed"));
  }
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (cause: unknown) {
    if (signal.aborted || isAbortCause(cause)) return err(authenticationError("cancelled"));
    return err(authenticationError("token_failed"));
  }
  if (!response.ok) return err(authenticationError("token_failed"));
  let body: unknown;
  try {
    body = JSON.parse(responseText);
  } catch (cause: unknown) {
    void cause;
    return err(authenticationError("token_invalid"));
  }
  const parsed = parseTokenResponse(body, scopes);
  if (parsed._tag === "err") return parsed;
  const token = createOneRosterV1p2AccessToken(parsed.value.accessToken);
  if (token._tag === "err") return token;
  return ok({ token: token.value, expiresInSeconds: parsed.value.expiresInSeconds });
}

function parseTokenResponse(
  input: unknown,
  requestedScopes: ReadonlyArray<string>,
): Result<ParsedTokenResponse, OneRosterV1p2AuthenticationError> {
  const body = asRecord(input);
  if (
    body === undefined ||
    typeof body["access_token"] !== "string" ||
    body["access_token"].length === 0 ||
    typeof body["token_type"] !== "string" ||
    body["token_type"].toLowerCase() !== "bearer" ||
    typeof body["expires_in"] !== "number" ||
    !Number.isSafeInteger(body["expires_in"]) ||
    body["expires_in"] <= 0
  ) {
    return err(authenticationError("token_invalid"));
  }
  let returnedScopes = requestedScopes;
  if (body["scope"] !== undefined) {
    if (typeof body["scope"] !== "string") return err(authenticationError("token_invalid"));
    const parsedScopes = normalizeScopeList(
      body["scope"].split(/\s+/).filter((scope) => scope.length > 0),
    );
    if (parsedScopes === undefined) return err(authenticationError("token_invalid"));
    returnedScopes = parsedScopes;
    if (requestedScopes.some((scope) => !returnedScopes.includes(scope))) {
      return err(authenticationError("token_invalid"));
    }
  }
  return ok({
    accessToken: body["access_token"],
    expiresInSeconds: body["expires_in"],
    scopes: returnedScopes,
  });
}

function normalizeRequestedScopes(
  requestedScopes: ReadonlyArray<string>,
  configuredScopes: ReadonlyArray<string>,
): ReadonlyArray<string> | undefined {
  const candidate = requestedScopes.length === 0 ? configuredScopes : requestedScopes;
  const normalized = normalizeScopeList(candidate);
  if (normalized === undefined || normalized.some((scope) => !configuredScopes.includes(scope)))
    return undefined;
  return normalized;
}

function normalizeScopeList(values: ReadonlyArray<string>): Array<string> | undefined {
  if (values.some((value) => typeof value !== "string" || value.length === 0 || /\s/.test(value))) {
    return undefined;
  }
  return [...new Set(values)].toSorted();
}

function encodeBasicCredentials(clientId: string, clientSecret: string): string {
  const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function asRecord(input: unknown): Readonly<Record<string, unknown>> | undefined {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return undefined;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the guard establishes a non-array object boundary for unknown JSON.
  return input as Readonly<Record<string, unknown>>;
}

function authenticationError(
  code: OneRosterV1p2AuthenticationError["code"],
): OneRosterV1p2AuthenticationError {
  const messages: Readonly<Record<OneRosterV1p2AuthenticationError["code"], string>> = {
    invalid_configuration: "The OAuth client-credentials configuration is invalid.",
    token_failed: "The OAuth access token could not be acquired.",
    token_invalid: "The OAuth access-token response is invalid.",
    cancelled: "The OAuth access-token request was cancelled.",
  };
  return { _tag: "OneRosterV1p2AuthenticationError", code, message: messages[code] };
}

function isAbortCause(cause: unknown): boolean {
  return (
    typeof cause === "object" && cause !== null && "name" in cause && cause.name === "AbortError"
  );
}
