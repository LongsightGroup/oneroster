import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { readZipEntries } from "../src/index.js";

describe("readZipEntries", () => {
  it("extracts root-level ZIP files behind the local ZipEntry contract", () => {
    const zipBytes = zipSync({
      "manifest.csv": new TextEncoder().encode("propertyName,value\nmanifest.version,1.0"),
      "users.csv": new TextEncoder().encode("sourcedId,status\nu1,active"),
    });

    const result = readZipEntries(zipBytes);

    expect(result).toMatchObject({
      _tag: "ok",
      value: [{ path: "manifest.csv" }, { path: "users.csv" }],
    });
  });

  it("rejects nested entries because OneRoster files must be at the archive root", () => {
    const zipBytes = zipSync({
      "oneroster/users.csv": new TextEncoder().encode("sourcedId\nu1"),
    });

    const result = readZipEntries(zipBytes);

    expect(result).toEqual({
      _tag: "err",
      error: {
        _tag: "ZipDiagnostic",
        code: "zip.entry_nested_path",
        message: "OneRoster ZIP entries must be files at the archive root.",
        entryName: "oneroster/users.csv",
      },
    });
  });

  it("rejects path traversal entries before nested path classification", () => {
    const zipBytes = zipSync({
      "../users.csv": new TextEncoder().encode("sourcedId\nu1"),
    });

    const result = readZipEntries(zipBytes);

    expect(result).toEqual({
      _tag: "err",
      error: {
        _tag: "ZipDiagnostic",
        code: "zip.entry_path_traversal",
        message: "ZIP entry contains a path traversal segment.",
        entryName: "../users.csv",
      },
    });
  });

  it("rejects invalid ZIP archives", () => {
    const result = readZipEntries(new Uint8Array([1, 2, 3]));

    expect(result).toEqual({
      _tag: "err",
      error: {
        _tag: "ZipDiagnostic",
        code: "zip.invalid_archive",
        message: "ZIP archive could not be read.",
      },
    });
  });
});
