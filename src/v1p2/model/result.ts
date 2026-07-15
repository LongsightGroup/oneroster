import { ok, type Result } from "../../result.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
  type OneRosterV1p2EntityBase,
} from "./entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2BooleanTokenAt,
  parseOneRosterV1p2DateAt,
  parseOneRosterV1p2KnownOrExtensionTokenAt,
  parseOneRosterV1p2NumberAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2Date,
  type OneRosterV1p2ExtensionToken,
} from "./primitive.js";
import {
  gradebookParser,
  gradebookReference,
  parseLearningObjectiveScoreSetAt,
  type Diagnostics,
  type OneRosterV1p2LearningObjectiveScoreSet,
  type RootParser,
} from "./gradebook-parsing.js";
import type { OneRosterV1p2Reference } from "./reference.js";

/** A result score-status vocabulary token. */
export type OneRosterV1p2ScoreStatus =
  | "exempt"
  | "fully graded"
  | "not submitted"
  | "partially graded"
  | "submitted"
  | OneRosterV1p2ExtensionToken;

/** A Gradebook result entity. */
export interface OneRosterV1p2Result extends OneRosterV1p2EntityBase {
  readonly lineItem: OneRosterV1p2Reference<"lineItem">;
  readonly student: OneRosterV1p2Reference<"user">;
  readonly scoreStatus: OneRosterV1p2ScoreStatus;
  readonly scoreDate: OneRosterV1p2Date;
  readonly class?: OneRosterV1p2Reference<"class">;
  readonly scoreScale?: OneRosterV1p2Reference<"scoreScale">;
  readonly score?: number;
  readonly textScore?: string;
  readonly comment?: string;
  readonly learningObjectiveSet?: ReadonlyArray<OneRosterV1p2LearningObjectiveScoreSet>;
  readonly inProgress?: "true" | "false";
  readonly incomplete?: "true" | "false";
  readonly late?: "true" | "false";
  readonly missing?: "true" | "false";
}

function parseResultAt(input: unknown, path: string): Result<OneRosterV1p2Result, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const allowed = new Set([
    "sourcedId",
    "status",
    "dateLastModified",
    "metadata",
    "lineItem",
    "student",
    "class",
    "scoreScale",
    "scoreStatus",
    "score",
    "textScore",
    "scoreDate",
    "comment",
    "learningObjectiveSet",
    "inProgress",
    "incomplete",
    "late",
    "missing",
  ]);
  const unknown = rejectUnknownOneRosterV1p2Properties(record.value, allowed, path);
  if (unknown._tag === "err") return unknown;
  const base = parseOneRosterV1p2EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  const lineItem = requireOneRosterV1p2Property(
    record.value,
    "lineItem",
    path,
    gradebookReference("lineItem"),
  );
  if (lineItem._tag === "err") return lineItem;
  const student = requireOneRosterV1p2Property(
    record.value,
    "student",
    path,
    gradebookReference("user"),
  );
  if (student._tag === "err") return student;
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
  const scoreDate = requireOneRosterV1p2Property(
    record.value,
    "scoreDate",
    path,
    parseOneRosterV1p2DateAt,
  );
  if (scoreDate._tag === "err") return scoreDate;
  const classRef = optionalOneRosterV1p2Property(
    record.value,
    "class",
    path,
    gradebookReference("class"),
  );
  if (classRef._tag === "err") return classRef;
  const scoreScale = optionalOneRosterV1p2Property(
    record.value,
    "scoreScale",
    path,
    gradebookReference("scoreScale"),
  );
  if (scoreScale._tag === "err") return scoreScale;
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
  const bool = (property: string): Result<"true" | "false" | undefined, Diagnostics> =>
    optionalOneRosterV1p2Property(record.value, property, path, parseOneRosterV1p2BooleanTokenAt);
  const inProgress = bool("inProgress");
  if (inProgress._tag === "err") return inProgress;
  const incomplete = bool("incomplete");
  if (incomplete._tag === "err") return incomplete;
  const late = bool("late");
  if (late._tag === "err") return late;
  const missing = bool("missing");
  if (missing._tag === "err") return missing;
  return ok({
    ...base.value,
    lineItem: lineItem.value,
    student: student.value,
    scoreStatus: scoreStatus.value,
    scoreDate: scoreDate.value,
    ...(classRef.value === undefined ? {} : { class: classRef.value }),
    ...(scoreScale.value === undefined ? {} : { scoreScale: scoreScale.value }),
    ...(score.value === undefined ? {} : { score: score.value }),
    ...(textScore.value === undefined ? {} : { textScore: textScore.value }),
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

/** Parse a Gradebook result entity. */
export const parseOneRosterV1p2Result: RootParser<OneRosterV1p2Result> =
  gradebookParser(parseResultAt);
