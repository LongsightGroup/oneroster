import type { OneRosterDateTime, OneRosterGuid } from "./one-roster-csv-primitive.js";

/** OneRoster extension vocabulary token accepted only on spec-allowed fields. */
export type OneRosterExtensionVocabularyToken = `ext:${string}`;

/** Delta lifecycle status values allowed by the OneRoster CSV binding. */
export type OneRosterCsvDeltaStatus = "active" | "tobedeleted";

/** Row lifecycle for a bulk CSV table. */
export type OneRosterCsvBulkLifecycle = {
  readonly mode: "bulk";
};

/** Row lifecycle for a delta CSV table. */
export type OneRosterCsvDeltaLifecycle = {
  readonly mode: "delta";
  readonly status: OneRosterCsvDeltaStatus;
  readonly dateLastModified: OneRosterDateTime;
};

/** Row lifecycle normalized from the table manifest mode and lifecycle columns. */
export type OneRosterCsvRowLifecycle = OneRosterCsvBulkLifecycle | OneRosterCsvDeltaLifecycle;

/** Metadata extension column values carried by a typed OneRoster CSV record. */
export type OneRosterCsvRecordMetadata = Readonly<Record<string, string>>;

/** Common fields shared by typed OneRoster CSV records. */
export type OneRosterCsvRecordBase = {
  readonly rowNumber: number;
  readonly sourcedId: OneRosterGuid;
  readonly lifecycle: OneRosterCsvRowLifecycle;
  readonly metadata: OneRosterCsvRecordMetadata;
};
