import {
  isOneRosterCsvFileName,
  oneRosterCsvDataFileNames,
  type OneRosterCsvFileName,
} from "./one-roster-csv-file.js";
import {
  manifestPropertyNameForDataFileName,
  parseOneRosterManifestCsv,
  type OneRosterManifest,
} from "./one-roster-csv-manifest.js";
import {
  packageDiagnostic,
  packageDiagnosticFromZip,
  type OneRosterCsvPackageDiagnostic,
} from "./one-roster-csv-package-diagnostic.js";
import { parseOneRosterCsvTable, type OneRosterCsvTable } from "./one-roster-csv-table.js";
import { err, ok, type Result } from "./result.js";
import { readZipEntries, type ZipEntry, type ZipReadOptions } from "./zip.js";

/** Parsed OneRoster CSV package with a strict manifest and normalized raw data tables. */
export type OneRosterCsvPackage = {
  readonly manifest: OneRosterManifest;
  readonly tables: ReadonlyArray<OneRosterCsvTable>;
};

/** Options for parsing OneRoster CSV ZIP packages. */
export type OneRosterCsvPackageOptions = {
  readonly zip?: ZipReadOptions;
  readonly oneRosterVersion?: "1.2";
};

/** Parse a OneRoster CSV ZIP archive into a strict manifest and normalized raw tables. */
export function parseOneRosterCsvZip(
  bytes: Uint8Array,
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const zipEntries = readZipEntries(bytes, options.zip);

  if (zipEntries._tag === "err") {
    return err([packageDiagnosticFromZip(zipEntries.error)]);
  }

  return parseOneRosterCsvPackageEntries(zipEntries.value, options);
}

/** Parse already-extracted root-level ZIP entries into a strict OneRoster CSV package. */
export function parseOneRosterCsvPackageEntries(
  entries: readonly ZipEntry[],
  options: OneRosterCsvPackageOptions = {},
): Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]> {
  const expectedOneRosterVersion = options.oneRosterVersion ?? "1.2";
  const diagnostics: OneRosterCsvPackageDiagnostic[] = [];
  const entriesByFileName = new Map<OneRosterCsvFileName, ZipEntry>();

  for (const entry of entries) {
    if (!isOneRosterCsvFileName(entry.path)) {
      diagnostics.push(
        packageDiagnostic({
          code: "package.unknown_file",
          message: "ZIP package contains a file outside the OneRoster CSV 1.2 catalog.",
          entryName: entry.path,
        }),
      );
      continue;
    }

    if (entriesByFileName.has(entry.path)) {
      diagnostics.push(
        packageDiagnostic({
          code: "package.duplicate_file",
          message: "ZIP package contains the same OneRoster CSV file more than once.",
          fileName: entry.path,
        }),
      );
      continue;
    }

    entriesByFileName.set(entry.path, entry);
  }

  const manifestEntry = entriesByFileName.get("manifest.csv");

  if (manifestEntry === undefined) {
    diagnostics.push(
      packageDiagnostic({
        code: "package.missing_manifest",
        message: "OneRoster CSV 1.2 packages must include manifest.csv.",
        fileName: "manifest.csv",
      }),
    );
    return err(diagnostics);
  }

  const manifest = parseOneRosterManifestCsv(manifestEntry.bytes, expectedOneRosterVersion);

  if (manifest._tag === "err") {
    diagnostics.push(...manifest.error);
    return err(diagnostics);
  }

  const tables: OneRosterCsvTable[] = [];

  for (const fileName of oneRosterCsvDataFileNames) {
    const mode = manifest.value.fileModes[fileName];
    const entry = entriesByFileName.get(fileName);
    const propertyName = manifestPropertyNameForDataFileName(fileName);

    if (mode === "absent") {
      if (entry !== undefined) {
        diagnostics.push(
          packageDiagnostic({
            code: "manifest.file_unexpected",
            message:
              "Manifest marks a OneRoster CSV file as absent, but the ZIP package supplies it.",
            fileName,
            propertyName,
            expected: "absent",
            actual: "present",
          }),
        );
      }

      continue;
    }

    if (entry === undefined) {
      diagnostics.push(
        packageDiagnostic({
          code: "manifest.file_missing",
          message: "Manifest requires a OneRoster CSV file that is missing from the ZIP package.",
          fileName,
          propertyName,
          expected: mode,
          actual: "absent",
        }),
      );
      continue;
    }

    const table = parseOneRosterCsvTable(entry.bytes, fileName, mode);

    if (table._tag === "err") {
      diagnostics.push(...table.error);
      continue;
    }

    tables.push(table.value);
  }

  if (diagnostics.length > 0) {
    return err(diagnostics);
  }

  return ok({
    manifest: manifest.value,
    tables,
  });
}

export type {
  OneRosterCsvPackageDiagnostic,
  OneRosterCsvPackageDiagnosticCode,
} from "./one-roster-csv-package-diagnostic.js";
export type {
  OneRosterManifest,
  OneRosterManifestFileMode,
  OneRosterManifestFileModes,
  OneRosterManifestSource,
} from "./one-roster-csv-manifest.js";
export type {
  OneRosterCsvTable,
  OneRosterCsvTableRow,
  OneRosterSuppliedFileMode,
} from "./one-roster-csv-table.js";
