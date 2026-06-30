import type { OneRosterCsvPackageWriteDiagnostic } from "../../src/index.js";
import type { Result } from "../../src/result.js";

/** Assert a Result succeeded and return the value. */
export function expectOk<T, E>(result: Result<T, E>): T {
  if (result._tag === "err") {
    throw new Error("Expected Result to succeed.");
  }

  return result.value;
}

/** Assert a Result failed and return the error. */
export function expectErr<T, E>(result: Result<T, E>): E {
  if (result._tag === "ok") {
    throw new Error("Expected Result to fail.");
  }

  return result.error;
}

/** Assert a package write succeeded and return the value. */
export function expectPackageWriteOk<T>(
  result: Result<T, readonly OneRosterCsvPackageWriteDiagnostic[]>,
): T {
  if (result._tag === "err") {
    throw new Error(
      `Expected package write to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a package write failed and return diagnostics. */
export function expectPackageWriteErr<T>(
  result: Result<T, readonly OneRosterCsvPackageWriteDiagnostic[]>,
): readonly OneRosterCsvPackageWriteDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected package write to fail.");
  }

  return result.error;
}

/** Return the only record from a single-item collection. */
export function onlyRecord<T>(records: readonly T[]): T {
  const record = records[0];

  if (record === undefined || records.length !== 1) {
    throw new Error("Expected exactly one record.");
  }

  return record;
}
