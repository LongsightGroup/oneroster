import { type Result } from "../../result.js";
import {
  parseOneRosterV1p1AcademicSession,
  parseOneRosterV1p1Class,
  parseOneRosterV1p1Course,
  parseOneRosterV1p1Demographics,
  parseOneRosterV1p1Enrollment,
  parseOneRosterV1p1Org,
  parseOneRosterV1p1Resource,
  parseOneRosterV1p1User,
} from "../model/rostering.js";
import type { OneRosterV1p1PayloadDiagnostic } from "../model/primitive.js";
import {
  createOneRosterV1p1CollectionParser,
  createOneRosterV1p1SingletonParser,
} from "../rest/payload.js";
import type { OneRosterV1p1ConfigurationError, OneRosterV1p1RestError } from "../rest/error.js";
import type { OneRosterV1p1Query } from "../rest/query.js";
import type { OneRosterV1p1CollectionBounds } from "../rest/transport.js";
import type {
  OneRosterV1p1GeneratedPathParameters,
  OneRosterV1p1ResourcesOperationId,
  OneRosterV1p1RosteringOperationId,
} from "../rest/operation.js";
import type {
  inferRestClientFromDefinitions,
  OneRosterRestWritePolicy,
} from "../../rest/client-types.js";
import {
  createOneRosterV1p1CollectionDefinition as collectionDefinition,
  createOneRosterV1p1RestClientFromRegistry,
  createOneRosterV1p1SingletonDefinition as singletonDefinition,
  type OneRosterV1p1RegistryDefinition,
} from "../rest/client-factory.js";

/** Options shared by v1.1 collection reads. */
export interface OneRosterV1p1RosteringCollectionOptions {
  readonly query?: OneRosterV1p1Query;
  readonly signal?: AbortSignal;
}

/** Options shared by v1.1 singleton reads. */
export interface OneRosterV1p1RosteringSingletonOptions {
  readonly query?: Pick<OneRosterV1p1Query, "fields">;
  readonly signal?: AbortSignal;
}

/** Bounded v1.1 collection traversal options. */
export type OneRosterV1p1RosteringCollectAllOptions = OneRosterV1p1RosteringCollectionOptions &
  OneRosterV1p1CollectionBounds;

type OneRosterV1p1RosteringPathParameters = OneRosterV1p1GeneratedPathParameters;
type RosteringClientOperationId =
  | OneRosterV1p1RosteringOperationId
  | OneRosterV1p1ResourcesOperationId;

/** Complete typed v1.1 Rostering consumer. */
export type OneRosterV1p1RosteringClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p1RosteringPathParameters,
  OneRosterV1p1Query,
  OneRosterV1p1RosteringCollectionOptions,
  OneRosterV1p1RosteringSingletonOptions,
  OneRosterV1p1RestError,
  OneRosterV1p1PayloadDiagnostic,
  OneRosterRestWritePolicy,
  OneRosterV1p1RosteringCollectAllOptions
>;

const academicSessions = createOneRosterV1p1CollectionParser(
  "academicSessions",
  parseOneRosterV1p1AcademicSession,
);
const academicSession = createOneRosterV1p1SingletonParser(
  "academicSession",
  parseOneRosterV1p1AcademicSession,
);
const classes = createOneRosterV1p1CollectionParser("classes", parseOneRosterV1p1Class);
const classValue = createOneRosterV1p1SingletonParser("class", parseOneRosterV1p1Class);
const courses = createOneRosterV1p1CollectionParser("courses", parseOneRosterV1p1Course);
const course = createOneRosterV1p1SingletonParser("course", parseOneRosterV1p1Course);
const enrollments = createOneRosterV1p1CollectionParser(
  "enrollments",
  parseOneRosterV1p1Enrollment,
);
const enrollment = createOneRosterV1p1SingletonParser("enrollment", parseOneRosterV1p1Enrollment);
const demographics = createOneRosterV1p1CollectionParser(
  "demographics",
  parseOneRosterV1p1Demographics,
);
const demographic = createOneRosterV1p1SingletonParser(
  "demographics",
  parseOneRosterV1p1Demographics,
);
const orgs = createOneRosterV1p1CollectionParser("orgs", parseOneRosterV1p1Org);
const org = createOneRosterV1p1SingletonParser("org", parseOneRosterV1p1Org);
const users = createOneRosterV1p1CollectionParser("users", parseOneRosterV1p1User);
const user = createOneRosterV1p1SingletonParser("user", parseOneRosterV1p1User);
const resources = createOneRosterV1p1CollectionParser("resources", parseOneRosterV1p1Resource);
const resource = createOneRosterV1p1SingletonParser("resource", parseOneRosterV1p1Resource);

const definitions = {
  getAllAcademicSessions: collectionDefinition(
    academicSessions,
    "iterateAllAcademicSessions",
    "collectAllAcademicSessions",
  ),
  getAcademicSession: singletonDefinition(academicSession),
  getAllClasses: collectionDefinition(classes, "iterateAllClasses", "collectAllClasses"),
  getClass: singletonDefinition(classValue),
  getAllCourses: collectionDefinition(courses, "iterateAllCourses", "collectAllCourses"),
  getCourse: singletonDefinition(course),
  getAllGradingPeriods: collectionDefinition(
    academicSessions,
    "iterateAllGradingPeriods",
    "collectAllGradingPeriods",
  ),
  getGradingPeriod: singletonDefinition(academicSession),
  getAllDemographics: collectionDefinition(
    demographics,
    "iterateAllDemographics",
    "collectAllDemographics",
  ),
  getDemographics: singletonDefinition(demographic),
  getAllEnrollments: collectionDefinition(
    enrollments,
    "iterateAllEnrollments",
    "collectAllEnrollments",
  ),
  getEnrollment: singletonDefinition(enrollment),
  getAllOrgs: collectionDefinition(orgs, "iterateAllOrgs", "collectAllOrgs"),
  getOrg: singletonDefinition(org),
  getAllSchools: collectionDefinition(orgs, "iterateAllSchools", "collectAllSchools"),
  getSchool: singletonDefinition(org),
  getAllStudents: collectionDefinition(users, "iterateAllStudents", "collectAllStudents"),
  getStudent: singletonDefinition(user),
  getAllTeachers: collectionDefinition(users, "iterateAllTeachers", "collectAllTeachers"),
  getTeacher: singletonDefinition(user),
  getAllTerms: collectionDefinition(academicSessions, "iterateAllTerms", "collectAllTerms"),
  getTerm: singletonDefinition(academicSession),
  getAllUsers: collectionDefinition(users, "iterateAllUsers", "collectAllUsers"),
  getUser: singletonDefinition(user),
  getCoursesForSchool: collectionDefinition(
    courses,
    "iterateCoursesForSchool",
    "collectCoursesForSchool",
  ),
  getEnrollmentsForClassInSchool: collectionDefinition(
    enrollments,
    "iterateEnrollmentsForClassInSchool",
    "collectEnrollmentsForClassInSchool",
  ),
  getStudentsForClassInSchool: collectionDefinition(
    users,
    "iterateStudentsForClassInSchool",
    "collectStudentsForClassInSchool",
  ),
  getTeachersForClassInSchool: collectionDefinition(
    users,
    "iterateTeachersForClassInSchool",
    "collectTeachersForClassInSchool",
  ),
  getEnrollmentsForSchool: collectionDefinition(
    enrollments,
    "iterateEnrollmentsForSchool",
    "collectEnrollmentsForSchool",
  ),
  getStudentsForSchool: collectionDefinition(
    users,
    "iterateStudentsForSchool",
    "collectStudentsForSchool",
  ),
  getTeachersForSchool: collectionDefinition(
    users,
    "iterateTeachersForSchool",
    "collectTeachersForSchool",
  ),
  getTermsForSchool: collectionDefinition(
    academicSessions,
    "iterateTermsForSchool",
    "collectTermsForSchool",
  ),
  getClassesForTerm: collectionDefinition(
    classes,
    "iterateClassesForTerm",
    "collectClassesForTerm",
  ),
  getGradingPeriodsForTerm: collectionDefinition(
    academicSessions,
    "iterateGradingPeriodsForTerm",
    "collectGradingPeriodsForTerm",
  ),
  getClassesForCourse: collectionDefinition(
    classes,
    "iterateClassesForCourse",
    "collectClassesForCourse",
  ),
  getClassesForStudent: collectionDefinition(
    classes,
    "iterateClassesForStudent",
    "collectClassesForStudent",
  ),
  getClassesForTeacher: collectionDefinition(
    classes,
    "iterateClassesForTeacher",
    "collectClassesForTeacher",
  ),
  getClassesForSchool: collectionDefinition(
    classes,
    "iterateClassesForSchool",
    "collectClassesForSchool",
  ),
  getClassesForUser: collectionDefinition(
    classes,
    "iterateClassesForUser",
    "collectClassesForUser",
  ),
  getStudentsForClass: collectionDefinition(
    users,
    "iterateStudentsForClass",
    "collectStudentsForClass",
  ),
  getTeachersForClass: collectionDefinition(
    users,
    "iterateTeachersForClass",
    "collectTeachersForClass",
  ),
  getAllResources: collectionDefinition(resources, "iterateAllResources", "collectAllResources"),
  getResource: singletonDefinition(resource),
  getResourcesForCourse: collectionDefinition(
    resources,
    "iterateResourcesForCourse",
    "collectResourcesForCourse",
  ),
  getResourcesForClass: collectionDefinition(
    resources,
    "iterateResourcesForClass",
    "collectResourcesForClass",
  ),
} as const satisfies Readonly<Record<RosteringClientOperationId, OneRosterV1p1RegistryDefinition>>;

/** Create the v1.1 Rostering and Resources consumer. */
export function createOneRosterV1p1RosteringClient(
  input: unknown,
): Result<OneRosterV1p1RosteringClient, OneRosterV1p1ConfigurationError> {
  return createOneRosterV1p1RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p1RosteringPathParameters,
    OneRosterV1p1RosteringCollectionOptions,
    OneRosterV1p1RosteringSingletonOptions,
    OneRosterV1p1RosteringCollectAllOptions
  >(input, definitions, {
    singletonPayloadMessage: "The singleton envelope did not contain a parsed entity.",
    writePayloadMessage: "The v1.1 Rostering write payload is invalid.",
    sourcedIdMessage: "The v1.1 Rostering write sourcedId does not match the path.",
  });
}
