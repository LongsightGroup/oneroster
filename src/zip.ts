import { unzipSync } from "fflate";

import { err, ok, type Result } from "./result.js";

/** A file extracted from a ZIP archive after package-level validation. */
export type ZipEntry = {
  readonly path: string;
  readonly bytes: Uint8Array;
};

/** Limits applied before and after ZIP extraction. */
export type ZipReadLimits = {
  readonly maxCompressedBytes?: number;
  readonly maxEntries?: number;
  readonly maxEntryBytes?: number;
  readonly maxTotalEntryBytes?: number;
};

/** Options for reading a ZIP archive. */
export type ZipReadOptions = {
  readonly limits?: ZipReadLimits;
};

/** Stable ZIP intake diagnostic code. */
export type ZipDiagnosticCode =
  | "zip.input_too_large"
  | "zip.invalid_archive"
  | "zip.entry_count_exceeded"
  | "zip.entry_empty_name"
  | "zip.entry_directory"
  | "zip.entry_absolute_path"
  | "zip.entry_path_traversal"
  | "zip.entry_nested_path"
  | "zip.entry_duplicate_name"
  | "zip.entry_too_large"
  | "zip.total_uncompressed_size_exceeded";

/** Expected ZIP intake failure with safe diagnostic context. */
export type ZipDiagnostic = {
  readonly _tag: "ZipDiagnostic";
  readonly code: ZipDiagnosticCode;
  readonly message: string;
  readonly entryName?: string;
  readonly limit?: number;
  readonly actual?: number;
};

type ResolvedZipReadLimits = {
  readonly maxCompressedBytes: number;
  readonly maxEntries: number;
  readonly maxEntryBytes: number;
  readonly maxTotalEntryBytes: number;
};

type ZipDiagnosticInput = {
  readonly code: ZipDiagnosticCode;
  readonly message: string;
  readonly entryName?: string;
  readonly limit?: number;
  readonly actual?: number;
};

/** Default ZIP limits chosen for roster CSV packages, not arbitrary archival workloads. */
export const defaultZipReadLimits: ResolvedZipReadLimits = {
  maxCompressedBytes: 50 * 1024 * 1024,
  maxEntries: 64,
  maxEntryBytes: 25 * 1024 * 1024,
  maxTotalEntryBytes: 100 * 1024 * 1024,
};

/** Read a ZIP archive into root-level file entries. */
export function readZipEntries(
  bytes: Uint8Array,
  options: ZipReadOptions = {},
): Result<readonly ZipEntry[], ZipDiagnostic> {
  const limits = resolveZipReadLimits(options.limits);

  if (bytes.byteLength > limits.maxCompressedBytes) {
    return err(
      zipDiagnostic({
        code: "zip.input_too_large",
        message: "ZIP archive exceeds the configured compressed size limit.",
        limit: limits.maxCompressedBytes,
        actual: bytes.byteLength,
      }),
    );
  }

  let files: Record<string, Uint8Array>;

  try {
    files = unzipSync(bytes);
  } catch {
    return err(
      zipDiagnostic({
        code: "zip.invalid_archive",
        message: "ZIP archive could not be read.",
      }),
    );
  }

  const fileEntries = Object.entries(files);

  if (fileEntries.length > limits.maxEntries) {
    return err(
      zipDiagnostic({
        code: "zip.entry_count_exceeded",
        message: "ZIP archive contains too many entries.",
        limit: limits.maxEntries,
        actual: fileEntries.length,
      }),
    );
  }

  const seenPaths = new Set<string>();
  const entries: ZipEntry[] = [];
  let totalUncompressedBytes = 0;

  for (const [entryName, entryBytes] of fileEntries) {
    const path = parseRootZipEntryPath(entryName);

    if (path._tag === "err") {
      return path;
    }

    if (seenPaths.has(path.value)) {
      return err(
        zipDiagnostic({
          code: "zip.entry_duplicate_name",
          message: "ZIP archive contains duplicate file names.",
          entryName: path.value,
        }),
      );
    }

    if (entryBytes.byteLength > limits.maxEntryBytes) {
      return err(
        zipDiagnostic({
          code: "zip.entry_too_large",
          message: "ZIP entry exceeds the configured uncompressed size limit.",
          entryName: path.value,
          limit: limits.maxEntryBytes,
          actual: entryBytes.byteLength,
        }),
      );
    }

    totalUncompressedBytes += entryBytes.byteLength;

    if (totalUncompressedBytes > limits.maxTotalEntryBytes) {
      return err(
        zipDiagnostic({
          code: "zip.total_uncompressed_size_exceeded",
          message: "ZIP archive exceeds the configured total uncompressed size limit.",
          limit: limits.maxTotalEntryBytes,
          actual: totalUncompressedBytes,
        }),
      );
    }

    seenPaths.add(path.value);
    entries.push({ path: path.value, bytes: entryBytes });
  }

  return ok(entries);
}

function resolveZipReadLimits(limits?: ZipReadLimits): ResolvedZipReadLimits {
  return {
    maxCompressedBytes: limits?.maxCompressedBytes ?? defaultZipReadLimits.maxCompressedBytes,
    maxEntries: limits?.maxEntries ?? defaultZipReadLimits.maxEntries,
    maxEntryBytes: limits?.maxEntryBytes ?? defaultZipReadLimits.maxEntryBytes,
    maxTotalEntryBytes: limits?.maxTotalEntryBytes ?? defaultZipReadLimits.maxTotalEntryBytes,
  };
}

function parseRootZipEntryPath(entryName: string): Result<string, ZipDiagnostic> {
  if (entryName === "") {
    return err(
      zipDiagnostic({
        code: "zip.entry_empty_name",
        message: "ZIP entry has an empty file name.",
      }),
    );
  }

  if (entryName.endsWith("/") || entryName.endsWith("\\")) {
    return err(
      zipDiagnostic({
        code: "zip.entry_directory",
        message: "ZIP archive contains a directory entry.",
        entryName,
      }),
    );
  }

  if (entryName.startsWith("/") || entryName.startsWith("\\") || hasWindowsDrivePrefix(entryName)) {
    return err(
      zipDiagnostic({
        code: "zip.entry_absolute_path",
        message: "ZIP entry uses an absolute path.",
        entryName,
      }),
    );
  }

  const pathSegments = entryName.split(/[\\/]/u);

  if (pathSegments.includes("..")) {
    return err(
      zipDiagnostic({
        code: "zip.entry_path_traversal",
        message: "ZIP entry contains a path traversal segment.",
        entryName,
      }),
    );
  }

  if (pathSegments.length > 1) {
    return err(
      zipDiagnostic({
        code: "zip.entry_nested_path",
        message: "OneRoster ZIP entries must be files at the archive root.",
        entryName,
      }),
    );
  }

  return ok(entryName);
}

function hasWindowsDrivePrefix(path: string): boolean {
  if (path.length < 3) {
    return false;
  }

  const driveLetter = path.charCodeAt(0);
  const hasDriveLetter =
    (driveLetter >= "A".charCodeAt(0) && driveLetter <= "Z".charCodeAt(0)) ||
    (driveLetter >= "a".charCodeAt(0) && driveLetter <= "z".charCodeAt(0));

  return hasDriveLetter && path[1] === ":" && (path[2] === "\\" || path[2] === "/");
}

function zipDiagnostic(input: ZipDiagnosticInput): ZipDiagnostic {
  let diagnostic: ZipDiagnostic = {
    _tag: "ZipDiagnostic",
    code: input.code,
    message: input.message,
  };

  if (input.entryName !== undefined) {
    diagnostic = { ...diagnostic, entryName: input.entryName };
  }

  if (input.limit !== undefined) {
    diagnostic = { ...diagnostic, limit: input.limit };
  }

  if (input.actual !== undefined) {
    diagnostic = { ...diagnostic, actual: input.actual };
  }

  return diagnostic;
}
