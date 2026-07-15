import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseTrueFalseVocabularyField,
  parseDateField,
  parseFloatField,
  parseGuidField,
  parseIntegerField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseStringListField,
  parseVocabularyField,
} from "./one-roster-csv-record-field-parsers.js";
import { parseCommonRecordFields } from "./one-roster-csv-record-lifecycle.js";
import { commonRecordCells, listCell, optionalCell } from "./one-roster-csv-record-cell-write.js";
import { parseOneRosterCsvRecordRow } from "./one-roster-csv-record-row.js";
import {
  learningObjectiveSourceValues,
  resultScoreStatusValues,
} from "./one-roster-csv-gradebook-schema.js";
import type {
  OneRosterCategoryRecord,
  OneRosterLineItemLearningObjectiveIdRecord,
  OneRosterLineItemRecord,
  OneRosterLineItemScoreScaleRecord,
  OneRosterResultLearningObjectiveIdRecord,
  OneRosterResultRecord,
  OneRosterResultScoreScaleRecord,
  OneRosterScoreScaleRecord,
} from "./one-roster-csv-gradebook-types.js";

/** Parse one categories.csv row into a typed OneRoster record. */
export function parseCategoryRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterCategoryRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseRequiredStringField(context, "title"),
      weight: parseIntegerField(context, "weight", "optional"),
    },
    ["common", "title"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      weight: fields.weight,
    }),
  );
}

/** Parse one lineItems.csv row into a typed OneRoster record. */
export function parseLineItemRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseRequiredStringField(context, "title"),
      description: parseOptionalStringField(context, "description"),
      assignDate: parseDateField(context, "assignDate", "required"),
      dueDate: parseDateField(context, "dueDate", "required"),
      classSourcedId: parseGuidField(context, "classSourcedId", "required"),
      categorySourcedId: parseGuidField(context, "categorySourcedId", "required"),
      academicSessionSourcedId: parseGuidField(context, "academicSessionSourcedId", "required"),
      resultValueMin: parseFloatField(context, "resultValueMin", "optional"),
      resultValueMax: parseFloatField(context, "resultValueMax", "optional"),
      schoolSourcedId: parseGuidField(context, "schoolSourcedId", "required"),
    },
    [
      "common",
      "title",
      "assignDate",
      "dueDate",
      "classSourcedId",
      "categorySourcedId",
      "academicSessionSourcedId",
      "schoolSourcedId",
    ],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      description: fields.description,
      assignDate: fields.assignDate,
      dueDate: fields.dueDate,
      classSourcedId: fields.classSourcedId,
      categorySourcedId: fields.categorySourcedId,
      academicSessionSourcedId: fields.academicSessionSourcedId,
      resultValueMin: fields.resultValueMin,
      resultValueMax: fields.resultValueMax,
      schoolSourcedId: fields.schoolSourcedId,
    }),
  );
}

/** Parse one results.csv row into a typed OneRoster record. */
export function parseResultRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      lineItemSourcedId: parseGuidField(context, "lineItemSourcedId", "required"),
      studentSourcedId: parseGuidField(context, "studentSourcedId", "required"),
      scoreStatus: parseVocabularyField(
        context,
        "scoreStatus",
        "required",
        resultScoreStatusValues,
        true,
      ),
      score: parseFloatField(context, "score", "optional"),
      scoreDate: parseDateField(context, "scoreDate", "required"),
      comment: parseOptionalStringField(context, "comment"),
      textScore: parseOptionalStringField(context, "textScore"),
      classSourcedId: parseGuidField(context, "classSourcedId", "optional"),
      inProgress: parseTrueFalseVocabularyField(context, "inProgress", "optional"),
      incomplete: parseTrueFalseVocabularyField(context, "incomplete", "optional"),
      late: parseTrueFalseVocabularyField(context, "late", "optional"),
      missing: parseTrueFalseVocabularyField(context, "missing", "optional"),
    },
    ["common", "lineItemSourcedId", "studentSourcedId", "scoreStatus", "scoreDate"],
    (fields) => ({
      ...fields.common,
      lineItemSourcedId: fields.lineItemSourcedId,
      studentSourcedId: fields.studentSourcedId,
      scoreStatus: fields.scoreStatus,
      score: fields.score,
      scoreDate: fields.scoreDate,
      comment: fields.comment,
      textScore: fields.textScore,
      classSourcedId: fields.classSourcedId,
      inProgress: fields.inProgress,
      incomplete: fields.incomplete,
      late: fields.late,
      missing: fields.missing,
    }),
  );
}

/** Parse one scoreScales.csv row into a typed OneRoster record. */
export function parseScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseRequiredStringField(context, "title"),
      type: parseRequiredStringField(context, "type"),
      orgSourcedId: parseGuidField(context, "orgSourcedId", "required"),
      courseSourcedId: parseGuidField(context, "courseSourcedId", "required"),
      classSourcedId: parseGuidField(context, "classSourcedId", "required"),
      scoreScaleValue: parseStringListField(context, "scoreScaleValue", "required"),
    },
    [
      "common",
      "title",
      "type",
      "orgSourcedId",
      "courseSourcedId",
      "classSourcedId",
      "scoreScaleValue",
    ],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      type: fields.type,
      orgSourcedId: fields.orgSourcedId,
      courseSourcedId: fields.courseSourcedId,
      classSourcedId: fields.classSourcedId,
      scoreScaleValue: fields.scoreScaleValue,
    }),
  );
}

/** Parse one lineItemLearningObjectiveIds.csv row into a typed OneRoster record. */
export function parseLineItemLearningObjectiveIdRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemLearningObjectiveIdRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      lineItemSourcedId: parseGuidField(context, "lineItemSourcedId", "required"),
      source: parseVocabularyField(
        context,
        "source",
        "required",
        learningObjectiveSourceValues,
        true,
      ),
      learningObjectiveId: parseRequiredStringField(context, "learningObjectiveId"),
    },
    ["common", "lineItemSourcedId", "source", "learningObjectiveId"],
    (fields) => ({
      ...fields.common,
      lineItemSourcedId: fields.lineItemSourcedId,
      source: fields.source,
      learningObjectiveId: fields.learningObjectiveId,
    }),
  );
}

/** Parse one lineItemScoreScales.csv row into a typed OneRoster record. */
export function parseLineItemScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseOptionalStringField(context, "title"),
      lineItemSourcedId: parseGuidField(context, "lineItemSourcedId", "required"),
      scoreScaleSourcedId: parseGuidField(context, "scoreScaleSourcedId", "required"),
    },
    ["common", "lineItemSourcedId", "scoreScaleSourcedId"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      lineItemSourcedId: fields.lineItemSourcedId,
      scoreScaleSourcedId: fields.scoreScaleSourcedId,
    }),
  );
}

/** Parse one resultLearningObjectiveIds.csv row into a typed OneRoster record. */
export function parseResultLearningObjectiveIdRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultLearningObjectiveIdRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      resultSourcedId: parseGuidField(context, "resultSourcedId", "required"),
      source: parseVocabularyField(
        context,
        "source",
        "required",
        learningObjectiveSourceValues,
        true,
      ),
      learningObjectiveId: parseRequiredStringField(context, "learningObjectiveId"),
      score: parseFloatField(context, "score", "optional"),
      textScore: parseOptionalStringField(context, "textScore"),
    },
    ["common", "resultSourcedId", "source", "learningObjectiveId"],
    (fields) => ({
      ...fields.common,
      resultSourcedId: fields.resultSourcedId,
      source: fields.source,
      learningObjectiveId: fields.learningObjectiveId,
      score: fields.score,
      textScore: fields.textScore,
    }),
  );
}

/** Parse one resultScoreScales.csv row into a typed OneRoster record. */
export function parseResultScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;

  return parseOneRosterCsvRecordRow(
    context,
    diagnosticStart,
    {
      common: parseCommonRecordFields(context),
      title: parseOptionalStringField(context, "title"),
      resultSourcedId: parseGuidField(context, "resultSourcedId", "required"),
      scoreScaleSourcedId: parseGuidField(context, "scoreScaleSourcedId", "required"),
    },
    ["common", "resultSourcedId", "scoreScaleSourcedId"],
    (fields) => ({
      ...fields.common,
      title: fields.title,
      resultSourcedId: fields.resultSourcedId,
      scoreScaleSourcedId: fields.scoreScaleSourcedId,
    }),
  );
}

/** Serialize one categories.csv record into CSV cells. */
export function serializeCategoryRecord(record: OneRosterCategoryRecord): readonly string[] {
  return [...commonRecordCells(record), record.title, optionalCell(record.weight)];
}

/** Serialize one lineItems.csv record into CSV cells. */
export function serializeLineItemRecord(record: OneRosterLineItemRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.title,
    optionalCell(record.description),
    record.assignDate,
    record.dueDate,
    record.classSourcedId,
    record.categorySourcedId,
    record.academicSessionSourcedId,
    optionalCell(record.resultValueMin),
    optionalCell(record.resultValueMax),
    record.schoolSourcedId,
  ];
}

/** Serialize one results.csv record into CSV cells. */
export function serializeResultRecord(record: OneRosterResultRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.lineItemSourcedId,
    record.studentSourcedId,
    record.scoreStatus,
    optionalCell(record.score),
    record.scoreDate,
    optionalCell(record.comment),
    optionalCell(record.textScore),
    optionalCell(record.classSourcedId),
    optionalCell(record.inProgress),
    optionalCell(record.incomplete),
    optionalCell(record.late),
    optionalCell(record.missing),
  ];
}

/** Serialize one scoreScales.csv record into CSV cells. */
export function serializeScoreScaleRecord(record: OneRosterScoreScaleRecord): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.title,
    record.type,
    record.orgSourcedId,
    record.courseSourcedId,
    record.classSourcedId,
    listCell(record.scoreScaleValue),
  ];
}

/** Serialize one lineItemLearningObjectiveIds.csv record into CSV cells. */
export function serializeLineItemLearningObjectiveIdRecord(
  record: OneRosterLineItemLearningObjectiveIdRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.lineItemSourcedId,
    record.source,
    record.learningObjectiveId,
  ];
}

/** Serialize one lineItemScoreScales.csv record into CSV cells. */
export function serializeLineItemScoreScaleRecord(
  record: OneRosterLineItemScoreScaleRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    optionalCell(record.title),
    record.lineItemSourcedId,
    record.scoreScaleSourcedId,
  ];
}

/** Serialize one resultLearningObjectiveIds.csv record into CSV cells. */
export function serializeResultLearningObjectiveIdRecord(
  record: OneRosterResultLearningObjectiveIdRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    record.resultSourcedId,
    record.source,
    record.learningObjectiveId,
    optionalCell(record.score),
    optionalCell(record.textScore),
  ];
}

/** Serialize one resultScoreScales.csv record into CSV cells. */
export function serializeResultScoreScaleRecord(
  record: OneRosterResultScoreScaleRecord,
): readonly string[] {
  return [
    ...commonRecordCells(record),
    optionalCell(record.title),
    record.resultSourcedId,
    record.scoreScaleSourcedId,
  ];
}
