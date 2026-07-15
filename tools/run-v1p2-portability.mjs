const {
  createOneRosterV1p2AccessToken,
  createOneRosterV1p2ProviderRouter,
  createOneRosterV1p2ResourcesClient,
} = await import(new URL("../dist/v1p2/index.js", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const token = createOneRosterV1p2AccessToken("portability-token");
assert(token._tag === "ok", "token construction failed");
let fetchCalls = 0;
let requestedUrl = "";
const client = createOneRosterV1p2ResourcesClient({
  serviceBaseUrls: { resources: "https://sis.example/ims/oneroster/resources/v1p2" },
  accessTokenProvider: async () => token,
  fetch: async (input) => {
    fetchCalls += 1;
    requestedUrl = typeof input === "string" ? input : input.url;
    return new Response(
      JSON.stringify({
        resources: [
          {
            sourcedId: "resource-example",
            status: "active",
            dateLastModified: "2025-01-01T00:00:00Z",
            vendorResourceId: "vendor-example",
            title: "Example",
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  },
});
assert(client._tag === "ok", "client construction failed");
const page = await client.value.getAllResources({ query: { fields: ["title"] } });
assert(page._tag === "ok" && page.value.items[0]?.title === "Example", "client response failed");
assert(requestedUrl.includes("fields=title"), "query serialization failed");

const controller = new AbortController();
controller.abort();
const cancelled = await client.value.getAllResources({ signal: controller.signal });
assert(
  cancelled._tag === "err" && cancelled.error._tag === "OneRosterV1p2CancellationError",
  "abort failed",
);
assert(fetchCalls === 1, "abort invoked fetch");

const router = createOneRosterV1p2ProviderRouter({
  services: {
    resources: {
      getAllResources: async () => ({
        _tag: "ok",
        value: { kind: "collection", page: { items: [], limit: 20, offset: 0 } },
      }),
    },
  },
  authorize: async () => ({ _tag: "ok", value: { subject: "portable-principal", scopes: [] } }),
});
assert(router._tag === "ok", "router construction failed");
const response = await router.value.handle(
  new Request("https://api.example/ims/oneroster/resources/v1p2/resources"),
);
assert(response.status === 200, "provider response failed");
const body = await response.json();
assert(Array.isArray(body.resources) && body.resources.length === 0, "provider JSON failed");

// oxlint-disable-next-line eslint/no-console -- SAFETY: this dev-only runtime lane reports its result.
console.log("Node/Deno Web API portability passed.");
