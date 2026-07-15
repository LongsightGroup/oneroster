import {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2AssessmentResultsClient,
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2GradebookClient,
  createOneRosterV1p2ResourcesClient,
  createOneRosterV1p2ProviderRouter,
  createOneRosterV1p2RosteringClient,
  type OneRosterV1p2LineItem,
  type OneRosterV1p2AssessmentLineItem,
  type OneRosterV1p2AssessmentResult,
  type OneRosterV1p2ProviderServices,
  type OneRosterV1p2Projected,
  type OneRosterV1p2Result,
  type OneRosterV1p2Resource,
  type OneRosterV1p2User,
  type OneRosterV1p2Fetch,
} from "../src/v1p2/index.js";
import { ok } from "../src/result.js";

// @ts-expect-error Projection fields are constrained to the entity's known keys.
type UnknownProjection = OneRosterV1p2Projected<OneRosterV1p2User, "notAUserField">;

/** A compile-time example of a projected, field-aware response. */
export function projectedUserExample(): OneRosterV1p2Projected<OneRosterV1p2User, "givenName"> {
  return { givenName: "Example" };
}

/** Compile-time examples for the known field selector vocabulary. */
export function projectedFieldTypeExamples(): void {
  const selected: OneRosterV1p2Projected<OneRosterV1p2User, "givenName" | "familyName"> = {
    givenName: "Example",
    familyName: "Learner",
  };
  void selected;
}

/** Keep the rejected projection type in a compile-only public API example. */
export function rejectedProjectionExample(_value: UnknownProjection): void {}

/** Compile-time README-shaped example for a caller-owned Rostering sync. */
export async function rosteringClientUsageExample(fetch: OneRosterV1p2Fetch): Promise<void> {
  const token = createOneRosterV1p2AccessToken("x");
  if (token._tag === "err") return;
  const client = createOneRosterV1p2RosteringClient({
    serviceBaseUrls: { rostering: "https://sis.example/ims/oneroster/rostering/v1p2" },
    accessTokenProvider: async () => ok(token.value),
    fetch,
  });
  if (client._tag === "err") return;
  const filter = createOneRosterV1p2FilterClause("status", "=", "active");
  if (filter._tag === "err") return;
  const controller = new AbortController();
  const page = await client.value.getAllUsers({
    query: { limit: 100, filter: filter.value, fields: ["givenName", "familyName"] },
    signal: controller.signal,
  });
  if (page._tag === "err") return;
  const firstName: string | undefined = page.value.items[0]?.givenName;
  void firstName;

  // @ts-expect-error Rostering projections reject fields outside the User model.
  await client.value.getAllUsers({ query: { fields: ["notAUserField"] } });
  // @ts-expect-error Singleton reads accept fields only, not collection pagination.
  await client.value.getUser("user-example", { query: { limit: 1 } });
  // A real application owns dateLastModified checkpoints and persistence.
}

/** Compile-time example for domain-neutral Gradebook passback and reconciliation. */
export async function gradebookPassbackUsageExample(
  fetch: OneRosterV1p2Fetch,
  lineItem: OneRosterV1p2LineItem,
  result: OneRosterV1p2Result,
): Promise<void> {
  const token = createOneRosterV1p2AccessToken("x");
  if (token._tag === "err") return;
  const client = createOneRosterV1p2GradebookClient({
    serviceBaseUrls: { gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2" },
    accessTokenProvider: async () => ok(token.value),
    fetch,
  });
  if (client._tag === "err") return;
  const controller = new AbortController();

  // The host resolves class/learner IDs and owns stable IDs and persistence.
  const created = await client.value.postLineItemsForClass("class-example", [lineItem], {
    signal: controller.signal,
  });
  if (created._tag === "err") return;
  const written = await client.value.putResult(result.sourcedId, result, {
    signal: controller.signal,
  });
  if (written._tag === "err") return;
  const reconciled = await client.value.getResult(result.sourcedId, {
    signal: controller.signal,
  });
  if (reconciled._tag === "err") return;
  void reconciled.value;
}

/** Compile-time example for a Resources relationship read. */
export async function resourcesClientUsageExample(
  fetch: OneRosterV1p2Fetch,
): Promise<Pick<OneRosterV1p2Resource, "sourcedId" | "title" | "vendorResourceId"> | undefined> {
  const token = createOneRosterV1p2AccessToken("x");
  if (token._tag === "err") return undefined;
  const client = createOneRosterV1p2ResourcesClient({
    serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
    accessTokenProvider: async () => ok(token.value),
    fetch,
  });
  if (client._tag === "err") return undefined;
  const page = await client.value.getResourcesForClass("class-example", {
    query: { fields: ["sourcedId", "title", "vendorResourceId"] },
  });
  if (page._tag === "err") return undefined;
  return page.value.items[0];
}

/** Compile-time example for caller-produced Assessment Results Profile data. */
export async function assessmentResultsProfileUsageExample(
  fetch: OneRosterV1p2Fetch,
  assessmentLineItem: OneRosterV1p2AssessmentLineItem,
  assessmentResult: OneRosterV1p2AssessmentResult,
): Promise<void> {
  const token = createOneRosterV1p2AccessToken("x");
  if (token._tag === "err") return;
  const client = createOneRosterV1p2AssessmentResultsClient({
    serviceBaseUrls: { gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2" },
    accessTokenProvider: async () => ok(token.value),
    fetch,
  });
  if (client._tag === "err") return;
  // A host-owned assessment/QTI workflow supplies these already-interpreted values.
  const lineItem = await client.value.putAssessmentLineItem(
    assessmentLineItem.sourcedId,
    assessmentLineItem,
  );
  if (lineItem._tag === "err") return;
  const result = await client.value.putAssessmentResult(
    assessmentResult.sourcedId,
    assessmentResult,
  );
  if (result._tag === "err") return;
  // OneRoster Assessment Results exchange does not calculate scores or carry QTI content.
}

/** Compile-time example of composing the provider with plain Web Request/Response values. */
export async function providerRequestResponseUsageExample(request: Request): Promise<Response> {
  const services: OneRosterV1p2ProviderServices = {
    resources: {
      getAllResources: async () =>
        ok({ kind: "collection", page: { items: [], limit: 20, offset: 0, totalCount: 0 } }),
    },
  };
  const router = createOneRosterV1p2ProviderRouter({
    services,
    authorize: async () =>
      ok({ subject: "host-owned-principal", scopes: [] as ReadonlyArray<string> }),
  });
  if (router._tag === "err") return new Response(null, { status: 500 });
  // Hono, Workers, Deno, and Node applications adapt this standard handler at their boundary.
  return router.value.handle(request);
}
