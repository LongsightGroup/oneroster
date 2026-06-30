import { csvDocument } from "./one-roster-csv-package-fixtures.js";
import {
  classResourceHeader,
  courseResourceHeader,
  resourceHeader,
  userResourceHeader,
} from "./one-roster-csv-resources-headers.js";

export function resourcesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(resourceHeader, rows);
}

export function classResourcesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(classResourceHeader, rows);
}

export function courseResourcesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(courseResourceHeader, rows);
}

export function userResourcesCsv(rows: ReadonlyArray<readonly string[]>): string {
  return csvDocument(userResourceHeader, rows);
}

export function resourceRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly vendorResourceId?: string;
    readonly title?: string;
    readonly roles?: string;
    readonly importance?: string;
    readonly vendorId?: string;
    readonly applicationId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "resource-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.vendorResourceId ?? "vendor-resource-1",
    opts.title ?? "Algebra Resource",
    opts.roles ?? "student,teacher",
    opts.importance ?? "primary",
    opts.vendorId ?? "vendor-1",
    opts.applicationId ?? "application-1",
  ];
}

export function classResourceRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly classSourcedId?: string;
    readonly resourceSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "class-resource-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Class Algebra Resource",
    opts.classSourcedId ?? "class-1",
    opts.resourceSourcedId ?? "resource-1",
  ];
}

export function courseResourceRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly title?: string;
    readonly courseSourcedId?: string;
    readonly resourceSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "course-resource-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.title ?? "Course Algebra Resource",
    opts.courseSourcedId ?? "course-1",
    opts.resourceSourcedId ?? "resource-1",
  ];
}

export function userResourceRow(
  opts: {
    readonly sourcedId?: string;
    readonly status?: string;
    readonly dateLastModified?: string;
    readonly userSourcedId?: string;
    readonly orgSourcedId?: string;
    readonly classSourcedId?: string;
    readonly resourceSourcedId?: string;
  } = {},
): readonly string[] {
  return [
    opts.sourcedId ?? "user-resource-1",
    opts.status ?? "",
    opts.dateLastModified ?? "",
    opts.userSourcedId ?? "user-1",
    opts.orgSourcedId ?? "org-1",
    opts.classSourcedId ?? "class-1",
    opts.resourceSourcedId ?? "resource-1",
  ];
}
