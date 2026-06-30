import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  parseBooleanField,
  parseCommonRecordFields,
  parseDateField,
  parseFloatField,
  parseGuidField,
  parseIntegerField,
  parseOptionalStringField,
  parseRequiredStringField,
  parseStringListField,
  parseVocabularyField,
} from "./one-roster-csv-record-fields.js";
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
  const commonFields = parseCommonRecordFields(context);
  const title = parseRequiredStringField(context, "title");
  const weight = parseIntegerField(context, "weight", "optional");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    weight,
  };
}

/** Parse one lineItems.csv row into a typed OneRoster record. */
export function parseLineItemRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseRequiredStringField(context, "title");
  const description = parseOptionalStringField(context, "description");
  const assignDate = parseDateField(context, "assignDate", "required");
  const dueDate = parseDateField(context, "dueDate", "required");
  const classSourcedId = parseGuidField(context, "classSourcedId", "required");
  const categorySourcedId = parseGuidField(context, "categorySourcedId", "required");
  const academicSessionSourcedId = parseGuidField(context, "academicSessionSourcedId", "required");
  const resultValueMin = parseFloatField(context, "resultValueMin", "optional");
  const resultValueMax = parseFloatField(context, "resultValueMax", "optional");
  const schoolSourcedId = parseGuidField(context, "schoolSourcedId", "required");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined ||
    assignDate === undefined ||
    dueDate === undefined ||
    classSourcedId === undefined ||
    categorySourcedId === undefined ||
    academicSessionSourcedId === undefined ||
    schoolSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    description,
    assignDate,
    dueDate,
    classSourcedId,
    categorySourcedId,
    academicSessionSourcedId,
    resultValueMin,
    resultValueMax,
    schoolSourcedId,
  };
}

/** Parse one results.csv row into a typed OneRoster record. */
export function parseResultRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const lineItemSourcedId = parseGuidField(context, "lineItemSourcedId", "required");
  const studentSourcedId = parseGuidField(context, "studentSourcedId", "required");
  const scoreStatus = parseVocabularyField(
    context,
    "scoreStatus",
    "required",
    resultScoreStatusValues,
    true,
  );
  const score = parseFloatField(context, "score", "optional");
  const scoreDate = parseDateField(context, "scoreDate", "required");
  const comment = parseOptionalStringField(context, "comment");
  const textScore = parseOptionalStringField(context, "textScore");
  const classSourcedId = parseGuidField(context, "classSourcedId", "optional");
  const inProgress = parseBooleanField(context, "inProgress", "optional");
  const incomplete = parseBooleanField(context, "incomplete", "optional");
  const late = parseBooleanField(context, "late", "optional");
  const missing = parseBooleanField(context, "missing", "optional");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    lineItemSourcedId === undefined ||
    studentSourcedId === undefined ||
    scoreStatus === undefined ||
    scoreDate === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    lineItemSourcedId,
    studentSourcedId,
    scoreStatus,
    score,
    scoreDate,
    comment,
    textScore,
    classSourcedId,
    inProgress,
    incomplete,
    late,
    missing,
  };
}

/** Parse one scoreScales.csv row into a typed OneRoster record. */
export function parseScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseRequiredStringField(context, "title");
  const type = parseRequiredStringField(context, "type");
  const orgSourcedId = parseGuidField(context, "orgSourcedId", "required");
  const courseSourcedId = parseGuidField(context, "courseSourcedId", "required");
  const classSourcedId = parseGuidField(context, "classSourcedId", "required");
  const scoreScaleValue = parseStringListField(context, "scoreScaleValue", "required");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    title === undefined ||
    type === undefined ||
    orgSourcedId === undefined ||
    courseSourcedId === undefined ||
    classSourcedId === undefined ||
    scoreScaleValue === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    type,
    orgSourcedId,
    courseSourcedId,
    classSourcedId,
    scoreScaleValue,
  };
}

/** Parse one lineItemLearningObjectiveIds.csv row into a typed OneRoster record. */
export function parseLineItemLearningObjectiveIdRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemLearningObjectiveIdRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const lineItemSourcedId = parseGuidField(context, "lineItemSourcedId", "required");
  const source = parseVocabularyField(
    context,
    "source",
    "required",
    learningObjectiveSourceValues,
    true,
  );
  const learningObjectiveId = parseRequiredStringField(context, "learningObjectiveId");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    lineItemSourcedId === undefined ||
    source === undefined ||
    learningObjectiveId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    lineItemSourcedId,
    source,
    learningObjectiveId,
  };
}

/** Parse one lineItemScoreScales.csv row into a typed OneRoster record. */
export function parseLineItemScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterLineItemScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseOptionalStringField(context, "title");
  const lineItemSourcedId = parseGuidField(context, "lineItemSourcedId", "required");
  const scoreScaleSourcedId = parseGuidField(context, "scoreScaleSourcedId", "required");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    lineItemSourcedId === undefined ||
    scoreScaleSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    lineItemSourcedId,
    scoreScaleSourcedId,
  };
}

/** Parse one resultLearningObjectiveIds.csv row into a typed OneRoster record. */
export function parseResultLearningObjectiveIdRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultLearningObjectiveIdRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const resultSourcedId = parseGuidField(context, "resultSourcedId", "required");
  const source = parseVocabularyField(
    context,
    "source",
    "required",
    learningObjectiveSourceValues,
    true,
  );
  const learningObjectiveId = parseRequiredStringField(context, "learningObjectiveId");
  const score = parseFloatField(context, "score", "optional");
  const textScore = parseOptionalStringField(context, "textScore");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    resultSourcedId === undefined ||
    source === undefined ||
    learningObjectiveId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    resultSourcedId,
    source,
    learningObjectiveId,
    score,
    textScore,
  };
}

/** Parse one resultScoreScales.csv row into a typed OneRoster record. */
export function parseResultScoreScaleRecord(
  context: OneRosterCsvRecordRowContext,
): OneRosterResultScoreScaleRecord | undefined {
  const diagnosticStart = context.diagnostics.length;
  const commonFields = parseCommonRecordFields(context);
  const title = parseOptionalStringField(context, "title");
  const resultSourcedId = parseGuidField(context, "resultSourcedId", "required");
  const scoreScaleSourcedId = parseGuidField(context, "scoreScaleSourcedId", "required");

  if (
    hasNewDiagnostics(context, diagnosticStart) ||
    commonFields === undefined ||
    resultSourcedId === undefined ||
    scoreScaleSourcedId === undefined
  ) {
    return undefined;
  }

  return {
    ...commonFields,
    title,
    resultSourcedId,
    scoreScaleSourcedId,
  };
}

function hasNewDiagnostics(
  context: OneRosterCsvRecordRowContext,
  diagnosticStart: number,
): boolean {
  return context.diagnostics.length > diagnosticStart;
}
