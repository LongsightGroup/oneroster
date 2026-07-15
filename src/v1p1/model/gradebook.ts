import { ok, type Result } from "../../result.js";
import {
  optionalOneRosterV1p1Property,
  parseOneRosterV1p1EntityBaseRecordAt,
  parseOneRosterV1p1RecordAt,
  requireOneRosterV1p1Property,
  type OneRosterV1p1EntityBase,
  type OneRosterV1p1Record,
} from "./entity.js";
import {
  parseOneRosterV1p1DateAt,
  parseOneRosterV1p1DateTimeAt,
  parseOneRosterV1p1NumberAt,
  parseOneRosterV1p1StringAt,
  parseOneRosterV1p1TokenAt,
  type OneRosterV1p1Date,
  type OneRosterV1p1DateTime,
  type OneRosterV1p1ExtensionToken,
  type OneRosterV1p1PayloadDiagnostic,
  type OneRosterV1p1PayloadParser,
} from "./primitive.js";
import type { OneRosterV1p1Reference } from "./rostering.js";

type Diagnostics = ReadonlyArray<OneRosterV1p1PayloadDiagnostic>;

/** A Gradebook category. */
export interface OneRosterV1p1Category extends OneRosterV1p1EntityBase {
  readonly title: string;
}

/** A Gradebook line item. */
export interface OneRosterV1p1LineItem extends OneRosterV1p1EntityBase {
  readonly title: string;
  readonly description?: string;
  readonly assignDate: OneRosterV1p1DateTime;
  readonly dueDate: OneRosterV1p1DateTime;
  readonly class: OneRosterV1p1Reference<"class">;
  readonly category: OneRosterV1p1Reference<"category">;
  readonly gradingPeriod: OneRosterV1p1Reference<"academicSession">;
  readonly resultValueMin: number;
  readonly resultValueMax: number;
}

/** OneRoster v1.1 result status. */
export type OneRosterV1p1ScoreStatus =
  | "exempt"
  | "fully graded"
  | "not submitted"
  | "partially graded"
  | "submitted"
  | OneRosterV1p1ExtensionToken;

/** A Gradebook result. */
export interface OneRosterV1p1Result extends OneRosterV1p1EntityBase {
  readonly lineItem: OneRosterV1p1Reference<"lineItem">;
  readonly student: OneRosterV1p1Reference<"user">;
  readonly scoreStatus: OneRosterV1p1ScoreStatus;
  readonly score: number;
  readonly scoreDate: OneRosterV1p1Date;
  readonly comment?: string;
}

function referenceParser<TType extends string>(
  type: TType,
): OneRosterV1p1PayloadParser<OneRosterV1p1Reference<TType>> {
  return (input, path) => {
    const record = parseOneRosterV1p1RecordAt(input, path);
    if (record._tag === "err") return record;
    const href = requiredString(record.value, "href", path);
    if (href._tag === "err") return href;
    const sourcedId = requiredString(record.value, "sourcedId", path);
    if (sourcedId._tag === "err") return sourcedId;
    const actualType = requiredString(record.value, "type", path);
    if (actualType._tag === "err") return actualType;
    return actualType.value === type
      ? ok({ href: href.value, sourcedId: sourcedId.value, type })
      : invalid(path, "The reference type does not match the expected entity.");
  };
}

/** Parse a Category. */
export function parseOneRosterV1p1Category(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Category, Diagnostics> {
  const context = parseContext(input, path);
  if (context._tag === "err") return context;
  const title = requiredString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  return ok({ ...context.value.base, title: title.value });
}

/** Parse a LineItem. */
export function parseOneRosterV1p1LineItem(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1LineItem, Diagnostics> {
  const context = parseContext(input, path);
  if (context._tag === "err") return context;
  const title = requiredString(context.value.record, "title", path);
  if (title._tag === "err") return title;
  const description = optionalString(context.value.record, "description", path);
  if (description._tag === "err") return description;
  const assignDate = requiredProperty(
    context.value.record,
    "assignDate",
    path,
    parseOneRosterV1p1DateTimeAt,
  );
  if (assignDate._tag === "err") return assignDate;
  const dueDate = requiredProperty(
    context.value.record,
    "dueDate",
    path,
    parseOneRosterV1p1DateTimeAt,
  );
  if (dueDate._tag === "err") return dueDate;
  const classValue = requiredReference(context.value.record, "class", "class", path);
  if (classValue._tag === "err") return classValue;
  const category = requiredReference(context.value.record, "category", "category", path);
  if (category._tag === "err") return category;
  const gradingPeriod = requiredReference(
    context.value.record,
    "gradingPeriod",
    "academicSession",
    path,
  );
  if (gradingPeriod._tag === "err") return gradingPeriod;
  const resultValueMin = requiredProperty(
    context.value.record,
    "resultValueMin",
    path,
    parseOneRosterV1p1NumberAt,
  );
  if (resultValueMin._tag === "err") return resultValueMin;
  const resultValueMax = requiredProperty(
    context.value.record,
    "resultValueMax",
    path,
    parseOneRosterV1p1NumberAt,
  );
  if (resultValueMax._tag === "err") return resultValueMax;
  return ok({
    ...context.value.base,
    title: title.value,
    assignDate: assignDate.value,
    dueDate: dueDate.value,
    class: classValue.value,
    category: category.value,
    gradingPeriod: gradingPeriod.value,
    resultValueMin: resultValueMin.value,
    resultValueMax: resultValueMax.value,
    ...(description.value === undefined ? {} : { description: description.value }),
  });
}

/** Parse a Result. */
export function parseOneRosterV1p1Result(
  input: unknown,
  path = "$",
): Result<OneRosterV1p1Result, Diagnostics> {
  const context = parseContext(input, path);
  if (context._tag === "err") return context;
  const lineItem = requiredReference(context.value.record, "lineItem", "lineItem", path);
  if (lineItem._tag === "err") return lineItem;
  const student = requiredReference(context.value.record, "student", "user", path);
  if (student._tag === "err") return student;
  const scoreStatus = requiredProperty(
    context.value.record,
    "scoreStatus",
    path,
    (value, nestedPath) =>
      parseOneRosterV1p1TokenAt<OneRosterV1p1ScoreStatus>(value, nestedPath, [
        "exempt",
        "fully graded",
        "not submitted",
        "partially graded",
        "submitted",
      ]),
  );
  if (scoreStatus._tag === "err") return scoreStatus;
  const score = requiredProperty(context.value.record, "score", path, parseOneRosterV1p1NumberAt);
  if (score._tag === "err") return score;
  const scoreDate = requiredProperty(
    context.value.record,
    "scoreDate",
    path,
    parseOneRosterV1p1DateAt,
  );
  if (scoreDate._tag === "err") return scoreDate;
  const comment = optionalString(context.value.record, "comment", path);
  if (comment._tag === "err") return comment;
  return ok({
    ...context.value.base,
    lineItem: lineItem.value,
    student: student.value,
    scoreStatus: scoreStatus.value,
    score: score.value,
    scoreDate: scoreDate.value,
    ...(comment.value === undefined ? {} : { comment: comment.value }),
  });
}

function parseContext(
  input: unknown,
  path: string,
): Result<
  { readonly record: OneRosterV1p1Record; readonly base: OneRosterV1p1EntityBase },
  Diagnostics
> {
  const record = parseOneRosterV1p1RecordAt(input, path);
  if (record._tag === "err") return record;
  const base = parseOneRosterV1p1EntityBaseRecordAt(record.value, path);
  if (base._tag === "err") return base;
  return ok({ record: record.value, base: base.value });
}

function requiredString(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<string, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, parseOneRosterV1p1StringAt);
}

function optionalString(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
): Result<string | undefined, Diagnostics> {
  return optionalOneRosterV1p1Property(record, property, path, parseOneRosterV1p1StringAt);
}

function requiredProperty<TValue>(
  record: OneRosterV1p1Record,
  property: string,
  path: string,
  parser: OneRosterV1p1PayloadParser<TValue>,
): Result<TValue, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, parser);
}

function requiredReference<TType extends string>(
  record: OneRosterV1p1Record,
  property: string,
  type: TType,
  path: string,
): Result<OneRosterV1p1Reference<TType>, Diagnostics> {
  return requireOneRosterV1p1Property(record, property, path, referenceParser(type));
}

function invalid<TValue = never>(path: string, message: string): Result<TValue, Diagnostics> {
  return {
    _tag: "err",
    error: [
      { _tag: "OneRosterV1p1PayloadDiagnostic", code: "payload.invalid_value", path, message },
    ],
  };
}
