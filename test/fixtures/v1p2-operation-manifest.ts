import {
  oneRosterV1p2Operations,
  type OneRosterV1p2Operation,
  type OneRosterV1p2Service,
} from "../../src/v1p2/index.js";

/** Hand-reviewed official 1EdTech OpenAPI source and document facts. */
export interface OneRosterV1p2NormativeDocument {
  readonly service: OneRosterV1p2Service;
  readonly profile: "base" | "assessment-results";
  readonly url: string;
  readonly revisionDate: "2022-09-19";
  readonly version: "1.2" | "1.0";
}

/** Pinned official OpenAPI inputs used by the optional live parity command. */
export const oneRosterV1p2NormativeDocuments: ReadonlyArray<OneRosterV1p2NormativeDocument> = [
  {
    service: "rostering",
    profile: "base",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2rostersservice_openapi3_v1p0.json",
    revisionDate: "2022-09-19",
    version: "1.2",
  },
  {
    service: "gradebook",
    profile: "base",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json",
    revisionDate: "2022-09-19",
    version: "1.2",
  },
  {
    service: "gradebook",
    profile: "assessment-results",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/assessmentresultv1p0service_openapi3_v1p0.json",
    revisionDate: "2022-09-19",
    version: "1.0",
  },
  {
    service: "resources",
    profile: "base",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2resourcesservice_openapi3_v1p0.json",
    revisionDate: "2022-09-19",
    version: "1.2",
  },
];

/** The published discovery filename contradiction is explicit and never a runtime fallback. */
export const oneRosterV1p2DiscoveryFilenameIssue = {
  binding: "onerosterv1p2{service}service_openapi3_v1p0.json",
  conformance: "imsorv1p2_{service}_openapi3_v1p0.json",
  resolution: "Callers choose one exact discovery URL or documented naming convention.",
} as const;

/** A reviewable operation fact row used by deterministic parity tests. */
export interface OneRosterV1p2OperationManifestEntry {
  readonly service: OneRosterV1p2Service;
  readonly profile: "base" | "assessment-results";
  readonly operationId: string;
  readonly method: OneRosterV1p2Operation["method"];
  readonly path: string;
  readonly scopes: ReadonlyArray<string>;
  readonly queryCategories: ReadonlyArray<OneRosterV1p2Operation["allowedQuery"][number]>;
  readonly responseKind: OneRosterV1p2Operation["responseKind"];
  readonly responseCodec: string;
}

/** Complete local operation fact table paired to its pinned normative source. */
export const oneRosterV1p2OperationManifest: ReadonlyArray<OneRosterV1p2OperationManifestEntry> =
  oneRosterV1p2Operations.map((operation) => ({
    service: operation.service,
    profile: operation.operationId.includes("Assessment") ? "assessment-results" : "base",
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    scopes: operation.requiredScopes,
    queryCategories: operation.allowedQuery,
    responseKind: operation.responseKind,
    responseCodec: operation.responseCodec,
  }));
