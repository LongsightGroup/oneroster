import type { Result } from "../../result.js";
import type { OneRosterV1p2Query } from "../rest/query.js";
import type { OneRosterV1p2PageLinks } from "../rest/page.js";
import {
  oneRosterV1p2OperationIdsByProviderKind,
  oneRosterV1p2OperationIdsByService,
  type OneRosterV1p2Service,
} from "../rest/operation.js";

/** Operation names implemented by the OneRoster 1.2 Rostering service. */
export const oneRosterV1p2ProviderRosteringOperationIds =
  oneRosterV1p2OperationIdsByProviderKind.rostering;

/** Operation names implemented by the base OneRoster 1.2 Gradebook service. */
export const oneRosterV1p2ProviderBaseGradebookOperationIds =
  oneRosterV1p2OperationIdsByProviderKind.gradebook;

/**
 * Assessment Results Profile operations served under the Gradebook service
 * root; this is a profile boundary, not a fourth provider service root.
 */
export const oneRosterV1p2ProviderAssessmentResultsOperationIds =
  oneRosterV1p2OperationIdsByProviderKind.assessmentResults;

/** All Gradebook-root provider operations, including the Assessment profile. */
export const oneRosterV1p2ProviderGradebookOperationIds =
  oneRosterV1p2OperationIdsByService.gradebook;

/** Operation names implemented by the OneRoster 1.2 Resources service. */
export const oneRosterV1p2ProviderResourcesOperationIds =
  oneRosterV1p2OperationIdsByProviderKind.resources;

/** An authenticated principal supplied by a host authorization adapter. */
export interface OneRosterV1p2ProviderPrincipal {
  readonly subject: string;
  readonly scopes: ReadonlyArray<string>;
}

/** Safe request facts supplied to the host authorization adapter. */
export interface OneRosterV1p2ProviderAuthorizationFacts {
  readonly operationId: string;
  readonly service: OneRosterV1p2Service;
  readonly method: string;
  readonly pathParameters: Readonly<Record<string, string>>;
  readonly query?: OneRosterV1p2Query;
  readonly requiredScopes: ReadonlyArray<string>;
  readonly hasAuthorizationHeader: boolean;
  readonly contentType?: string;
}

/** Immutable request context passed to an authorized provider method. */
export interface OneRosterV1p2ProviderRequestContext extends OneRosterV1p2ProviderAuthorizationFacts {
  readonly principal: OneRosterV1p2ProviderPrincipal;
  readonly signal: AbortSignal;
}

/** Collection metadata returned by a provider domain method. */
export interface OneRosterV1p2ProviderPage<TValue = unknown> {
  readonly items: ReadonlyArray<TValue>;
  readonly limit: number;
  readonly offset: number;
  readonly totalCount?: number;
  readonly links?: OneRosterV1p2PageLinks;
}

/** Domain success values that the provider router serializes onto the wire. */
export type OneRosterV1p2ProviderSuccess =
  | {
      readonly kind: "collection";
      readonly page: OneRosterV1p2ProviderPage;
    }
  | {
      readonly kind: "singleton";
      readonly value: unknown;
    }
  | {
      readonly kind: "write";
      readonly sourcedIdPairs?: ReadonlyArray<{
        readonly suppliedSourcedId: string;
        readonly allocatedSourcedId: string;
      }>;
    }
  | { readonly kind: "noContent" };

/** Safe failure returned by a provider domain method. */
export interface OneRosterV1p2ProviderFailure {
  readonly _tag: "OneRosterV1p2ProviderFailure";
  readonly status: 400 | 401 | 403 | 404 | 405 | 409 | 422 | 429 | 500 | 501 | 503;
  readonly code:
    | "bad_request"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "method_not_allowed"
    | "conflict"
    | "unprocessable"
    | "rate_limited"
    | "internal"
    | "not_implemented"
    | "unavailable";
}

/** Parsed input passed to one provider operation method. */
export interface OneRosterV1p2ProviderOperationInput {
  readonly context: OneRosterV1p2ProviderRequestContext;
  readonly body?: unknown;
}

/** One exact operation method in a provider service contract. */
export type OneRosterV1p2ProviderOperationHandler = (
  input: OneRosterV1p2ProviderOperationInput,
) => Promise<Result<OneRosterV1p2ProviderSuccess, OneRosterV1p2ProviderFailure>>;

/** Mapped provider methods whose keys are exact operation IDs. */
export type OneRosterV1p2ProviderServiceHandlers<TOperationId extends string> = {
  readonly [K in TOperationId]: OneRosterV1p2ProviderOperationHandler;
};

/** Complete Rostering provider contract. */
export type OneRosterV1p2RosteringProviderService = OneRosterV1p2ProviderServiceHandlers<
  (typeof oneRosterV1p2ProviderRosteringOperationIds)[number]
>;

/** Complete Gradebook provider contract, including Assessment Results Profile operations. */
export type OneRosterV1p2GradebookProviderService = OneRosterV1p2ProviderServiceHandlers<
  (typeof oneRosterV1p2ProviderGradebookOperationIds)[number]
>;

/** Complete Resources provider contract. */
export type OneRosterV1p2ResourcesProviderService = OneRosterV1p2ProviderServiceHandlers<
  (typeof oneRosterV1p2ProviderResourcesOperationIds)[number]
>;

/** A capability subset for a Rostering provider. */
export type OneRosterV1p2RosteringProviderServiceSubset =
  Partial<OneRosterV1p2RosteringProviderService>;

/** A capability subset for a Gradebook provider. */
export type OneRosterV1p2GradebookProviderServiceSubset =
  Partial<OneRosterV1p2GradebookProviderService>;

/** A capability subset for a Resources provider. */
export type OneRosterV1p2ResourcesProviderServiceSubset =
  Partial<OneRosterV1p2ResourcesProviderService>;

/** Host-provided service capability subsets. */
export interface OneRosterV1p2ProviderServices {
  readonly rostering?: OneRosterV1p2RosteringProviderServiceSubset;
  readonly gradebook?: OneRosterV1p2GradebookProviderServiceSubset;
  readonly resources?: OneRosterV1p2ResourcesProviderServiceSubset;
}

/** Return the implemented operation IDs in a capability subset. */
export function getOneRosterV1p2ProviderOperationIds(
  services: OneRosterV1p2ProviderServices,
): ReadonlyArray<string> {
  const result: Array<string> = [];
  for (const service of [services.rostering, services.gradebook, services.resources]) {
    if (service === undefined) continue;
    for (const [operationId, handler] of Object.entries(service)) {
      if (typeof handler === "function") result.push(operationId);
    }
  }
  return result.toSorted();
}

/** Get a handler from a service capability subset without guessing a fallback. */
export function findOneRosterV1p2ProviderHandler(
  services: OneRosterV1p2ProviderServices,
  service: OneRosterV1p2Service,
  operationId: string,
): OneRosterV1p2ProviderOperationHandler | undefined {
  const handlers = services[service];
  if (handlers === undefined) return undefined;
  const handler = Object.entries(handlers).find(([key]) => key === operationId)?.[1];
  return typeof handler === "function" ? handler : undefined;
}
