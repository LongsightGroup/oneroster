# OneRoster for TypeScript

Parse, validate, and write [OneRoster](https://www.1edtech.org/standards/oneroster) CSV packages. Use versioned clients and provider routes for OneRoster REST APIs.

The package uses standard Web APIs and runs in Node, Deno, Cloudflare Workers, Hono, and browser-compatible bundlers.

## Install

```sh
pnpm add @longsightgroup/oneroster
```

## How the package is organized

| Import                           | Use when                                                 |
| -------------------------------- | -------------------------------------------------------- |
| `@longsightgroup/oneroster`      | CSV ZIP packages for rostering, gradebook, and resources |
| `@longsightgroup/oneroster/v1p2` | OneRoster 1.2 REST (normative target)                    |
| `@longsightgroup/oneroster/v1p1` | OneRoster 1.1 REST compatibility                         |

Import REST APIs from the version you need. The v1.1 and v1.2 entry points have separate types and behavior, with no cross-version fallback.

New to the REST API? Start with the [OneRoster REST guide](docs/rest.md), then use the [generated operation catalog](docs/rest-operations.md) to find every client call, HTTP path, query option, and OAuth scope.

CSV support follows the corrected OneRoster CSV Binding 1.2.1. Packages still declare
`oneroster.version,1.2` in `manifest.csv`. The 1.2.1 number identifies the CSV document
correction level, not a separate manifest or REST version.

## CSV: parse a package

`parseAndValidateOneRosterCsvFullZip` accepts ZIP bytes and returns a `Result`. A successful result contains typed records. An expected data failure contains structured diagnostics instead of throwing.

```ts
import { parseAndValidateOneRosterCsvFullZip } from "@longsightgroup/oneroster";

const result = parseAndValidateOneRosterCsvFullZip(zipBytes, {
  referenceMode: "allRows",
});

if (result._tag === "err") {
  for (const d of result.error) {
    console.error(d.code, d.fileName, d.rowNumber, d.field, d.message);
  }
} else {
  const { users, classes, enrollments } = result.value.fullPackage.rosteringPackage;
  console.log(users.length, classes.length, enrollments.length);
}
```

Round-trip a validated package back to normalized ZIP bytes:

```ts
import {
  parseAndValidateOneRosterCsvFullZip,
  writeOneRosterCsvFullZip,
} from "@longsightgroup/oneroster";

const parsed = parseAndValidateOneRosterCsvFullZip(zipBytes);
if (parsed._tag === "ok") {
  const written = writeOneRosterCsvFullZip(parsed.value.fullPackage);
}
```

For separate CSV files, use `parseAndValidateOneRosterCsvFullFiles`. Use `parseOneRosterCsvZip` when you need the lower-level ZIP parsing boundary.

## REST: read roster data (1.2)

Create a client with a service base URL and an `accessTokenProvider`. Read methods encode query parameters and parse each response. Use `collectAll*` or `iterateAll*` to follow pages.

```ts
import {
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2RosteringClient,
} from "@longsightgroup/oneroster/v1p2";

const filter = createOneRosterV1p2FilterClause("status", "=", "active");
if (filter._tag !== "ok") throw new Error("bad filter");

const client = createOneRosterV1p2RosteringClient({
  serviceBaseUrls: {
    rostering: "https://sis.example/ims/oneroster/rostering/v1p2",
  },
  accessTokenProvider: (scopes, signal) => yourTokenService(scopes, signal),
});

if (client._tag === "ok") {
  const page = await client.value.getAllUsers({
    query: { limit: 100, filter: filter.value },
    signal: AbortSignal.timeout(30_000),
  });

  if (page._tag === "ok") {
    for (const user of page.value.items) {
      console.log(user.sourcedId, user.givenName, user.familyName);
    }
  }

  // The caller sets limits for full traversal.
  const all = await client.value.collectAllUsers({ maxPages: 50, maxItems: 10_000 });

  // Lazy traversal uses the same link and offset rules without materializing every item.
  for await (const result of client.value.iterateAllUsers({
    maxPages: 50,
    maxItems: 10_000,
    signal: AbortSignal.timeout(30_000),
  })) {
    if (result._tag === "err") {
      console.error(result.error._tag);
      break;
    }
    processPage(result.value);
  }
}
```

TypeScript checks field projections and narrows the result. For example, pass `query: { fields: ["sourcedId", "givenName"] }` to request those fields.

Filter combination has a different return type in each version. `combineOneRosterV1p1Filters` returns the combined filter directly to maintain compatibility with the v1.1 API. `combineOneRosterV1p2Filters` returns a `Result`. Both functions accept validated clauses and an `"AND" | "OR"` join, so callers should follow the return type from their versioned import.

The 1.1 and 1.2 clients support optional read retries. A retry policy must be bounded, applies only to `GET`, observes `Retry-After`, and passes the request's abort signal to backoff waits. Without `retryPolicy`, each operation makes one request. Tests and hosts with their own clock can provide `retryClock: { nowMilliseconds }`. Other clients use the system clock.

```ts
const resilientClient = createOneRosterV1p2RosteringClient({
  serviceBaseUrls: {
    rostering: "https://sis.example/ims/oneroster/rostering/v1p2",
  },
  accessTokenProvider: (scopes, signal) => yourTokenService(scopes, signal),
  retryPolicy: {
    maxAttempts: 3,
    maxElapsedMilliseconds: 15_000,
    statusCodes: [429, 502, 503],
    retryConnectionErrors: true,
  },
});
```

## REST: pass back grades (1.2)

Gradebook writes do not require an options object. Pass an optional `signal` when your application needs cancellation or a deadline; `AbortSignal.timeout(30_000)` cancels a request after 30 seconds. `POST`, `PUT`, and `DELETE` each make one authenticated request, and the client never retries writes automatically.

```ts
import { createOneRosterV1p2GradebookClient } from "@longsightgroup/oneroster/v1p2";

const client = createOneRosterV1p2GradebookClient({
  serviceBaseUrls: {
    gradebook: "https://sis.example/ims/oneroster/gradebook/v1p2",
  },
  accessTokenProvider: (scopes, signal) => yourTokenService(scopes, signal),
});

if (client._tag === "ok") {
  await client.value.putResult(result.sourcedId, result);
  const check = await client.value.getResult(result.sourcedId);
}
```

Assessment Results Profile clients use the gradebook base URL and are exported from `@longsightgroup/oneroster/v1p2`. Resources has a separate client. To build a OneRoster provider, use `createOneRosterV1p2ProviderRouter`. Supply authentication and persistence implementations; the router accepts `Request` and returns `Response`.

## REST: authorize legacy 1.1 requests

OneRoster 1.1 always requires an explicit request authorizer. Hosts can keep injecting their own implementation, or deliberately select the portable OAuth 1.0a HMAC-SHA1 helper. The helper reads no environment variables and performs no authentication probing.

```ts
import {
  createOneRosterV1p1OAuth1Authorizer,
  createOneRosterV1p1RosteringClient,
} from "@longsightgroup/oneroster/v1p1";

const authorizer = createOneRosterV1p1OAuth1Authorizer({
  credentials: {
    consumerKey: yourConsumerKey,
    consumerSecret: yourConsumerSecret,
    token: yourToken,
    tokenSecret: yourTokenSecret,
  },
});

if (authorizer._tag === "ok") {
  const client = createOneRosterV1p1RosteringClient({
    baseUrl: "https://sis.example/ims/oneroster/v1p1",
    authorizer: authorizer.value,
  });
}
```

## What's implemented

| Area                                              | Status |
| ------------------------------------------------- | ------ |
| CSV ZIP intake + manifest                         | Done   |
| Rostering, gradebook, resources CSV tables        | Done   |
| CSV write + record builders                       | Done   |
| Reference and duplicate-ID validation             | Done   |
| Official CSV Rostering reference gate (719 cases) | Done   |
| OneRoster 1.2 REST consumers                      | Done   |
| OneRoster 1.1 REST compatibility                  | Done   |
| Provider router (framework-neutral)               | Done   |
| OpenAPI parity gate (`pnpm run rest:spec-check`)  | Done   |

The only runtime dependency is `fflate`, which parses ZIP containers. Its types are not part of the public API.

## Development

```sh
pnpm run check    # format, lint, typecheck, tests
pnpm run build    # emit dist/
pnpm run csv:rostering-cert-check # verify all official bulk and delta Rostering cases
```

Conformance-oriented checks also include `pnpm run test:portability`, `pnpm run compatibility:v1p1`, `pnpm run csv:rostering-cert-check`, and `pnpm run rest:spec-check`. The CSV and REST specification checks download SHA-pinned official artifacts into ignored `.specs/`.
