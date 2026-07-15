const { createOneRosterV1p1OAuth1Authorizer, createOneRosterV1p1RosteringClient } = await import(
  new URL("../dist/v1p1/index.js", import.meta.url)
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
let requestedUrl = "";
let authorization = "";
const authorizer = createOneRosterV1p1OAuth1Authorizer({
  credentials: { consumerKey: "portable-consumer", consumerSecret: "portable-secret" },
  nonce: () => "portable-nonce",
  clock: () => 1_700_000_000,
});
assert(authorizer._tag === "ok", "OAuth 1.0a authorizer construction failed");
const clientResult = createOneRosterV1p1RosteringClient({
  baseUrl: "https://provider.example/ims/oneroster/v1p1",
  authorizer: authorizer.value,
  fetch: async (input, init) => {
    requestedUrl =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ courses: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});
assert(clientResult._tag === "ok", "client construction failed");
const result = await clientResult.value.getAllCourses({ query: { limit: 1 } });
assert(result._tag === "ok", "client response failed");
assert(result.value.limit === 1, "query serialization failed");
assert(
  requestedUrl === "https://provider.example/ims/oneroster/v1p1/courses?limit=1",
  "request URL failed",
);
assert(authorization.startsWith("OAuth "), "OAuth 1.0a authorization failed");
// oxlint-disable-next-line eslint/no-console -- SAFETY: this dev-only runtime lane reports its result.
console.log("OneRoster 1.1 Node/Deno Web API portability passed.");
