import { zipSync } from "fflate";

import {
  oneRosterCsvDataFileNames,
  type OneRosterCsvDataFileName,
  type OneRosterCsvPackage,
  type OneRosterCsvPackageDiagnostic,
  type Result,
} from "../../src/index.js";

const textEncoder = new TextEncoder();

/** Build a ZIP archive from string file contents for package tests. */
export function zipPackage(files: Readonly<Record<string, string>>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};

  for (const [fileName, contents] of Object.entries(files)) {
    entries[fileName] = textEncoder.encode(contents);
  }

  return zipSync(entries);
}

export type ManifestCsvOptions = {
  readonly header?: string;
  readonly manifestVersion?: string;
  readonly oneRosterVersion?: string;
  readonly modes?: ReadonlyMap<string, string>;
  readonly omitProperties?: ReadonlySet<string>;
  readonly extraRows?: ReadonlyArray<string>;
};

/** Build a manifest.csv document for package and rostering tests. */
export function manifestCsv(options: ManifestCsvOptions = {}): string {
  const rows: string[] = [options.header ?? "propertyName,value"];

  addManifestRow(rows, options, "manifest.version", options.manifestVersion ?? "1.0");
  addManifestRow(rows, options, "oneroster.version", options.oneRosterVersion ?? "1.2");

  for (const fileName of oneRosterCsvDataFileNames) {
    addManifestRow(
      rows,
      options,
      manifestPropertyName(fileName),
      options.modes?.get(fileName) ?? "absent",
    );
  }

  if (options.extraRows !== undefined) {
    rows.push(...options.extraRows);
  }

  return rows.join("\n");
}

function addManifestRow(
  rows: string[],
  options: ManifestCsvOptions,
  propertyName: string,
  value: string,
): void {
  if (options.omitProperties?.has(propertyName) === true) {
    return;
  }

  rows.push(`${propertyName},${value}`);
}

function manifestPropertyName(fileName: OneRosterCsvDataFileName): string {
  return `file.${fileName.slice(0, fileName.length - ".csv".length)}`;
}

/** Build a minimal CSV document from a header row and data rows. */
export function csvDocument(
  header: readonly string[],
  rows: ReadonlyArray<readonly string[]>,
): string {
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string): string {
  if (!/[",\r\n]/u.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

/** Assert a package parse succeeded and return the value. */
export function expectPackageOk(
  result: Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): OneRosterCsvPackage {
  if (result._tag === "err") {
    throw new Error(
      `Expected package parse to succeed, got ${result.error[0]?.code ?? "unknown error"}.`,
    );
  }

  return result.value;
}

/** Assert a package parse failed and return diagnostics. */
export function expectPackageErr(
  result: Result<OneRosterCsvPackage, readonly OneRosterCsvPackageDiagnostic[]>,
): readonly OneRosterCsvPackageDiagnostic[] {
  if (result._tag === "ok") {
    throw new Error("Expected package parse to fail.");
  }

  return result.error;
}
