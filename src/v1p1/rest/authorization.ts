import type { Result } from "../../result.js";
import type { OneRosterV1p1Operation } from "./operation.js";

/** Safe failures returned by a host-owned v1.1 request authorizer. */
export interface OneRosterV1p1AuthorizationError {
  readonly _tag: "OneRosterV1p1AuthorizationError";
  readonly code:
    | "authorization_rejected"
    | "authorization_failed"
    | "invalid_configuration"
    | "signing_failed"
    | "cancelled";
  readonly message: string;
}

/** Context supplied to the injected authorizer. */
export interface OneRosterV1p1AuthorizationInput {
  readonly request: Request;
  readonly operation: OneRosterV1p1Operation;
  readonly signal: AbortSignal;
}

/** Canonical host-owned authorization seam implemented by optional authorization helpers. */
export type OneRosterV1p1RequestAuthorizer = (
  input: OneRosterV1p1AuthorizationInput,
) =>
  | Result<HeadersInit, OneRosterV1p1AuthorizationError>
  | Promise<Result<HeadersInit, OneRosterV1p1AuthorizationError>>;
