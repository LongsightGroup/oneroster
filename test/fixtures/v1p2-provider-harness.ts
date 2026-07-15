import { ok } from "../../src/result.js";
import type {
  OneRosterV1p2ProviderOperationHandler,
  OneRosterV1p2ProviderPrincipal,
  OneRosterV1p2ProviderSuccess,
} from "../../src/v1p2/index.js";

/** A synthetic provider entity used only for wire-shape tests. */
export const providerResource = {
  sourcedId: "resource-example",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00.000Z",
  vendorResourceId: "vendor-resource-example",
  title: "Example Resource",
} as const;

/** A deterministic collection result for a provider test handler. */
export function providerCollectionSuccess(
  items: ReadonlyArray<unknown> = [providerResource],
): OneRosterV1p2ProviderSuccess {
  return {
    kind: "collection",
    page: { items, limit: 20, offset: 0, totalCount: items.length, links: {} },
  };
}

/** A deterministic singleton result for a provider test handler. */
export function providerSingletonSuccess(
  value: unknown = providerResource,
): OneRosterV1p2ProviderSuccess {
  return { kind: "singleton", value };
}

/** A no-op handler used for capability and route tests. */
export const providerSuccessHandler: OneRosterV1p2ProviderOperationHandler = async () =>
  ok(providerCollectionSuccess());

/** A synthetic principal returned by the test authorization seam. */
export const providerPrincipal: OneRosterV1p2ProviderPrincipal = {
  subject: "provider-test-principal",
  scopes: [],
};
