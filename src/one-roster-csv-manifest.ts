import { parseCsvBytes, type CsvDocument } from "./csv.js";
import {
  isOneRosterCsvDataFileName,
  oneRosterCsvDataFileNames,
  type OneRosterCsvDataFileName,
} from "./one-roster-csv-file.js";
import {
  packageDiagnostic,
  packageDiagnosticFromCsv,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import { err, ok, type Result } from "./result.js";

/** Manifest mode for a OneRoster CSV data file. */
export type OneRosterManifestFileMode = "absent" | "bulk" | "delta";

/** Complete manifest-declared file mode table keyed by canonical CSV data file name. */
export type OneRosterManifestFileModes = Readonly<
  Record<OneRosterCsvDataFileName, OneRosterManifestFileMode>
>;

/** Optional producer metadata declared by manifest.csv. */
export type OneRosterManifestSource = {
  readonly systemName?: string;
  readonly systemCode?: string;
};

/** Parsed and spec-checked OneRoster CSV manifest. */
export type OneRosterManifest = {
  readonly manifestVersion: "1.0";
  readonly oneRosterVersion: "1.2";
  readonly fileModes: OneRosterManifestFileModes;
  readonly source?: OneRosterManifestSource;
};

/** Return whether a manifest declares a data file as supplied. */
export function isManifestDataFilePresent(
  fileModes: OneRosterManifestFileModes,
  targetFileName: OneRosterCsvDataFileName,
): boolean {
  return fileModes[targetFileName] !== "absent";
}

type ManifestPropertyRow = {
  readonly propertyName: string;
  readonly value: string;
  readonly rowNumber: number;
};

/** Parse manifest.csv bytes into a spec-checked OneRoster manifest. */
export function parseOneRosterManifestCsv(
  bytes: Uint8Array,
  expectedOneRosterVersion: "1.2",
): Result<OneRosterManifest, readonly OneRosterCsvPackageDiagnostic[]> {
  const csv = parseCsvBytes(bytes, { fileName: "manifest.csv" });

  if (csv._tag === "err") {
    return err([packageDiagnosticFromCsv(csv.error)]);
  }

  return parseOneRosterManifestDocument(csv.value, expectedOneRosterVersion);
}

/** Return the manifest.csv property name for a canonical data file name. */
export function manifestPropertyNameForDataFileName(fileName: OneRosterCsvDataFileName): string {
  return `file.${fileName.slice(0, fileName.length - ".csv".length)}`;
}

function parseOneRosterManifestDocument(
  document: CsvDocument,
  expectedOneRosterVersion: "1.2",
): Result<OneRosterManifest, readonly OneRosterCsvPackageDiagnostic[]> {
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const header = document.rows[0];

  if (header === undefined) {
    return err([
      packageDiagnostic({
        code: "manifest.missing_header",
        message: "manifest.csv must include a header row.",
        fileName: "manifest.csv",
        rowNumber: 1,
      }),
    ]);
  }

  if (!rowEquals(header, ["propertyName", "value"])) {
    diagnostics.push(
      packageDiagnostic({
        code: "manifest.invalid_header",
        message: "manifest.csv header must be exactly propertyName,value.",
        fileName: "manifest.csv",
        rowNumber: 1,
        expected: "propertyName,value",
        actual: header.join(","),
      }),
    );
  }

  const rowsByPropertyName = collectManifestPropertyRows(document, diagnostics);

  addUnknownPropertyDiagnostics(rowsByPropertyName, diagnostics);
  addVersionDiagnostics(rowsByPropertyName, expectedOneRosterVersion, diagnostics);

  const fileModes = parseManifestFileModes(rowsByPropertyName, diagnostics);

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok(
    createManifest(
      fileModes,
      expectedOneRosterVersion,
      rowsByPropertyName.get("source.systemName")?.value,
      rowsByPropertyName.get("source.systemCode")?.value,
    ),
  );
}

function collectManifestPropertyRows(
  document: CsvDocument,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyMap<string, ManifestPropertyRow> {
  const rowsByPropertyName = new Map<string, ManifestPropertyRow>();

  for (let rowIndex = 1; rowIndex < document.rows.length; rowIndex += 1) {
    const row = document.rows[rowIndex];

    if (row === undefined) {
      continue;
    }

    const rowNumber = rowIndex + 1;
    const propertyRow = parseManifestPropertyRow(row, rowNumber);

    if (propertyRow._tag === "err") {
      diagnostics.push(propertyRow.error);
      continue;
    }

    if (rowsByPropertyName.has(propertyRow.value.propertyName)) {
      diagnostics.push(
        packageDiagnostic({
          code: "manifest.duplicate_property",
          message: "manifest.csv contains a duplicate property.",
          fileName: "manifest.csv",
          rowNumber,
          propertyName: propertyRow.value.propertyName,
        }),
      );
      continue;
    }

    rowsByPropertyName.set(propertyRow.value.propertyName, propertyRow.value);
  }

  return rowsByPropertyName;
}

function parseManifestPropertyRow(
  row: readonly string[],
  rowNumber: number,
): Result<ManifestPropertyRow, OneRosterCsvPackageDiagnostic> {
  if (row.length !== 2) {
    return err(
      packageDiagnostic({
        code: "manifest.row_width_mismatch",
        message: "manifest.csv rows must contain exactly propertyName and value cells.",
        fileName: "manifest.csv",
        rowNumber,
        expected: 2,
        actual: row.length,
      }),
    );
  }

  const propertyName = row[0];
  const value = row[1];

  if (propertyName === undefined || value === undefined) {
    return err(
      packageDiagnostic({
        code: "manifest.row_width_mismatch",
        message: "manifest.csv rows must contain exactly propertyName and value cells.",
        fileName: "manifest.csv",
        rowNumber,
        expected: 2,
        actual: row.length,
      }),
    );
  }

  return ok({ propertyName, value, rowNumber });
}

function addUnknownPropertyDiagnostics(
  rowsByPropertyName: ReadonlyMap<string, ManifestPropertyRow>,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): void {
  for (const propertyRow of rowsByPropertyName.values()) {
    if (isKnownManifestProperty(propertyRow.propertyName)) {
      continue;
    }

    diagnostics.push(
      packageDiagnostic({
        code: "manifest.unknown_property",
        message: "manifest.csv contains an unknown property.",
        fileName: "manifest.csv",
        rowNumber: propertyRow.rowNumber,
        propertyName: propertyRow.propertyName,
      }),
    );
  }
}

function addVersionDiagnostics(
  rowsByPropertyName: ReadonlyMap<string, ManifestPropertyRow>,
  expectedOneRosterVersion: "1.2",
  diagnostics: OneRosterCsvPackageDiagnostic[],
): void {
  const manifestVersionRow = rowsByPropertyName.get("manifest.version");

  if (manifestVersionRow === undefined) {
    addMissingManifestPropertyDiagnostic(diagnostics, "manifest.version");
  } else if (manifestVersionRow.value !== "1.0") {
    diagnostics.push(
      packageDiagnostic({
        code: "manifest.invalid_manifest_version",
        message: "manifest.version must be 1.0 for OneRoster CSV 1.2 packages.",
        fileName: "manifest.csv",
        rowNumber: manifestVersionRow.rowNumber,
        propertyName: manifestVersionRow.propertyName,
        expected: "1.0",
        actual: manifestVersionRow.value,
      }),
    );
  }

  const oneRosterVersionRow = rowsByPropertyName.get("oneroster.version");

  if (oneRosterVersionRow === undefined) {
    addMissingManifestPropertyDiagnostic(diagnostics, "oneroster.version");
  } else if (oneRosterVersionRow.value !== expectedOneRosterVersion) {
    diagnostics.push(
      packageDiagnostic({
        code: "manifest.invalid_oneroster_version",
        message: "oneroster.version must be 1.2 for this parser.",
        fileName: "manifest.csv",
        rowNumber: oneRosterVersionRow.rowNumber,
        propertyName: oneRosterVersionRow.propertyName,
        expected: expectedOneRosterVersion,
        actual: oneRosterVersionRow.value,
      }),
    );
  }
}

function parseManifestFileModes(
  rowsByPropertyName: ReadonlyMap<string, ManifestPropertyRow>,
  diagnostics: OneRosterCsvPackageDiagnostic[],
): OneRosterManifestFileModes {
  const fileModes = createAbsentFileModes();

  for (const fileName of oneRosterCsvDataFileNames) {
    const propertyName = manifestPropertyNameForDataFileName(fileName);
    const propertyRow = rowsByPropertyName.get(propertyName);

    if (propertyRow === undefined) {
      addMissingManifestPropertyDiagnostic(diagnostics, propertyName);
      continue;
    }

    const mode = parseManifestFileMode(propertyRow.value);

    if (mode === undefined) {
      diagnostics.push(
        packageDiagnostic({
          code: "manifest.invalid_file_mode",
          message: "Manifest file modes must be absent, bulk, or delta.",
          fileName,
          rowNumber: propertyRow.rowNumber,
          propertyName,
          expected: "absent|bulk|delta",
          actual: propertyRow.value,
        }),
      );
      continue;
    }

    fileModes[fileName] = mode;
  }

  return fileModes;
}

function addMissingManifestPropertyDiagnostic(
  diagnostics: OneRosterCsvPackageDiagnostic[],
  propertyName: string,
): void {
  diagnostics.push(
    packageDiagnostic({
      code: "manifest.missing_property",
      message: "manifest.csv is missing a required property.",
      fileName: "manifest.csv",
      propertyName,
    }),
  );
}

function createManifest(
  fileModes: OneRosterManifestFileModes,
  oneRosterVersion: "1.2",
  sourceSystemName: string | undefined,
  sourceSystemCode: string | undefined,
): OneRosterManifest {
  const source = createManifestSource(sourceSystemName, sourceSystemCode);

  if (source === undefined) {
    return {
      manifestVersion: "1.0",
      oneRosterVersion,
      fileModes,
    };
  }

  return {
    manifestVersion: "1.0",
    oneRosterVersion,
    fileModes,
    source,
  };
}

function createManifestSource(
  systemName: string | undefined,
  systemCode: string | undefined,
): OneRosterManifestSource | undefined {
  if (systemName === undefined && systemCode === undefined) {
    return undefined;
  }

  if (systemName === undefined) {
    if (systemCode === undefined) {
      return undefined;
    }

    return { systemCode };
  }

  if (systemCode === undefined) {
    return { systemName };
  }

  return { systemName, systemCode };
}

function createAbsentFileModes(): Record<OneRosterCsvDataFileName, OneRosterManifestFileMode> {
  return {
    "academicSessions.csv": "absent",
    "categories.csv": "absent",
    "classes.csv": "absent",
    "classResources.csv": "absent",
    "courseResources.csv": "absent",
    "courses.csv": "absent",
    "demographics.csv": "absent",
    "enrollments.csv": "absent",
    "lineItemLearningObjectiveIds.csv": "absent",
    "lineItems.csv": "absent",
    "lineItemScoreScales.csv": "absent",
    "orgs.csv": "absent",
    "resources.csv": "absent",
    "resultLearningObjectiveIds.csv": "absent",
    "results.csv": "absent",
    "resultScoreScales.csv": "absent",
    "roles.csv": "absent",
    "scoreScales.csv": "absent",
    "userProfiles.csv": "absent",
    "userResources.csv": "absent",
    "users.csv": "absent",
  };
}

function parseManifestFileMode(input: string): OneRosterManifestFileMode | undefined {
  if (input === "absent" || input === "bulk" || input === "delta") {
    return input;
  }

  return undefined;
}

function isKnownManifestProperty(propertyName: string): boolean {
  return (
    propertyName === "manifest.version" ||
    propertyName === "oneroster.version" ||
    propertyName === "source.systemName" ||
    propertyName === "source.systemCode" ||
    dataFileNameForManifestProperty(propertyName) !== undefined
  );
}

function dataFileNameForManifestProperty(
  propertyName: string,
): OneRosterCsvDataFileName | undefined {
  const filePrefix = "file.";

  if (!propertyName.startsWith(filePrefix)) {
    return undefined;
  }

  const fileName = `${propertyName.slice(filePrefix.length)}.csv`;

  return isOneRosterCsvDataFileName(fileName) ? fileName : undefined;
}

function rowEquals(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (const [index, value] of right.entries()) {
    if (left[index] !== value) {
      return false;
    }
  }

  return true;
}
