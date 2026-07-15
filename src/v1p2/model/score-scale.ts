import { ok, type Result } from "../../result.js";
import {
  parseOneRosterV1p2EntityBaseRecordAt,
  parseOneRosterV1p2RecordAt,
  rejectUnknownOneRosterV1p2Properties,
  requireOneRosterV1p2Property,
  optionalOneRosterV1p2Property,
  type OneRosterV1p2EntityBase,
} from "./entity.js";
import { parseOneRosterV1p2ArrayAt, parseOneRosterV1p2StringAt } from "./primitive.js";
import {
  gradebookParser,
  gradebookReference,
  type Diagnostics,
  type RootParser,
} from "./gradebook-parsing.js";
import type { OneRosterV1p2Reference } from "./reference.js";

/** A score-scale value mapping. */
export interface OneRosterV1p2ScoreScaleValue {
  readonly itemValueLHS: string;
  readonly itemValueRHS: string;
}

/** A Gradebook score-scale entity. */
export interface OneRosterV1p2ScoreScale extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly type: string;
  readonly class: OneRosterV1p2Reference<"class">;
  readonly scoreScaleValue: ReadonlyArray<OneRosterV1p2ScoreScaleValue>;
  readonly course?: OneRosterV1p2Reference<"course">;
}

function parseScoreScaleValueAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2ScoreScaleValue, Diagnostics> {
  const record = parseOneRosterV1p2RecordAt(input, path);
  if (record._tag === "err") return record;
  const unknown = rejectUnknownOneRosterV1p2Properties(
    record.value,
    new Set(["itemValueLHS", "itemValueRHS"]),
    path,
  );
  if (unknown._tag === "err") return unknown;
  const lhs = requireOneRosterV1p2Property(
    record.value,
    "itemValueLHS",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (lhs._tag === "err") return lhs;
  const rhs = requireOneRosterV1p2Property(
    record.value,
    "itemValueRHS",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (rhs._tag === "err") return rhs;
  return ok({ itemValueLHS: lhs.value, itemValueRHS: rhs.value });
}

function parseScoreScaleAt(
  input: unknown,
  path: string,
): Result<OneRosterV1p2ScoreScale, Diagnostics> {
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
      "type",
      "course",
      "class",
      "scoreScaleValue",
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
  const type = requireOneRosterV1p2Property(record.value, "type", path, parseOneRosterV1p2StringAt);
  if (type._tag === "err") return type;
  const classRef = requireOneRosterV1p2Property(
    record.value,
    "class",
    path,
    gradebookReference("class"),
  );
  if (classRef._tag === "err") return classRef;
  const values = requireOneRosterV1p2Property(
    record.value,
    "scoreScaleValue",
    path,
    (value, nestedPath) => parseOneRosterV1p2ArrayAt(value, nestedPath, parseScoreScaleValueAt, 1),
  );
  if (values._tag === "err") return values;
  const course = optionalOneRosterV1p2Property(
    record.value,
    "course",
    path,
    gradebookReference("course"),
  );
  if (course._tag === "err") return course;
  return ok({
    ...base.value,
    title: title.value,
    type: type.value,
    class: classRef.value,
    scoreScaleValue: values.value,
    ...(course.value === undefined ? {} : { course: course.value }),
  });
}

/** Parse a Gradebook score-scale entity. */
export const parseOneRosterV1p2ScoreScale: RootParser<OneRosterV1p2ScoreScale> =
  gradebookParser(parseScoreScaleAt);
