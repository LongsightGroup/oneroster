import { describe, expect, it } from "vitest";

import { err, ok } from "../src/result.js";
import {
  buildOneRosterV1p2ProviderDiscoveryDocument,
  checkOneRosterV1p2DiscoveryCapabilities,
  createOneRosterV1p2ProviderPage,
  createOneRosterV1p2ProviderRouter,
  createOneRosterV1p2ProviderStatusResponse,
  findOneRosterV1p2Operation,
  oneRosterV1p2OperationIdsByProviderKind,
  oneRosterV1p2OperationIdsByService,
  oneRosterV1p2Operations,
  oneRosterV1p2ProviderAssessmentResultsOperationIds,
  oneRosterV1p2ProviderBaseGradebookOperationIds,
  oneRosterV1p2ProviderGradebookOperationIds,
  oneRosterV1p2ProviderResourcesOperationIds,
  oneRosterV1p2ProviderRosteringOperationIds,
  oneRosterV1p2Scope,
  parseOneRosterV1p2StatusInfo,
  readOneRosterV1p2Discovery,
  type OneRosterV1p2GradebookProviderService,
  type OneRosterV1p2ProviderAuthorize,
  type OneRosterV1p2ProviderFailure,
  type OneRosterV1p2ProviderOperationInput,
  type OneRosterV1p2ProviderServices,
  type OneRosterV1p2ResourcesProviderService,
} from "../src/v1p2/index.js";
import {
  oneRosterV1p2GeneratedRequestPayloadParsers,
  oneRosterV1p2GeneratedResponseEnvelopeSerializers,
} from "../src/v1p2/rest/payload.generated.js";
import {
  providerPrincipal,
  providerResource,
  providerSingletonSuccess,
  providerSuccessHandler,
} from "./fixtures/v1p2-provider-harness.js";

// @ts-expect-error A declared complete provider contract must implement every operation method.
const incompleteGradebookProvider: OneRosterV1p2GradebookProviderService = {
  getAllCategories: providerSuccessHandler,
};
void incompleteGradebookProvider;

const resourceReadScopes = [
  oneRosterV1p2Scope("resource.readonly"),
  oneRosterV1p2Scope("resource-core.readonly"),
];

function authorizeWith(
  result: ReturnType<OneRosterV1p2ProviderAuthorize> extends Promise<infer TValue> ? TValue : never,
): OneRosterV1p2ProviderAuthorize {
  return async () => result;
}

function readJson(response: Response): Promise<unknown> {
  return response.json();
}

function resourceServices(
  overrides: Partial<OneRosterV1p2ResourcesProviderService> = {},
): OneRosterV1p2ProviderServices {
  return {
    resources: {
      getAllResources: providerSuccessHandler,
      getResource: async () => ok(providerSingletonSuccess()),
      ...overrides,
    },
  };
}

function gradebookWriteServices(
  handler: OneRosterV1p2GradebookProviderService["putCategory"],
): OneRosterV1p2ProviderServices {
  return { gradebook: { putCategory: handler } };
}

function expectedProviderOperationIds(service: "rostering" | "gradebook" | "resources") {
  return oneRosterV1p2Operations
    .filter((operation) => operation.service === service)
    .map((operation) => operation.operationId)
    .toSorted();
}

describe("OneRoster 1.2 provider contracts", () => {
  it("keeps provider method families in parity with the operation registry", () => {
    expect(oneRosterV1p2ProviderRosteringOperationIds).toBe(
      oneRosterV1p2OperationIdsByProviderKind.rostering,
    );
    expect(oneRosterV1p2ProviderGradebookOperationIds).toBe(
      oneRosterV1p2OperationIdsByService.gradebook,
    );
    expect(oneRosterV1p2ProviderResourcesOperationIds).toBe(
      oneRosterV1p2OperationIdsByProviderKind.resources,
    );
    expect(oneRosterV1p2ProviderBaseGradebookOperationIds).toBe(
      oneRosterV1p2OperationIdsByProviderKind.gradebook,
    );
    expect(oneRosterV1p2ProviderAssessmentResultsOperationIds).toBe(
      oneRosterV1p2OperationIdsByProviderKind.assessmentResults,
    );
    expect([...oneRosterV1p2ProviderRosteringOperationIds].toSorted()).toEqual(
      expectedProviderOperationIds("rostering"),
    );
    expect([...oneRosterV1p2ProviderGradebookOperationIds].toSorted()).toEqual(
      expectedProviderOperationIds("gradebook"),
    );
    expect([...oneRosterV1p2ProviderBaseGradebookOperationIds].toSorted()).toEqual(
      expectedProviderOperationIds("gradebook").filter(
        (operationId) => !operationId.includes("Assessment"),
      ),
    );
    expect([...oneRosterV1p2ProviderAssessmentResultsOperationIds].toSorted()).toEqual(
      expectedProviderOperationIds("gradebook").filter((operationId) =>
        operationId.includes("Assessment"),
      ),
    );
    expect([...oneRosterV1p2ProviderResourcesOperationIds].toSorted()).toEqual(
      expectedProviderOperationIds("resources"),
    );
    expect(Object.keys(oneRosterV1p2GeneratedResponseEnvelopeSerializers).toSorted()).toEqual(
      oneRosterV1p2Operations
        .filter(
          (operation) =>
            operation.responseKind === "collection" || operation.responseKind === "singleton",
        )
        .map((operation) => operation.operationId)
        .toSorted(),
    );
    expect(Object.keys(oneRosterV1p2GeneratedRequestPayloadParsers).toSorted()).toEqual(
      [
        ...new Set(
          oneRosterV1p2Operations.flatMap((operation) =>
            operation.requestCodec === undefined ? [] : [operation.requestCodec],
          ),
        ),
      ].toSorted(),
    );
  });

  it("parses provider URL queries through the shared query and filter grammar", async () => {
    let received: OneRosterV1p2ProviderOperationInput | undefined;
    const router = createOneRosterV1p2ProviderRouter({
      services: resourceServices({
        getAllResources: async (input) => {
          received = input;
          return ok({
            kind: "collection",
            page: { items: [providerResource], limit: 20, offset: 0 },
          });
        },
      }),
      authorize: authorizeWith(ok(providerPrincipal)),
    });
    if (router._tag === "err") throw new Error("Expected provider router.");
    const params = new URLSearchParams({
      limit: "20",
      offset: "0",
      sort: "title",
      orderBy: "asc",
      filter: "title~'O''Reilly' AND status='active'",
      fields: "title,vendorResourceId",
    });
    const response = await router.value.handle(
      new Request(
        `https://api.example/ims/oneroster/resources/v1p2/resources?${params.toString()}`,
      ),
    );
    expect(response.status).toBe(200);
    expect(received?.context.query).toEqual({
      limit: 20,
      offset: 0,
      sort: "title",
      orderBy: "asc",
      filter: {
        _tag: "OneRosterV1p2FilterCombination",
        left: {
          _tag: "OneRosterV1p2FilterClause",
          field: "title",
          operator: "~",
          value: "O'Reilly",
        },
        join: "AND",
        right: {
          _tag: "OneRosterV1p2FilterClause",
          field: "status",
          operator: "=",
          value: "active",
        },
      },
      fields: ["title", "vendorResourceId"],
    });
    const duplicate = await router.value.handle(
      new Request("https://api.example/ims/oneroster/resources/v1p2/resources?limit=1&limit=2"),
    );
    expect(duplicate.status).toBe(400);
    const emptyOffset = await router.value.handle(
      new Request("https://api.example/ims/oneroster/resources/v1p2/resources?offset="),
    );
    expect(emptyOffset.status).toBe(400);
  });

  it("serializes exact projected envelopes, page headers, and status payloads", async () => {
    const operation = findOneRosterV1p2Operation("getAllResources");
    if (operation === undefined) throw new Error("Expected Resources operation.");
    const page = createOneRosterV1p2ProviderPage({
      items: [providerResource],
      limit: 20,
      offset: 0,
      totalCount: 1,
      links: { first: "https://api.example/first", next: "https://api.example/next" },
    });
    expect(page._tag).toBe("ok");
    const router = createOneRosterV1p2ProviderRouter({
      services: resourceServices({
        getAllResources: async () =>
          ok({
            kind: "collection",
            page: {
              items: [providerResource],
              limit: 20,
              offset: 0,
              totalCount: 1,
              links: { first: "https://api.example/first", next: "https://api.example/next" },
            },
          }),
      }),
      authorize: authorizeWith(ok(providerPrincipal)),
    });
    if (router._tag === "err") throw new Error("Expected provider router.");
    const response = await router.value.handle(
      new Request("https://api.example/ims/oneroster/resources/v1p2/resources?fields=title", {
        headers: { authorization: "Bearer test-token" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-total-count")).toBe("1");
    expect(response.headers.get("link")).toContain('rel="next"');
    expect(await readJson(response)).toEqual({ resources: [{ title: "Example Resource" }] });

    const invalidPage = createOneRosterV1p2ProviderPage({
      items: [],
      limit: -1,
      offset: 0,
    });
    expect(invalidPage).toMatchObject({ _tag: "err", error: { status: 500 } });
    const status = createOneRosterV1p2ProviderStatusResponse(422);
    expect(status.status).toBe(422);
    const statusBody = JSON.parse(status.body ?? "{}");
    expect(parseOneRosterV1p2StatusInfo(statusBody["imsx_StatusInfo"])._tag).toBe("ok");
    void operation;
  });

  it("authorizes before body parsing and maps route/query/service failures safely", async () => {
    let calls = 0;
    const unauthorizedRouter = createOneRosterV1p2ProviderRouter({
      services: resourceServices(),
      authorize: authorizeWith(
        err({
          _tag: "OneRosterV1p2ProviderAuthorizationFailure",
          status: 401,
          code: "unauthorized",
        }),
      ),
    });
    if (unauthorizedRouter._tag === "err") throw new Error("Expected provider router.");
    const unauthorizedResponse = await unauthorizedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/resources/v1p2/resources"),
    );
    expect(unauthorizedResponse.status).toBe(401);

    const denied = authorizeWith(
      err({
        _tag: "OneRosterV1p2ProviderAuthorizationFailure",
        status: 403,
        code: "forbidden",
      }),
    );
    const deniedRouter = createOneRosterV1p2ProviderRouter({
      services: gradebookWriteServices(async () => {
        calls += 1;
        return ok({ kind: "noContent" });
      }),
      authorize: denied,
    });
    if (deniedRouter._tag === "err") throw new Error("Expected provider router.");
    const deniedResponse = await deniedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/gradebook/v1p2/categories/category-example", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(deniedResponse.status).toBe(403);
    expect(calls).toBe(0);

    const malformedRouter = createOneRosterV1p2ProviderRouter({
      services: gradebookWriteServices(async () => {
        calls += 1;
        return ok({ kind: "noContent" });
      }),
      authorize: authorizeWith(ok(providerPrincipal)),
    });
    if (malformedRouter._tag === "err") throw new Error("Expected provider router.");
    const malformedResponse = await malformedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/gradebook/v1p2/categories/category-example", {
        method: "PUT",
        body: "not-json",
      }),
    );
    expect(malformedResponse.status).toBe(400);
    expect(calls).toBe(0);

    const unknownQuery = await malformedRouter.value.handle(
      new Request(
        "https://api.example/ims/oneroster/gradebook/v1p2/categories/category-example?unknown=value",
        { method: "PUT" },
      ),
    );
    expect(unknownQuery.status).toBe(400);
    const notFound = await malformedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/gradebook/v1p2/categories/missing"),
    );
    expect(notFound.status).toBe(404);
    const methodNotAllowed = await malformedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/gradebook/v1p2/categories/category-example", {
        method: "PATCH",
      }),
    );
    expect(methodNotAllowed.status).toBe(405);
    expect(calls).toBe(0);
    const cancelledController = new AbortController();
    cancelledController.abort();
    const cancelled = await malformedRouter.value.handle(
      new Request("https://api.example/ims/oneroster/gradebook/v1p2/categories/category-example", {
        signal: cancelledController.signal,
      }),
    );
    expect(cancelled.status).toBe(499);
  });

  it("maps typed 422, 429, and 500 service failures without exposing path values", async () => {
    const statuses: ReadonlyArray<OneRosterV1p2ProviderFailure["status"]> = [422, 429, 500];
    for (const status of statuses) {
      const failure: OneRosterV1p2ProviderFailure = {
        _tag: "OneRosterV1p2ProviderFailure",
        status,
        code: status === 422 ? "unprocessable" : status === 429 ? "rate_limited" : "internal",
      };
      const router = createOneRosterV1p2ProviderRouter({
        services: resourceServices({
          getResource: async () => err(failure),
        }),
        authorize: authorizeWith(ok(providerPrincipal)),
      });
      if (router._tag === "err") throw new Error("Expected provider router.");
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: this loop verifies each independent status mapping.
      const response = await router.value.handle(
        new Request("https://api.example/ims/oneroster/resources/v1p2/resources/resource-example"),
      );
      expect(response.status).toBe(status);
      // oxlint-disable-next-line no-await-in-loop -- SAFETY: this loop verifies each independent response body.
      expect(await response.text()).not.toContain("resource-example");
    }
  });

  it("builds localized discovery only for enabled implemented capabilities", async () => {
    const document = buildOneRosterV1p2ProviderDiscoveryDocument({
      service: "resources",
      publicServerUrl: "https://api.example",
      tokenUrl: "https://auth.example/token",
      advertisedScopes: resourceReadScopes,
      services: resourceServices(),
      enabledOperationIds: ["getAllResources"],
    });
    expect(document).toMatchObject({ _tag: "ok" });
    if (document._tag === "err") return;
    const paths = document.value["paths"];
    expect(paths).toMatchObject({ "/resources": { get: { operationId: "getAllResources" } } });
    const discovery = await readOneRosterV1p2Discovery({
      discoveryUrl: "https://api.example/ims/oneroster/resources/v1p2/discovery.json",
      service: "resources",
      fetch: async () =>
        new Response(JSON.stringify(document.value), {
          headers: { "content-type": "application/json" },
        }),
    });
    expect(discovery).toMatchObject({
      _tag: "ok",
      value: { operations: [{ operationId: "getAllResources" }] },
    });
    if (discovery._tag === "err") return;
    const gap = checkOneRosterV1p2DiscoveryCapabilities(
      discovery.value,
      ["getAllResources"],
      resourceReadScopes,
    );
    expect(gap.missingOperationIds).toEqual([]);
    expect(gap.missingScopes).toEqual([]);
    expect(
      buildOneRosterV1p2ProviderDiscoveryDocument({
        service: "resources",
        publicServerUrl: "https://api.example",
        tokenUrl: "https://auth.example/token",
        advertisedScopes: resourceReadScopes,
        services: resourceServices(),
        enabledOperationIds: ["getAllUsers"],
      }),
    ).toMatchObject({ _tag: "err", error: { code: "missing_operation" } });
  });
});

void providerResource;
void providerSingletonSuccess;
void resourceReadScopes;
