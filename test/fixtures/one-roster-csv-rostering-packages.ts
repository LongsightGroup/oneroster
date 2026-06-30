import { manifestCsv, zipPackage } from "./one-roster-csv-package-fixtures.js";
import {
  academicSessionRow,
  academicSessionsCsv,
  classRow,
  classesCsv,
  courseRow,
  coursesCsv,
  enrollmentRow,
  enrollmentsCsv,
  orgRow,
  orgsCsv,
  roleRow,
  rolesCsv,
  usersCsv,
  userRow,
  validBulkUserRow,
} from "./one-roster-csv-rostering-rows.js";

/** Build manifest file modes for all seven core rostering CSV files. */
export function rosteringModes(mode: "bulk" | "delta"): ReadonlyMap<string, string> {
  return new Map([
    ["academicSessions.csv", mode],
    ["orgs.csv", mode],
    ["courses.csv", mode],
    ["classes.csv", mode],
    ["users.csv", mode],
    ["roles.csv", mode],
    ["enrollments.csv", mode],
  ]);
}

/** Build a minimal valid bulk rostering package with one record per file. */
export function validBulkRosteringFiles(): Readonly<Record<string, string>> {
  return {
    "academicSessions.csv": academicSessionsCsv([
      ["as-1", "", "", "School Year", "schoolYear", "2024-08-01", "2025-06-01", "", "2025"],
    ]),
    "orgs.csv": orgsCsv([["org-1", "", "", "North School", "school", "NCES-1", ""]]),
    "courses.csv": coursesCsv([
      ["course-1", "", "", "as-1", "Algebra One", "ALG1", "9", "org-1", "Math", "MATH"],
    ]),
    "classes.csv": classesCsv([
      [
        "class-1",
        "",
        "",
        "Algebra One A",
        "9",
        "course-1",
        "A1",
        "scheduled",
        "Room 101",
        "org-1",
        "as-1",
        "Math",
        "MATH",
        "1",
      ],
    ]),
    "users.csv": usersCsv([validBulkUserRow()]),
    "roles.csv": rolesCsv([
      ["role-1", "", "", "user-1", "primary", "teacher", "2024-08-01", "", "org-1", ""],
    ]),
    "enrollments.csv": enrollmentsCsv([
      ["enrollment-1", "", "", "class-1", "org-1", "user-1", "teacher", "true", "2024-08-01", ""],
    ]),
  };
}

/** Build a connected bulk rostering graph for reference validation tests. */
export function validBulkGraphFiles(): Readonly<Record<string, string>> {
  return {
    "academicSessions.csv": academicSessionsCsv([
      academicSessionRow({ sourcedId: "as-parent", title: "School Year" }),
      academicSessionRow({
        sourcedId: "as-1",
        title: "Fall Term",
        type: "term",
        parentSourcedId: "as-parent",
      }),
    ]),
    "orgs.csv": orgsCsv([
      orgRow({ sourcedId: "org-root", name: "District", type: "district" }),
      orgRow({ sourcedId: "org-1", name: "North School", parentSourcedId: "org-root" }),
    ]),
    "courses.csv": coursesCsv([courseRow({ sourcedId: "course-1", orgSourcedId: "org-1" })]),
    "classes.csv": classesCsv([
      classRow({
        sourcedId: "class-1",
        courseSourcedId: "course-1",
        schoolSourcedId: "org-1",
        termSourcedIds: "as-1",
      }),
    ]),
    "users.csv": usersCsv([
      userRow({ sourcedId: "user-agent", username: "user-agent", primaryOrgSourcedId: "org-1" }),
      userRow({
        sourcedId: "user-1",
        username: "user-1",
        agentSourcedIds: "user-agent",
        primaryOrgSourcedId: "org-1",
      }),
    ]),
    "roles.csv": rolesCsv([
      roleRow({ sourcedId: "role-1", userSourcedId: "user-1", orgSourcedId: "org-1" }),
    ]),
    "enrollments.csv": enrollmentsCsv([
      enrollmentRow({
        sourcedId: "enrollment-1",
        classSourcedId: "class-1",
        schoolSourcedId: "org-1",
        userSourcedId: "user-1",
      }),
    ]),
  };
}

/** Build a ZIP archive containing the connected bulk reference graph. */
export function validBulkGraphZip(): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: rosteringModes("bulk") }),
    ...validBulkGraphFiles(),
  });
}

/** Build a users-only ZIP package for focused rostering tests. */
export function usersOnlyPackage(users: string): Uint8Array {
  return zipPackage({
    "manifest.csv": manifestCsv({ modes: new Map([["users.csv", "bulk"]]) }),
    "users.csv": users,
  });
}
