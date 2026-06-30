# Agent Instructions

This repository is intended to become the best TypeScript library for faithful, accurate OneRoster support across the full standard. The first implementation slice is CSV package parsing and normalization, but design decisions must preserve a path to complete OneRoster coverage: core information models, CSV bindings, REST bindings, gradebook, resources, assessment results profile, versioned schemas, validation, conformance fixtures, and platform-neutral adapters.

## Repository Boundaries

- Keep private planning artifacts out of git. `PRD.md`, local notes, and downloaded 1EdTech specification documents are ignored on purpose.
- Do not copy private planning text into public package docs.
- Public docs may describe the package behavior, API contracts, and supported standards, but should not include private strategy notes.
- Public docs must not present the package as a Harbor-specific extraction. Harbor is an early consumer; OneRoster fidelity is the product boundary.

## Platform Contract

- Published source must be portable ESM.
- Runtime code in `src/` must not depend on Node-only APIs, Node globals, CommonJS, filesystem access, process globals, Buffer-only APIs, or framework-specific request objects.
- Prefer Web Platform types and data shapes: `Uint8Array`, `ArrayBuffer`, `ReadableStream`, `Blob`, plain records, and explicit DTOs.
- The library must be usable from npm ESM consumers, Cloudflare Workers, Hono apps, Deno consumers, browser-compatible bundlers, and test runners.
- Runtime behavior must not assume a single host platform. Host-specific I/O belongs in examples, adapters, tests, or separate packages.

## Dependency Policy

- Default to zero runtime dependencies.
- Do not add a runtime dependency unless a written decision explains why a small internal module would be less correct, less portable, or less maintainable.
- The current deliberate runtime exception is `fflate` for ZIP container parsing. Keep it behind local package contracts; do not expose `fflate` types in public OneRoster APIs.
- CSV parsing is owned in this repository. Do not add a CSV parser dependency without revisiting that decision explicitly.
- Runtime dependencies must be ESM-compatible, actively maintained, narrow in purpose, and work outside Node.
- Dev dependencies are allowed for TypeScript, formatting, linting, and tests, but keep them minimal.
- Do not add frameworks to the core package.
- Generated OpenAPI clients, schema codegen tools, fixture generators, and host-specific adapters belong in dev tooling or separate packages unless they are proven to be small, portable, and central to the core library contract.

## TypeScript Discipline

- Keep `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `isolatedModules`, declaration generation, and lint checks enabled.
- Do not use `any`, non-null assertions, broad casts, or unproven `as SomeType` casts.
- Rare type escape hatches must be local, hidden behind a precise interface, and documented with a `SAFETY:` comment.
- Treat untrusted input as `unknown` or boundary-shaped data until parsed.
- A successful parser returns the refined value. Do not validate and then pass unrefined data inward.
- Model OneRoster concepts directly and precisely. Do not collapse spec-distinct concepts into loose strings because that is convenient for a first consumer.
- Public exported values and public methods on exported classes require concise JSDoc explaining the contract.
- Keep all public data contracts immutable with `readonly` fields and `ReadonlyArray` collections unless mutation is explicitly part of the API.
- Avoid callable `then` on ordinary objects.
- Prefer direct file imports. Avoid barrels except for the package root export surface.

## Error and Diagnostic Model

- Expected parse, normalization, schema, manifest, and reference failures must be returned as typed diagnostic values.
- Do not throw for expected user/data failures.
- Throw only for defects: impossible branches, invalid internal states, or incorrect library usage.
- Diagnostics must use stable codes, safe messages, optional file/row/field location, and safe raw row context.
- Do not include secrets or sensitive credential-like values in diagnostics, logs, snapshots, or test fixtures.

## Module Shape

- Domain modules own pure parsing, normalization, record construction, invariants, and reference checks.
- Boundary modules translate external bytes/files/streams into domain inputs.
- Versioned OneRoster modules must make version/profile assumptions explicit. Do not hide v1.1, v1.2, regional profile, assessment-results-profile, CSV-binding, or REST-binding differences behind silent fallbacks.
- Vendor tolerance belongs behind explicit options/profiles. The default behavior should be faithful to the selected OneRoster spec/profile.
- Do not let platform objects, framework request objects, or filesystem paths enter core domain modules.
- Prefer deep modules with small interfaces that hide real policy and invariants.
- Avoid `utils.ts`, `helpers.ts`, `common.ts`, and miscellaneous dumping grounds. Use precise names.

## Testing Requirements

- Tests must prove observable behavior through public APIs or intentional module seams.
- Do not use module mocks or method spies.
- Parser tests must cover accepted and rejected shapes.
- Include row/file diagnostic expectations for failure paths.
- Add round-trip/property-style tests when implementing CSV, ZIP, list-cell, status, or file-name normalization behavior.
- Tests that claim platform portability must run through representative platform-compatible inputs, not Node-only conveniences.
- Every behavior change needs proportionate verification before it is considered done.

## Formatting, Linting, and Verification

- Use pnpm for package management and scripts.
- Run `pnpm run check` before considering work complete.
- Run `pnpm run build` for package-output changes.
- Do not weaken compiler, lint, or formatter settings to admit new code.
- If a tool exposes a real portability or TypeScript issue, fix the code or isolate the compatibility boundary.
