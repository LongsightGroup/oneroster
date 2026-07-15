/* oxlint-disable import/no-nodejs-modules, eslint/no-console, no-await-in-loop, typescript/require-array-sort-compare */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const documents = [
  {
    service: "rostering",
    file: "rostering.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2rostersservice_openapi3_v1p0.json",
  },
  {
    service: "gradebook",
    file: "gradebook.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json",
  },
  {
    service: "gradebook",
    file: "assessment-results.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/assessmentresultv1p0service_openapi3_v1p0.json",
  },
  {
    service: "resources",
    file: "resources.json",
    url: "https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2resourcesservice_openapi3_v1p0.json",
  },
];

const { oneRosterV1p2Operations } = await import(new URL("../dist/v1p2/index.js", import.meta.url));
const localOperations = new Map(
  oneRosterV1p2Operations.map((operation) => [
    `${operation.service}:${operation.operationId}`,
    operation,
  ]),
);

try {
  await mkdir(new URL("../.specs/oneroster-v1p2/", import.meta.url), { recursive: true });
  const differences = [];
  for (const document of documents) {
    let response;
    try {
      response = await fetch(document.url);
    } catch (cause) {
      throw unavailable(`network failure for ${document.url}`, cause);
    }
    if (!response.ok) throw unavailable(`HTTP ${response.status} for ${document.url}`);
    const text = await response.text();
    const digest = createHash("sha256").update(text).digest("hex");
    await writeFile(new URL(`../.specs/oneroster-v1p2/${document.file}`, import.meta.url), text);
    const specification = JSON.parse(text);
    const expected = [...localOperations.values()].filter((operation) => {
      if (operation.service !== document.service) return false;
      if (document.file === "assessment-results.json")
        return operation.operationId.includes("Assessment");
      return true;
    });
    const official = readOfficialOperations(specification);
    const expectedIds = new Set(expected.map((operation) => operation.operationId));
    const officialIds = new Set(official.map((operation) => operation.operationId));
    for (const operation of expected) {
      const actual = official.find((candidate) => candidate.operationId === operation.operationId);
      if (actual === undefined) {
        differences.push(`${document.file}: missing operation ${operation.operationId}`);
        continue;
      }
      differences.push(...compareOperation(document.file, operation, actual));
    }
    for (const operation of official) {
      if (!expectedIds.has(operation.operationId)) {
        differences.push(`${document.file}: unexpected operation ${operation.operationId}`);
      }
    }
    for (const operationId of officialIds) {
      if (!expectedIds.has(operationId))
        differences.push(`${document.file}: unexpected operation ${operationId}`);
    }
    console.log(`${document.file}: sha256=${digest} operations=${official.length}`);
  }
  if (differences.length > 0) {
    console.error("OpenAPI parity differences:");
    for (const difference of new Set(differences)) console.error(`- ${difference}`);
    process.exitCode = 1;
  } else {
    console.log(`OpenAPI parity passed for ${documents.length} pinned documents.`);
  }
} catch (error) {
  if (error?.code === "SPEC_CHECK_UNAVAILABLE") {
    console.error(`spec check unavailable: ${error.message}`);
    process.exitCode = 2;
  } else {
    throw error;
  }
}

function readOfficialOperations(specification) {
  const operations = [];
  for (const [path, pathItem] of Object.entries(specification.paths ?? {})) {
    if (!isRecord(pathItem)) continue;
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (method === "parameters" || !isRecord(rawOperation)) continue;
      if (!rawOperation.operationId) continue;
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
      operations.push({
        operationId: rawOperation.operationId,
        method: method.toUpperCase(),
        path,
        query: parameters
          .filter((parameter) => parameter.in === "query")
          .map((parameter) => parameter.name)
          .toSorted(),
        scopes: [...new Set(scopes)].toSorted(),
        responses,
        specification,
      });
    }
  }
  return operations;
}

function compareOperation(file, local, official) {
  const differences = [];
  if (local.method !== official.method)
    differences.push(`${file}:${local.operationId} method ${local.method} != ${official.method}`);
  if (local.path !== official.path)
    differences.push(`${file}:${local.operationId} path ${local.path} != ${official.path}`);
  if ([...local.allowedQuery].toSorted().join(",") !== official.query.join(","))
    differences.push(`${file}:${local.operationId} query categories differ`);
  if ([...local.requiredScopes].toSorted().join(",") !== official.scopes.join(","))
    differences.push(`${file}:${local.operationId} scopes differ`);
  for (const status of local.successStatuses) {
    if (official.responses[String(status)] === undefined)
      differences.push(`${file}:${local.operationId} missing success status ${status}`);
  }
  if (local.responseKind !== "noContent") {
    const success = official.responses[String(local.successStatuses[0])];
    const content =
      isRecord(success) && isRecord(success.content)
        ? success.content["application/json"]
        : undefined;
    const schema = isRecord(content)
      ? resolveReference(official.specification, content.schema)
      : undefined;
    const properties = isRecord(schema?.properties) ? Object.keys(schema.properties) : [];
    const expectedProperty = envelopeProperty(local.responseCodec);
    if (expectedProperty !== undefined && !properties.includes(expectedProperty))
      differences.push(`${file}:${local.operationId} envelope ${expectedProperty} missing`);
  }
  return differences;
}

function envelopeProperty(codec) {
  const properties = {
    academicSessionCollection: "academicSessions",
    academicSessionSingleton: "academicSession",
    assessmentLineItemCollection: "assessmentLineItems",
    assessmentLineItemSingleton: "assessmentLineItem",
    assessmentResultCollection: "assessmentResults",
    assessmentResultSingleton: "assessmentResult",
    categoryCollection: "categories",
    categorySingleton: "category",
    classCollection: "classes",
    classSingleton: "class",
    courseCollection: "courses",
    courseSingleton: "course",
    demographicsCollection: "demographics",
    demographicsSingleton: "demographics",
    enrollmentCollection: "enrollments",
    enrollmentSingleton: "enrollment",
    lineItemCollection: "lineItems",
    lineItemSingleton: "lineItem",
    orgCollection: "orgs",
    orgSingleton: "org",
    resourceCollection: "resources",
    resourceSingleton: "resource",
    resultCollection: "results",
    resultSingleton: "result",
    scoreScaleCollection: "scoreScales",
    scoreScaleSingleton: "scoreScale",
    userCollection: "users",
    userSingleton: "user",
    guidPairSet: "sourcedIdPairs",
  };
  return properties[codec];
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
  error.code = "SPEC_CHECK_UNAVAILABLE";
  return error;
}
