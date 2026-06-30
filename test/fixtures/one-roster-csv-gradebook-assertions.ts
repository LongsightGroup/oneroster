import type {
  OneRosterCsvGradebookPackage,
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvValidatedGradebookPackage,
  Result,
} from "../../src/index.js";

/** Assert a gradebook parse succeeded and return the package. */
export function expectGradebookOk(
  result: Result<OneRosterCsvGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvGradebookPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected gradebook parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a gradebook parse failed and return diagnostics. */
export function expectGradebookErr(
  result: Result<OneRosterCsvGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected gradebook parse to fail.");
  }

  return result.error;
}

/** Assert gradebook validation succeeded and return the validated package. */
export function expectValidatedGradebookOk(
  result: Result<OneRosterCsvValidatedGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvValidatedGradebookPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected gradebook validation to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert gradebook validation failed and return diagnostics. */
export function expectValidatedGradebookErr(
  result: Result<OneRosterCsvValidatedGradebookPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected gradebook validation to fail.");
  }

  return result.error;
}
