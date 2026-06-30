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

/** Reason a ZIP entry path failed root-level validation. */
export type RootZipEntryPathFailure =
  | "empty_name"
  | "directory"
  | "absolute_path"
  | "path_traversal"
  | "nested_path";

/** Audience used when formatting root ZIP entry path failure messages. */
export type RootZipEntryPathFailureContext = "zip.read" | "package.write";

/** Safe diagnostic fields for a root ZIP entry path validation failure. */
export type RootZipEntryPathFailureDescription = {
  readonly message: string;
  readonly path?: string;
};

/** Validate that a ZIP entry path is a safe root-level file name. */
export function validateRootZipEntryPath(
  entryName: string,
): Result<string, RootZipEntryPathFailure> {
  if (entryName === "") {
    return err("empty_name");
  }

  if (entryName.endsWith("/") || entryName.endsWith("\\")) {
    return err("directory");
  }

  if (entryName.startsWith("/") || entryName.startsWith("\\") || hasWindowsDrivePrefix(entryName)) {
    return err("absolute_path");
  }

  const pathSegments = entryName.split(/[\\/]/u);

  if (pathSegments.includes("..")) {
    return err("path_traversal");
  }

  if (pathSegments.length > 1) {
    return err("nested_path");
  }

  return ok(entryName);
}

/** Format a root ZIP entry path failure for read or package-write diagnostics. */
export function describeRootZipEntryPathFailure(
  failure: RootZipEntryPathFailure,
  entryName: string,
  context: RootZipEntryPathFailureContext,
): RootZipEntryPathFailureDescription {
  const path = failure === "empty_name" ? undefined : entryName;

  switch (failure) {
    case "empty_name":
      return {
        message:
          context === "zip.read"
            ? "ZIP entry has an empty file name."
            : "OneRoster CSV package writer received an empty file name.",
      };
    case "directory":
      return {
        message:
          context === "zip.read"
            ? "ZIP archive contains a directory entry."
            : "OneRoster CSV package writer received a directory entry.",
        ...(path !== undefined ? { path } : {}),
      };
    case "absolute_path":
      return {
        message:
          context === "zip.read"
            ? "ZIP entry uses an absolute path."
            : "OneRoster CSV package writer received an absolute file path.",
        ...(path !== undefined ? { path } : {}),
      };
    case "path_traversal":
      return {
        message:
          context === "zip.read"
            ? "ZIP entry contains a path traversal segment."
            : "OneRoster CSV package writer received a path traversal segment.",
        ...(path !== undefined ? { path } : {}),
      };
    case "nested_path":
      return {
        message:
          context === "zip.read"
            ? "OneRoster ZIP entries must be files at the archive root."
            : "OneRoster CSV package ZIP entries must be files at the archive root.",
        ...(path !== undefined ? { path } : {}),
      };
    default: {
      const exhaustiveFailure: RootZipEntryPathFailure = failure;
      throw new Error(`Unhandled root ZIP entry path failure: ${String(exhaustiveFailure)}.`);
    }
  }
}

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
  const validatedPath = validateRootZipEntryPath(entryName);

  if (validatedPath._tag === "err") {
    return err(rootZipEntryPathDiagnostic(validatedPath.error, entryName));
  }

  return validatedPath;
}

function rootZipEntryPathDiagnostic(
  failure: RootZipEntryPathFailure,
  entryName: string,
): ZipDiagnostic {
  const description = describeRootZipEntryPathFailure(failure, entryName, "zip.read");

  return zipDiagnostic({
    code: zipDiagnosticCodeForRootZipEntryPathFailure(failure),
    message: description.message,
    ...(description.path !== undefined ? { entryName: description.path } : {}),
  });
}

function zipDiagnosticCodeForRootZipEntryPathFailure(
  failure: RootZipEntryPathFailure,
): Extract<
  ZipDiagnosticCode,
  | "zip.entry_empty_name"
  | "zip.entry_directory"
  | "zip.entry_absolute_path"
  | "zip.entry_path_traversal"
  | "zip.entry_nested_path"
> {
  switch (failure) {
    case "empty_name":
      return "zip.entry_empty_name";
    case "directory":
      return "zip.entry_directory";
    case "absolute_path":
      return "zip.entry_absolute_path";
    case "path_traversal":
      return "zip.entry_path_traversal";
    case "nested_path":
      return "zip.entry_nested_path";
    default: {
      const exhaustiveFailure: RootZipEntryPathFailure = failure;
      throw new Error(`Unhandled root ZIP entry path failure: ${String(exhaustiveFailure)}.`);
    }
  }
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
