# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Enforce the CSV Binding's positional `subjects`/`subjectCodes` invariant and `{type:id}` syntax for `users.userIds`, while removing extra-spec class-term and enrollment-role restrictions that rejected official valid Rostering packages.
- Make the corrected OneRoster CSV Binding 1.2.1 level explicit while preserving the required `oneroster.version,1.2` manifest value, and align true/false field terminology with the binding's enumeration model.
- Align OneRoster 1.2 REST page metadata with the binding's default `limit` of 100 when callers omit it; explicit limits are preserved.
- Parse required traversal bounds at the public method boundary so missing `maxPages` or `maxItems` returns a versioned query diagnostic instead of a collection-limit sentinel failure.
- Consolidate shared v1.1 and v1.2 transport-error construction while preserving versioned tags, messages, and public error unions.
- Isolate per-attempt authorization and fetch mechanics from retry orchestration, and share pagination-link parsing while retaining explicit version-specific limit behavior.
- Require structured payload diagnostics at the shared transport type boundary instead of recovering `code` and `path` through runtime duck typing.
- Centralize registry-generated collection and singleton option parsing while preserving their distinct response behavior.
- Derive provider service operation inventories and exact handler-key unions from the generated OpenAPI operation registry.
- Centralize v1.1/v1.2 query parsing, validation, serialization, and offset updates, plus the complete filter constructor/parser/combiner/serializer facade, behind version data and diagnostic adapters.
- Reject incomplete, ambiguous, and extra-property v1.1 runtime filter shapes before clause validation.
- Bind registry client installation once per version and reject definition/operation metadata mismatches or impossible runtime method arity with explicit registry configuration errors.
- Infer registry adapter diagnostics and literal error tags/codes from one policy object instead of threading descriptor literals through ten generic parameters and call-site assertions.
- Route provider URL decoding through the shared query/filter grammar and generate request-payload parsers plus exact operation-to-response-envelope serializers from OpenAPI metadata.
- Resolve provider path, method, capability, and handler selection through one decision table so 404/405 classification and dispatch cannot diverge.
- Declare collection iterate method names in registry metadata and use the same literal names for runtime installation and compile-time client projection.
- Drive mutation arity and option placement from one kind policy, and serialize query parameters through one ordered field table.
- Distinguish envelope and unwrapped registry definitions explicitly while preserving diagnostic paths through generated v1.2 payload parsers.
- Separate pure retry scheduling and `Retry-After` verification from version transport integration tests.
- Document the intentionally version-specific filter-combination return contracts without changing either public API.

### Added

- A SHA-pinned certification gate covering all 719 official OneRoster 1.2.1 Rostering CSV reference cases: 350 bulk and 369 delta.
- Named v1.1 and v1.2 filter helpers for the seven existing standard comparison predicates, without expanding the baseline grammar.
- An optional, portable OneRoster 1.1 OAuth 1.0a HMAC-SHA1 authorizer with explicit credentials and deterministic nonce, clock, and Web Crypto seams.
- Pure v1.1 and v1.2 page-termination helpers with explicit next-link, total-count, empty-page, and offset-fallback precedence.
- Bounded async page iterators for every OneRoster 1.1 and 1.2 collection operation, yielding typed page results without eager materialization.
- An opt-in, bounded, cancellation-aware retry policy for OneRoster 1.1 and 1.2 `GET` requests, including `Retry-After` support, an injectable retry clock, and retry-module-owned backoff scheduling.
- Portable OneRoster 1.2 REST discovery, OAuth 2 client-credentials authentication, and a complete registry-driven Rostering read client
- Base OneRoster 1.2 Gradebook pull and passback operations with validated write envelopes and no automatic mutation retries
- OneRoster 1.2 Resources read client for collection, singleton, and class/course/user relationship endpoints
- OneRoster 1.2 Assessment Results Profile v1.0 models, envelopes, and Gradebook-layer client operations
- Framework-neutral OneRoster 1.2 provider contracts, authorization seam, router, response helpers, and capability-derived discovery
- Deterministic OpenAPI parity manifest, conformance-oriented scenarios, and Node/Deno Web API portability gates
- Explicitly versioned OneRoster 1.1 REST contracts, complete operation registry, injected request authorization, typed consumers, and a classified v1.1/v1.2 compatibility report

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
