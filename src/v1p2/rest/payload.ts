/** Stable public payload API backed by the generated response-codec wrappers. */
export type {
  OneRosterV1p2CollectionPayload,
  OneRosterV1p2Projected,
  OneRosterV1p2SingletonPayload,
} from "./payload-core.js";
export {
  oneRosterV1p2GeneratedRequestPayloadParsers,
  oneRosterV1p2GeneratedResponseEnvelopeSerializers,
  parseOneRosterV1p2AcademicSessionCollection,
  parseOneRosterV1p2AcademicSessionSingleton,
  parseOneRosterV1p2CategoryCollection,
  parseOneRosterV1p2CategorySingleton,
  parseOneRosterV1p2ClassCollection,
  parseOneRosterV1p2ClassSingleton,
  parseOneRosterV1p2CourseCollection,
  parseOneRosterV1p2CourseSingleton,
  parseOneRosterV1p2DemographicsCollection,
  parseOneRosterV1p2DemographicsSingleton,
  parseOneRosterV1p2EnrollmentCollection,
  parseOneRosterV1p2EnrollmentSingleton,
  parseOneRosterV1p2LineItemCollection,
  parseOneRosterV1p2LineItemSingleton,
  parseOneRosterV1p2OrgCollection,
  parseOneRosterV1p2OrgSingleton,
  parseOneRosterV1p2ResourceCollection,
  parseOneRosterV1p2ResourceSingleton,
  parseOneRosterV1p2ResultCollection,
  parseOneRosterV1p2ResultSingleton,
  parseOneRosterV1p2ScoreScaleCollection,
  parseOneRosterV1p2ScoreScaleSingleton,
  parseOneRosterV1p2UserCollection,
  parseOneRosterV1p2UserSingleton,
} from "./payload.generated.js";
export type {
  OneRosterV1p2GeneratedRequestPayloadParser,
  OneRosterV1p2GeneratedResponseEnvelopeSerializer,
} from "./payload.generated.js";
