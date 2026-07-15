import type { Result } from "../../result.js";

/** A safe authentication failure returned by a host token provider. */
export interface OneRosterV1p2AuthenticationError {
  readonly _tag: "OneRosterV1p2AuthenticationError";
  readonly code: "invalid_configuration" | "token_failed" | "token_invalid" | "cancelled";
  readonly message: string;
}

const accessTokenValues = new WeakMap<OneRosterV1p2AccessToken, string>();

/** An opaque bearer token whose value is never exposed by inspection or JSON serialization. */
export class OneRosterV1p2AccessToken {
  readonly _tag = "OneRosterV1p2AccessToken" as const;

  private constructor(bearerValue: string) {
    accessTokenValues.set(this, bearerValue);
  }

  /** @internal Create an opaque token without exposing its value afterward. */
  public static fromTrustedValue(bearerValue: string): OneRosterV1p2AccessToken {
    return new OneRosterV1p2AccessToken(bearerValue);
  }

  /** Prevent accidental token disclosure in diagnostics and logs. */
  toString(): string {
    return "[redacted OneRoster access token]";
  }

  /** Prevent accidental token disclosure when serialized as JSON. */
  toJSON(): string {
    return "[redacted OneRoster access token]";
  }
}

/** Create an opaque token for a host-owned or OAuth token provider. */
export function createOneRosterV1p2AccessToken(
  bearerValue: string,
): Result<OneRosterV1p2AccessToken, OneRosterV1p2AuthenticationError> {
  if (bearerValue.length === 0 || /[\r\n]/.test(bearerValue)) {
    return {
      _tag: "err",
      error: {
        _tag: "OneRosterV1p2AuthenticationError",
        code: "token_invalid",
        message: "The access token is invalid.",
      },
    };
  }
  return { _tag: "ok", value: OneRosterV1p2AccessToken.fromTrustedValue(bearerValue) };
}

/** A caller-owned token acquisition seam used by the portable transport. */
export type OneRosterV1p2AccessTokenProvider = (
  scopes: ReadonlyArray<string>,
  signal: AbortSignal,
) => Promise<Result<OneRosterV1p2AccessToken, OneRosterV1p2AuthenticationError>>;

/** @internal Read the token only at the authorization-header composition boundary. */
export function readOneRosterV1p2BearerValue(token: OneRosterV1p2AccessToken): string {
  const value = accessTokenValues.get(token);
  if (value === undefined) {
    throw new Error("Invalid OneRoster access-token object.");
  }
  return value;
}
