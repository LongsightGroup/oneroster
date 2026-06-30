import { packageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvTable } from "./one-roster-csv-table.js";

const metadataHeaderPrefix = "metadata.";

/** Validate typed OneRoster CSV headers against spec order and metadata placement rules. */
export function validateOneRosterCsvRecordHeader(
  table: OneRosterCsvTable,
  expectedHeaders: readonly string[],
  diagnostics: OneRosterCsvPackageDiagnostic[],
): ReadonlyArray<string> | undefined {
  const beforeCount = diagnostics.length;
  const reportedMissingHeaders = new Set<string>();

  for (let index = 0; index < expectedHeaders.length; index += 1) {
    const expectedHeader = expectedHeaders[index];
    const actualHeader = table.header[index];

    if (expectedHeader === undefined) {
      continue;
    }

    if (actualHeader === undefined) {
      diagnostics.push(
        packageDiagnostic({
          code: "schema.missing_header",
          message: "OneRoster CSV table is missing a spec-defined header.",
          fileName: table.fileName,
          rowNumber: 1,
          field: expectedHeader,
        }),
      );
      reportedMissingHeaders.add(expectedHeader);
      continue;
    }

    if (actualHeader === expectedHeader) {
      continue;
    }

    diagnostics.push(
      packageDiagnostic({
        code: isMetadataHeader(actualHeader)
          ? "schema.metadata_column_position"
          : "schema.header_order_mismatch",
        message: isMetadataHeader(actualHeader)
          ? "OneRoster metadata columns must appear after all spec-defined columns."
          : "OneRoster CSV headers must match the spec-defined order and case.",
        fileName: table.fileName,
        rowNumber: 1,
        field: expectedHeader,
        expected: expectedHeader,
        actual: actualHeader,
      }),
    );
  }

  for (const expectedHeader of expectedHeaders) {
    if (table.header.includes(expectedHeader) || reportedMissingHeaders.has(expectedHeader)) {
      continue;
    }

    diagnostics.push(
      packageDiagnostic({
        code: "schema.missing_header",
        message: "OneRoster CSV table is missing a spec-defined header.",
        fileName: table.fileName,
        rowNumber: 1,
        field: expectedHeader,
      }),
    );
  }

  for (let index = expectedHeaders.length; index < table.header.length; index += 1) {
    const header = table.header[index];

    if (header === undefined || isMetadataHeader(header)) {
      continue;
    }

    diagnostics.push(
      packageDiagnostic({
        code: "schema.invalid_metadata_header",
        message: "OneRoster extension columns must be metadata-prefixed columns at the end.",
        fileName: table.fileName,
        rowNumber: 1,
        field: header,
        expected: `${metadataHeaderPrefix}*`,
        actual: header,
      }),
    );
  }

  if (diagnostics.length > beforeCount) {
    return undefined;
  }

  return table.header.slice(expectedHeaders.length);
}

function isMetadataHeader(value: string): boolean {
  return value.startsWith(metadataHeaderPrefix) && value.length > metadataHeaderPrefix.length;
}
