import type { Result } from "../../result.js";
import type {
  OneRosterV1p2ProviderAuthorizationFacts,
  OneRosterV1p2ProviderPrincipal,
} from "./service.js";

/** Safe authorization failure returned by a host verifier. */
export interface OneRosterV1p2ProviderAuthorizationFailure {
  readonly _tag: "OneRosterV1p2ProviderAuthorizationFailure";
  readonly status: 401 | 403;
  readonly code: "unauthorized" | "forbidden";
}

/** Injected authorization seam; bearer verification and issuer trust stay host-owned. */
export type OneRosterV1p2ProviderAuthorize = (
  facts: OneRosterV1p2ProviderAuthorizationFacts,
  signal: AbortSignal,
) => Promise<Result<OneRosterV1p2ProviderPrincipal, OneRosterV1p2ProviderAuthorizationFailure>>;

/** Build a safe unauthorized result without retaining credentials or request URLs. */
export function oneRosterV1p2ProviderUnauthorized(): OneRosterV1p2ProviderAuthorizationFailure {
  return {
    _tag: "OneRosterV1p2ProviderAuthorizationFailure",
    status: 401,
    code: "unauthorized",
  };
}

/** Build a safe forbidden result without retaining credentials or request URLs. */
export function oneRosterV1p2ProviderForbidden(): OneRosterV1p2ProviderAuthorizationFailure {
  return {
    _tag: "OneRosterV1p2ProviderAuthorizationFailure",
    status: 403,
    code: "forbidden",
  };
}
