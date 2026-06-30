export type ConformanceLifecycleMode = "bulk" | "delta";

/** Shared delta timestamp for conformance packages that exercise lifecycle columns. */
export const conformanceDateLastModified = "2025-01-02T03:04:05.006Z";

/** Return lifecycle column values for conformance graph fixtures. */
export function conformanceLifecycleFields(mode: ConformanceLifecycleMode): {
  readonly status: string;
  readonly dateLastModified: string;
} {
  if (mode === "bulk") {
    return { status: "", dateLastModified: "" };
  }

  return { status: "active", dateLastModified: conformanceDateLastModified };
}
