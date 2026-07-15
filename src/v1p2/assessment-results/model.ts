import { ok, type Result } from "../../result.js";
import type {
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadParser,
} from "../model/json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "../model/entity.js";
import type { OneRosterV1p2EntityBase } from "../model/entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2BooleanTokenAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2NumberAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
} from "../model/primitive.js";
import {
  parseOneRosterV1p2ReferenceAt,
  type OneRosterV1p2Reference,
  type OneRosterV1p2ReferenceType,
} from "../model/reference.js";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** Assessment Results Profile v1.0 learning-objective source vocabulary for OneRoster 1.2. */
export type OneRosterV1p2AssessmentLearningObjectiveSource =
  | "case"
  | "unknown"
  | (string & { readonly __oneRosterV1p2AssessmentLearningObjectiveSource: unique symbol });

/** An assessment line item learning-objective identifier set. */
export interface OneRosterV1p2AssessmentLearningObjectiveSet {
  readonly source: OneRosterV1p2AssessmentLearningObjectiveSource;
  readonly learningObjectiveIds: ReadonlyArray<string>;
}

/** A learning-objective score associated with an assessment result. */
export interface OneRosterV1p2AssessmentLearningObjectiveResult {
  readonly learningObjectiveId: string;
  readonly score?: number;
  readonly textScore?: string;
}

/** An assessment result learning-objective score set. */
export interface OneRosterV1p2AssessmentLearningObjectiveScoreSet {
  readonly source: OneRosterV1p2AssessmentLearningObjectiveSource;
  readonly learningObjectiveResults: ReadonlyArray<OneRosterV1p2AssessmentLearningObjectiveResult>;
}

/** A score-status token from the Assessment Results Profile v1.0 vocabulary. */
export type OneRosterV1p2AssessmentScoreStatus =
  | "exempt"
  | "fully graded"
  | "not submitted"
  | "partially graded"
  | "submitted"
  | OneRosterV1p2ExtensionToken;

/** An assessment line item from the Assessment Results Profile v1.0 for OneRoster 1.2. */
export interface OneRosterV1p2AssessmentLineItem extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly description?: string;
  readonly class?: OneRosterV1p2Reference<"class">;
  readonly parentAssessmentLineItem?: OneRosterV1p2Reference<"assessmentLineItem">;
  readonly scoreScale?: OneRosterV1p2Reference<"scoreScale">;
  readonly resultValueMin?: number;
  readonly resultValueMax?: number;
  readonly learningObjectiveSet?: ReadonlyArray<OneRosterV1p2AssessmentLearningObjectiveSet>;
}

/** An assessment result from the Assessment Results Profile v1.0 for OneRoster 1.2. */
export interface OneRosterV1p2AssessmentResult extends OneRosterV1p2EntityBase {
  readonly assessmentLineItem: OneRosterV1p2Reference<"assessmentLineItem">;
  readonly student: OneRosterV1p2Reference<"user">;
  readonly score?: number;
  readonly textScore?: string;
  readonly scoreDate: OneRosterV1p2Date;
  readonly scoreScale?: OneRosterV1p2Reference<"scoreScale">;
  readonly scorePercentile?: number;
  readonly scoreStatus: OneRosterV1p2AssessmentScoreStatus;
  readonly comment?: string;
  readonly learningObjectiveSet?: ReadonlyArray<OneRosterV1p2AssessmentLearningObjectiveScoreSet>;
  readonly inProgress?: "true" | "false";
  readonly incomplete?: "true" | "false";
  readonly late?: "true" | "false";
  readonly missing?: "true" | "false";
}

const reference =
  <TType extends OneRosterV1p2ReferenceType>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

function parseLearningObjectiveSourceAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentLearningObjectiveSource, Diagnostics> {
  const value = parseOneRosterV1p2StringAt(input, path);
  if (value._tag === "err") return value;
  if (value.value === "case" || value.value === "unknown") return ok(value.value);
  if (!/^\/(?!case$)(?!unknown$)[a-z0-9]+$/.test(value.value)) {
    return {
      _tag: "err",
      error: [
        {
          _tag: "OneRosterV1p2PayloadDiagnostic",
          code: "payload.invalid_value",
          path,
          message: "The assessment learning-objective source is not valid.",
        },
      ],
    };
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the source expression established the profile vocabulary invariant.
  return ok(value.value as OneRosterV1p2AssessmentLearningObjectiveSource);
}

function parseLearningObjectiveSetAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentLearningObjectiveSet, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["source", "learningObjectiveIds"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const source = requireOneRosterV1p2Property(
    record.value,
    "source",
    path,
    parseLearningObjectiveSourceAt,
  );
  if (source._tag === "err") return source;
  const learningObjectiveIds = requireOneRosterV1p2Property(
    record.value,
    "learningObjectiveIds",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2ArrayAt(value, nestedPath, parseOneRosterV1p2StringAt, 1),
  );
  if (learningObjectiveIds._tag === "err") return learningObjectiveIds;
  return ok({ source: source.value, learningObjectiveIds: learningObjectiveIds.value });
}

function parseLearningObjectiveResultAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentLearningObjectiveResult, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["learningObjectiveId", "score", "textScore"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const learningObjectiveId = requireOneRosterV1p2Property(
    record.value,
    "learningObjectiveId",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (learningObjectiveId._tag === "err") return learningObjectiveId;
  const score = optionalOneRosterV1p2Property(
    record.value,
    "score",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (score._tag === "err") return score;
  const textScore = optionalOneRosterV1p2Property(
    record.value,
    "textScore",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (textScore._tag === "err") return textScore;
  return ok({
    learningObjectiveId: learningObjectiveId.value,
    ...(score.value === undefined ? {} : { score: score.value }),
    ...(textScore.value === undefined ? {} : { textScore: textScore.value }),
  });
}

function parseLearningObjectiveScoreSetAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentLearningObjectiveScoreSet, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["source", "learningObjectiveResults"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const source = requireOneRosterV1p2Property(
    record.value,
    "source",
    path,
    parseLearningObjectiveSourceAt,
  );
  if (source._tag === "err") return source;
  const learningObjectiveResults = requireOneRosterV1p2Property(
    record.value,
    "learningObjectiveResults",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2ArrayAt(value, nestedPath, parseLearningObjectiveResultAt, 1),
  );
  if (learningObjectiveResults._tag === "err") return learningObjectiveResults;
  return ok({ source: source.value, learningObjectiveResults: learningObjectiveResults.value });
}

function parseAssessmentLineItemAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentLineItem, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "title",
      "description",
      "class",
      "parentAssessmentLineItem",
      "scoreScale",
      "resultValueMin",
      "resultValueMax",
      "learningObjectiveSet",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const title = requireOneRosterV1p2Property(
    record.value,
    "title",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (title._tag === "err") return title;
  const description = optionalOneRosterV1p2Property(
    record.value,
    "description",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (description._tag === "err") return description;
  const classRef = optionalOneRosterV1p2Property(record.value, "class", path, reference("class"));
  if (classRef._tag === "err") return classRef;
  const parent = optionalOneRosterV1p2Property(
    record.value,
    "parentAssessmentLineItem",
    path,
    reference("assessmentLineItem"),
  );
  if (parent._tag === "err") return parent;
  const scoreScale = optionalOneRosterV1p2Property(
    record.value,
    "scoreScale",
    path,
    reference("scoreScale"),
  );
  if (scoreScale._tag === "err") return scoreScale;
  const resultValueMin = optionalOneRosterV1p2Property(
    record.value,
    "resultValueMin",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (resultValueMin._tag === "err") return resultValueMin;
  const resultValueMax = optionalOneRosterV1p2Property(
    record.value,
    "resultValueMax",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (resultValueMax._tag === "err") return resultValueMax;
  const learningObjectiveSet = optionalOneRosterV1p2Property(
    record.value,
    "learningObjectiveSet",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2ArrayAt(value, nestedPath, parseLearningObjectiveSetAt),
  );
  if (learningObjectiveSet._tag === "err") return learningObjectiveSet;
  return ok({
    ...base.value,
    title: title.value,
    ...(description.value === undefined ? {} : { description: description.value }),
    ...(classRef.value === undefined ? {} : { class: classRef.value }),
    ...(parent.value === undefined ? {} : { parentAssessmentLineItem: parent.value }),
    ...(scoreScale.value === undefined ? {} : { scoreScale: scoreScale.value }),
    ...(resultValueMin.value === undefined ? {} : { resultValueMin: resultValueMin.value }),
    ...(resultValueMax.value === undefined ? {} : { resultValueMax: resultValueMax.value }),
    ...(learningObjectiveSet.value === undefined
      ? {}
      : { learningObjectiveSet: learningObjectiveSet.value }),
  });
}

function parseAssessmentResultAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2AssessmentResult, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set([
      "sourcedId",
      "status",
      "dateLastModified",
      "metadata",
      "assessmentLineItem",
      "student",
      "score",
      "textScore",
      "scoreDate",
      "scoreScale",
      "scorePercentile",
      "scoreStatus",
      "comment",
      "learningObjectiveSet",
      "inProgress",
      "incomplete",
      "late",
      "missing",
    ]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const assessmentLineItem = requireOneRosterV1p2Property(
    record.value,
    "assessmentLineItem",
    path,
    reference("assessmentLineItem"),
  );
  if (assessmentLineItem._tag === "err") return assessmentLineItem;
  const student = requireOneRosterV1p2Property(record.value, "student", path, reference("user"));
  if (student._tag === "err") return student;
  const score = optionalOneRosterV1p2Property(
    record.value,
    "score",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (score._tag === "err") return score;
  const textScore = optionalOneRosterV1p2Property(
    record.value,
    "textScore",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (textScore._tag === "err") return textScore;
  const scoreDate = requireOneRosterV1p2Property(
    record.value,
    "scoreDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (scoreDate._tag === "err") return scoreDate;
  const scoreScale = optionalOneRosterV1p2Property(
    record.value,
    "scoreScale",
    path,
    reference("scoreScale"),
  );
  if (scoreScale._tag === "err") return scoreScale;
  const scorePercentile = optionalOneRosterV1p2Property(
    record.value,
    "scorePercentile",
    path,
    parseOneRosterV1p2NumberAt,
  );
  if (scorePercentile._tag === "err") return scorePercentile;
  const scoreStatus = requireOneRosterV1p2Property(
    record.value,
    "scoreStatus",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2KnownOrExtensionTokenAt(value, nestedPath, [
        "exempt",
        "fully graded",
        "not submitted",
        "partially graded",
        "submitted",
      ] as const),
  );
  if (scoreStatus._tag === "err") return scoreStatus;
  const comment = optionalOneRosterV1p2Property(
    record.value,
    "comment",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (comment._tag === "err") return comment;
  const learningObjectiveSet = optionalOneRosterV1p2Property(
    record.value,
    "learningObjectiveSet",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p2ArrayAt(value, nestedPath, parseLearningObjectiveScoreSetAt),
  );
  if (learningObjectiveSet._tag === "err") return learningObjectiveSet;
  const booleanProperty = (property: string): Result<"true" | "false" | undefined, Diagnostics> =>
    optionalOneRosterV1p2Property(record.value, property, path, parseOneRosterV1p2BooleanTokenAt);
  const inProgress = booleanProperty("inProgress");
  if (inProgress._tag === "err") return inProgress;
  const incomplete = booleanProperty("incomplete");
  if (incomplete._tag === "err") return incomplete;
  const late = booleanProperty("late");
  if (late._tag === "err") return late;
  const missing = booleanProperty("missing");
  if (missing._tag === "err") return missing;
  return ok({
    ...base.value,
    assessmentLineItem: assessmentLineItem.value,
    student: student.value,
    scoreDate: scoreDate.value,
    scoreStatus: scoreStatus.value,
    ...(score.value === undefined ? {} : { score: score.value }),
    ...(textScore.value === undefined ? {} : { textScore: textScore.value }),
    ...(scoreScale.value === undefined ? {} : { scoreScale: scoreScale.value }),
    ...(scorePercentile.value === undefined ? {} : { scorePercentile: scorePercentile.value }),
    ...(comment.value === undefined ? {} : { comment: comment.value }),
    ...(learningObjectiveSet.value === undefined
      ? {}
      : { learningObjectiveSet: learningObjectiveSet.value }),
    ...(inProgress.value === undefined ? {} : { inProgress: inProgress.value }),
    ...(incomplete.value === undefined ? {} : { incomplete: incomplete.value }),
    ...(late.value === undefined ? {} : { late: late.value }),
    ...(missing.value === undefined ? {} : { missing: missing.value }),
  });
}

function parser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): RootParser<TValue> {
  return (input) => parseAt(input, "$");
}

/** Parse an Assessment Results Profile v1.0 assessment line item. */
export const parseOneRosterV1p2AssessmentLineItem: RootParser<OneRosterV1p2AssessmentLineItem> =
  parser(parseAssessmentLineItemAt);

/** Parse an Assessment Results Profile v1.0 assessment result. */
export const parseOneRosterV1p2AssessmentResult: RootParser<OneRosterV1p2AssessmentResult> =
  parser(parseAssessmentResultAt);
