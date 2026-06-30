/** Prefix required for OneRoster CSV metadata extension headers. */
export const oneRosterMetadataHeaderPrefix = "metadata.";

/** Return true when a header is a non-empty OneRoster metadata extension header. */
export function isOneRosterMetadataHeader(value: string): boolean {
  return (
    value.startsWith(oneRosterMetadataHeaderPrefix) &&
    value.length > oneRosterMetadataHeaderPrefix.length
  );
}
