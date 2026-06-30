# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Consolidated OneRoster CSV conformance corpus with acceptance, round-trip, and negative scenarios across package, rostering, gradebook, resources, and full profiles
- Public API smoke tests and documented usage examples exercised in CI
- Shared test assertion helpers, conformance profile handlers, and split conformance fixture modules

### Changed

- Hardened conformance fixture assertions and replaced brittle CSV lifecycle surgery with explicit delta row builders

## [0.1.0] - 2026-06-30

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
