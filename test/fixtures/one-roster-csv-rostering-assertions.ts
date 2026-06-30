import {
  parseOneRosterGuid,
  type OneRosterCsvPackageDiagnostic,
  type OneRosterCsvRosteringPackage,
  type OneRosterCsvValidatedRosteringPackage,
  type OneRosterGuid,
  type Result,
} from "../../src/index.js";

/** Parse a test fixture GUID or throw when the fixture is invalid. */
export function fixtureGuid(value: string): OneRosterGuid {
  const parsed = parseOneRosterGuid(value);

  if (parsed === undefined) {
    throw new Error("Test fixture GUID is invalid.");
  }

  return parsed;
}

/** Assert a rostering parse succeeded and return the package. */
export function expectRosteringOk(
  result: Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvRosteringPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected rostering parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a rostering parse failed and return diagnostics. */
export function expectRosteringErr(
  result: Result<OneRosterCsvRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected rostering parse to fail.");
  }

  return result.error;
}

/** Assert rostering validation succeeded and return the validated package. */
export function expectValidatedOk(
  result: Result<OneRosterCsvValidatedRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvValidatedRosteringPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected rostering validation to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert rostering validation failed and return diagnostics. */
export function expectValidatedErr(
  result: Result<OneRosterCsvValidatedRosteringPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected rostering validation to fail.");
  }

  return result.error;
}
