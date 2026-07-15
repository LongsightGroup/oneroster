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
  parseOneRosterV1p2DateTimeAt,
  parseOneRosterV1p2NumberAt,
  parseOneRosterV1p2StringAt,
  type OneRosterV1p2DateTime,
} from "./primitive.js";
import {
  gradebookParser,
  gradebookReference,
  parseLearningObjectiveSetAt,
  type Diagnostics,
  type OneRosterV1p2LearningObjectiveSet,
  type RootParser,
} from "./gradebook-parsing.js";
import type { OneRosterV1p2Reference } from "./reference.js";

/** A Gradebook line-item entity. */
export interface OneRosterV1p2LineItem extends OneRosterV1p2EntityBase {
  readonly title: string;
  readonly assignDate: OneRosterV1p2DateTime;
  readonly dueDate: OneRosterV1p2DateTime;
  readonly class: OneRosterV1p2Reference<"class">;
  readonly school: OneRosterV1p2Reference<"org">;
  readonly category: OneRosterV1p2Reference<"category">;
  readonly description?: string;
  readonly gradingPeriod?: OneRosterV1p2Reference<"academicSession">;
  readonly academicSession?: OneRosterV1p2Reference<"academicSession">;
  readonly scoreScale?: OneRosterV1p2Reference<"scoreScale">;
  readonly resultValueMin?: number;
  readonly resultValueMax?: number;
  readonly learningObjectiveSet?: ReadonlyArray<OneRosterV1p2LearningObjectiveSet>;
}

function parseLineItemAt(input: unknown, path: string): Result<OneRosterV1p2LineItem, Diagnostics> {
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
      "assignDate",
      "dueDate",
      "class",
      "school",
      "category",
      "gradingPeriod",
      "academicSession",
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
  const assignDate = requireOneRosterV1p2Property(
    record.value,
    "assignDate",
    path,
    parseOneRosterV1p2DateTimeAt,
  );
  if (assignDate._tag === "err") return assignDate;
  const dueDate = requireOneRosterV1p2Property(
    record.value,
    "dueDate",
    path,
    parseOneRosterV1p2DateTimeAt,
  );
  if (dueDate._tag === "err") return dueDate;
  const classRef = requireOneRosterV1p2Property(
    record.value,
    "class",
    path,
    gradebookReference("class"),
  );
  if (classRef._tag === "err") return classRef;
  const school = requireOneRosterV1p2Property(
    record.value,
    "school",
    path,
    gradebookReference("org"),
  );
  if (school._tag === "err") return school;
  const category = requireOneRosterV1p2Property(
    record.value,
    "category",
    path,
    gradebookReference("category"),
  );
  if (category._tag === "err") return category;
  const description = optionalOneRosterV1p2Property(
    record.value,
    "description",
    path,
    parseOneRosterV1p2StringAt,
  );
  if (description._tag === "err") return description;
  const gradingPeriod = optionalOneRosterV1p2Property(
    record.value,
    "gradingPeriod",
    path,
    gradebookReference("academicSession"),
  );
  if (gradingPeriod._tag === "err") return gradingPeriod;
  const academicSession = optionalOneRosterV1p2Property(
    record.value,
    "academicSession",
    path,
    gradebookReference("academicSession"),
  );
  if (academicSession._tag === "err") return academicSession;
  const scoreScale = optionalOneRosterV1p2Property(
    record.value,
    "scoreScale",
    path,
    gradebookReference("scoreScale"),
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
    assignDate: assignDate.value,
    dueDate: dueDate.value,
    class: classRef.value,
    school: school.value,
    category: category.value,
    ...(description.value === undefined ? {} : { description: description.value }),
    ...(gradingPeriod.value === undefined ? {} : { gradingPeriod: gradingPeriod.value }),
    ...(academicSession.value === undefined ? {} : { academicSession: academicSession.value }),
    ...(scoreScale.value === undefined ? {} : { scoreScale: scoreScale.value }),
    ...(resultValueMin.value === undefined ? {} : { resultValueMin: resultValueMin.value }),
    ...(resultValueMax.value === undefined ? {} : { resultValueMax: resultValueMax.value }),
    ...(learningObjectiveSet.value === undefined
      ? {}
      : { learningObjectiveSet: learningObjectiveSet.value }),
  });
}

/** Parse a Gradebook line-item entity. */
export const parseOneRosterV1p2LineItem: RootParser<OneRosterV1p2LineItem> =
  gradebookParser(parseLineItemAt);
