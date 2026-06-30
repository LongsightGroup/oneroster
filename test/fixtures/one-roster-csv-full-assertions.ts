import type {
  OneRosterCsvFullPackage,
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvValidatedFullPackage,
  Result,
} from "../../src/index.js";

/** Assert a full CSV parse succeeded and return the package. */
export function expectFullOk(
  result: Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvFullPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected full CSV parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a full CSV parse failed and return diagnostics. */
export function expectFullErr(
  result: Result<OneRosterCsvFullPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected full CSV parse to fail.");
  }

  return result.error;
}

/** Assert full CSV validation succeeded and return the validated package. */
export function expectValidatedFullOk(
  result: Result<OneRosterCsvValidatedFullPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvValidatedFullPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected full CSV validation to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert full CSV validation failed and return diagnostics. */
export function expectValidatedFullErr(
  result: Result<OneRosterCsvValidatedFullPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected full CSV validation to fail.");
  }

  return result.error;
}
