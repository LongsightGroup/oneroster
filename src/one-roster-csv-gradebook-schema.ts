import type { OneRosterCsvGradebookFileName } from "./one-roster-csv-gradebook-types.js";

/** Spec-defined headers for categories.csv in exact order. */
export const categoryHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "weight",
] as const;

/** Spec-defined headers for lineItems.csv in exact order. */
export const lineItemHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "description",
  "assignDate",
  "dueDate",
  "classSourcedId",
  "categorySourcedId",
  "academicSessionSourcedId",
  "resultValueMin",
  "resultValueMax",
  "schoolSourcedId",
] as const;

/** Spec-defined headers for results.csv in exact order. */
export const resultHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "lineItemSourcedId",
  "studentSourcedId",
  "scoreStatus",
  "score",
  "scoreDate",
  "comment",
  "textScore",
  "classSourcedId",
  "inProgress",
  "incomplete",
  "late",
  "missing",
] as const;

/** Spec-defined headers for scoreScales.csv in exact order. */
export const scoreScaleHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "type",
  "orgSourcedId",
  "courseSourcedId",
  "classSourcedId",
  "scoreScaleValue",
] as const;

/** Spec-defined headers for lineItemLearningObjectiveIds.csv in exact order. */
export const lineItemLearningObjectiveIdHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "lineItemSourcedId",
  "source",
  "learningObjectiveId",
] as const;

/** Spec-defined headers for lineItemScoreScales.csv in exact order. */
export const lineItemScoreScaleHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "lineItemSourcedId",
  "scoreScaleSourcedId",
] as const;

/** Spec-defined headers for resultLearningObjectiveIds.csv in exact order. */
export const resultLearningObjectiveIdHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "resultSourcedId",
  "source",
  "learningObjectiveId",
  "score",
  "textScore",
] as const;

/** Spec-defined headers for resultScoreScales.csv in exact order. */
export const resultScoreScaleHeaders = [
  "sourcedId",
  "status",
  "dateLastModified",
  "title",
  "resultSourcedId",
  "scoreScaleSourcedId",
] as const;

/** All gradebook table headers keyed by file name for tests and tooling. */
export const gradebookTableHeaders: Readonly<
  Record<OneRosterCsvGradebookFileName, readonly string[]>
> = {
  "categories.csv": categoryHeaders,
  "lineItems.csv": lineItemHeaders,
  "results.csv": resultHeaders,
  "scoreScales.csv": scoreScaleHeaders,
  "lineItemLearningObjectiveIds.csv": lineItemLearningObjectiveIdHeaders,
  "lineItemScoreScales.csv": lineItemScoreScaleHeaders,
  "resultLearningObjectiveIds.csv": resultLearningObjectiveIdHeaders,
  "resultScoreScales.csv": resultScoreScaleHeaders,
};

/** OneRoster learning objective source vocabulary values. */
export const learningObjectiveSourceValues = ["case", "unknown"] as const;

/** OneRoster results.csv scoreStatus vocabulary values. */
export const resultScoreStatusValues = [
  "exempt",
  "fully graded",
  "not submitted",
  "partially graded",
  "submitted",
] as const;
