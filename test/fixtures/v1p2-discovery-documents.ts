import {
  oneRosterV1p2BasePaths,
  oneRosterV1p2Scope,
  type OneRosterV1p2Service,
} from "../../src/v1p2/index.js";

/** Create a small hand-authored localized OpenAPI document for parser tests. */
export function createOneRosterV1p2DiscoveryDocument(
  service: OneRosterV1p2Service = "rostering",
): Record<string, unknown> {
  const operationPath =
    service === "rostering" ? "/users" : service === "gradebook" ? "/results" : "/resources";
  const operationId =
    service === "rostering"
      ? "getAllUsers"
      : service === "gradebook"
        ? "getAllResults"
        : "getAllResources";
  const scope =
    service === "rostering"
      ? oneRosterV1p2Scope("roster.readonly")
      : service === "gradebook"
        ? oneRosterV1p2Scope("gradebook.readonly")
        : oneRosterV1p2Scope("resource.readonly");
  return {
    openapi: "3.0.0",
    info: { title: `Test ${service} service`, version: "1.2" },
    servers: [
      {
        url: `https://sis.example/{basePath}`,
        variables: { basePath: { default: oneRosterV1p2BasePaths[service] } },
      },
    ],
    components: {
      securitySchemes: {
        OAuth2CC: {
          type: "oauth2",
          flows: {
            clientCredentials: {
              tokenUrl: "https://auth.example.test/oauth/token",
              scopes: { [scope]: "Test scope" },
            },
          },
        },
      },
    },
    paths: {
      [operationPath]: {
        get: {
          operationId,
          security: [{ OAuth2CC: [scope] }],
          responses: { "200": { content: { "application/json": {} } } },
        },
      },
    },
  };
}
