import { csvDocument } from "./one-roster-csv-package-fixtures.js";
import {
  categoryHeader,
  lineItemHeader,
  lineItemLearningObjectiveIdHeader,
  lineItemScoreScaleHeader,
  resultHeader,
  resultLearningObjectiveIdHeader,
  resultScoreScaleHeader,
  scoreScaleHeader,
} from "./one-roster-csv-gradebook-headers.js";

export function categoriesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(categoryHeader, rows);
}

export function lineItemsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(lineItemHeader, rows);
}

export function resultsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(resultHeader, rows);
}

export function scoreScalesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(scoreScaleHeader, rows);
}

export function lineItemLearningObjectiveIdsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(lineItemLearningObjectiveIdHeader, rows);
}

export function lineItemScoreScalesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(lineItemScoreScaleHeader, rows);
}

export function resultLearningObjectiveIdsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(resultLearningObjectiveIdHeader, rows);
}

export function resultScoreScalesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(resultScoreScaleHeader, rows);
}

export function categoryRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly weight?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "category-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Homework",
    opts.weight ?? "20",
  ];
}

export function lineItemRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly description?: string;
    readonly assignDate?: string;
    readonly dueDate?: string;
    readonly classSourcedId?: string;
    readonly categorySourcedId?: string;
    readonly academicSessionSourcedId?: string;
    readonly resultValueMin?: string;
    readonly resultValueMax?: string;
    readonly schoolSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "line-item-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Unit Quiz",
    opts.description ?? "Chapter 1",
    opts.assignDate ?? "2024-09-01",
    opts.dueDate ?? "2024-09-08",
    opts.classSourcedId ?? "class-1",
    opts.categorySourcedId ?? "category-1",
    opts.academicSessionSourcedId ?? "as-1",
    opts.resultValueMin ?? "0",
    opts.resultValueMax ?? "100",
    opts.schoolSourcedId ?? "org-1",
  ];
}

export function resultRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly lineItemSourcedId?: string;
    readonly studentSourcedId?: string;
    readonly scoreStatus?: string;
    readonly score?: string;
    readonly scoreDate?: string;
    readonly comment?: string;
    readonly textScore?: string;
    readonly classSourcedId?: string;
    readonly inProgress?: string;
    readonly incomplete?: string;
    readonly late?: string;
    readonly missing?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "result-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.lineItemSourcedId ?? "line-item-1",
    opts.studentSourcedId ?? "user-1",
    opts.scoreStatus ?? "fully graded",
    opts.score ?? "95.5",
    opts.scoreDate ?? "2024-09-09",
    opts.comment ?? "Done",
    opts.textScore ?? "A",
    opts.classSourcedId ?? "class-1",
    opts.inProgress ?? "false",
    opts.incomplete ?? "false",
    opts.late ?? "false",
    opts.missing ?? "false",
  ];
}

export function scoreScaleRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly type?: string;
    readonly orgSourcedId?: string;
    readonly courseSourcedId?: string;
    readonly classSourcedId?: string;
    readonly scoreScaleValue?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "score-scale-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Letter",
    opts.type ?? "letter",
    opts.orgSourcedId ?? "org-1",
    opts.courseSourcedId ?? "course-1",
    opts.classSourcedId ?? "class-1",
    opts.scoreScaleValue ?? "{A:94},{B:84}",
  ];
}

export function lineItemLearningObjectiveIdRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly lineItemSourcedId?: string;
    readonly source?: string;
    readonly learningObjectiveId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "line-item-lo-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.lineItemSourcedId ?? "line-item-1",
    opts.source ?? "case",
    opts.learningObjectiveId ?? "urn:uuid:11111111-1111-1111-1111-111111111111",
  ];
}

export function lineItemScoreScaleRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly lineItemSourcedId?: string;
    readonly scoreScaleSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "line-item-score-scale-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Line Item Scale",
    opts.lineItemSourcedId ?? "line-item-1",
    opts.scoreScaleSourcedId ?? "score-scale-1",
  ];
}

export function resultLearningObjectiveIdRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly resultSourcedId?: string;
    readonly source?: string;
    readonly learningObjectiveId?: string;
    readonly score?: string;
    readonly textScore?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "result-lo-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.resultSourcedId ?? "result-1",
    opts.source ?? "unknown",
    opts.learningObjectiveId ?? "objective-1",
    opts.score ?? "1",
    opts.textScore ?? "mastered",
  ];
}

export function resultScoreScaleRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly resultSourcedId?: string;
    readonly scoreScaleSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "result-score-scale-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Result Scale",
    opts.resultSourcedId ?? "result-1",
    opts.scoreScaleSourcedId ?? "score-scale-1",
  ];
}
