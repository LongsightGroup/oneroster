import type { OneRosterExtensionVocabularyToken } from "./one-roster-csv-record-types.js";

/** Return true when a string is a non-empty OneRoster extension vocabulary token. */
export function isExtensionVocabularyToken(
  value: string,
): value is OneRosterExtensionVocabularyToken {
  return value.startsWith("ext:") && value.length > "ext:".length;
}
