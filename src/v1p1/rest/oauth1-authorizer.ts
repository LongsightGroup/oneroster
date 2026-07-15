import { err, ok, type Result } from "../../result.js";
import type {
  OneRosterV1p1AuthorizationError,
  OneRosterV1p1RequestAuthorizer,
} from "./authorization.js";

/** Explicit OAuth 1.0a credentials for a legacy OneRoster 1.1 provider. */
export interface OneRosterV1p1OAuth1Credentials {
  readonly consumerKey: string;
  readonly consumerSecret: string;
  readonly token?: string;
  readonly tokenSecret?: string;
}

/** Host seams and credentials used to create an OAuth 1.0a request authorizer. */
export interface OneRosterV1p1OAuth1AuthorizerOptions {
  readonly credentials: OneRosterV1p1OAuth1Credentials;
  /** Produce one nonce per signing attempt; defaults to Web Crypto random bytes. */
  readonly nonce?: () => string;
  /** Return the current Unix timestamp in whole seconds. */
  readonly clock?: () => number;
  /** Override the Web Crypto capability, primarily for portable hosts. */
  readonly crypto?: Pick<Crypto, "getRandomValues" | "subtle">;
}

/** Create an optional Web Crypto HMAC-SHA1 authorizer for OneRoster 1.1. */
export function createOneRosterV1p1OAuth1Authorizer(
  input: unknown,
): Result<OneRosterV1p1RequestAuthorizer, OneRosterV1p1AuthorizationError> {
  const options = parseOptions(input);
  if (options._tag === "err") return options;
  return ok(async ({ request, signal }) => {
    if (signal.aborted) return err(authorizationError("cancelled"));
    let nonce: unknown;
    let timestamp: unknown;
    try {
      nonce = options.value.nonce();
      timestamp = options.value.clock();
    } catch (cause: unknown) {
      void cause;
      return err(authorizationError("signing_failed"));
    }
    if (
      typeof nonce !== "string" ||
      nonce.length === 0 ||
      typeof timestamp !== "number" ||
      !Number.isSafeInteger(timestamp) ||
      timestamp < 0
    ) {
      return err(authorizationError("signing_failed"));
    }
    const oauthParameters: Array<readonly [string, string]> = [
      ["oauth_consumer_key", options.value.credentials.consumerKey],
      ["oauth_nonce", nonce],
      ["oauth_signature_method", "HMAC-SHA1"],
      ["oauth_timestamp", String(timestamp)],
      ["oauth_version", "1.0"],
      ...(options.value.credentials.token === undefined
        ? []
        : ([["oauth_token", options.value.credentials.token]] as const)),
    ];
    let signature: string;
    try {
      signature = await signRequest(
        request,
        oauthParameters,
        options.value.credentials,
        options.value.crypto,
      );
    } catch (cause: unknown) {
      void cause;
      return err(authorizationError(signal.aborted ? "cancelled" : "signing_failed"));
    }
    if (signal.aborted) return err(authorizationError("cancelled"));
    return ok({
      Authorization: authorizationHeader([...oauthParameters, ["oauth_signature", signature]]),
    });
  });
}

interface ParsedOptions {
  readonly credentials: OneRosterV1p1OAuth1Credentials;
  readonly nonce: () => string;
  readonly clock: () => number;
  readonly crypto: Pick<Crypto, "getRandomValues" | "subtle">;
}

function parseOptions(input: unknown): Result<ParsedOptions, OneRosterV1p1AuthorizationError> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return err(authorizationError("invalid_configuration"));
  }
  const value = input as Partial<OneRosterV1p1OAuth1AuthorizerOptions>;
  const credentials = value.credentials;
  if (
    credentials === undefined ||
    credentials === null ||
    typeof credentials !== "object" ||
    !nonEmpty(credentials.consumerKey) ||
    !nonEmpty(credentials.consumerSecret) ||
    (credentials.token !== undefined && !nonEmpty(credentials.token)) ||
    (credentials.tokenSecret !== undefined && !nonEmpty(credentials.tokenSecret)) ||
    (credentials.token === undefined) !== (credentials.tokenSecret === undefined)
  ) {
    return err(authorizationError("invalid_configuration"));
  }
  if (value.nonce !== undefined && typeof value.nonce !== "function") {
    return err(authorizationError("invalid_configuration"));
  }
  if (value.clock !== undefined && typeof value.clock !== "function") {
    return err(authorizationError("invalid_configuration"));
  }
  const cryptoValue = value.crypto ?? globalThis.crypto;
  if (
    cryptoValue === undefined ||
    typeof cryptoValue.getRandomValues !== "function" ||
    cryptoValue.subtle === undefined
  ) {
    return err(authorizationError("invalid_configuration"));
  }
  return ok({
    credentials,
    nonce: value.nonce ?? (() => randomNonce(cryptoValue)),
    clock: value.clock ?? (() => Math.floor(Date.now() / 1_000)),
    crypto: cryptoValue,
  });
}

async function signRequest(
  request: Request,
  oauthParameters: ReadonlyArray<readonly [string, string]>,
  credentials: OneRosterV1p1OAuth1Credentials,
  cryptoValue: Pick<Crypto, "subtle">,
): Promise<string> {
  const url = new URL(request.url);
  const parameters: Array<readonly [string, string]> = [...oauthParameters];
  url.searchParams.forEach((value, key) => parameters.push([key, value]));
  const normalizedParameters = parameters
    .map(([key, value]) => [oauthEncode(key), oauthEncode(value)] as const)
    .toSorted(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey
        ? compareEncoded(leftValue, rightValue)
        : compareEncoded(leftKey, rightKey),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const baseString = [request.method.toUpperCase(), normalizedBaseUrl(url), normalizedParameters]
    .map(oauthEncode)
    .join("&");
  const signingKey = `${oauthEncode(credentials.consumerSecret)}&${oauthEncode(credentials.tokenSecret ?? "")}`;
  const encoder = new TextEncoder();
  const key = await cryptoValue.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await cryptoValue.subtle.sign("HMAC", key, encoder.encode(baseString));
  return base64(new Uint8Array(signature));
}

function normalizedBaseUrl(url: URL): string {
  const defaultPort =
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443");
  const authority = `${url.hostname.toLowerCase()}${url.port === "" || defaultPort ? "" : `:${url.port}`}`;
  return `${url.protocol.toLowerCase()}//${authority}${url.pathname === "" ? "/" : url.pathname}`;
}

function authorizationHeader(parameters: ReadonlyArray<readonly [string, string]>): string {
  return `OAuth ${parameters
    .map(([key, value]) => [oauthEncode(key), oauthEncode(value)] as const)
    .toSorted(([left], [right]) => compareEncoded(left, right))
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ")}`;
}

function oauthEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function compareEncoded(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function randomNonce(cryptoValue: Pick<Crypto, "getRandomValues">): string {
  const bytes = cryptoValue.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function authorizationError(
  code: OneRosterV1p1AuthorizationError["code"],
): OneRosterV1p1AuthorizationError {
  const messages: Readonly<Record<OneRosterV1p1AuthorizationError["code"], string>> = {
    authorization_rejected: "The request authorization was rejected.",
    authorization_failed: "The request authorization failed.",
    invalid_configuration: "The OAuth 1.0a authorizer configuration is invalid.",
    signing_failed: "The OAuth 1.0a request could not be signed.",
    cancelled: "The request authorization was cancelled.",
  };
  return { _tag: "OneRosterV1p1AuthorizationError", code, message: messages[code] };
}
