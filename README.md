# OneRoster TypeScript

Portable, npm-destined TypeScript library for faithful OneRoster support.

The first production surface is parsing, validating, and normalizing OneRoster CSV ZIP packages. The larger ambition is a full, spec-shaped toolkit: versioned information models, CSV bindings, REST bindings, gradebook, resources, assessment results profile, validation, and conformance-oriented fixtures.

Product-specific provisioning remains outside the package.

## Spec Basis

OneRoster 1.2 is organized by service and transport binding:

- CSV has one binding document for ZIP package shape, `manifest.csv`, CSV file layout, UTF-8/RFC 4180 parsing rules, file presence, and bulk/delta behavior.
- REST is split into information model and REST binding documents for Rostering, Gradebook, and Resource services.
- REST bindings include endpoint definitions, query behavior, service discovery, security, payload definitions, and OpenAPI listings.
- The Assessment Results Profile is layered on the OneRoster 1.2 Gradebook Service for assessment line items and results.
- OneRoster 1.1 remains important compatibility material, but OneRoster 1.2 is the initial normative target.

## Phases

| Phase                     | Scope                                                                                                                                                               | Outcome                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0. Foundation             | Strict TypeScript package setup, ESM-only build, zero runtime dependencies by default, private local spec archive, and public contribution rules.                   | A portable baseline that can be consumed from npm, Workers, Hono, Deno, and browser-compatible bundlers.      |
| 1. Core Model             | Versioned OneRoster 1.2 primitives, enums, references, status values, diagnostics, and result types.                                                                | A shared type and validation vocabulary that every binding uses.                                              |
| 2. CSV Rostering          | ZIP intake, root-level file detection, `manifest.csv`, RFC 4180 parsing, BOM tolerance, case-sensitive headers, bulk/delta mode handling, and core rostering files. | First useful release for OneRoster CSV imports without Harbor-specific provisioning behavior.                 |
| 3. Full CSV Binding       | Complete OneRoster 1.2 CSV file catalog, including gradebook, resources, score scales, learning objective links, roles, user profiles, and user resources.          | Full CSV normalization across Rostering, Gradebook, and Resources with stable row/file diagnostics.           |
| 4. CSV Conformance        | Golden fixtures, negative fixtures, spec-derived required/optional field checks, relationship checks, and version compatibility tests.                              | Confidence that CSV behavior is faithful, predictable, and regression-resistant.                              |
| 5. REST Contracts         | REST information models, payload envelopes, pagination, sorting, filtering, field selection, status payloads, and OpenAPI comparison tests.                         | REST support designed on top of the stable core model, without committing the core package to generated SDKs. |
| 6. REST Runtime           | Optional client/server helpers for Rostering, Gradebook, and Resources using web-standard `fetch`/`Request`/`Response` contracts.                                   | REST integrations that work across Workers, Hono, Deno, Node runtimes, and test harnesses.                    |
| 7. Profiles and Ecosystem | Assessment Results Profile support, optional adapters, import/export utilities, examples, and compatibility guides.                                                 | A broad OneRoster toolkit while keeping product provisioning outside the library.                             |

CSV comes first because it is a concrete binding with immediate normalization needs. REST comes later because the spec separates REST service models from REST bindings, and those are best built after the shared OneRoster model and diagnostics are stable.

OpenAPI descriptions and external schema libraries may be used as references or test inputs. They should not become core runtime dependencies unless there is a strong portability and maintenance reason.

## Toolchain

- TypeScript 7 RC
- pnpm
- oxlint
- oxfmt
- Vitest

Runtime dependency policy: zero by default, with one deliberate exception: ZIP container handling uses `fflate` behind the package's own `ZipEntry` and diagnostic contracts. CSV parsing is owned by this package so OneRoster-specific diagnostics and parser restrictions stay under our control.

The core package should remain portable across npm ESM, Workers, Hono, Deno consumers, and browser-compatible bundlers.

## Scripts

```sh
pnpm run check
pnpm run build
```
