import type {
  OneRosterDate,
  OneRosterFloat,
  OneRosterGuid,
  OneRosterInteger,
} from "./one-roster-csv-primitive.js";
import type {
  OneRosterCsvRecordBase,
  OneRosterExtensionVocabularyToken,
} from "./one-roster-csv-record-types.js";
import type { OneRosterCsvRosteringPackage } from "./one-roster-csv-rostering-types.js";

/** OneRoster 1.2 CSV gradebook files supported by the typed row parser. */
export type OneRosterCsvGradebookFileName =
  | "categories.csv"
  | "lineItems.csv"
  | "results.csv"
  | "scoreScales.csv"
  | "lineItemLearningObjectiveIds.csv"
  | "lineItemScoreScales.csv"
  | "resultLearningObjectiveIds.csv"
  | "resultScoreScales.csv";

/** Common fields shared by typed OneRoster CSV gradebook records. */
export type OneRosterCsvGradebookRecordBase = OneRosterCsvRecordBase;

/** OneRoster learning objective source vocabulary values. */
export type OneRosterLearningObjectiveSource =
  | "case"
  | "unknown"
  | OneRosterExtensionVocabularyToken;

/** OneRoster results.csv scoreStatus vocabulary values. */
export type OneRosterResultScoreStatus =
  | "exempt"
  | "fully graded"
  | "not submitted"
  | "partially graded"
  | "submitted"
  | OneRosterExtensionVocabularyToken;

/** Typed OneRoster categories.csv record. */
export type OneRosterCategoryRecord = OneRosterCsvGradebookRecordBase & {
  readonly title: string;
  readonly weight: OneRosterInteger | undefined;
};

/** Typed OneRoster lineItems.csv record. */
export type OneRosterLineItemRecord = OneRosterCsvGradebookRecordBase & {
  readonly title: string;
  readonly description: string | undefined;
  readonly assignDate: OneRosterDate;
  readonly dueDate: OneRosterDate;
  readonly classSourcedId: OneRosterGuid;
  readonly categorySourcedId: OneRosterGuid;
  readonly academicSessionSourcedId: OneRosterGuid;
  readonly resultValueMin: OneRosterFloat | undefined;
  readonly resultValueMax: OneRosterFloat | undefined;
  readonly schoolSourcedId: OneRosterGuid;
};

/** Typed OneRoster results.csv record. */
export type OneRosterResultRecord = OneRosterCsvGradebookRecordBase & {
  readonly lineItemSourcedId: OneRosterGuid;
  readonly studentSourcedId: OneRosterGuid;
  readonly scoreStatus: OneRosterResultScoreStatus;
  readonly score: OneRosterFloat | undefined;
  readonly scoreDate: OneRosterDate;
  readonly comment: string | undefined;
  readonly textScore: string | undefined;
  readonly classSourcedId: OneRosterGuid | undefined;
  readonly inProgress: boolean | undefined;
  readonly incomplete: boolean | undefined;
  readonly late: boolean | undefined;
  readonly missing: boolean | undefined;
};

/** Typed OneRoster scoreScales.csv record. */
export type OneRosterScoreScaleRecord = OneRosterCsvGradebookRecordBase & {
  readonly title: string;
  readonly type: string;
  readonly orgSourcedId: OneRosterGuid;
  readonly courseSourcedId: OneRosterGuid;
  readonly classSourcedId: OneRosterGuid;
  readonly scoreScaleValue: ReadonlyArray<string>;
};

/** Typed OneRoster lineItemLearningObjectiveIds.csv record. */
export type OneRosterLineItemLearningObjectiveIdRecord = OneRosterCsvGradebookRecordBase & {
  readonly lineItemSourcedId: OneRosterGuid;
  readonly source: OneRosterLearningObjectiveSource;
  readonly learningObjectiveId: string;
};

/** Typed OneRoster lineItemScoreScales.csv record. */
export type OneRosterLineItemScoreScaleRecord = OneRosterCsvGradebookRecordBase & {
  readonly title: string | undefined;
  readonly lineItemSourcedId: OneRosterGuid;
  readonly scoreScaleSourcedId: OneRosterGuid;
};

/** Typed OneRoster resultLearningObjectiveIds.csv record. */
export type OneRosterResultLearningObjectiveIdRecord = OneRosterCsvGradebookRecordBase & {
  readonly resultSourcedId: OneRosterGuid;
  readonly source: OneRosterLearningObjectiveSource;
  readonly learningObjectiveId: string;
  readonly score: OneRosterFloat | undefined;
  readonly textScore: string | undefined;
};

/** Typed OneRoster resultScoreScales.csv record. */
export type OneRosterResultScoreScaleRecord = OneRosterCsvGradebookRecordBase & {
  readonly title: string | undefined;
  readonly resultSourcedId: OneRosterGuid;
  readonly scoreScaleSourcedId: OneRosterGuid;
};

/** Typed OneRoster CSV gradebook package over an already parsed rostering package. */
export type OneRosterCsvGradebookPackage = {
  readonly rosteringPackage: OneRosterCsvRosteringPackage;
  readonly categories: ReadonlyArray<OneRosterCategoryRecord>;
  readonly lineItems: ReadonlyArray<OneRosterLineItemRecord>;
  readonly results: ReadonlyArray<OneRosterResultRecord>;
  readonly scoreScales: ReadonlyArray<OneRosterScoreScaleRecord>;
  readonly lineItemLearningObjectiveIds: ReadonlyArray<OneRosterLineItemLearningObjectiveIdRecord>;
  readonly lineItemScoreScales: ReadonlyArray<OneRosterLineItemScoreScaleRecord>;
  readonly resultLearningObjectiveIds: ReadonlyArray<OneRosterResultLearningObjectiveIdRecord>;
  readonly resultScoreScales: ReadonlyArray<OneRosterResultScoreScaleRecord>;
};

/** Lookup indexes for typed OneRoster CSV gradebook records keyed by sourcedId. */
export type OneRosterCsvGradebookReferenceIndexes = {
  readonly categoriesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterCategoryRecord>;
  readonly lineItemsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterLineItemRecord>;
  readonly resultsBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterResultRecord>;
  readonly scoreScalesBySourcedId: ReadonlyMap<OneRosterGuid, OneRosterScoreScaleRecord>;
  readonly lineItemLearningObjectiveIdsBySourcedId: ReadonlyMap<
    OneRosterGuid,
    OneRosterLineItemLearningObjectiveIdRecord
  >;
  readonly lineItemScoreScalesBySourcedId: ReadonlyMap<
    OneRosterGuid,
    OneRosterLineItemScoreScaleRecord
  >;
  readonly resultLearningObjectiveIdsBySourcedId: ReadonlyMap<
    OneRosterGuid,
    OneRosterResultLearningObjectiveIdRecord
  >;
  readonly resultScoreScalesBySourcedId: ReadonlyMap<
    OneRosterGuid,
    OneRosterResultScoreScaleRecord
  >;
};
