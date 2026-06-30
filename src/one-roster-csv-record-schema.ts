/** Requiredness policy for a spec-defined OneRoster CSV field. */
export type OneRosterCsvFieldRequiredness = "required" | "optional";

/** Format allowed vocabulary values for diagnostic expected text. */
export function formatVocabularyExpected(
  values: readonly string[],
  allowExtension: boolean,
): string {
  const parts = [...values];

  if (allowExtension) {
    parts.push("ext:*");
  }

  return parts.join("|");
}
