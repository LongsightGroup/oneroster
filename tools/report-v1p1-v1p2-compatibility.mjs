/* oxlint-disable import/no-nodejs-modules, eslint/no-console */
import assert from "node:assert/strict";

const v1p1 = await import("../dist/v1p1/index.js");
const v1p2 = await import("../dist/v1p2/index.js");

const differences = [
  {
    area: "service root",
    classification: "version-specific",
    v1p1: "/ims/oneroster/v1p1",
    v1p2: "/ims/oneroster/{rostering|gradebook|resources}/v1p2",
  },
  {
    area: "transport security",
    classification: "version-specific",
    v1p1: "TLS with a required injected authorizer; optional OAuth 1.0a HMAC-SHA1 helper available",
    v1p2: "TLS with OAuth 2 bearer authorization; client-credentials helper available",
  },
  {
    area: "request authorization ownership",
    classification: "version-specific",
    v1p1: "request authorizer is required and receives the complete Request; the optional OAuth 1.0a helper implements this seam",
    v1p2: "access-token provider is required and the transport emits Bearer headers",
  },
  {
    area: "collection query grammar",
    classification: "shared",
    v1p1: "limit, offset, sort, orderBy, filter, fields; quoted filter values",
    v1p2: "limit, offset, sort, orderBy, filter, fields; quoted filter values",
  },
  {
    area: "pagination defaults",
    classification: "version-specific",
    v1p1: "limit defaults to 100 and offset to 0",
    v1p2: "limit defaults to 100 and offset to 0",
  },
  {
    area: "Rostering operation paths",
    classification: "version-specific",
    v1p1: "all service calls use the combined root and v1.1 path parameters",
    v1p2: "service-specific roots and v1.2 path parameter names",
  },
  {
    area: "User model",
    classification: "version-specific",
    v1p1: "singular role plus plural orgs",
    v1p2: "roles array with roleType and primaryOrg/reference additions",
  },
  {
    area: "Gradebook model",
    classification: "version-specific",
    v1p1: "lineItem requires gradingPeriod/result bounds; Result requires numeric score",
    v1p2: "additional academicSession, scoreScale, textScore, and assessment-alignment fields",
  },
  {
    area: "Gradebook writes",
    classification: "shared",
    v1p1: "PUT create/replace and DELETE for Category, LineItem, Result",
    v1p2: "PUT/POST create/replace and DELETE variants for Gradebook resources",
  },
  {
    area: "Resources",
    classification: "version-specific",
    v1p1: "four published operations; user-resource relationship is absent",
    v1p2: "five published operations, including getResourcesForUser",
  },
  {
    area: "Assessment Results Profile",
    classification: "unsupported",
    v1p1: "not defined by the v1.1 standard",
    v1p2: "explicit ARP operations are exposed from the v1.2 Gradebook client",
  },
  {
    area: "OAuth 1.0a signing",
    classification: "version-specific",
    v1p1: "optional createOneRosterV1p1OAuth1Authorizer configuration path; injected authorizer remains canonical",
    v1p2: "not applicable; OAuth 2 client credentials is the explicit binding path",
  },
  {
    area: "Focus/HCPS vendor behavior",
    classification: "vendor verification",
    v1p1: "no proprietary endpoints or claims; requires authorized contract/sandbox validation",
    v1p2: "no proprietary endpoints or claims; requires authorized contract/sandbox validation",
  },
];

assert.equal(v1p1.oneRosterV1p1BasePath, "/ims/oneroster/v1p1");
assert.equal(v1p1.oneRosterV1p1Operations.length, 61);
assert.equal(typeof v1p1.createOneRosterV1p1OAuth1Authorizer, "function");
assert.equal(new Set(v1p1.oneRosterV1p1Operations.map(({ operationId }) => operationId)).size, 61);
assert.ok(v1p2.oneRosterV1p2Operations.length > v1p1.oneRosterV1p1Operations.length);
assert.equal(
  differences.filter(({ classification }) => classification === "unclassified").length,
  0,
);

console.log(
  `OneRoster v1.1/v1.2 compatibility report passed: ${differences.length} classified differences.`,
);
for (const difference of differences) {
  console.log(`${difference.classification}: ${difference.area}`);
}
