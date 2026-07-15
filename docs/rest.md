# OneRoster REST with TypeScript

Use the versioned `@longsightgroup/oneroster/v1p2` entry point for OneRoster 1.2 REST calls. The package provides four clients:

| What you need                                            | Client                                       |
| -------------------------------------------------------- | -------------------------------------------- |
| Users, classes, courses, schools, terms, and enrollments | `createOneRosterV1p2RosteringClient`         |
| Categories, line items, results, and score scales        | `createOneRosterV1p2GradebookClient`         |
| Hierarchical assessment line items and results           | `createOneRosterV1p2AssessmentResultsClient` |
| Resource allocations for classes, courses, and users     | `createOneRosterV1p2ResourcesClient`         |

The [generated operation catalog](./rest-operations.md) lists every client method with its HTTP method, path, query controls, success status, and OAuth scopes.

## Connect to a OneRoster provider

OneRoster 1.2 uses OAuth 2 client credentials. Keep the client secret in server-side code; do not ship it in browser JavaScript.

```ts
import {
  createOneRosterV1p2OAuth2ClientCredentialsProvider,
  createOneRosterV1p2RosteringClient,
} from "@longsightgroup/oneroster/v1p2";

const tokenProvider = createOneRosterV1p2OAuth2ClientCredentialsProvider({
  tokenEndpoint: "https://sis.example/oauth/token",
  clientId: yourClientId,
  clientSecret: yourClientSecret,
  clientAuthentication: "client_secret_basic",
  scopes: [
    "https://purl.imsglobal.org/spec/or/v1p2/scope/roster-core.readonly",
    "https://purl.imsglobal.org/spec/or/v1p2/scope/roster.readonly",
  ],
  fetch,
});

if (tokenProvider._tag === "err") {
  console.error(tokenProvider.error.code);
} else {
  const client = createOneRosterV1p2RosteringClient({
    serviceBaseUrls: {
      rostering: "https://sis.example/ims/oneroster/rostering/v1p2",
    },
    accessTokenProvider: tokenProvider.value,
  });

  if (client._tag === "err") {
    console.error(client.error.code, client.error.message);
  } else {
    const users = await client.value.getAllUsers({
      query: { limit: 100 },
      signal: AbortSignal.timeout(30_000),
    });

    if (users._tag === "err") console.error(users.error._tag);
    else console.log(users.value.items);
  }
}
```

The package itself reads no environment variables. The host application passes credentials into the portable client.

## Perform a complete roster sync

Rostering clients provide bounded `collectAll*` methods when the complete result can fit in memory. Always set both limits so a bad pagination response cannot make the sync unbounded.

```ts
const bounds = {
  maxPages: 100,
  maxItems: 100_000,
  signal: AbortSignal.timeout(120_000),
};

const [users, classes, enrollments] = await Promise.all([
  client.collectAllUsers(bounds),
  client.collectAllClasses(bounds),
  client.collectAllEnrollments(bounds),
]);

for (const result of [users, classes, enrollments]) {
  if (result._tag === "err") {
    console.error(result.error._tag);
    break;
  }
}
```

For larger datasets, use `iterateAllUsers`, `iterateAllClasses`, or `iterateAllEnrollments`. Each async iterator yields one parsed page, so the application can process data without retaining the full dataset.

## Find a student's classes

Relationship operations are named after the corresponding OneRoster operation. Pass path identifiers first and request options last.

```ts
const classes = await client.getClassesForStudent(studentSourcedId, {
  query: { limit: 100, fields: ["sourcedId", "title", "course", "school"] },
  signal: AbortSignal.timeout(30_000),
});

if (classes._tag === "ok") {
  for (const oneRosterClass of classes.value.items) {
    console.log(oneRosterClass.sourcedId, oneRosterClass.title);
  }
}
```

Use `iterateClassesForStudent` when the relationship may span more than one page.

## Pass a grade back

Gradebook writes require an `AbortSignal`. `PUT` checks that the path `sourcedId` matches the entity before sending the request.

```ts
import { createOneRosterV1p2GradebookClient } from "@longsightgroup/oneroster/v1p2";

const configured = createOneRosterV1p2GradebookClient({
  serviceBaseUrls: {
    gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2",
  },
  accessTokenProvider,
});

if (configured._tag === "ok") {
  const signal = AbortSignal.timeout(30_000);
  const written = await configured.value.putResult(result.sourcedId, result, { signal });

  if (written._tag === "err") console.error(written.error._tag);
  else console.log(written.value.status);
}
```

Use `postResultsForLineItem` or `postResultsForAcademicSessionForClass` to create a collection. Those calls return the provider's parsed sourced-ID pairs.

## Read assigned resources

The Resources client uses its own service base URL and scope.

```ts
import { createOneRosterV1p2ResourcesClient } from "@longsightgroup/oneroster/v1p2";

const configured = createOneRosterV1p2ResourcesClient({
  serviceBaseUrls: {
    resources: "https://sis.example/ims/oneroster/resources/v1p2",
  },
  accessTokenProvider,
});

if (configured._tag === "ok") {
  const resources = await configured.value.getResourcesForClass(classSourcedId, {
    query: { limit: 100 },
    signal: AbortSignal.timeout(30_000),
  });
}
```

## Query collections

Collection reads support pagination, sorting, filtering, and field projection. Build filters with the exported filter constructors instead of assembling filter syntax by hand.

```ts
import { createOneRosterV1p2EqualsFilter } from "@longsightgroup/oneroster/v1p2";

const active = createOneRosterV1p2EqualsFilter("status", "active");
if (active._tag === "ok") {
  const page = await client.getAllUsers({
    query: {
      limit: 100,
      sort: "familyName",
      orderBy: "asc",
      filter: active.value,
      fields: ["sourcedId", "givenName", "familyName"],
    },
  });
}
```

Field projections are checked by TypeScript and narrow the returned entity type.

## Handle failures

Configuration and REST operations return `Result` values for expected failures. Check `_tag` before using the value. REST error tags distinguish HTTP failures, invalid JSON, invalid payloads, pagination problems, cancellation, authentication, and other boundary failures. Diagnostics do not retain response bodies or credentials.

Read retries are opt-in and apply only to `GET`. Gradebook mutations are never retried automatically.

## Inspect raw HTTP with OpenAPI and Swagger

The generated catalog is the package reference. Use an OpenAPI viewer such as Swagger UI or Scalar when you need raw request and response schemas, or want to compare the package with a provider's HTTP API.

Official OneRoster 1.2 OpenAPI 3 documents:

- [Rostering](https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2rostersservice_openapi3_v1p0.json)
- [Gradebook](https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json)
- [Assessment Results Profile](https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/assessmentresultv1p0service_openapi3_v1p0.json)
- [Resources](https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2resourcesservice_openapi3_v1p0.json)

A real provider should publish localized discovery documents with its server URLs, supported operations, OAuth token endpoint, and scopes. Use `buildOneRosterV1p2DiscoveryUrl`, `readOneRosterV1p2Discovery`, and `checkOneRosterV1p2DiscoveryCapabilities` to inspect that contract in code. Prefer the provider's localized document when testing against that provider.

Do not paste production access tokens or client secrets into a third-party OpenAPI viewer. Host the viewer yourself if you need authenticated “Try it out” requests.

## OneRoster 1.1

Import OneRoster 1.1 compatibility APIs from `@longsightgroup/oneroster/v1p1`. Version 1.1 uses a different authentication and service contract, so do not reuse the 1.2 examples unchanged.
