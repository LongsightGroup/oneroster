import { expect } from "vitest";

import type { OneRosterCsvPackageDiagnostic } from "../../src/index.js";

/** Expected fields for one reference or parse diagnostic assertion. */
export type ExpectedOneRosterCsvDiagnostic = {
  readonly code: string;
  readonly fileName?: string;
  readonly field?: string;
  readonly rowNumber?: number;
  readonly expected?: string;
  readonly actual?: string;
};

/** Assert that diagnostics include one expected diagnostic shape. */
export function expectDiagnostic(
  diagnostics: readonly OneRosterCsvPackageDiagnostic[],
  expected: ExpectedOneRosterCsvDiagnostic,
): void {
  expect.hasAssertions();
  expect(diagnostics).toContainEqual(expect.objectContaining(expected));
}

/** Assert that diagnostics include every expected diagnostic shape. */
export function expectDiagnosticsContaining(
  diagnostics: readonly OneRosterCsvPackageDiagnostic[],
  expected: readonly ExpectedOneRosterCsvDiagnostic[],
): void {
  expect.hasAssertions();
  expect(diagnostics).toEqual(
    expect.arrayContaining(expected.map((diagnostic) => expect.objectContaining(diagnostic))),
  );
}

/** Assert a missing target-record reference diagnostic. */
export function expectMissingTargetRecordDiagnostic(
  diagnostics: readonly OneRosterCsvPackageDiagnostic[],
  expected: {
    readonly sourceFile: string;
    readonly rowNumber: number;
    readonly field: string;
    readonly targetFile: string;
  },
): void {
  expect.hasAssertions();
  expectDiagnostic(diagnostics, {
    code: "reference.missing_target_record",
    fileName: expected.sourceFile,
    rowNumber: expected.rowNumber,
    field: expected.field,
    expected: expected.targetFile,
    actual: "missing",
  });
}
