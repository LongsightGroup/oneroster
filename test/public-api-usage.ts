import {
  ok,
  parseAndValidateOneRosterCsvFullZip,
  parseAndValidateOneRosterCsvGradebookZip,
  parseAndValidateOneRosterCsvResourcesZip,
  parseAndValidateOneRosterCsvRosteringZip,
  parseCsv,
  parseOneRosterCsvPackageEntries,
  parseOneRosterCsvZip,
  writeCsvBytes,
  writeOneRosterCsvFullZip,
  writeOneRosterCsvGradebookZip,
  writeOneRosterCsvPackageZip,
  writeOneRosterCsvResourcesZip,
  writeOneRosterCsvRosteringZip,
  type CsvDocument,
  type CsvParseDiagnostic,
  type CsvWriteDiagnostic,
  type OneRosterCsvFullPackage,
  type OneRosterCsvGradebookPackage,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageDiagnostic,
  type OneRosterCsvPackageDiagnosticCode,
  type OneRosterCsvPackageWriteDiagnostic,
  type OneRosterCsvResourcesPackage,
  type OneRosterCsvRosteringPackage,
  type Result,
  type ZipEntry,
} from "../src/index.js";

export function parseRawPackageExample(
  bytes: Uint8Array,
): Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvZip(bytes);
}

export function parseEntriesExample(
  entries: readonly ZipEntry[],
): Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  return parseOneRosterCsvPackageEntries(entries);
}

export function parseCsvExample(text: string): Result<CsvDocument, CsvParseDiagnostic> {
  return parseCsv(text);
}

export function writeCsvExample(): Result<Uint8Array, CsvWriteDiagnostic> {
  return writeCsvBytes([
    ["sourcedId", "title"],
    ["line-item-1", "Unit Quiz"],
  ]);
}

export function validateFullExample(
  bytes: Uint8Array,
): Result<number, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseAndValidateOneRosterCsvFullZip(bytes, { referenceMode: "allRows" });

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value.gradebookValidation.indexes.resultsBySourcedId.size);
}

export function validateRosteringExample(
  bytes: Uint8Array,
): Result<number, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseAndValidateOneRosterCsvRosteringZip(bytes);

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value.indexes.usersBySourcedId.size);
}

export function validateGradebookExample(
  bytes: Uint8Array,
): Result<number, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseAndValidateOneRosterCsvGradebookZip(bytes);

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value.indexes.lineItemsBySourcedId.size);
}

export function validateResourcesExample(
  bytes: Uint8Array,
): Result<number, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseAndValidateOneRosterCsvResourcesZip(bytes);

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value.indexes.resourcesBySourcedId.size);
}

export function writeRawPackageExample(
  packageValue: OneRosterCsvPackage,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvPackageZip(packageValue);
}

export function writeRosteringExample(
  packageValue: OneRosterCsvRosteringPackage,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvRosteringZip(packageValue);
}

export function writeGradebookExample(
  packageValue: OneRosterCsvGradebookPackage,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvGradebookZip(packageValue);
}

export function writeResourcesExample(
  packageValue: OneRosterCsvResourcesPackage,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvResourcesZip(packageValue);
}

export function writeFullExample(
  packageValue: OneRosterCsvFullPackage,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvFullZip(packageValue);
}

export function diagnosticCodeExample(
  diagnostic: OneRosterCsvPackageDiagnostic,
): OneRosterCsvPackageDiagnosticCode {
  return diagnostic.code;
}

export function resultNarrowingExample(result: Result<string, CsvWriteDiagnostic>): string {
  if (result._tag === "err") {
    return result.error.code;
  }

  return result.value;
}
