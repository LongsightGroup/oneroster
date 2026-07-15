import { err, ok, type Result } from "../../result.js";
import {
  getOneRosterV1p2ProviderOperationIds,
  type OneRosterV1p2ProviderServices,
} from "./service.js";
import {
  oneRosterV1p2BasePaths,
  oneRosterV1p2Operations,
  type OneRosterV1p2Operation,
  type OneRosterV1p2Service,
} from "../rest/operation.js";

/** Safe failure from localized provider discovery generation. */
export interface OneRosterV1p2ProviderDiscoveryError {
  readonly _tag: "OneRosterV1p2ProviderDiscoveryError";
  readonly code: "invalid_url" | "missing_operation" | "missing_scope";
}

/** Explicit host configuration for one localized OneRoster 1.2 OpenAPI document. */
export interface OneRosterV1p2ProviderDiscoveryOptions {
  readonly service: OneRosterV1p2Service;
  readonly publicServerUrl: string;
  readonly tokenUrl: string;
  readonly advertisedScopes: ReadonlyArray<string>;
  readonly services: OneRosterV1p2ProviderServices;
  readonly enabledOperationIds?: ReadonlyArray<string>;
  readonly title?: string;
  readonly version?: string;
}

/** Build a deterministic localized OpenAPI 3 document from true provider capabilities. */
export function buildOneRosterV1p2ProviderDiscoveryDocument(
  options: OneRosterV1p2ProviderDiscoveryOptions,
): Result<Readonly<Record<string, unknown>>, OneRosterV1p2ProviderDiscoveryError> {
  const serverUrl = serverUrlFor(options.publicServerUrl, options.service);
  if (serverUrl === undefined || !isHttpsUrl(options.tokenUrl))
    return err(discoveryError("invalid_url"));
  const implemented = new Set(getOneRosterV1p2ProviderOperationIds(options.services));
  const enabled =
    options.enabledOperationIds === undefined
      ? [...implemented]
      : [...new Set(options.enabledOperationIds)];
  if (enabled.some((operationId) => !implemented.has(operationId))) {
    return err(discoveryError("missing_operation"));
  }
  const advertisedScopes = new Set(options.advertisedScopes);
  const operations: Array<OneRosterV1p2Operation> = [];
  for (const operationId of enabled) {
    const operation = oneRosterV1p2Operations.find(
      (candidate) => candidate.operationId === operationId,
    );
    if (operation === undefined || operation.service !== options.service) {
      return err(discoveryError("missing_operation"));
    }
    operations.push(operation);
  }
  const sortedOperations = operations.toSorted((left, right) =>
    left.operationId.localeCompare(right.operationId),
  );
  if (
    operations.some((operation) =>
      operation.requiredScopes.some((scope) => !advertisedScopes.has(scope)),
    )
  ) {
    return err(discoveryError("missing_scope"));
  }
  const paths: Record<string, unknown> = {};
  for (const operation of sortedOperations) {
    const method = operation.method.toLowerCase();
    const responses: Record<string, unknown> = {};
    for (const status of operation.successStatuses) {
      responses[String(status)] = responseDefinition(operation.responseKind === "noContent");
    }
    const parameters = [
      ...operation.pathParameters.map((name) => ({
        name,
        in: "path",
        required: true,
        schema: { type: "string" },
      })),
      ...operation.allowedQuery.map((name) => ({
        name,
        in: "query",
        required: false,
        schema: { type: name === "limit" || name === "offset" ? "integer" : "string" },
      })),
    ];
    const pathOperation: Record<string, unknown> = {
      operationId: operation.operationId,
      responses,
      security: [{ OAuth2CC: operation.requiredScopes }],
      ...(parameters.length === 0 ? {} : { parameters }),
      ...(operation.requestCodec === undefined ? {} : { requestBody: requestBodyDefinition() }),
    };
    const existingPathValue = paths[operation.path];
    const existingPath = isRecord(existingPathValue) ? existingPathValue : {};
    paths[operation.path] = {
      ...existingPath,
      [method]: pathOperation,
    };
  }
  return ok({
    openapi: "3.0.3",
    info: {
      title: options.title ?? `OneRoster 1.2 ${capitalize(options.service)} Service Provider`,
      version: options.version ?? "1.2",
    },
    servers: [{ url: serverUrl }],
    security: [{ OAuth2CC: [...advertisedScopes].toSorted() }],
    paths,
    components: {
      securitySchemes: {
        OAuth2CC: {
          type: "oauth2",
          flows: {
            clientCredentials: {
              tokenUrl: options.tokenUrl,
              scopes: Object.fromEntries(
                [...advertisedScopes].toSorted().map((scope) => [scope, scope]),
              ),
            },
          },
        },
      },
    },
  });
}

function responseDefinition(noContent: boolean): Readonly<Record<string, unknown>> {
  return noContent
    ? { description: "Successful operation." }
    : {
        description: "Successful operation.",
        content: { "application/json": { schema: { type: "object" } } },
      };
}

function requestBodyDefinition(): Readonly<Record<string, unknown>> {
  return {
    required: true,
    content: { "application/json": { schema: { type: "object" } } },
  };
}

function serverUrlFor(origin: string, service: OneRosterV1p2Service): string | undefined {
  if (!isHttpsUrl(origin)) return undefined;
  const url = new URL(origin);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${oneRosterV1p2BasePaths[service]}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch (cause: unknown) {
    void cause;
    return false;
  }
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function discoveryError(
  code: OneRosterV1p2ProviderDiscoveryError["code"],
): OneRosterV1p2ProviderDiscoveryError {
  return { _tag: "OneRosterV1p2ProviderDiscoveryError", code };
}
