# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-07-15

### Added

- Versioned `@longsightgroup/oneroster/v1p2` and `@longsightgroup/oneroster/v1p1` package entry points, while keeping the root entry point CSV-first.
- A generated OneRoster 1.2 registry covering 81 operations from the official Rostering, Gradebook, Resources, and Assessment Results OpenAPI documents.
- Portable OneRoster 1.2 clients for Rostering reads, Gradebook pull and passback, Resources reads, and Assessment Results Profile v1.0 operations.
- Typed OneRoster 1.2 models, response-envelope parsers, request-payload parsers, field projections, query filters, and versioned diagnostics.
- Framework-neutral OneRoster 1.2 provider contracts, authorization, capability-derived discovery, `Request`/`Response` routing, and response-envelope serialization.
- Portable OneRoster 1.2 discovery and OAuth 2 client-credentials authentication with explicit token, clock, fetch, and cancellation seams.
- Explicit OneRoster 1.1 models, generated operation metadata, Rostering, Resources, and Gradebook clients, injected request authorization, and a v1.1/v1.2 compatibility report.
- An optional OneRoster 1.1 OAuth 1.0a HMAC-SHA1 authorizer with explicit credentials and deterministic nonce, clock, and Web Crypto seams.
- Named v1.1 and v1.2 filter constructors for the seven supported comparison predicates.
- Bounded collection traversal through typed page reads, lazy async iterators, and eager `collectAll` methods for v1.1 and v1.2 clients.
- Opt-in, bounded, cancellation-aware retries for v1.1 and v1.2 `GET` requests, including `Retry-After` handling and an injectable retry clock. Mutations are never retried automatically.
- A SHA-pinned certification gate for all 719 official OneRoster CSV Binding 1.2.1 Rostering cases: 350 bulk and 369 delta.
- OpenAPI parity checks for four pinned REST specifications, conformance scenarios, generated-registry checks, and Node/Deno Web API portability tests.
- CI and release checks for Deno portability, plus a manually triggered live OpenAPI parity workflow.
- Public `oneRosterCsvBindingVersion` and `oneRosterCsvManifestOneRosterVersion` constants that distinguish the 1.2.1 CSV correction level from the required `oneroster.version,1.2` manifest value.

### Changed

- Follow the corrected OneRoster CSV Binding 1.2.1 rules as the single validation behavior; no strict or certification-specific mode is required.
- Parse paired `subjects` and `subjectCodes` fields together and require `users.userIds` entries to use the binding's `{type:id}` syntax.
- Describe `true` and `false` CSV fields as binding enumerations instead of a separate boolean vocabulary.
- Build versioned REST clients from operation and payload registries so runtime methods, path parameters, scopes, response kinds, iterate names, and TypeScript contracts share one source of truth.
- Generate OneRoster 1.2 provider operation inventories, request parsers, and response-envelope serializers from the same OpenAPI metadata used by consumer clients.
- Share query parsing, filtering, pagination, URL construction, transport errors, retries, runtime option parsing, and registry validation across v1.1 and v1.2 while preserving versioned public errors.
- Require `maxPages` for lazy iteration and both `maxPages` and `maxItems` for eager `collectAll` traversal at the public method boundary.
- Make mutation options and caller-owned cancellation signals optional while keeping all writes single-attempt and non-retrying.
- Keep the established filter-combination contracts: v1.1 returns a filter directly, while v1.2 returns a `Result`.
- Expand the README with versioned import guidance and examples for CSV parsing, v1.2 reads and passback, retries, bounded traversal, provider routing, and v1.1 authorization.
- Update the development toolchain to stable TypeScript 7.0.2, Vitest 4.1.10, Oxlint 1.74.0, Oxfmt 0.59.0, `oxlint-tsgolint` 0.24.0, and pnpm 11.13.0.

### Fixed

- Apply the OneRoster 1.2 REST default page `limit` of 100 when a response omits an explicit limit.
- Return versioned query diagnostics for missing or invalid traversal bounds instead of passing invalid sentinel values into collection mechanics.
- Preserve diagnostic paths through generated v1.2 envelope parsers and require structured payload diagnostics at the shared transport boundary.
- Reject incomplete, ambiguous, and extra-property v1.1 filter objects before clause validation.
- Reject registry definitions that disagree with generated operation metadata and runtime calls with impossible argument counts.
- Resolve provider path, HTTP method, configured capability, and handler in one decision table so 404/405 classification cannot disagree with dispatch.
- Keep authorization and cancellation attached to each retry attempt, honor aborts during backoff, and verify `Retry-After` scheduling independently from transport integration.
- Preserve version-specific pagination-link behavior while sharing link parsing and page-termination rules.

### Removed

- Extra-spec CSV class-to-term ancestry and enrollment-role matching restrictions that rejected packages accepted by the official 1.2.1 certification corpus.
- The unused `semantic.enrollment_role_mismatch` diagnostic and stale class-term semantic documentation.

## [0.2.2]

### Added

- Direct full-package parser and validator for in-memory OneRoster CSV file maps
- Common typed record builders for bulk lifecycles, delta delete lifecycles, users, and enrollments
- Full-package summary helper with per-table, per-layer, active/inactive row, and user status counts
- General `getFirstOneRosterResultScoreScale` helper for result score-scale relationships with optional inactive-row inclusion
- Shared profile table iteration helpers used by full-package summary reporting

### Changed

- `getFirstActiveOneRosterResultScoreScale` is now always active-only across the parent result, link row, and score scale target
- File-map ZIP writing now reuses the shared OneRoster CSV file-map-to-entry conversion
- README recipes now cover file-map parse/write flows, relationship filtering policies, score-scale helpers, display-name formatting, and package summaries

## [0.2.1]

### Added

- Manifest mode builder helper for deriving complete OneRoster CSV file modes from in-memory file maps
- Direct ZIP writers for trusted root-level OneRoster CSV entries and file maps without a parse-then-write round trip
- Record-based full-package writers for deterministic entries or ZIP bytes from typed OneRoster record collections
- User display-name formatting helper with deterministic fallback ordering
- Result score-scale projection helpers for first-active and result-to-score-scale lookup use cases

## [0.2.0]

### Added

- Consolidated OneRoster CSV conformance corpus with acceptance, round-trip, and negative scenarios across package, rostering, gradebook, resources, and full profiles
- Public API smoke tests and documented usage examples exercised in CI
- Shared test assertion helpers, conformance profile handlers, and split conformance fixture modules
- `parseAndValidateOneRosterCsvFullEntries` for callers that already have package entries in memory
- Canonical CSV binding helpers for table headers and manifest row generation
- Typed record projection helpers for canonical CSV cells and header-keyed objects
- Public status, diagnostic location, resolved enrollment, and gradebook relationship helpers

### Changed

- Hardened conformance fixture assertions and replaced brittle CSV lifecycle surgery with explicit delta row builders
- Added resolved relationship indexes to validated full-package results
- Split entries options from ZIP options so in-memory entry APIs do not expose irrelevant ZIP limits
- Centralized metadata header validation across parsing, writing, and record projection

## [0.1.0]

First public release of `@longsightgroup/oneroster`.

### Added

- Portable ESM TypeScript library for faithful OneRoster 1.2 CSV package parsing, validation, normalization, and writing
- ZIP package intake with root-level file detection, `manifest.csv` reconciliation, bulk/delta modes, and safe diagnostics
- Owned RFC 4180 CSV parser and writer with UTF-8, BOM, quoting, and embedded line-break rejection
- Typed rostering CSV records for `academicSessions`, `orgs`, `courses`, `classes`, `users`, `roles`, `enrollments`, `demographics`, and `userProfiles`
- Gradebook CSV parsing and validation for categories, line items, results, score scales, and gradebook link tables
- Resources CSV parsing and validation for resources, class resources, course resources, and user resources
- Reference validation for duplicate sourced IDs and missing target files/records
- Full-package semantic validation for score ranges, score scale mappings, CASE learning objective URNs, enrollment roles, org types, and related cross-record constraints
- Typed CSV writers for raw packages and rostering, gradebook, resources, and full packages, including deterministic `metadata.*` column ordering
- `Result`-based error handling with stable diagnostic codes and location context that omits sensitive row payloads
- MIT license

### Changed

- Renamed the package to `@longsightgroup/oneroster` with npm publish metadata, repository links, and install documentation
