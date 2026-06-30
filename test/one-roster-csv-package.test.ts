import { describe, expect, it } from "vitest";

import { parseOneRosterCsvPackageEntries, parseOneRosterCsvZip } from "../src/index.js";
import {
  expectPackageErr,
  expectPackageOk,
  manifestCsv,
  zipPackage,
} from "./fixtures/one-roster-csv-package-fixtures.js";

const textEncoder = new TextEncoder();

describe("parseOneRosterCsvZip", () => {
  it("accepts a manifest-only package when every data file is absent", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv(),
      }),
    );

    const packageValue = expectPackageOk(result);

    expect(packageValue.manifest.manifestVersion).toBe("1.0");
    expect(packageValue.manifest.oneRosterVersion).toBe("1.2");
    expect(packageValue.manifest.fileModes["users.csv"]).toBe("absent");
    expect(packageValue.tables).toEqual([]);
  });

  it("accepts a manifest-declared users.csv table", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([["users.csv", "bulk"]]),
        }),
        "users.csv": "sourcedId,username\nu1,alex",
      }),
    );

    const packageValue = expectPackageOk(result);

    expect(packageValue.manifest.fileModes["users.csv"]).toBe("bulk");
    expect(packageValue.tables).toEqual([
      {
        fileName: "users.csv",
        manifestMode: "bulk",
        header: ["sourcedId", "username"],
        rows: [
          {
            rowNumber: 2,
            values: ["u1", "alex"],
            valuesByHeader: {
              sourcedId: "u1",
              username: "alex",
            },
          },
        ],
      },
    ]);
  });

  it("reports a missing manifest", () => {
    const result = parseOneRosterCsvPackageEntries([
      { path: "users.csv", bytes: textEncoder.encode("sourcedId\nu1") },
    ]);

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "package.missing_manifest",
        fileName: "manifest.csv",
      }),
    );
  });

  it("reports an invalid manifest header", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({ header: "PropertyName,value" }),
      }),
    );

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "manifest.invalid_header",
        fileName: "manifest.csv",
        rowNumber: 1,
      }),
    );
  });

  it("reports missing, duplicate, unknown, malformed, and invalid manifest properties", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([["categories.csv", "replace"]]),
          omitProperties: new Set(["file.users"]),
          extraRows: ["manifest.version,1.0", "vendor.extension,true", "source.systemName"],
        }),
      }),
    );

    const codes = expectPackageErr(result).map((diagnostic) => diagnostic.code);

    expect(codes).toContain("manifest.invalid_file_mode");
    expect(codes).toContain("manifest.missing_property");
    expect(codes).toContain("manifest.duplicate_property");
    expect(codes).toContain("manifest.unknown_property");
    expect(codes).toContain("manifest.row_width_mismatch");
  });

  it("reports invalid manifest and OneRoster versions", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          manifestVersion: "2.0",
          oneRosterVersion: "1.1",
        }),
      }),
    );

    const codes = expectPackageErr(result).map((diagnostic) => diagnostic.code);

    expect(codes).toContain("manifest.invalid_manifest_version");
    expect(codes).toContain("manifest.invalid_oneroster_version");
  });

  it("reports manifest-required files that are missing from the ZIP package", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([["users.csv", "delta"]]),
        }),
      }),
    );

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "manifest.file_missing",
        fileName: "users.csv",
        propertyName: "file.users",
        expected: "delta",
        actual: "absent",
      }),
    );
  });

  it("reports ZIP files that the manifest marks absent", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv(),
        "users.csv": "sourcedId\nu1",
      }),
    );

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "manifest.file_unexpected",
        fileName: "users.csv",
        propertyName: "file.users",
      }),
    );
  });

  it("reports unknown ZIP entries", () => {
    const result = parseOneRosterCsvPackageEntries([
      { path: "manifest.csv", bytes: textEncoder.encode(manifestCsv()) },
      { path: "extra.csv", bytes: textEncoder.encode("sourcedId\nx1") },
    ]);

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "package.unknown_file",
        entryName: "extra.csv",
      }),
    );
  });

  it("reports data CSV parse failures with file and location context", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([["users.csv", "bulk"]]),
        }),
        "users.csv": 'sourcedId\n"u1',
      }),
    );

    expect(expectPackageErr(result)).toContainEqual(
      expect.objectContaining({
        code: "csv.unclosed_quote",
        fileName: "users.csv",
        rowNumber: 2,
      }),
    );
  });

  it("reports duplicate headers, missing data rows, and wrong-width data rows", () => {
    const result = parseOneRosterCsvZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["categories.csv", "bulk"],
            ["classes.csv", "bulk"],
            ["users.csv", "bulk"],
          ]),
        }),
        "categories.csv": "sourcedId,sourcedId\nc1,c2",
        "classes.csv": "sourcedId,title\nc1",
        "users.csv": "sourcedId",
      }),
    );

    const diagnostics = expectPackageErr(result);
    const codes = diagnostics.map((diagnostic) => diagnostic.code);

    expect(codes).toContain("table.duplicate_header");
    expect(codes).toContain("table.missing_data_rows");
    expect(codes).toContain("table.row_width_mismatch");

    for (const diagnostic of diagnostics) {
      expect(diagnostic).not.toHaveProperty("rawRow");
    }
  });
});
