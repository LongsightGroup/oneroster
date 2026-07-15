import { err, ok, type Result } from "../../result.js";
import type { OneRosterV1p2Fetch } from "./client-configuration.js";
import {
  findOneRosterV1p2Operation,
  oneRosterV1p2BasePaths,
  type OneRosterV1p2OperationMethod,
  type OneRosterV1p2Service,
} from "./operation.js";

/** HTTP methods represented by an OpenAPI operation capability. */
export type OneRosterV1p2DiscoveryOperationMethod =
  | OneRosterV1p2OperationMethod
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "TRACE";

/** A minimal operation capability retained from a localized OpenAPI document. */
export interface OneRosterV1p2DiscoveryOperation {
  readonly operationId: string;
  readonly method: OneRosterV1p2DiscoveryOperationMethod;
  readonly path: string;
  readonly knownOperationId?: string;
  readonly responseContentTypes: ReadonlyArray<string>;
  readonly scopes: ReadonlyArray<string>;
}

/** Minimal immutable OneRoster service capabilities from OpenAPI discovery. */
export interface OneRosterV1p2DiscoveryCapabilities {
  readonly _tag: "OneRosterV1p2DiscoveryCapabilities";
  readonly service: OneRosterV1p2Service;
  readonly title: string;
  readonly version: string;
  readonly serverBaseUrls: ReadonlyArray<string>;
  readonly operations: ReadonlyArray<OneRosterV1p2DiscoveryOperation>;
  readonly tokenEndpoint: string;
  readonly scopes: ReadonlyArray<string>;
}

/** The two published OneRoster 1.2 discovery filename conventions. */
export type OneRosterV1p2DiscoveryNamingConvention = "binding" | "conformance";

/** Safe discovery-reader failures that never retain source JSON or response bodies. */
export interface OneRosterV1p2DiscoveryError {
  readonly _tag: "OneRosterV1p2DiscoveryError";
  readonly code:
    | "invalid_url"
    | "cancelled"
    | "network_failure"
    | "http_failure"
    | "malformed_json"
    | "invalid_document"
    | "wrong_service"
    | "missing_oauth";
  readonly status?: number;
  readonly message: string;
}

/** Inputs for the primary explicit discovery URL integration path. */
export interface OneRosterV1p2DiscoveryReadOptions {
  readonly discoveryUrl: string;
  readonly service: OneRosterV1p2Service;
  readonly fetch: OneRosterV1p2Fetch;
  readonly signal?: AbortSignal;
}

/** Build a discovery URL using a documented filename convention, without fallback probing. */
export interface OneRosterV1p2DiscoveryConventionUrlInput {
  readonly origin: string;
  readonly service: OneRosterV1p2Service;
  readonly convention: OneRosterV1p2DiscoveryNamingConvention;
}

/** Build a discovery URL using an exact caller-supplied filename. */
export interface OneRosterV1p2DiscoveryExactFilenameUrlInput {
  readonly origin: string;
  readonly service: OneRosterV1p2Service;
  readonly filename: string;
}

/** A URL-builder input with an explicit naming choice. */
export type OneRosterV1p2DiscoveryUrlInput =
  | OneRosterV1p2DiscoveryConventionUrlInput
  | OneRosterV1p2DiscoveryExactFilenameUrlInput;

const bindingFileNames: Readonly<Record<OneRosterV1p2Service, string>> = {
  // OR 1.2 REST binding documents, section 2.5 Service Discovery.
  rostering: "onerosterv1p2rostersservice_openapi3_v1p0.json",
  gradebook: "onerosterv1p2gradebookservice_openapi3_v1p0.json",
  resources: "onerosterv1p2resourcesservice_openapi3_v1p0.json",
};

const conformanceFileNames: Readonly<Record<OneRosterV1p2Service, string>> = {
  // OR 1.2 Conformance and Certification Guide, localized discovery filenames.
  rostering: "imsorv1p2_rostering_openapi3_v1p0.json",
  gradebook: "imsorv1p2_gradebook_openapi3_v1p0.json",
  resources: "imsorv1p2_resources_openapi3_v1p0.json",
};

/**
 * Build the exact localized discovery URL. The caller must choose a filename
 * convention because the binding and conformance documents publish different
 * names; this function never probes or falls back to another convention.
 */
export function buildOneRosterV1p2DiscoveryUrl(
  input: OneRosterV1p2DiscoveryUrlInput,
): Result<string, OneRosterV1p2DiscoveryError> {
  if (!isOrigin(input.origin)) return err(discoveryError("invalid_url"));
  const filename =
    "convention" in input ? fileNameFor(input.service, input.convention) : input.filename;
  if (filename === undefined || !isSafeDiscoveryFileName(filename)) {
    return err(discoveryError("invalid_url"));
  }
  const url = new URL(input.origin);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${oneRosterV1p2BasePaths[input.service]}/discovery/${filename}`;
  url.search = "";
  url.hash = "";
  return ok(url.toString());
}

/** Read and validate a localized OpenAPI 3 OneRoster service discovery document. */
export async function readOneRosterV1p2Discovery(
  options: OneRosterV1p2DiscoveryReadOptions,
): Promise<Result<OneRosterV1p2DiscoveryCapabilities, OneRosterV1p2DiscoveryError>> {
  if (!isHttpsUrl(options.discoveryUrl) || typeof options.fetch !== "function") {
    return err(discoveryError("invalid_url"));
  }
  const signal = options.signal;
  if (signal?.aborted) return err(discoveryError("cancelled"));

  let response: Response;
  try {
    response = await options.fetch(
      options.discoveryUrl,
      signal === undefined ? undefined : { signal },
    );
  } catch (cause: unknown) {
    if (signal?.aborted || isAbortCause(cause)) return err(discoveryError("cancelled"));
    return err(discoveryError("network_failure"));
  }
  if (!response.ok) {
    return {
      _tag: "err",
      error: {
        ...discoveryError("http_failure"),
        status: response.status,
      },
    };
  }

  let text: string;
  try {
    text = await response.text();
  } catch (cause: unknown) {
    if (signal?.aborted || isAbortCause(cause)) return err(discoveryError("cancelled"));
    return err(discoveryError("network_failure"));
  }
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (cause: unknown) {
    void cause;
    return err(discoveryError("malformed_json"));
  }
  return parseDiscoveryDocument(document, options.service);
}

/** Report capability gaps without mutating transport configuration. */
export interface OneRosterV1p2CapabilityGapReport {
  readonly _tag: "OneRosterV1p2CapabilityGapReport";
  readonly missingOperationIds: ReadonlyArray<string>;
  readonly missingScopes: ReadonlyArray<string>;
  readonly extraOperationIds: ReadonlyArray<string>;
}

/** Compare required operations/scopes against one discovered service subset. */
export function checkOneRosterV1p2DiscoveryCapabilities(
  capabilities: OneRosterV1p2DiscoveryCapabilities,
  requiredOperationIds: ReadonlyArray<string>,
  requiredScopes: ReadonlyArray<string>,
): OneRosterV1p2CapabilityGapReport {
  const operationIds = new Set(capabilities.operations.map((operation) => operation.operationId));
  const scopes = new Set(capabilities.scopes);
  const requiredOperations = uniqueSorted(requiredOperationIds);
  const requiredScopeValues = uniqueSorted(requiredScopes);
  const discoveredOperationIds = uniqueSorted(
    capabilities.operations.map((operation) => operation.operationId),
  );
  return {
    _tag: "OneRosterV1p2CapabilityGapReport",
    missingOperationIds: requiredOperations.filter((operationId) => !operationIds.has(operationId)),
    missingScopes: requiredScopeValues.filter((scope) => !scopes.has(scope)),
    extraOperationIds: discoveredOperationIds.filter(
      (operationId) => !requiredOperations.includes(operationId),
    ),
  };
}

function parseDiscoveryDocument(
  input: unknown,
  service: OneRosterV1p2Service,
): Result<OneRosterV1p2DiscoveryCapabilities, OneRosterV1p2DiscoveryError> {
  const document = asRecord(input);
  if (
    document === undefined ||
    typeof document["openapi"] !== "string" ||
    !document["openapi"].startsWith("3.")
  ) {
    return err(discoveryError("invalid_document"));
  }
  const info = asRecord(document["info"]);
  const title = info?.["title"];
  const version = info?.["version"];
  if (
    typeof title !== "string" ||
    title.length === 0 ||
    typeof version !== "string" ||
    version.length === 0
  ) {
    return err(discoveryError("invalid_document"));
  }
  const servers = parseServers(document["servers"], service);
  if (servers === undefined) return err(discoveryError("wrong_service"));
  const oauth = parseOAuth(document);
  if (oauth === undefined) return err(discoveryError("missing_oauth"));
  const operations = parseOperations(document["paths"], document["security"], oauth.schemeNames);
  if (operations === undefined) return err(discoveryError("invalid_document"));
  return ok({
    _tag: "OneRosterV1p2DiscoveryCapabilities",
    service,
    title,
    version,
    serverBaseUrls: servers,
    operations,
    tokenEndpoint: oauth.tokenEndpoint,
    scopes: oauth.scopes,
  });
}

function parseServers(
  input: unknown,
  service: OneRosterV1p2Service,
): ReadonlyArray<string> | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const expectedRoot = oneRosterV1p2BasePaths[service];
  const result: Array<string> = [];
  for (const serverValue of input) {
    const server = asRecord(serverValue);
    if (server === undefined || typeof server["url"] !== "string" || !isServerUrl(server["url"])) {
      return undefined;
    }
    if (!serverContainsRoot(server, expectedRoot)) return undefined;
    result.push(server["url"]);
  }
  return result;
}

function parseOAuth(document: Readonly<Record<string, unknown>>):
  | {
      readonly tokenEndpoint: string;
      readonly scopes: ReadonlyArray<string>;
      readonly schemeNames: ReadonlySet<string>;
    }
  | undefined {
  const components = asRecord(document["components"]);
  const securitySchemes = asRecord(components?.["securitySchemes"]);
  if (securitySchemes === undefined) return undefined;
  const schemeNames = new Set<string>();
  let tokenEndpoint: string | undefined;
  let scopes: ReadonlyArray<string> | undefined;
  for (const [name, value] of Object.entries(securitySchemes)) {
    const scheme = asRecord(value);
    const flows = asRecord(scheme?.["flows"]);
    const clientCredentials = asRecord(flows?.["clientCredentials"]);
    const rawScopes = asRecord(clientCredentials?.["scopes"]);
    if (
      scheme?.["type"] !== "oauth2" ||
      typeof clientCredentials?.["tokenUrl"] !== "string" ||
      !isHttpsUrl(clientCredentials["tokenUrl"]) ||
      rawScopes === undefined ||
      !Object.values(rawScopes).every((scope) => typeof scope === "string")
    ) {
      continue;
    }
    schemeNames.add(name);
    tokenEndpoint = clientCredentials["tokenUrl"];
    scopes = Object.keys(rawScopes).toSorted();
    break;
  }
  if (tokenEndpoint === undefined || scopes === undefined || schemeNames.size === 0)
    return undefined;
  return { tokenEndpoint, scopes, schemeNames };
}

function parseOperations(
  input: unknown,
  globalSecurity: unknown,
  oauthSchemeNames: ReadonlySet<string>,
): ReadonlyArray<OneRosterV1p2DiscoveryOperation> | undefined {
  const paths = asRecord(input);
  if (paths === undefined) return undefined;
  const result: Array<OneRosterV1p2DiscoveryOperation> = [];
  for (const [path, pathItemValue] of Object.entries(paths)) {
    const pathItem = asRecord(pathItemValue);
    if (pathItem === undefined || !path.startsWith("/")) return undefined;
    for (const [methodName, operationValue] of Object.entries(pathItem)) {
      if (
        methodName === "$ref" ||
        methodName === "parameters" ||
        methodName === "summary" ||
        methodName === "description" ||
        methodName === "servers" ||
        methodName.startsWith("x-")
      )
        continue;
      const method = discoveryMethod(methodName);
      if (method === undefined) return undefined;
      const operation = asRecord(operationValue);
      if (
        operation === undefined ||
        typeof operation["operationId"] !== "string" ||
        operation["operationId"].length === 0
      ) {
        return undefined;
      }
      const known = findOneRosterV1p2Operation(operation["operationId"]);
      if (known !== undefined && (known.method !== method || known.path !== path)) return undefined;
      result.push({
        operationId: operation["operationId"],
        method,
        path,
        ...(known === undefined ? {} : { knownOperationId: known.operationId }),
        responseContentTypes: parseResponseContentTypes(operation["responses"]),
        scopes: parseOperationScopes(operation["security"] ?? globalSecurity, oauthSchemeNames),
      });
    }
  }
  return result;
}

function parseResponseContentTypes(input: unknown): ReadonlyArray<string> {
  const responses = asRecord(input);
  if (responses === undefined) return [];
  const contentTypes = new Set<string>();
  for (const responseValue of Object.values(responses)) {
    const response = asRecord(responseValue);
    const content = asRecord(response?.["content"]);
    if (content === undefined) continue;
    for (const contentType of Object.keys(content)) contentTypes.add(contentType);
  }
  return [...contentTypes].toSorted();
}

function parseOperationScopes(
  input: unknown,
  oauthSchemeNames: ReadonlySet<string>,
): ReadonlyArray<string> {
  if (!Array.isArray(input)) return [];
  const scopes = new Set<string>();
  for (const requirementValue of input) {
    const requirement = asRecord(requirementValue);
    if (requirement === undefined) continue;
    for (const schemeName of oauthSchemeNames) {
      const values = requirement[schemeName];
      if (!Array.isArray(values)) continue;
      for (const scope of values) if (typeof scope === "string") scopes.add(scope);
    }
  }
  return [...scopes].toSorted();
}

function fileNameFor(
  service: OneRosterV1p2Service,
  convention: OneRosterV1p2DiscoveryNamingConvention,
): string {
  return convention === "binding" ? bindingFileNames[service] : conformanceFileNames[service];
}

function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function isServerUrl(value: string): boolean {
  if (value.includes(" ")) return false;
  const substituted = value.replace(/\{[^}]+\}/g, "example.invalid");
  return isHttpsUrl(substituted);
}

function serverContainsRoot(
  server: Readonly<Record<string, unknown>>,
  expectedRoot: string,
): boolean {
  const url = server["url"];
  if (typeof url !== "string") return false;
  if (url.includes(expectedRoot)) return true;
  const variables = asRecord(server["variables"]);
  if (variables === undefined) return false;
  return Object.values(variables).some((value) => {
    const variable = asRecord(value);
    const candidates = [
      variable?.["default"],
      ...(Array.isArray(variable?.["enum"]) ? variable["enum"] : []),
    ];
    return candidates.some((candidate) => candidate === expectedRoot);
  });
}

function discoveryMethod(value: string): OneRosterV1p2DiscoveryOperationMethod | undefined {
  switch (value.toUpperCase()) {
    case "GET":
      return "GET";
    case "POST":
      return "POST";
    case "PUT":
      return "PUT";
    case "DELETE":
      return "DELETE";
    case "HEAD":
      return "HEAD";
    case "OPTIONS":
      return "OPTIONS";
    case "PATCH":
      return "PATCH";
    case "TRACE":
      return "TRACE";
    default:
      return undefined;
  }
}

function asRecord(input: unknown): Readonly<Record<string, unknown>> | undefined {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return undefined;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the guard establishes a non-array object boundary for unknown JSON.
  return input as Readonly<Record<string, unknown>>;
}

function uniqueSorted(values: ReadonlyArray<string>): Array<string> {
  return [...new Set(values)].toSorted();
}

function isSafeDiscoveryFileName(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._-]+\.json$/.test(value);
}

function discoveryError(code: OneRosterV1p2DiscoveryError["code"]): OneRosterV1p2DiscoveryError {
  const messages: Readonly<Record<OneRosterV1p2DiscoveryError["code"], string>> = {
    invalid_url: "The OneRoster discovery URL is invalid.",
    cancelled: "The OneRoster discovery request was cancelled.",
    network_failure: "The OneRoster discovery request could not be completed.",
    http_failure: "The OneRoster discovery endpoint returned a non-success HTTP status.",
    malformed_json: "The OneRoster discovery response was not valid JSON.",
    invalid_document: "The OneRoster discovery document is not a supported OpenAPI 3 document.",
    wrong_service: "The OneRoster discovery document does not identify the selected service root.",
    missing_oauth: "The OneRoster discovery document does not declare OAuth 2 client credentials.",
  };
  return { _tag: "OneRosterV1p2DiscoveryError", code, message: messages[code] };
}

function isAbortCause(cause: unknown): boolean {
  return (
    typeof cause === "object" && cause !== null && "name" in cause && cause.name === "AbortError"
  );
}
