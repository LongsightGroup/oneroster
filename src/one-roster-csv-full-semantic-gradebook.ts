import type { OneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import {
  addSemanticDiagnostic,
  shouldValidateSemanticRecord,
} from "./one-roster-csv-full-semantic-diagnostic.js";
import {
  effectiveResultClassSourcedId,
  hasComparableScoreBounds,
  hasInvalidScoreBounds,
  hasResultEnrollmentTargets,
  isAcceptableSchoolOrgReference,
  isInvalidLineItemAcademicSessionType,
  isValidScoreScaleMapping,
  validateCaseLearningObjectiveIdRecords,
  validateSemanticClassUserEnrollment,
} from "./one-roster-csv-full-semantic-policies.js";
import { runSemanticRowRules } from "./one-roster-csv-full-semantic-rules.js";

/** Validate gradebook semantics that require typed gradebook and rostering records. */
export function validateOneRosterCsvFullGradebookSemantics(
  context: OneRosterCsvFullSemanticContext,
): void {
  validateLineItemScoreRanges(context);
  validateResultScoresAgainstLineItems(context);
  validateResultClassesAgainstLineItems(context);
  validateScoreScaleMappings(context);
  validateCaseLearningObjectiveIds(context);
  validateResultEnrollmentMembership(context);
  validateLineItemAcademicSessions(context);
  validateLineItemSchoolOrgs(context);
}

function validateLineItemScoreRanges(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.gradebookPackage.lineItems,
      when: (lineItem) => hasComparableScoreBounds(lineItem),
      satisfies: (lineItem) => {
        if (!hasComparableScoreBounds(lineItem)) {
          return true;
        }

        return lineItem.resultValueMin <= lineItem.resultValueMax;
      },
      diagnostic: (lineItem) => ({
        code: "semantic.invalid_score_range",
        message: "OneRoster lineItem resultValueMin must not exceed resultValueMax.",
        fileName: "lineItems.csv",
        rowNumber: lineItem.rowNumber,
        field: "resultValueMin",
        expected: "resultValueMin <= resultValueMax",
        actual: "min greater than max",
      }),
    },
  ]);
}

function validateResultScoresAgainstLineItems(context: OneRosterCsvFullSemanticContext): void {
  for (const result of context.packageValue.gradebookPackage.results) {
    if (!shouldValidateSemanticRecord(context, result) || result.score === undefined) {
      continue;
    }

    const lineItem = context.gradebookIndexes.lineItemsBySourcedId.get(result.lineItemSourcedId);
    if (lineItem === undefined || hasInvalidScoreBounds(lineItem)) {
      continue;
    }

    if (lineItem.resultValueMin !== undefined && result.score < lineItem.resultValueMin) {
      addSemanticDiagnostic(context, {
        code: "semantic.score_below_min",
        message: "OneRoster result score must be greater than or equal to lineItem resultValueMin.",
        fileName: "results.csv",
        rowNumber: result.rowNumber,
        field: "score",
        expected: "lineItems.resultValueMin",
        actual: "below minimum",
      });
    }

    if (lineItem.resultValueMax !== undefined && result.score > lineItem.resultValueMax) {
      addSemanticDiagnostic(context, {
        code: "semantic.score_above_max",
        message: "OneRoster result score must be less than or equal to lineItem resultValueMax.",
        fileName: "results.csv",
        rowNumber: result.rowNumber,
        field: "score",
        expected: "lineItems.resultValueMax",
        actual: "above maximum",
      });
    }
  }
}

function validateResultClassesAgainstLineItems(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.gradebookPackage.results,
      when: (result) => result.classSourcedId !== undefined,
      satisfies: (result, ctx) => {
        const lineItem = ctx.gradebookIndexes.lineItemsBySourcedId.get(result.lineItemSourcedId);
        return lineItem === undefined || result.classSourcedId === lineItem.classSourcedId;
      },
      diagnostic: (result) => ({
        code: "semantic.result_class_mismatch",
        message: "OneRoster result classSourcedId must match the referenced lineItem class.",
        fileName: "results.csv",
        rowNumber: result.rowNumber,
        field: "classSourcedId",
        expected: "lineItems.classSourcedId",
        actual: "mismatch",
      }),
    },
  ]);
}

function validateScoreScaleMappings(context: OneRosterCsvFullSemanticContext): void {
  for (const scoreScale of context.packageValue.gradebookPackage.scoreScales) {
    if (!shouldValidateSemanticRecord(context, scoreScale)) {
      continue;
    }

    for (const value of scoreScale.scoreScaleValue) {
      if (isValidScoreScaleMapping(value)) {
        continue;
      }

      addSemanticDiagnostic(context, {
        code: "semantic.invalid_score_scale_mapping",
        message: "OneRoster scoreScaleValue entries must use {lhs:rhs} mapping syntax.",
        fileName: "scoreScales.csv",
        rowNumber: scoreScale.rowNumber,
        field: "scoreScaleValue",
        expected: "{lhs:rhs}",
        actual: "invalid mapping syntax",
      });
    }
  }
}

function validateCaseLearningObjectiveIds(context: OneRosterCsvFullSemanticContext): void {
  validateCaseLearningObjectiveIdRecords(
    context,
    context.packageValue.gradebookPackage.lineItemLearningObjectiveIds,
    "lineItemLearningObjectiveIds.csv",
  );
  validateCaseLearningObjectiveIdRecords(
    context,
    context.packageValue.gradebookPackage.resultLearningObjectiveIds,
    "resultLearningObjectiveIds.csv",
  );
}

function validateResultEnrollmentMembership(context: OneRosterCsvFullSemanticContext): void {
  for (const result of context.packageValue.gradebookPackage.results) {
    const classSourcedId = effectiveResultClassSourcedId(context, result);

    validateSemanticClassUserEnrollment(context, {
      record: result,
      classSourcedId,
      userSourcedId: result.studentSourcedId,
      hasTargets:
        classSourcedId === undefined
          ? false
          : hasResultEnrollmentTargets(context, result, classSourcedId),
      fileName: "results.csv",
      field: "studentSourcedId",
      code: "semantic.result_student_not_enrolled",
      message: "OneRoster result student must be enrolled in the result class.",
    });
  }
}

function validateLineItemAcademicSessions(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.gradebookPackage.lineItems,
      satisfies: (lineItem, ctx) => {
        const academicSession = ctx.rosteringIndexes.academicSessionsBySourcedId.get(
          lineItem.academicSessionSourcedId,
        );
        return (
          academicSession === undefined ||
          !isInvalidLineItemAcademicSessionType(academicSession.type)
        );
      },
      diagnostic: (lineItem) => ({
        code: "semantic.academic_session_type_mismatch",
        message: "OneRoster lineItem academicSessionSourcedId must not reference a schoolYear.",
        fileName: "lineItems.csv",
        rowNumber: lineItem.rowNumber,
        field: "academicSessionSourcedId",
        expected: "term, semester, gradingPeriod, or ext:*",
        actual: "schoolYear",
      }),
    },
  ]);
}

function validateLineItemSchoolOrgs(context: OneRosterCsvFullSemanticContext): void {
  runSemanticRowRules(context, [
    {
      records: context.packageValue.gradebookPackage.lineItems,
      satisfies: (lineItem, ctx) =>
        isAcceptableSchoolOrgReference(
          ctx.rosteringIndexes.orgsBySourcedId.get(lineItem.schoolSourcedId),
        ),
      diagnostic: (lineItem) => ({
        code: "semantic.org_type_mismatch",
        message: "OneRoster lineItem schoolSourcedId must reference a school org.",
        fileName: "lineItems.csv",
        rowNumber: lineItem.rowNumber,
        field: "schoolSourcedId",
        expected: "school or ext:*",
        actual: "incompatible org type",
      }),
    },
  ]);
}
