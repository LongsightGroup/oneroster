import type {
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvResourcesPackage,
  OneRosterCsvValidatedResourcesPackage,
  Result,
} from "../../src/index.js";

/** Assert a resources parse succeeded and return the package. */
export function expectResourcesOk(
  result: Result<OneRosterCsvResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvResourcesPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected resources parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a resources parse failed and return diagnostics. */
export function expectResourcesErr(
  result: Result<OneRosterCsvResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected resources parse to fail.");
  }

  return result.error;
}

/** Assert resources validation succeeded and return the validated package. */
export function expectValidatedResourcesOk(
  result: Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvValidatedResourcesPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected resources validation to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert resources validation failed and return diagnostics. */
export function expectValidatedResourcesErr(
  result: Result<OneRosterCsvValidatedResourcesPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected resources validation to fail.");
  }

  return result.error;
}
