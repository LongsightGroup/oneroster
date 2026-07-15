import { type Result } from "../../result.js";
import {
  parseOneRosterV1p2AcademicSessionCollection,
  parseOneRosterV1p2AcademicSessionSingleton,
  parseOneRosterV1p2ClassCollection,
  parseOneRosterV1p2ClassSingleton,
  parseOneRosterV1p2CourseCollection,
  parseOneRosterV1p2CourseSingleton,
  parseOneRosterV1p2DemographicsCollection,
  parseOneRosterV1p2DemographicsSingleton,
  parseOneRosterV1p2EnrollmentCollection,
  parseOneRosterV1p2EnrollmentSingleton,
  parseOneRosterV1p2OrgCollection,
  parseOneRosterV1p2OrgSingleton,
  parseOneRosterV1p2UserCollection,
  parseOneRosterV1p2UserSingleton,
} from "../rest/payload.js";
import type { OneRosterV1p2CollectionBounds } from "../rest/transport.js";
import type { OneRosterV1p2ConfigurationError, OneRosterV1p2RestError } from "../rest/error.js";
import type { OneRosterV1p2Query } from "../rest/query.js";
import type { OneRosterV1p2GeneratedPathParameters } from "../rest/operation.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import type {
  OneRosterRestCollectionOptions,
  OneRosterRestCollectionProjectionOptions,
  OneRosterRestEntityField,
  OneRosterRestSingletonOptions,
  OneRosterRestSingletonProjectionOptions,
} from "../../rest/projection.js";
import type {
  inferRestClientFromDefinitions,
  OneRosterRestWritePolicy,
} from "../../rest/client-types.js";
import {
  createOneRosterV1p2CollectionDefinition as collectionDefinition,
  createOneRosterV1p2RestClientFromRegistry,
  createOneRosterV1p2SingletonDefinition as singletonDefinition,
  type OneRosterV1p2RegistryDefinition,
} from "../rest/client-factory.js";

/** Collection options without field projection. */
export type OneRosterV1p2RosteringCollectionOptions =
  OneRosterRestCollectionOptions<OneRosterV1p2Query>;

/** Collection options with a compile-time checked top-level field projection. */
export type OneRosterV1p2RosteringCollectionProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestCollectionProjectionOptions<TEntity, OneRosterV1p2Query, TField>;

/** Singleton options without field projection. */
export type OneRosterV1p2RosteringSingletonOptions = OneRosterRestSingletonOptions;

/** Singleton options with a compile-time checked top-level field projection. */
export type OneRosterV1p2RosteringSingletonProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestSingletonProjectionOptions<TEntity, TField>;

/** Bounded collection options without field projection. */
export type OneRosterV1p2RosteringCollectAllOptions = OneRosterV1p2RosteringCollectionOptions &
  OneRosterV1p2CollectionBounds;

/** Bounded collection options with a compile-time checked field projection. */
export type OneRosterV1p2RosteringCollectAllProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterV1p2RosteringCollectionProjectionOptions<TEntity, TField> &
  OneRosterV1p2CollectionBounds;

const definitions = {
  getAllAcademicSessions: collectionDefinition(
    "academicSessions",
    parseOneRosterV1p2AcademicSessionCollection,
    "iterateAllAcademicSessions",
    "collectAllAcademicSessions",
  ),
  getAcademicSession: singletonDefinition(
    "academicSession",
    parseOneRosterV1p2AcademicSessionSingleton,
  ),
  getAllClasses: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateAllClasses",
    "collectAllClasses",
  ),
  getStudentsForClass: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateStudentsForClass",
    "collectStudentsForClass",
  ),
  getTeachersForClass: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateTeachersForClass",
    "collectTeachersForClass",
  ),
  getClass: singletonDefinition("class", parseOneRosterV1p2ClassSingleton),
  getAllCourses: collectionDefinition(
    "courses",
    parseOneRosterV1p2CourseCollection,
    "iterateAllCourses",
    "collectAllCourses",
  ),
  getClassesForCourse: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForCourse",
    "collectClassesForCourse",
  ),
  getCourse: singletonDefinition("course", parseOneRosterV1p2CourseSingleton),
  getAllDemographics: collectionDefinition(
    "demographics",
    parseOneRosterV1p2DemographicsCollection,
    "iterateAllDemographics",
    "collectAllDemographics",
  ),
  getDemographics: singletonDefinition("demographics", parseOneRosterV1p2DemographicsSingleton),
  getAllEnrollments: collectionDefinition(
    "enrollments",
    parseOneRosterV1p2EnrollmentCollection,
    "iterateAllEnrollments",
    "collectAllEnrollments",
  ),
  getEnrollment: singletonDefinition("enrollment", parseOneRosterV1p2EnrollmentSingleton),
  getAllGradingPeriods: collectionDefinition(
    "academicSessions",
    parseOneRosterV1p2AcademicSessionCollection,
    "iterateAllGradingPeriods",
    "collectAllGradingPeriods",
  ),
  getGradingPeriod: singletonDefinition(
    "academicSession",
    parseOneRosterV1p2AcademicSessionSingleton,
  ),
  getAllOrgs: collectionDefinition(
    "orgs",
    parseOneRosterV1p2OrgCollection,
    "iterateAllOrgs",
    "collectAllOrgs",
  ),
  getOrg: singletonDefinition("org", parseOneRosterV1p2OrgSingleton),
  getAllSchools: collectionDefinition(
    "orgs",
    parseOneRosterV1p2OrgCollection,
    "iterateAllSchools",
    "collectAllSchools",
  ),
  getClassesForSchool: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForSchool",
    "collectClassesForSchool",
  ),
  getEnrollmentsForClassInSchool: collectionDefinition(
    "enrollments",
    parseOneRosterV1p2EnrollmentCollection,
    "iterateEnrollmentsForClassInSchool",
    "collectEnrollmentsForClassInSchool",
  ),
  getStudentsForClassInSchool: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateStudentsForClassInSchool",
    "collectStudentsForClassInSchool",
  ),
  getTeachersForClassInSchool: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateTeachersForClassInSchool",
    "collectTeachersForClassInSchool",
  ),
  getCoursesForSchool: collectionDefinition(
    "courses",
    parseOneRosterV1p2CourseCollection,
    "iterateCoursesForSchool",
    "collectCoursesForSchool",
  ),
  getEnrollmentsForSchool: collectionDefinition(
    "enrollments",
    parseOneRosterV1p2EnrollmentCollection,
    "iterateEnrollmentsForSchool",
    "collectEnrollmentsForSchool",
  ),
  getStudentsForSchool: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateStudentsForSchool",
    "collectStudentsForSchool",
  ),
  getTeachersForSchool: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateTeachersForSchool",
    "collectTeachersForSchool",
  ),
  getTermsForSchool: collectionDefinition(
    "academicSessions",
    parseOneRosterV1p2AcademicSessionCollection,
    "iterateTermsForSchool",
    "collectTermsForSchool",
  ),
  getSchool: singletonDefinition("org", parseOneRosterV1p2OrgSingleton),
  getAllStudents: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateAllStudents",
    "collectAllStudents",
  ),
  getStudent: singletonDefinition("user", parseOneRosterV1p2UserSingleton),
  getClassesForStudent: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForStudent",
    "collectClassesForStudent",
  ),
  getAllTeachers: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateAllTeachers",
    "collectAllTeachers",
  ),
  getTeacher: singletonDefinition("user", parseOneRosterV1p2UserSingleton),
  getClassesForTeacher: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForTeacher",
    "collectClassesForTeacher",
  ),
  getAllTerms: collectionDefinition(
    "academicSessions",
    parseOneRosterV1p2AcademicSessionCollection,
    "iterateAllTerms",
    "collectAllTerms",
  ),
  getTerm: singletonDefinition("academicSession", parseOneRosterV1p2AcademicSessionSingleton),
  getClassesForTerm: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForTerm",
    "collectClassesForTerm",
  ),
  getGradingPeriodsForTerm: collectionDefinition(
    "academicSessions",
    parseOneRosterV1p2AcademicSessionCollection,
    "iterateGradingPeriodsForTerm",
    "collectGradingPeriodsForTerm",
  ),
  getAllUsers: collectionDefinition(
    "users",
    parseOneRosterV1p2UserCollection,
    "iterateAllUsers",
    "collectAllUsers",
  ),
  getUser: singletonDefinition("user", parseOneRosterV1p2UserSingleton),
  getClassesForUser: collectionDefinition(
    "classes",
    parseOneRosterV1p2ClassCollection,
    "iterateClassesForUser",
    "collectClassesForUser",
  ),
} as const satisfies Readonly<Record<string, OneRosterV1p2RegistryDefinition>>;

/** Exact generated path parameters for the Rostering operation subset. */
export type OneRosterV1p2RosteringPathParameters = Pick<
  OneRosterV1p2GeneratedPathParameters,
  keyof typeof definitions
>;

/** Typed read-only OneRoster 1.2 Rostering consumer. */
export type OneRosterV1p2RosteringClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p2RosteringPathParameters,
  OneRosterV1p2Query,
  OneRosterV1p2RosteringCollectionOptions,
  OneRosterV1p2RosteringSingletonOptions,
  OneRosterV1p2RestError,
  OneRosterV1p2PayloadDiagnostic,
  OneRosterRestWritePolicy,
  OneRosterV1p2RosteringCollectAllOptions,
  true
>;

/** Registry operation IDs covered by the public Rostering client. */
export const oneRosterV1p2RosteringOperationIds: ReadonlyArray<string> = Object.freeze(
  Object.keys(definitions),
);

/** Create the complete registry-driven read-only Rostering client. */
export function createOneRosterV1p2RosteringClient(
  input: unknown,
): Result<OneRosterV1p2RosteringClient, OneRosterV1p2ConfigurationError> {
  return createOneRosterV1p2RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p2RosteringPathParameters,
    OneRosterV1p2RosteringCollectionOptions,
    OneRosterV1p2RosteringSingletonOptions,
    OneRosterV1p2RosteringCollectAllOptions
  >(input, definitions, {
    singletonPayloadMessage: "The OneRoster singleton response did not contain a parsed entity.",
    writePayloadMessage: "The Rostering write payload is invalid.",
    sourcedIdMessage: "The path sourcedId must match the write entity sourcedId.",
  });
}
