import {
  createOneRosterManifestFileModes,
  formatOneRosterDiagnosticLocation,
  formatOneRosterUserDisplayName,
  getFirstActiveOneRosterResultScoreScale,
  getOneRosterLineItemScoreScales,
  getOneRosterRecordStatus,
  getOneRosterUserStatus,
  getResultScoreScaleSourcedIdsByResultSourcedId,
  iterateResolvedStudentEnrollments,
  oneRosterCsvTableHeaders,
  oneRosterManifestRows,
  oneRosterRecordToCsvCells,
  oneRosterRecordToCsvObject,
  ok,
  parseAndValidateOneRosterCsvFullEntries,
  parseAndValidateOneRosterCsvFullZip,
  parseAndValidateOneRosterCsvGradebookZip,
  parseAndValidateOneRosterCsvResourcesZip,
  parseAndValidateOneRosterCsvRosteringZip,
  parseCsv,
  parseOneRosterCsvPackageEntries,
  parseOneRosterCsvZip,
  writeCsvBytes,
  writeOneRosterCsvFullPackageEntriesFromRecords,
  writeOneRosterCsvFullPackageZipFromRecords,
  writeOneRosterCsvFullZip,
  writeOneRosterCsvGradebookZip,
  writeOneRosterCsvPackageZip,
  writeOneRosterCsvPackageZipFromEntries,
  writeOneRosterCsvPackageZipFromFiles,
  writeOneRosterCsvResourcesZip,
  writeOneRosterCsvRosteringZip,
  type CsvDocument,
  type CsvParseDiagnostic,
  type CsvWriteDiagnostic,
  type OneRosterCsvFullPackage,
  type OneRosterCsvFullPackageRecordCollections,
  type OneRosterCsvGradebookPackage,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageDiagnostic,
  type OneRosterCsvPackageDiagnosticCode,
  type OneRosterCsvPackageWriteDiagnostic,
  type OneRosterCsvResourcesPackage,
  type OneRosterCsvRosteringPackage,
  type OneRosterCsvValidatedFullPackage,
  type OneRosterManifestFileModes,
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

export function entriesOptionTypeChecks(entries: readonly ZipEntry[]): void {
  parseOneRosterCsvPackageEntries(entries, { oneRosterVersion: "1.2" });
  parseAndValidateOneRosterCsvFullEntries(entries, {
    oneRosterVersion: "1.2",
    referenceMode: "allRows",
  });
  parseOneRosterCsvPackageEntries(entries, {
    // @ts-expect-error Already-extracted package entries do not accept ZIP read options.
    zip: { limits: { maxEntries: 1 } },
  });
  parseAndValidateOneRosterCsvFullEntries(entries, {
    // @ts-expect-error Already-extracted full package entries do not accept ZIP read options.
    zip: { limits: { maxEntries: 1 } },
  });
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

export function validateFullEntriesExample(
  entries: readonly ZipEntry[],
): Result<number, readonly OneRosterCsvPackageDiagnostic[]> {
  const result = parseAndValidateOneRosterCsvFullEntries(entries, { referenceMode: "allRows" });

  if (result._tag === "err") {
    return result;
  }

  return ok(result.value.resolvedIndexes.usersBySourcedId.size);
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

export function manifestModesExample(): OneRosterManifestFileModes {
  return createOneRosterManifestFileModes(["users.csv"], {
    "users.csv": "delta",
  });
}

export function writeDirectEntriesExample(
  entries: readonly ZipEntry[],
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvPackageZipFromEntries(entries);
}

export function writeDirectFilesExample(): Result<
  Uint8Array,
  readonly OneRosterCsvPackageWriteDiagnostic[]
> {
  return writeOneRosterCsvPackageZipFromFiles({
    "manifest.csv": "propertyName,value\nmanifest.version,1.0\noneroster.version,1.2\n",
  });
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

export function writeFullRecordsExample(
  records: OneRosterCsvFullPackageRecordCollections,
): Result<Uint8Array, readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvFullPackageZipFromRecords(records);
}

export function writeFullRecordEntriesExample(
  records: OneRosterCsvFullPackageRecordCollections,
): Result<readonly ZipEntry[], readonly OneRosterCsvPackageWriteDiagnostic[]> {
  return writeOneRosterCsvFullPackageEntriesFromRecords(records, {
    fileModes: { "users.csv": "bulk" },
  });
}

export function manifestRowsExample(
  packageValue: OneRosterCsvPackage,
): ReadonlyArray<readonly string[]> {
  return oneRosterManifestRows(packageValue.manifest.fileModes, packageValue.manifest.source);
}

export function tableHeaderExample(): readonly string[] {
  return oneRosterCsvTableHeaders["users.csv"];
}

export function recordProjectionExample(packageValue: OneRosterCsvFullPackage): readonly string[] {
  const user = packageValue.rosteringPackage.users[0];

  if (user === undefined) {
    return [];
  }

  const object = oneRosterRecordToCsvObject("users.csv", user);

  return [...oneRosterRecordToCsvCells("users.csv", user), object["username"] ?? ""];
}

export function statusExample(packageValue: OneRosterCsvFullPackage): string {
  const user = packageValue.rosteringPackage.users[0];

  if (user === undefined) {
    return "missing";
  }

  return `${getOneRosterRecordStatus(user)}:${getOneRosterUserStatus(user)}`;
}

export function userDisplayNameExample(packageValue: OneRosterCsvFullPackage): string {
  const user = packageValue.rosteringPackage.users[0];

  return user === undefined ? "missing" : formatOneRosterUserDisplayName(user);
}

export function relationshipHelperExample(packageValue: OneRosterCsvValidatedFullPackage): number {
  const lineItem = packageValue.fullPackage.gradebookPackage.lineItems[0];
  const result = packageValue.fullPackage.gradebookPackage.results[0];
  const scoreScaleCount =
    lineItem === undefined ? 0 : getOneRosterLineItemScoreScales(packageValue, lineItem).length;
  const firstResultScoreScale =
    result === undefined ? null : getFirstActiveOneRosterResultScoreScale(packageValue, result);
  const resultScoreScales = getResultScoreScaleSourcedIdsByResultSourcedId(packageValue);

  return (
    [...iterateResolvedStudentEnrollments(packageValue)].length +
    scoreScaleCount +
    resultScoreScales.size +
    (firstResultScoreScale === null ? 0 : 1)
  );
}

export function diagnosticLocationExample(
  diagnostic: OneRosterCsvPackageDiagnostic,
): string | null {
  return formatOneRosterDiagnosticLocation(diagnostic);
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
