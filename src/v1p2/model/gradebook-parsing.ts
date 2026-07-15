import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic, OneRosterV1p2PayloadParser } from "./json-value.js";
import {
  optionalOneRosterV1p2Property,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
} from "./entity.js";
import {
  parseOneRosterV1p2ArrayAt,
  parseOneRosterV1p2NumberAt,
  parseOneRosterV1p2StringAt,
} from "./primitive.js";
import { parseOneRosterV1p2ReferenceAt, type OneRosterV1p2Reference } from "./reference.js";

export type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;
export type RootParser<TValue> = (input: unknown) => Result<TValue, Diagnostics>;

/** An aligned learning-objective identifier set. */
export interface OneRosterV1p2LearningObjectiveSet {
  readonly source: OneRosterV1p2LearningObjectiveSource;
  readonly learningObjectiveIds: ReadonlyArray<string>;
}

/** An aligned learning-objective result set. */
export interface OneRosterV1p2LearningObjectiveScoreSet {
  readonly source: OneRosterV1p2LearningObjectiveSource;
  readonly learningObjectiveResults: ReadonlyArray<OneRosterV1p2LearningObjectiveResult>;
}

/** A learning-objective source token. */
export type OneRosterV1p2LearningObjectiveSource =
  | "case"
  | "unknown"
  | (string & {
      readonly __oneRosterV1p2LearningObjectiveSource: unique symbol;
    });

/** A score associated with one learning objective. */
export interface OneRosterV1p2LearningObjectiveResult {
  readonly learningObjectiveId: string;
  readonly score?: number;
  readonly textScore?: string;
}

export const gradebookReference =
  <TType extends Parameters<typeof parseOneRosterV1p2ReferenceAt>[1]>(
    type: TType,
  ): OneRosterV1p2PayloadParser<OneRosterV1p2Reference<TType>> =>
  (input, path) =>
    parseOneRosterV1p2ReferenceAt(input, type, path);

/** Parse the common learning-objective source token. */
export function parseLearningSourceAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2LearningObjectiveSource, Diagnostics> {
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
          message: "The learning-objective source is not valid.",
        },
      ],
    };
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the source expression established the profile vocabulary invariant.
  return ok(value.value as OneRosterV1p2LearningObjectiveSource);
}

/** Parse a learning-objective identifier set used by line items. */
export function parseLearningObjectiveSetAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2LearningObjectiveSet, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["source", "learningObjectiveIds"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const source = requireOneRosterV1p2Property(record.value, "source", path, parseLearningSourceAt);
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
): Result<OneRosterV1p2LearningObjectiveResult, Diagnostics> {
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

/** Parse a learning-objective result set used by results. */
export function parseLearningObjectiveScoreSetAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2LearningObjectiveScoreSet, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["source", "learningObjectiveResults"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const source = requireOneRosterV1p2Property(record.value, "source", path, parseLearningSourceAt);
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

export function gradebookParser<TValue>(
  parseAt: (input: unknown, path: string) => Result<TValue, Diagnostics>,
): RootParser<TValue> {
  return (input) => parseAt(input, "$");
}
