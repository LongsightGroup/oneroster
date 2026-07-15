import { describe, expect, it } from "vitest";

import {
  buildOneRosterV1p2DiscoveryUrl,
  checkOneRosterV1p2DiscoveryCapabilities,
  readOneRosterV1p2Discovery,
} from "../src/v1p2/index.js";
import { createOneRosterV1p2DiscoveryDocument } from "./fixtures/v1p2-discovery-documents.js";
import { OneRosterV1p2FetchHarness } from "./fixtures/v1p2-fetch-harness.js";

function readValidDiscovery(
  document: Record<string, unknown> = createOneRosterV1p2DiscoveryDocument(),
) {
  const harness = new OneRosterV1p2FetchHarness([
    new Response(JSON.stringify(document), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ]);
  return readOneRosterV1p2Discovery({
    discoveryUrl: "https://sis.example/ims/oneroster/rostering/v1p2/discovery/discovery.json",
    service: "rostering",
    fetch: harness.fetch,
  });
}

describe("OneRoster 1.2 discovery", () => {
  it("parses a minimal localized OpenAPI capability subset", async () => {
    const result = await readValidDiscovery();
    expect(result).toMatchObject({
      _tag: "ok",
      value: {
        service: "rostering",
        title: "Test rostering service",
        version: "1.2",
        tokenEndpoint: "https://auth.example.test/oauth/token",
        operations: [
          {
            operationId: "getAllUsers",
            knownOperationId: "getAllUsers",
            method: "GET",
            path: "/users",
            responseContentTypes: ["application/json"],
          },
        ],
      },
    });
  });

  it("builds either published filename convention only when selected explicitly", () => {
    const binding = buildOneRosterV1p2DiscoveryUrl({
      origin: "https://sis.example",
      service: "rostering",
      convention: "binding",
    });
    const conformance = buildOneRosterV1p2DiscoveryUrl({
      origin: "https://sis.example/tenant",
      service: "gradebook",
      convention: "conformance",
    });
    const exact = buildOneRosterV1p2DiscoveryUrl({
      origin: "https://sis.example",
      service: "resources",
      filename: "partner_openapi.json",
    });
    expect(binding).toEqual({
      _tag: "ok",
      value:
        "https://sis.example/ims/oneroster/rostering/v1p2/discovery/onerosterv1p2rostersservice_openapi3_v1p0.json",
    });
    expect(conformance).toEqual({
      _tag: "ok",
      value:
        "https://sis.example/tenant/ims/oneroster/gradebook/v1p2/discovery/imsorv1p2_gradebook_openapi3_v1p0.json",
    });
    expect(exact).toEqual({
      _tag: "ok",
      value: "https://sis.example/ims/oneroster/resources/v1p2/discovery/partner_openapi.json",
    });
  });

  it("returns typed failures for version, service, OAuth, cancellation, and network problems", async () => {
    const wrongVersion = createOneRosterV1p2DiscoveryDocument();
    wrongVersion["openapi"] = "2.0.0";
    await expect(readValidDiscovery(wrongVersion)).resolves.toMatchObject({
      _tag: "err",
      error: { code: "invalid_document" },
    });

    const wrongService = createOneRosterV1p2DiscoveryDocument("gradebook");
    const wrongServiceHarness = new OneRosterV1p2FetchHarness([
      new Response(JSON.stringify(wrongService), { status: 200 }),
    ]);
    await expect(
      readOneRosterV1p2Discovery({
        discoveryUrl: "https://sis.example/discovery.json",
        service: "rostering",
        fetch: wrongServiceHarness.fetch,
      }),
    ).resolves.toMatchObject({ _tag: "err", error: { code: "wrong_service" } });

    const malformedSecurity = createOneRosterV1p2DiscoveryDocument();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the hand-authored fixture has the known OpenAPI object shape.
    const components = malformedSecurity["components"] as Record<string, unknown>;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the hand-authored fixture has the known OpenAPI object shape.
    const schemes = components["securitySchemes"] as Record<string, unknown>;
    schemes["OAuth2CC"] = { type: "apiKey" };
    await expect(readValidDiscovery(malformedSecurity)).resolves.toMatchObject({
      _tag: "err",
      error: { code: "missing_oauth" },
    });

    const controller = new AbortController();
    controller.abort();
    const cancelled = await readOneRosterV1p2Discovery({
      discoveryUrl: "https://sis.example/discovery.json",
      service: "rostering",
      fetch: async () => new Response("{}"),
      signal: controller.signal,
    });
    expect(cancelled).toMatchObject({ _tag: "err", error: { code: "cancelled" } });

    const rejected = await readOneRosterV1p2Discovery({
      discoveryUrl: "https://sis.example/discovery.json",
      service: "rostering",
      fetch: async () => {
        throw new Error("untrusted network cause");
      },
    });
    expect(rejected).toMatchObject({ _tag: "err", error: { code: "network_failure" } });
    expect(JSON.stringify(rejected)).not.toContain("untrusted network cause");
  });

  it("retains proprietary operations as capabilities without registering them", async () => {
    const document = createOneRosterV1p2DiscoveryDocument();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the hand-authored fixture has the known OpenAPI object shape.
    const paths = document["paths"] as Record<string, unknown>;
    paths["/vendor/extensions"] = {
      get: {
        operationId: "vendorExtension",
        responses: { "200": { content: { "application/json": {} } } },
      },
    };
    const result = await readValidDiscovery(document);
    expect(result).toMatchObject({
      _tag: "ok",
      value: { operations: [{ operationId: "getAllUsers" }, { operationId: "vendorExtension" }] },
    });
  });

  it("reports missing required capabilities without rejecting valid subsets", async () => {
    const result = await readValidDiscovery();
    if (result._tag === "err") throw new Error("Expected valid discovery.");
    const report = checkOneRosterV1p2DiscoveryCapabilities(
      result.value,
      ["getUser"],
      ["missing.scope"],
    );
    expect(report).toEqual({
      _tag: "OneRosterV1p2CapabilityGapReport",
      missingOperationIds: ["getUser"],
      missingScopes: ["missing.scope"],
      extraOperationIds: ["getAllUsers"],
    });
  });

  it("does not retain an input document in the capability object", async () => {
    const document = createOneRosterV1p2DiscoveryDocument();
    const result = await readValidDiscovery(document);
    if (result._tag === "err") throw new Error("Expected valid discovery.");
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toContain("clientCredentials");
    expect(serialized).not.toContain("Test scope");
  });
});
