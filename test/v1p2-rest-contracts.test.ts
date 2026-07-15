import { describe, expect, it } from "vitest";

import {
  findOneRosterV1p2Operation,
  oneRosterV1p2Operations,
  parseOneRosterV1p2AcademicSession,
  parseOneRosterV1p2AcademicSessionCollection,
  parseOneRosterV1p2Category,
  parseOneRosterV1p2Class,
  parseOneRosterV1p2Course,
  parseOneRosterV1p2Date,
  parseOneRosterV1p2DateTime,
  parseOneRosterV1p2Demographics,
  parseOneRosterV1p2Enrollment,
  parseOneRosterV1p2LineItem,
  parseOneRosterV1p2Metadata,
  parseOneRosterV1p2Org,
  parseOneRosterV1p2Reference,
  parseOneRosterV1p2Resource,
  parseOneRosterV1p2Result,
  parseOneRosterV1p2ScoreScale,
  parseOneRosterV1p2StatusInfo,
  parseOneRosterV1p2User,
  parseOneRosterV1p2UserSingleton,
} from "../src/v1p2/index.js";

const href = (kind: string, id: string) => `https://sis.example/ims/oneroster/${kind}/${id}`;

const orgReference = { href: href("orgs", "org-1"), sourcedId: "org-1", type: "org" } as const;
const classReference = {
  href: href("classes", "class-1"),
  sourcedId: "class-1",
  type: "class",
} as const;
const courseReference = {
  href: href("courses", "course-1"),
  sourcedId: "course-1",
  type: "course",
} as const;
const sessionReference = {
  href: href("academicSessions", "term-1"),
  sourcedId: "term-1",
  type: "academicSession",
} as const;
const userReference = { href: href("users", "user-1"), sourcedId: "user-1", type: "user" } as const;

const academicSession = {
  sourcedId: "term-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Term One",
  startDate: "2025-01-01",
  endDate: "2025-06-01",
  type: "term",
  schoolYear: "2025",
};

const org = {
  sourcedId: "org-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  name: "Example School",
  type: "school",
  identifier: "school-1",
};

const course = {
  sourcedId: "course-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Algebra",
  courseCode: "ALG-1",
  schoolYear: sessionReference,
  org: orgReference,
};

const rosterClass = {
  sourcedId: "class-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Algebra A",
  course: courseReference,
  school: orgReference,
  terms: [sessionReference],
};

const user = {
  sourcedId: "user-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  enabledUser: "true",
  givenName: "Example",
  familyName: "Learner",
  roles: [{ roleType: "primary", role: "student", org: orgReference }],
};

const enrollment = {
  sourcedId: "enrollment-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  user: userReference,
  class: classReference,
  school: orgReference,
  role: "student",
  primary: "true",
};

const demographics = {
  sourcedId: "demographics-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  sex: "unspecified",
};

const category = {
  sourcedId: "category-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Assessments",
};

const scoreScale = {
  sourcedId: "scale-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Percent",
  type: "numeric",
  class: classReference,
  scoreScaleValue: [{ itemValueLHS: "0", itemValueRHS: "0" }],
};

const lineItem = {
  sourcedId: "line-item-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Unit One",
  assignDate: "2025-01-01T00:00:00Z",
  dueDate: "2025-02-01T00:00:00Z",
  class: classReference,
  school: orgReference,
  category: { href: href("categories", "category-1"), sourcedId: "category-1", type: "category" },
};

const result = {
  sourcedId: "result-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  lineItem: { href: href("lineItems", "line-item-1"), sourcedId: "line-item-1", type: "lineItem" },
  student: userReference,
  scoreStatus: "fully graded",
  scoreDate: "2025-02-02",
  score: 95,
};

const resource = {
  sourcedId: "resource-1",
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
  title: "Example Resource",
  vendorResourceId: "vendor-resource-1",
  roles: ["student"],
  importance: "primary",
};

describe("OneRoster 1.2 REST contracts", () => {
  it("parses the three service model families and common payloads", () => {
    expect(parseOneRosterV1p2AcademicSession(academicSession)._tag).toBe("ok");
    expect(parseOneRosterV1p2Org(org)._tag).toBe("ok");
    expect(parseOneRosterV1p2Course(course)._tag).toBe("ok");
    expect(parseOneRosterV1p2Class(rosterClass)._tag).toBe("ok");
    expect(parseOneRosterV1p2User(user)._tag).toBe("ok");
    expect(parseOneRosterV1p2Enrollment(enrollment)._tag).toBe("ok");
    expect(parseOneRosterV1p2Demographics(demographics)._tag).toBe("ok");
    expect(parseOneRosterV1p2Category(category)._tag).toBe("ok");
    expect(parseOneRosterV1p2ScoreScale(scoreScale)._tag).toBe("ok");
    expect(parseOneRosterV1p2LineItem(lineItem)._tag).toBe("ok");
    expect(parseOneRosterV1p2Result(result)._tag).toBe("ok");
    expect(parseOneRosterV1p2Resource(resource)._tag).toBe("ok");
    expect(
      parseOneRosterV1p2AcademicSessionCollection({ academicSessions: [academicSession] })._tag,
    ).toBe("ok");
    expect(parseOneRosterV1p2UserSingleton({ user })._tag).toBe("ok");
  });

  it("parses canonical primitives, metadata, references, and status payloads", () => {
    expect(parseOneRosterV1p2Date("2025-02-02")).toMatchObject({ _tag: "ok", value: "2025-02-02" });
    expect(parseOneRosterV1p2DateTime("2025-02-02T01:02:03+00:00")).toMatchObject({
      _tag: "ok",
      value: "2025-02-02T01:02:03.000Z",
    });
    expect(parseOneRosterV1p2Metadata({ "x-example": [true, 1, null] })._tag).toBe("ok");
    expect(parseOneRosterV1p2Reference(orgReference, "org")._tag).toBe("ok");
    expect(
      parseOneRosterV1p2StatusInfo({ imsx_codeMajor: "failure", imsx_severity: "error" })._tag,
    ).toBe("ok");
  });

  it("rejects malformed required, nested, vocabulary, and extension values safely", () => {
    const missing = parseOneRosterV1p2User({ ...user, roles: [] });
    expect(missing._tag).toBe("err");
    expect(JSON.stringify(missing)).not.toContain("Learner");

    const nested = parseOneRosterV1p2Class({
      ...rosterClass,
      terms: [{ ...sessionReference, type: "course" }],
    });
    expect(nested._tag).toBe("err");
    expect(nested._tag === "err" ? nested.error[0]?.path : "").toContain("terms");

    expect(parseOneRosterV1p2DateTime("2025-02-02T01:02:03-05:00")._tag).toBe("err");
    expect(parseOneRosterV1p2Resource({ ...resource, importance: "critical" })._tag).toBe("err");
    expect(parseOneRosterV1p2Metadata({ password: undefined })._tag).toBe("err");
    expect(parseOneRosterV1p2User({ ...user, unexpected: "value" })._tag).toBe("err");
  });

  it("contains unique official operation IDs and method/path pairs", () => {
    expect(oneRosterV1p2Operations.length).toBe(81);
    expect(new Set(oneRosterV1p2Operations.map((operation) => operation.operationId)).size).toBe(
      oneRosterV1p2Operations.length,
    );
    expect(
      new Set(
        oneRosterV1p2Operations.map(
          (operation) => `${operation.method} ${operation.service} ${operation.path}`,
        ),
      ).size,
    ).toBe(oneRosterV1p2Operations.length);
    expect(findOneRosterV1p2Operation("getAllUsers")).toMatchObject({
      method: "GET",
      path: "/users",
      responseKind: "collection",
    });
    expect(findOneRosterV1p2Operation("putResult")).toMatchObject({
      method: "PUT",
      path: "/results/{sourcedId}",
      responseKind: "noContent",
    });
  });
});
