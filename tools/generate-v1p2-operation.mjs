/* oxlint-disable import/no-nodejs-modules, eslint/no-console, no-await-in-loop, typescript/require-array-sort-compare */
import { mkdir, readFile, writeFile } from "node:fs/promises";

const documents = [
  {
    service: "rostering",
    providerKind: "rostering",
    file: "rostering.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2rostersservice_openapi3_v1p0.json",
  },
  {
    service: "gradebook",
    providerKind: "gradebook",
    file: "gradebook.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json",
  },
  {
    service: "gradebook",
    providerKind: "assessmentResults",
    file: "assessment-results.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/assessmentresultv1p0service_openapi3_v1p0.json",
  },
  {
    service: "resources",
    providerKind: "resources",
    file: "resources.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2resourcesservice_openapi3_v1p0.json",
  },
];

const queryCategories = ["limit", "offset", "sort", "orderBy", "filter", "fields"];
const specsDirectory = new URL("../.specs/oneroster-v1p2/", import.meta.url);
const outputFile = new URL("../src/v1p2/rest/operation.generated.ts", import.meta.url);
const payloadOutputFile = new URL("../src/v1p2/rest/payload.generated.ts", import.meta.url);
const refresh = process.argv.includes("--refresh");

const payloadDefinitions = {
  academicSession: {
    typeName: "OneRosterV1p2AcademicSession",
    parserName: "parseOneRosterV1p2AcademicSession",
    module: "../model/rostering.js",
    collectionProperty: "academicSessions",
    singletonProperty: "academicSession",
  },
  assessmentLineItem: {
    typeName: "OneRosterV1p2AssessmentLineItem",
    parserName: "parseOneRosterV1p2AssessmentLineItem",
    module: "../assessment-results/model.js",
    collectionProperty: "assessmentLineItems",
    singletonProperty: "assessmentLineItem",
  },
  assessmentResult: {
    typeName: "OneRosterV1p2AssessmentResult",
    parserName: "parseOneRosterV1p2AssessmentResult",
    module: "../assessment-results/model.js",
    collectionProperty: "assessmentResults",
    singletonProperty: "assessmentResult",
  },
  category: {
    typeName: "OneRosterV1p2Category",
    parserName: "parseOneRosterV1p2Category",
    module: "../model/gradebook.js",
    collectionProperty: "categories",
    singletonProperty: "category",
  },
  class: {
    typeName: "OneRosterV1p2Class",
    parserName: "parseOneRosterV1p2Class",
    module: "../model/rostering.js",
    collectionProperty: "classes",
    singletonProperty: "class",
  },
  course: {
    typeName: "OneRosterV1p2Course",
    parserName: "parseOneRosterV1p2Course",
    module: "../model/rostering.js",
    collectionProperty: "courses",
    singletonProperty: "course",
  },
  demographics: {
    typeName: "OneRosterV1p2Demographics",
    parserName: "parseOneRosterV1p2Demographics",
    module: "../model/rostering.js",
    collectionProperty: "demographics",
    singletonProperty: "demographics",
  },
  enrollment: {
    typeName: "OneRosterV1p2Enrollment",
    parserName: "parseOneRosterV1p2Enrollment",
    module: "../model/rostering.js",
    collectionProperty: "enrollments",
    singletonProperty: "enrollment",
  },
  lineItem: {
    typeName: "OneRosterV1p2LineItem",
    parserName: "parseOneRosterV1p2LineItem",
    module: "../model/gradebook.js",
    collectionProperty: "lineItems",
    singletonProperty: "lineItem",
  },
  org: {
    typeName: "OneRosterV1p2Org",
    parserName: "parseOneRosterV1p2Org",
    module: "../model/rostering.js",
    collectionProperty: "orgs",
    singletonProperty: "org",
  },
  resource: {
    typeName: "OneRosterV1p2Resource",
    parserName: "parseOneRosterV1p2Resource",
    module: "../model/resources.js",
    collectionProperty: "resources",
    singletonProperty: "resource",
  },
  result: {
    typeName: "OneRosterV1p2Result",
    parserName: "parseOneRosterV1p2Result",
    module: "../model/gradebook.js",
    collectionProperty: "results",
    singletonProperty: "result",
  },
  scoreScale: {
    typeName: "OneRosterV1p2ScoreScale",
    parserName: "parseOneRosterV1p2ScoreScale",
    module: "../model/gradebook.js",
    collectionProperty: "scoreScales",
    singletonProperty: "scoreScale",
  },
  user: {
    typeName: "OneRosterV1p2User",
    parserName: "parseOneRosterV1p2User",
    module: "../model/rostering.js",
    collectionProperty: "users",
    singletonProperty: "user",
  },
};

await mkdir(specsDirectory, { recursive: true });

const operations = [];
const operationsById = new Map();
const basePaths = {};
for (const document of documents) {
  const specification = await loadSpecification(document);
  const basePath = specification.servers?.[0]?.variables?.basePath?.default;
  if (typeof basePath !== "string") {
    throw new Error(`${document.file}: OpenAPI document has no server basePath default.`);
  }
  if (basePaths[document.service] === undefined) basePaths[document.service] = basePath;

  for (const operation of readOfficialOperations(specification)) {
    const existing = operationsById.get(operation.operationId);
    if (existing !== undefined) {
      existing.providerKind = document.providerKind;
      continue;
    }

    const registryEntry = createRegistryEntry(document.service, document.providerKind, operation);
    operationsById.set(operation.operationId, registryEntry);
    operations.push(registryEntry);
  }
}

const queryGroups = uniqueGroups(operations, (operation) => operation.allowedQuery);
const scopeGroups = uniqueGroups(operations, (operation) => operation.requiredScopes);
const pathParametersType = operations
  .map(
    (operation) =>
      `  readonly ${operation.operationId}: [${operation.pathParameters
        .map((parameter) => `${parameter}: string`)
        .join(", ")}];`,
  )
  .join("\n");
const basePathType = Object.entries(basePaths)
  .map(([service, basePath]) => `  readonly ${service}: ${JSON.stringify(basePath)};`)
  .join("\n");
const operationData = operations.map((operation) => [
  operation.service,
  operation.operationId,
  operation.providerKind,
  operation.method,
  operation.path,
  operation.responseKind,
  groupKey(queryGroups, operation.allowedQuery),
  groupKey(scopeGroups, operation.requiredScopes),
  operation.successStatuses.join(","),
  operation.responseCodec,
  ...(operation.requestCodec === undefined ? [] : [operation.requestCodec]),
]);

const source = `// Generated by tools/generate-v1p2-operation.mjs. Do not edit.\n\n/** The three core services in the OneRoster 1.2 REST binding. */
export type OneRosterV1p2Service = "rostering" | "gradebook" | "resources";

/** Provider contract families represented in the generated operation registry. */
export type OneRosterV1p2ProviderOperationKind =
  | "rostering"
  | "gradebook"
  | "assessmentResults"
  | "resources";

/** HTTP methods used by the OneRoster 1.2 operation registry. */
export type OneRosterV1p2OperationMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Response families used by the registry and transport. */
export type OneRosterV1p2ResponseKind = "collection" | "singleton" | "write" | "noContent";

/** Query categories supported by the published collection binding. */
export type OneRosterV1p2QueryCategory =
  | "limit"
  | "offset"
  | "sort"
  | "orderBy"
  | "filter"
  | "fields";

/** Immutable metadata for one official OneRoster 1.2 service operation. */
export interface OneRosterV1p2Operation {
  readonly service: OneRosterV1p2Service;
  readonly operationId: string;
  readonly providerKind: OneRosterV1p2ProviderOperationKind;
  readonly method: OneRosterV1p2OperationMethod;
  readonly path: string;
  readonly pathParameters: ReadonlyArray<string>;
  readonly responseKind: OneRosterV1p2ResponseKind;
  readonly allowedQuery: ReadonlyArray<OneRosterV1p2QueryCategory>;
  readonly requiredScopes: ReadonlyArray<string>;
  readonly successStatuses: ReadonlyArray<number>;
  readonly responseCodec: string;
  readonly requestCodec?: string;
}

/** Base paths extracted from the published OpenAPI servers. */
export const oneRosterV1p2GeneratedBasePaths: Readonly<{
${basePathType}
}> = ${JSON.stringify(basePaths)};

/** Path-parameter tuples extracted from the published OpenAPI paths. */
export interface OneRosterV1p2GeneratedPathParameters {
${pathParametersType}
}

const queryGroups = ${JSON.stringify(queryGroups, null, 2)} as const;
const scopeGroups = ${JSON.stringify(scopeGroups, null, 2)} as const;

type GeneratedOperationData = readonly [
  service: OneRosterV1p2Service,
  operationId: string,
  providerKind: OneRosterV1p2ProviderOperationKind,
  method: OneRosterV1p2OperationMethod,
  path: string,
  responseKind: OneRosterV1p2ResponseKind,
  queryGroup: keyof typeof queryGroups,
  scopeGroup: keyof typeof scopeGroups,
  successStatuses: string,
  responseCodec: string,
  requestCodec?: string,
];

// oxfmt-ignore
const operationData = ${JSON.stringify(operationData)} as const satisfies ReadonlyArray<GeneratedOperationData>;

type OneRosterV1p2GeneratedOperationData = (typeof operationData)[number];

/** Exact generated operation ID for one OneRoster service. */
export type OneRosterV1p2GeneratedOperationId<TService extends OneRosterV1p2Service> =
  Extract<OneRosterV1p2GeneratedOperationData, readonly [TService, ...ReadonlyArray<unknown>]>[1];

/** Exact generated operation ID for one provider contract family. */
export type OneRosterV1p2GeneratedProviderOperationId<
  TKind extends OneRosterV1p2ProviderOperationKind,
> = Extract<
  OneRosterV1p2GeneratedOperationData,
  readonly [OneRosterV1p2Service, string, TKind, ...ReadonlyArray<unknown>]
>[1];

/** Official operation IDs projected from the generated operation registry. */
export const oneRosterV1p2GeneratedOperationIdsByService = {
  rostering: operationIdsForService("rostering"),
  gradebook: operationIdsForService("gradebook"),
  resources: operationIdsForService("resources"),
} as const;

/** Official operation IDs projected by provider contract family. */
export const oneRosterV1p2GeneratedOperationIdsByProviderKind = {
  rostering: operationIdsForProviderKind("rostering"),
  gradebook: operationIdsForProviderKind("gradebook"),
  assessmentResults: operationIdsForProviderKind("assessmentResults"),
  resources: operationIdsForProviderKind("resources"),
} as const;

/** Complete operation metadata extracted from the published OpenAPI documents. */
export const oneRosterV1p2GeneratedOperations: ReadonlyArray<OneRosterV1p2Operation> = operationData.map(
  createGeneratedOperation,
);

function operationIdsForService(
  service: "rostering",
): ReadonlyArray<OneRosterV1p2GeneratedOperationId<"rostering">>;
function operationIdsForService(
  service: "gradebook",
): ReadonlyArray<OneRosterV1p2GeneratedOperationId<"gradebook">>;
function operationIdsForService(
  service: "resources",
): ReadonlyArray<OneRosterV1p2GeneratedOperationId<"resources">>;
function operationIdsForService(
  service: OneRosterV1p2Service,
): ReadonlyArray<OneRosterV1p2GeneratedOperationId<OneRosterV1p2Service>> {
  return operationData
    .filter((operation) => operation[0] === service)
    .map((operation) => operation[1]);
}

function operationIdsForProviderKind(
  providerKind: "rostering",
): ReadonlyArray<OneRosterV1p2GeneratedProviderOperationId<"rostering">>;
function operationIdsForProviderKind(
  providerKind: "gradebook",
): ReadonlyArray<OneRosterV1p2GeneratedProviderOperationId<"gradebook">>;
function operationIdsForProviderKind(
  providerKind: "assessmentResults",
): ReadonlyArray<OneRosterV1p2GeneratedProviderOperationId<"assessmentResults">>;
function operationIdsForProviderKind(
  providerKind: "resources",
): ReadonlyArray<OneRosterV1p2GeneratedProviderOperationId<"resources">>;
function operationIdsForProviderKind(
  providerKind: OneRosterV1p2ProviderOperationKind,
): ReadonlyArray<
  OneRosterV1p2GeneratedProviderOperationId<OneRosterV1p2ProviderOperationKind>
> {
  return operationData
    .filter((operation) => operation[2] === providerKind)
    .map((operation) => operation[1]);
}

function createGeneratedOperation(
  [service, operationId, providerKind, method, path, responseKind, queryGroup, scopeGroup, successStatuses, responseCodec, requestCodec]: GeneratedOperationData,
): OneRosterV1p2Operation {
  const operation = {
    service,
    operationId,
    providerKind,
    method,
    path,
    pathParameters: pathParameters(path),
    responseKind,
    allowedQuery: queryGroups[queryGroup],
    requiredScopes: scopeGroups[scopeGroup],
    successStatuses: successStatuses.split(",").map(Number),
    responseCodec,
  } satisfies OneRosterV1p2Operation;
  return requestCodec === undefined ? operation : { ...operation, requestCodec };
}

function pathParameters(path: string): ReadonlyArray<string> {
  return Array.from(path.matchAll(/\\{([^}]+)\\}/g), (match) => match[1] ?? "");
}
`;

await writeFile(outputFile, source);
const payloadCodecs = operations
  .map((operation) => operation.responseCodec)
  .filter((codec) => codec.endsWith("Collection") || codec.endsWith("Singleton"))
  .filter((codec, index, values) => values.indexOf(codec) === index)
  .toSorted();
for (const codec of payloadCodecs) {
  const base = codec.endsWith("Collection")
    ? codec.slice(0, -"Collection".length)
    : codec.slice(0, -"Singleton".length);
  if (payloadDefinitions[base] === undefined) {
    throw new Error(`Missing payload generator definition for ${codec}.`);
  }
}
const payloadImports = payloadCodecs
  .map((codec) => {
    const base = codec.replace(/(Collection|Singleton)$/, "");
    const definition = payloadDefinitions[base];
    return `import { ${definition.parserName}, type ${definition.typeName} } from "${definition.module}";`;
  })
  .filter((line, index, values) => values.indexOf(line) === index)
  .join("\n");
const payloadWrappers = payloadCodecs
  .map((codec) => {
    const collection = codec.endsWith("Collection");
    const base = codec.slice(0, -(collection ? "Collection" : "Singleton").length);
    const definition = payloadDefinitions[base];
    const kind = collection ? "collection" : "singleton";
    const property = collection ? definition.collectionProperty : definition.singletonProperty;
    const functionName = `parseOneRosterV1p2${pascalCase(base)}${collection ? "Collection" : "Singleton"}`;
    const payloadType = `OneRosterV1p2${collection ? "Collection" : "Singleton"}Payload<${definition.typeName}, "${property}">`;
    const coreFunction = `parseOneRosterV1p2${pascalCase(kind)}At`;
    return `/** Parse the generated ${base} ${kind} response envelope. */
export function ${functionName}(
  input: unknown,
  path = "$",
): Result<${payloadType}, Diagnostics> {
  return ${coreFunction}(input, path, "${property}", ${definition.parserName});
}`;
  })
  .join("\n\n");
const requestCodecs = operations
  .map((operation) => operation.requestCodec)
  .filter((codec) => codec !== undefined)
  .filter((codec, index, values) => values.indexOf(codec) === index)
  .toSorted();
const requestParserEntries = requestCodecs
  .map((codec) => {
    const collection = codec.endsWith("Collection");
    const base = collection
      ? codec.slice(0, -"Collection".length)
      : pascalToCamel(codec.slice("single".length));
    if (payloadDefinitions[base] === undefined) {
      throw new Error(`Missing request payload generator definition for ${codec}.`);
    }
    const functionName = `parseOneRosterV1p2${pascalCase(base)}${collection ? "Collection" : "Singleton"}`;
    return `  ${codec}: ${functionName},`;
  })
  .join("\n");
const responseEnvelopeSerializerEntries = operations
  .filter(
    (operation) =>
      operation.responseKind === "collection" || operation.responseKind === "singleton",
  )
  .map((operation) => {
    const collection = operation.responseCodec.endsWith("Collection");
    const base = operation.responseCodec.slice(
      0,
      -(collection ? "Collection" : "Singleton").length,
    );
    const definition = payloadDefinitions[base];
    if (definition === undefined) {
      throw new Error(
        `Missing response envelope generator definition for ${operation.operationId}.`,
      );
    }
    const property = collection ? definition.collectionProperty : definition.singletonProperty;
    return `  ${operation.operationId}: (value) => ({ ${property}: value }),`;
  })
  .join("\n");
const payloadSource = `// Generated by tools/generate-v1p2-operation.mjs. Do not edit.

import type { Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import {
  parseOneRosterV1p2CollectionAt,
  parseOneRosterV1p2SingletonAt,
  type OneRosterV1p2CollectionPayload,
  type OneRosterV1p2SingletonPayload,
} from "./payload-core.js";
${payloadImports}

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

${payloadWrappers}

/** Runtime parser for one generated provider request payload codec. */
export type OneRosterV1p2GeneratedRequestPayloadParser = (
  input: unknown,
) => Result<unknown, Diagnostics>;

/** Request payload parsers projected from operation request-codec metadata. */
export const oneRosterV1p2GeneratedRequestPayloadParsers: Readonly<
  Record<string, OneRosterV1p2GeneratedRequestPayloadParser>
> = {
${requestParserEntries}
};

/** Runtime serializer for one generated operation's response envelope. */
export type OneRosterV1p2GeneratedResponseEnvelopeSerializer = (
  value: unknown,
) => Readonly<Record<string, unknown>>;

/** Exact operation-to-response-envelope serializers projected from OpenAPI payload metadata. */
export const oneRosterV1p2GeneratedResponseEnvelopeSerializers: Readonly<
  Record<string, OneRosterV1p2GeneratedResponseEnvelopeSerializer>
> = {
${responseEnvelopeSerializerEntries}
};
`;
await writeFile(payloadOutputFile, payloadSource);
console.log(`Generated ${operations.length} v1.2 operations at ${outputFile.pathname}`);
console.log(
  `Generated ${payloadCodecs.length} v1.2 payload codecs at ${payloadOutputFile.pathname}`,
);

async function loadSpecification(document) {
  const file = new URL(document.file, specsDirectory);
  if (!refresh) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  let response;
  try {
    response = await fetch(document.url);
  } catch (cause) {
    throw unavailable(`network failure for ${document.url}`, cause);
  }
  if (!response.ok) throw unavailable(`HTTP ${response.status} for ${document.url}`);
  const text = await response.text();
  await writeFile(file, text);
  return JSON.parse(text);
}

function readOfficialOperations(specification) {
  const documentOperations = [];
  for (const [path, pathItem] of Object.entries(specification.paths ?? {})) {
    if (!isRecord(pathItem)) continue;
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (method === "parameters" || !isRecord(rawOperation)) continue;
      if (typeof rawOperation.operationId !== "string") continue;
      const parameters = [
        ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
        ...(Array.isArray(rawOperation.parameters) ? rawOperation.parameters : []),
      ]
        .map((parameter) => resolveReference(specification, parameter))
        .filter(isRecord);
      const security = Array.isArray(rawOperation.security)
        ? rawOperation.security
        : Array.isArray(specification.security)
          ? specification.security
          : [];
      const scopes = security.flatMap((entry) =>
        isRecord(entry) && Array.isArray(entry.OAuth2CC) ? entry.OAuth2CC : [],
      );
      const responses = isRecord(rawOperation.responses) ? rawOperation.responses : {};
      documentOperations.push({
        operationId: rawOperation.operationId,
        method: method.toUpperCase(),
        path,
        pathParameters: Array.from(path.matchAll(/\{([^}]+)\}/g), (match) => match[1] ?? ""),
        query: queryCategories.filter((category) =>
          parameters.some((parameter) => parameter.in === "query" && parameter.name === category),
        ),
        scopes: [...new Set(scopes)].toSorted(),
        responses,
        requestSchema: requestSchema(specification, rawOperation),
        specification,
      });
    }
  }
  return documentOperations;
}

function createRegistryEntry(service, providerKind, operation) {
  const successStatuses = Object.keys(operation.responses)
    .filter((status) => /^2\d\d$/.test(status))
    .map(Number)
    .toSorted((left, right) => left - right);
  if (successStatuses.length === 0) {
    throw new Error(`${operation.operationId}: OpenAPI operation has no 2xx response.`);
  }
  const responseSchema = responseSchemaFor(
    operation.specification,
    operation.responses,
    successStatuses,
  );
  return {
    service,
    providerKind,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    pathParameters: operation.pathParameters,
    responseKind: responseKind(operation.method, responseSchema),
    allowedQuery: operation.query,
    requiredScopes: operation.scopes,
    successStatuses,
    responseCodec: codecForSchema(responseSchema),
    ...(operation.requestSchema === undefined
      ? {}
      : { requestCodec: codecForSchema(operation.requestSchema, "request") }),
  };
}

function responseKind(method, responseSchemaName) {
  if (method === "GET")
    return responseSchemaName?.endsWith("SetDType") === true ? "collection" : "singleton";
  if (method === "DELETE" || method === "PUT") return "noContent";
  return "write";
}

function codecForSchema(schemaNameValue, purpose = "response") {
  if (schemaNameValue === undefined) return "none";
  if (schemaNameValue === "GUIDPairSetDType") return "guidPairSet";
  if (schemaNameValue.endsWith("SetDType")) {
    const base = singularize(schemaNameValue.slice(0, -"SetDType".length));
    return `${pascalToCamel(base)}Collection`;
  }
  if (schemaNameValue.startsWith("Single") && schemaNameValue.endsWith("DType")) {
    const base = schemaNameValue.slice("Single".length, -"DType".length);
    return purpose === "request" ? `single${base}` : `${pascalToCamel(base)}Singleton`;
  }
  throw new Error(`Unsupported OpenAPI schema ${schemaNameValue}.`);
}

function singularize(value) {
  if (value === "Categories") return "Category";
  return value;
}

function pascalToCamel(value) {
  return value.length === 0 ? value : `${value[0].toLowerCase()}${value.slice(1)}`;
}

function pascalCase(value) {
  return value.length === 0 ? value : `${value[0].toUpperCase()}${value.slice(1)}`;
}

function responseSchemaFor(specification, responses, successStatuses) {
  for (const status of successStatuses) {
    const response = resolveReference(specification, responses[String(status)]);
    const content = isRecord(response?.content) ? response.content["application/json"] : undefined;
    const schema = isRecord(content) ? content.schema : undefined;
    const name = schemaName(specification, schema);
    if (name !== undefined) return name;
  }
  return undefined;
}

function requestSchema(specification, operation) {
  const body = operation.requestBody;
  if (!isRecord(body)) return undefined;
  const content = isRecord(body.content) ? body.content["application/json"] : undefined;
  return isRecord(content) ? schemaName(specification, content.schema) : undefined;
}

function schemaName(specification, value) {
  const schema = resolveReference(specification, value);
  if (isRecord(value) && typeof value.$ref === "string") {
    const name = value.$ref.split("/").at(-1);
    return typeof name === "string" ? name : undefined;
  }
  if (isRecord(schema) && typeof schema.title === "string") return schema.title;
  return undefined;
}

function resolveReference(specification, value) {
  if (!isRecord(value) || typeof value.$ref !== "string") return value;
  const prefix = "#/components/";
  if (!value.$ref.startsWith(prefix)) return undefined;
  const [group, name] = value.$ref.slice(prefix.length).split("/");
  return isRecord(specification.components?.[group])
    ? specification.components[group][name]
    : undefined;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unavailable(message, cause) {
  const error = new Error(message, { cause });
  error.code = "SPEC_GENERATION_UNAVAILABLE";
  return error;
}

function uniqueGroups(values, select) {
  const groups = new Map();
  for (const value of values) {
    const group = select(value);
    const identity = JSON.stringify(group);
    if (!groups.has(identity)) groups.set(identity, group);
  }
  return Object.fromEntries([...groups.values()].map((group, index) => [`g${index}`, group]));
}

function groupKey(groups, value) {
  const identity = JSON.stringify(value);
  const entry = Object.entries(groups).find(([, group]) => JSON.stringify(group) === identity);
  if (entry === undefined) throw new Error(`Missing generated operation group ${identity}.`);
  return entry[0];
}
