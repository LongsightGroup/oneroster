import { expect } from "vitest";

import type { OneRosterCsvRosteringFileName } from "../../src/index.js";
import { manifestCsv } from "./one-roster-csv-package-fixtures.js";
import { validBulkGraphFiles } from "./one-roster-csv-rostering-packages.js";
import {
  academicSessionRow,
  academicSessionsCsv,
  classRow,
  classesCsv,
  courseRow,
  coursesCsv,
  demographicsCsv,
  demographicsRow,
  enrollmentRow,
  enrollmentsCsv,
  orgRow,
  orgsCsv,
  roleRow,
  rolesCsv,
  userProfileRow,
  userProfilesCsv,
  userRow,
  usersCsv,
} from "./one-roster-csv-rostering-rows.js";

export type MissingTargetFileScenario = {
  readonly name: string;
  readonly files: Readonly<Record<string, string>>;
  readonly expectedDiagnostics: readonly [
    ReturnType<typeof expect.objectContaining>,
    ...ReturnType<typeof expect.objectContaining>[],
  ];
};

export function missingTargetFileScenarios(): readonly MissingTargetFileScenario[] {
  return [
    {
      name: "classes.csv cross-file references",
      files: {
        "manifest.csv": manifestCsv({ modes: new Map([["classes.csv", "bulk"]]) }),
        "classes.csv": classesCsv([
          classRow({
            courseSourcedId: "course-missing",
            schoolSourcedId: "org-missing",
            termSourcedIds: "as-missing",
          }),
        ]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "courseSourcedId",
          expected: "courses.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "schoolSourcedId",
          expected: "orgs.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "classes.csv",
          rowNumber: 2,
          field: "termSourcedIds",
          expected: "academicSessions.csv",
          actual: "absent",
        }),
      ],
    },
    {
      name: "user-backed demographics and userProfiles",
      files: {
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["demographics.csv", "bulk"],
            ["userProfiles.csv", "bulk"],
          ]),
        }),
        "demographics.csv": demographicsCsv([demographicsRow({ sourcedId: "user-missing" })]),
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-missing" }),
        ]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "demographics.csv",
          rowNumber: 2,
          field: "sourcedId",
          expected: "users.csv",
          actual: "absent",
        }),
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "userProfiles.csv",
          rowNumber: 2,
          field: "userSourcedId",
          expected: "users.csv",
          actual: "absent",
        }),
      ],
    },
    {
      name: "roles.userProfileSourcedId",
      files: {
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["roles.csv", "bulk"],
            ["users.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" })]),
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-missing",
          }),
        ]),
        "users.csv": usersCsv([userRow({ sourcedId: "user-1", username: "user-1" })]),
      },
      expectedDiagnostics: [
        expect.objectContaining({
          code: "reference.missing_target_file",
          fileName: "roles.csv",
          rowNumber: 2,
          field: "userProfileSourcedId",
          expected: "userProfiles.csv",
          actual: "absent",
        }),
      ],
    },
  ];
}

export type MissingReferenceRecordScenario = {
  readonly name: string;
  readonly sourceFile: OneRosterCsvRosteringFileName;
  readonly rowNumber: number;
  readonly field: string;
  readonly targetFile: OneRosterCsvRosteringFileName;
  readonly files: Readonly<Record<string, string>>;
};

export function missingReferenceRecordScenarios(): readonly MissingReferenceRecordScenario[] {
  return [
    {
      name: "academicSessions.parentSourcedId",
      sourceFile: "academicSessions.csv",
      rowNumber: 3,
      field: "parentSourcedId",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "academicSessions.csv": academicSessionsCsv([
          academicSessionRow({ sourcedId: "as-parent", title: "School Year" }),
          academicSessionRow({
            sourcedId: "as-1",
            title: "Fall Term",
            type: "term",
            parentSourcedId: "as-missing",
          }),
        ]),
      }),
    },
    {
      name: "orgs.parentSourcedId",
      sourceFile: "orgs.csv",
      rowNumber: 3,
      field: "parentSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "orgs.csv": orgsCsv([
          orgRow({ sourcedId: "org-root", name: "District", type: "district" }),
          orgRow({ sourcedId: "org-1", name: "North School", parentSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "courses.schoolYearSourcedId",
      sourceFile: "courses.csv",
      rowNumber: 2,
      field: "schoolYearSourcedId",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "courses.csv": coursesCsv([
          courseRow({ sourcedId: "course-1", schoolYearSourcedId: "as-missing" }),
        ]),
      }),
    },
    {
      name: "courses.orgSourcedId",
      sourceFile: "courses.csv",
      rowNumber: 2,
      field: "orgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "courses.csv": coursesCsv([
          courseRow({ sourcedId: "course-1", orgSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "classes.courseSourcedId",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "courseSourcedId",
      targetFile: "courses.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ courseSourcedId: "course-missing" })]),
      }),
    },
    {
      name: "classes.schoolSourcedId",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "schoolSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ schoolSourcedId: "org-missing" })]),
      }),
    },
    {
      name: "classes.termSourcedIds",
      sourceFile: "classes.csv",
      rowNumber: 2,
      field: "termSourcedIds",
      targetFile: "academicSessions.csv",
      files: validGraphWith({
        "classes.csv": classesCsv([classRow({ termSourcedIds: "as-missing" })]),
      }),
    },
    {
      name: "users.agentSourcedIds",
      sourceFile: "users.csv",
      rowNumber: 3,
      field: "agentSourcedIds",
      targetFile: "users.csv",
      files: validGraphWith({
        "users.csv": usersCsv([
          userRow({
            sourcedId: "user-agent",
            username: "user-agent",
            primaryOrgSourcedId: "org-1",
          }),
          userRow({
            sourcedId: "user-1",
            username: "user-1",
            agentSourcedIds: "user-missing",
            primaryOrgSourcedId: "org-1",
          }),
        ]),
      }),
    },
    {
      name: "users.primaryOrgSourcedId",
      sourceFile: "users.csv",
      rowNumber: 3,
      field: "primaryOrgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "users.csv": usersCsv([
          userRow({
            sourcedId: "user-agent",
            username: "user-agent",
            primaryOrgSourcedId: "org-1",
          }),
          userRow({
            sourcedId: "user-1",
            username: "user-1",
            agentSourcedIds: "user-agent",
            primaryOrgSourcedId: "org-missing",
          }),
        ]),
      }),
    },
    {
      name: "roles.userSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({ sourcedId: "role-1", userSourcedId: "user-missing", orgSourcedId: "org-1" }),
        ]),
      }),
    },
    {
      name: "roles.orgSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "orgSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({ sourcedId: "role-1", userSourcedId: "user-1", orgSourcedId: "org-missing" }),
        ]),
      }),
    },
    {
      name: "roles.userProfileSourcedId",
      sourceFile: "roles.csv",
      rowNumber: 2,
      field: "userProfileSourcedId",
      targetFile: "userProfiles.csv",
      files: validGraphWith({
        "roles.csv": rolesCsv([
          roleRow({
            sourcedId: "role-1",
            userSourcedId: "user-1",
            orgSourcedId: "org-1",
            userProfileSourcedId: "profile-missing",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.classSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "classSourcedId",
      targetFile: "classes.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-missing",
            schoolSourcedId: "org-1",
            userSourcedId: "user-1",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.schoolSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "schoolSourcedId",
      targetFile: "orgs.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-missing",
            userSourcedId: "user-1",
          }),
        ]),
      }),
    },
    {
      name: "enrollments.userSourcedId",
      sourceFile: "enrollments.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "enrollments.csv": enrollmentsCsv([
          enrollmentRow({
            sourcedId: "enrollment-1",
            classSourcedId: "class-1",
            schoolSourcedId: "org-1",
            userSourcedId: "user-missing",
          }),
        ]),
      }),
    },
    {
      name: "demographics.sourcedId",
      sourceFile: "demographics.csv",
      rowNumber: 2,
      field: "sourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "demographics.csv": demographicsCsv([demographicsRow({ sourcedId: "user-missing" })]),
      }),
    },
    {
      name: "userProfiles.userSourcedId",
      sourceFile: "userProfiles.csv",
      rowNumber: 2,
      field: "userSourcedId",
      targetFile: "users.csv",
      files: validGraphWith({
        "userProfiles.csv": userProfilesCsv([
          userProfileRow({ sourcedId: "profile-1", userSourcedId: "user-missing" }),
        ]),
      }),
    },
  ];
}

export function validGraphWith(
  overrides: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return {
    ...validBulkGraphFiles(),
    ...overrides,
  };
}
