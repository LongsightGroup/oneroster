import { csvDocument } from "./one-roster-csv-package-fixtures.js";
import {
  academicSessionHeader,
  classHeader,
  courseHeader,
  enrollmentHeader,
  orgHeader,
  roleHeader,
  userHeader,
} from "./one-roster-csv-rostering-headers.js";

export function validBulkUserRow(): readonly string[] {
  return [
    "user-1",
    "",
    "",
    "true",
    "user-1",
    "",
    "Given",
    "Family",
    "",
    "",
    "",
    "",
    "",
    "",
    "9",
    "",
    "",
    "",
    "",
    "",
    "org-1",
    "",
  ];
}

export function academicSessionsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(academicSessionHeader, rows);
}

export function orgsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(orgHeader, rows);
}

export function coursesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(courseHeader, rows);
}

export function classesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(classHeader, rows);
}

export function usersCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(userHeader, rows);
}

export function rolesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(roleHeader, rows);
}

export function enrollmentsCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(enrollmentHeader, rows);
}

export function academicSessionRow(opts: {
  readonly sourcedId?: string;
  readonly status?: string;
  readonly dateLastModified?: string;
  readonly title?: string;
  readonly type?: string;
  readonly parentSourcedId?: string;
}): readonly string[] {
  return [
    opts.sourcedId ?? "as-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "School Year",
    opts.type ?? "schoolYear",
    "2024-08-01",
    "2025-06-01",
    opts.parentSourcedId ?? "",
    "2025",
  ];
}

export function orgRow(opts: {
  readonly sourcedId?: string;
  readonly status?: string;
  readonly dateLastModified?: string;
  readonly name?: string;
  readonly type?: string;
  readonly parentSourcedId?: string;
}): readonly string[] {
  return [
    opts.sourcedId ?? "org-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.name ?? "North School",
    opts.type ?? "school",
    "NCES-1",
    opts.parentSourcedId ?? "",
  ];
}

export function courseRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly schoolYearSourcedId?: string;
    readonly orgSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "course-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.schoolYearSourcedId ?? "",
    "Algebra One",
    "ALG1",
    "9",
    opts.orgSourcedId ?? "org-1",
    "Math",
    "MATH",
  ];
}

export function classRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly courseSourcedId?: string;
    readonly schoolSourcedId?: string;
    readonly termSourcedIds?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "class-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    "Algebra One A",
    "9",
    opts.courseSourcedId ?? "course-1",
    "A1",
    "scheduled",
    "Room 101",
    opts.schoolSourcedId ?? "org-1",
    opts.termSourcedIds ?? "as-1",
    "Math",
    "MATH",
    "1",
  ];
}

export function userRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly enabledUser?: string;
    readonly username?: string;
    readonly agentSourcedIds?: string;
    readonly primaryOrgSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "user-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.enabledUser ?? "true",
    opts.username ?? "user-1",
    "",
    "Given",
    "Family",
    "",
    "",
    "",
    "",
    "",
    opts.agentSourcedIds ?? "",
    "9",
    "",
    "",
    "",
    "",
    "",
    opts.primaryOrgSourcedId ?? "",
    "",
  ];
}

export function roleRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly userSourcedId?: string;
    readonly orgSourcedId?: string;
    readonly userProfileSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "role-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.userSourcedId ?? "user-1",
    "primary",
    "teacher",
    "2024-08-01",
    "",
    opts.orgSourcedId ?? "org-1",
    opts.userProfileSourcedId ?? "",
  ];
}

export function enrollmentRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly classSourcedId?: string;
    readonly schoolSourcedId?: string;
    readonly userSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "enrollment-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.classSourcedId ?? "class-1",
    opts.schoolSourcedId ?? "org-1",
    opts.userSourcedId ?? "user-1",
    "teacher",
    "true",
    "2024-08-01",
    "",
  ];
}
