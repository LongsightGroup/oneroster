const reference = (type: string, sourcedId: string) => ({
  href: `https://sis.example/objects/${type}/${sourcedId}`,
  sourcedId,
  type,
});

const entityBase = (sourcedId: string) => ({
  sourcedId,
  status: "active",
  dateLastModified: "2025-01-01T00:00:00Z",
});

/** Non-PII, hand-authored Rostering entity fixtures. */
export const rosteringEntities = {
  academicSession: {
    ...entityBase("session-example"),
    title: "Example Term",
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    type: "term",
    schoolYear: "2025",
  },
  course: {
    ...entityBase("course-example"),
    title: "Example Course",
    courseCode: "COURSE-EXAMPLE",
  },
  class: {
    ...entityBase("class-example"),
    title: "Example Class",
    course: reference("course", "course-example"),
    school: reference("org", "school-example"),
    terms: [reference("academicSession", "session-example")],
  },
  org: {
    ...entityBase("school-example"),
    name: "Example School",
    type: "school",
    identifier: "SCHOOL-EXAMPLE",
  },
  demographics: {
    ...entityBase("demographics-example"),
  },
  enrollment: {
    ...entityBase("enrollment-example"),
    user: reference("user", "user-example"),
    class: reference("class", "class-example"),
    school: reference("org", "school-example"),
    role: "student",
    primary: "true",
  },
  user: {
    ...entityBase("user-example"),
    enabledUser: "true",
    givenName: "Example",
    familyName: "Learner",
    roles: [
      {
        roleType: "primary",
        role: "student",
        org: reference("org", "school-example"),
      },
    ],
  },
} as const;

/** Return the standards-defined envelope for one Rostering response family. */
export function rosteringPayload(responseCodec: string, empty = false): Record<string, unknown> {
  switch (responseCodec) {
    case "academicSessionCollection":
      return { academicSessions: empty ? [] : [rosteringEntities.academicSession] };
    case "academicSessionSingleton":
      return { academicSession: rosteringEntities.academicSession };
    case "classCollection":
      return { classes: empty ? [] : [rosteringEntities.class] };
    case "classSingleton":
      return { class: rosteringEntities.class };
    case "courseCollection":
      return { courses: empty ? [] : [rosteringEntities.course] };
    case "courseSingleton":
      return { course: rosteringEntities.course };
    case "demographicsCollection":
      return { demographics: empty ? [] : [rosteringEntities.demographics] };
    case "demographicsSingleton":
      return { demographics: rosteringEntities.demographics };
    case "enrollmentCollection":
      return { enrollments: empty ? [] : [rosteringEntities.enrollment] };
    case "enrollmentSingleton":
      return { enrollment: rosteringEntities.enrollment };
    case "orgCollection":
      return { orgs: empty ? [] : [rosteringEntities.org] };
    case "orgSingleton":
      return { org: rosteringEntities.org };
    case "userCollection":
      return { users: empty ? [] : [rosteringEntities.user] };
    case "userSingleton":
      return { user: rosteringEntities.user };
    default:
      throw new Error(`Unsupported test fixture response codec: ${responseCodec}`);
  }
}
