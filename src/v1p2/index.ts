/** Public OneRoster 1.2 REST contracts and payload codecs. */

export {
  parseOneRosterV1p2AcademicSession,
  parseOneRosterV1p2Class,
  parseOneRosterV1p2Course,
  parseOneRosterV1p2Demographics,
  parseOneRosterV1p2Enrollment,
  parseOneRosterV1p2Org,
  parseOneRosterV1p2User,
} from "./model/rostering.js";
export type {
  OneRosterV1p2AcademicSession,
  OneRosterV1p2AcademicSessionReference,
  OneRosterV1p2AcademicSessionType,
  OneRosterV1p2Class,
  OneRosterV1p2ClassReference,
  OneRosterV1p2ClassType,
  OneRosterV1p2Course,
  OneRosterV1p2CourseReference,
  OneRosterV1p2Credential,
  OneRosterV1p2Demographics,
  OneRosterV1p2DemographicsSex,
  OneRosterV1p2Enrollment,
  OneRosterV1p2EnrollmentRole,
  OneRosterV1p2Org,
  OneRosterV1p2OrgReference,
  OneRosterV1p2OrgType,
  OneRosterV1p2ResourceReference,
  OneRosterV1p2Role,
  OneRosterV1p2RoleType,
  OneRosterV1p2User,
  OneRosterV1p2UserId,
  OneRosterV1p2UserProfile,
  OneRosterV1p2UserReference,
} from "./model/rostering.js";

export {
  parseOneRosterV1p2Category,
  parseOneRosterV1p2LineItem,
  parseOneRosterV1p2Result,
  parseOneRosterV1p2ScoreScale,
} from "./model/gradebook.js";
export type {
  OneRosterV1p2Category,
  OneRosterV1p2LearningObjectiveResult,
  OneRosterV1p2LearningObjectiveScoreSet,
  OneRosterV1p2LearningObjectiveSet,
  OneRosterV1p2LearningObjectiveSource,
  OneRosterV1p2LineItem,
  OneRosterV1p2Result,
  OneRosterV1p2ScoreScale,
  OneRosterV1p2ScoreScaleValue,
  OneRosterV1p2ScoreStatus,
} from "./model/gradebook.js";

export { parseOneRosterV1p2Resource } from "./model/resources.js";
export type {
  OneRosterV1p2Resource,
  OneRosterV1p2ResourceImportance,
  OneRosterV1p2ResourceRole,
} from "./model/resources.js";

export { parseOneRosterV1p2JsonValue, parseOneRosterV1p2Metadata } from "./model/json-value.js";
export type {
  OneRosterV1p2JsonObject,
  OneRosterV1p2JsonValue,
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadDiagnosticCode,
} from "./model/json-value.js";
export {
  parseOneRosterV1p2Date,
  parseOneRosterV1p2DateTime,
  parseOneRosterV1p2SourcedId,
  parseOneRosterV1p2Uri,
} from "./model/primitive.js";
export type {
  OneRosterV1p2Date,
  OneRosterV1p2DateTime,
  OneRosterV1p2ExtensionToken,
  OneRosterV1p2SourcedId,
  OneRosterV1p2Uri,
} from "./model/primitive.js";
export { parseOneRosterV1p2Reference } from "./model/reference.js";
export type { OneRosterV1p2Reference, OneRosterV1p2ReferenceType } from "./model/reference.js";
export type {
  OneRosterV1p2LifecycleStatus,
  OneRosterV1p2StatusCodeMajor,
  OneRosterV1p2StatusCodeMinor,
  OneRosterV1p2StatusCodeMinorField,
  OneRosterV1p2StatusCodeMinorValue,
  OneRosterV1p2StatusInfo,
  OneRosterV1p2StatusSeverity,
} from "./model/status.js";
export { parseOneRosterV1p2LifecycleStatus, parseOneRosterV1p2StatusInfo } from "./model/status.js";

export {
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
} from "./rest/payload.js";
export type {
  OneRosterV1p2CollectionPayload,
  OneRosterV1p2Projected,
  OneRosterV1p2SingletonPayload,
} from "./rest/payload.js";

export {
  findOneRosterV1p2Operation,
  oneRosterV1p2BasePaths,
  oneRosterV1p2OperationIdsByProviderKind,
  oneRosterV1p2OperationIdsByService,
  oneRosterV1p2Operations,
  oneRosterV1p2Scope,
} from "./rest/operation.js";

export { createOneRosterV1p2AccessToken, OneRosterV1p2AccessToken } from "./rest/access-token.js";
export type {
  OneRosterV1p2AccessTokenProvider,
  OneRosterV1p2AuthenticationError,
} from "./rest/access-token.js";
export {
  buildOneRosterV1p2DiscoveryUrl,
  checkOneRosterV1p2DiscoveryCapabilities,
  readOneRosterV1p2Discovery,
} from "./rest/discovery.js";
export type {
  OneRosterV1p2CapabilityGapReport,
  OneRosterV1p2DiscoveryCapabilities,
  OneRosterV1p2DiscoveryConventionUrlInput,
  OneRosterV1p2DiscoveryError,
  OneRosterV1p2DiscoveryExactFilenameUrlInput,
  OneRosterV1p2DiscoveryNamingConvention,
  OneRosterV1p2DiscoveryOperation,
  OneRosterV1p2DiscoveryOperationMethod,
  OneRosterV1p2DiscoveryReadOptions,
  OneRosterV1p2DiscoveryUrlInput,
} from "./rest/discovery.js";
export { createOneRosterV1p2OAuth2ClientCredentialsProvider } from "./rest/oauth2-client-credentials.js";
export type {
  OneRosterV1p2OAuth2ClientAuthentication,
  OneRosterV1p2OAuth2ClientCredentialsOptions,
} from "./rest/oauth2-client-credentials.js";
export {
  combineOneRosterV1p2Filters,
  createOneRosterV1p2ContainsFilter,
  createOneRosterV1p2EqualsFilter,
  createOneRosterV1p2FilterClause,
  createOneRosterV1p2GreaterThanFilter,
  createOneRosterV1p2GreaterThanOrEqualFilter,
  createOneRosterV1p2LessThanFilter,
  createOneRosterV1p2LessThanOrEqualFilter,
  createOneRosterV1p2NotEqualsFilter,
  serializeOneRosterV1p2Filter,
} from "./rest/filter.js";
export type {
  OneRosterV1p2Filter,
  OneRosterV1p2FilterClause,
  OneRosterV1p2FilterOperator,
  OneRosterV1p2FilterValue,
  OneRosterV1p2QueryDiagnostic,
} from "./rest/filter.js";
export {
  createOneRosterV1p2Query,
  serializeOneRosterV1p2Query,
  withOneRosterV1p2QueryOffset,
} from "./rest/query.js";
export type { OneRosterV1p2Query, OneRosterV1p2QueryInput } from "./rest/query.js";
export { parseOneRosterV1p2PageMetadata } from "./rest/page.js";
export { hasMoreOneRosterRestPage as hasMoreOneRosterV1p2Page } from "../rest/page.js";
export type { OneRosterV1p2Page, OneRosterV1p2PageLinks } from "./rest/page.js";
export { createOneRosterV1p2ClientConfiguration } from "./rest/client-configuration.js";
export type {
  OneRosterV1p2ClientConfiguration,
  OneRosterV1p2ClientConfigurationInput,
  OneRosterV1p2Fetch,
  OneRosterV1p2ServiceBaseUrls,
} from "./rest/client-configuration.js";
export { createOneRosterV1p2RestTransport } from "./rest/transport.js";
export type {
  OneRosterRestRetryBackoffContext,
  OneRosterRestRetryClock,
  OneRosterRestRetryPolicyInput,
} from "../rest/retry.js";
export type {
  OneRosterV1p2CollectionBounds,
  OneRosterV1p2CollectionRequest,
  OneRosterV1p2IterationBounds,
  OneRosterV1p2RestTransport,
  OneRosterV1p2TransportRequest,
  OneRosterV1p2TransportResponse,
} from "./rest/transport.js";
export type {
  OneRosterV1p2CollectionLimitError,
  OneRosterV1p2ConfigurationError,
  OneRosterV1p2ContentTypeError,
  OneRosterV1p2HttpError,
  OneRosterV1p2JsonError,
  OneRosterV1p2NetworkError,
  OneRosterV1p2PaginationError,
  OneRosterV1p2PathParameterError,
  OneRosterV1p2PayloadError,
  OneRosterV1p2QueryError,
  OneRosterV1p2RestError,
  OneRosterV1p2SafeHeaders,
} from "./rest/error.js";
export type {
  OneRosterV1p2Operation,
  OneRosterV1p2OperationId,
  OneRosterV1p2OperationMethod,
  OneRosterV1p2ProviderOperationId,
  OneRosterV1p2ProviderOperationKind,
  OneRosterV1p2QueryCategory,
  OneRosterV1p2ResponseKind,
  OneRosterV1p2Service,
} from "./rest/operation.js";

export {
  createOneRosterV1p2RosteringClient,
  oneRosterV1p2RosteringOperationIds,
} from "./rostering/client.js";
export type {
  OneRosterV1p2RosteringClient,
  OneRosterV1p2RosteringCollectionOptions,
  OneRosterV1p2RosteringCollectionProjectionOptions,
  OneRosterV1p2RosteringCollectAllOptions,
  OneRosterV1p2RosteringCollectAllProjectionOptions,
  OneRosterV1p2RosteringPathParameters,
  OneRosterV1p2RosteringSingletonOptions,
  OneRosterV1p2RosteringSingletonProjectionOptions,
} from "./rostering/client.js";

export { createOneRosterV1p2GradebookClient } from "./gradebook/client.js";
export type {
  OneRosterV1p2GradebookClient,
  OneRosterV1p2GradebookPathParameters,
  OneRosterV1p2GradebookProjectionOptions,
  OneRosterV1p2GradebookReadOptions,
  OneRosterV1p2GradebookSingletonOptions,
  OneRosterV1p2GradebookSingletonProjectionOptions,
  OneRosterV1p2GradebookWriteOptions,
  OneRosterV1p2GradebookWriteSuccess,
} from "./gradebook/client.js";
export {
  createOneRosterV1p2CategoryWritePayload,
  createOneRosterV1p2LineItemCollectionWritePayload,
  createOneRosterV1p2LineItemWritePayload,
  createOneRosterV1p2ResultCollectionWritePayload,
  createOneRosterV1p2ResultWritePayload,
  createOneRosterV1p2ScoreScaleWritePayload,
} from "./gradebook/write-payload.js";

export {
  parseOneRosterV1p2AssessmentLineItem,
  parseOneRosterV1p2AssessmentResult,
} from "./assessment-results/model.js";
export type {
  OneRosterV1p2AssessmentLearningObjectiveResult,
  OneRosterV1p2AssessmentLearningObjectiveScoreSet,
  OneRosterV1p2AssessmentLearningObjectiveSet,
  OneRosterV1p2AssessmentLearningObjectiveSource,
  OneRosterV1p2AssessmentLineItem,
  OneRosterV1p2AssessmentResult,
  OneRosterV1p2AssessmentScoreStatus,
} from "./assessment-results/model.js";
export {
  createOneRosterV1p2AssessmentLineItemWritePayload,
  createOneRosterV1p2AssessmentResultWritePayload,
  parseOneRosterV1p2AssessmentLineItemCollection,
  parseOneRosterV1p2AssessmentLineItemSingleton,
  parseOneRosterV1p2AssessmentResultCollection,
  parseOneRosterV1p2AssessmentResultSingleton,
} from "./assessment-results/payload.js";
export type {
  OneRosterV1p2AssessmentResultsCollectionPayload,
  OneRosterV1p2AssessmentResultsSingletonPayload,
} from "./assessment-results/payload.js";
export { createOneRosterV1p2AssessmentResultsClient } from "./assessment-results/client.js";
export type {
  OneRosterV1p2AssessmentResultsClient,
  OneRosterV1p2AssessmentResultsPathParameters,
  OneRosterV1p2AssessmentResultsProjectionOptions,
  OneRosterV1p2AssessmentResultsReadOptions,
  OneRosterV1p2AssessmentResultsSingletonOptions,
  OneRosterV1p2AssessmentResultsSingletonProjectionOptions,
  OneRosterV1p2AssessmentResultsWriteOptions,
  OneRosterV1p2AssessmentResultsWriteSuccess,
} from "./assessment-results/client.js";

export { createOneRosterV1p2ResourcesClient } from "./resources/client.js";
export type {
  OneRosterV1p2ResourcesClient,
  OneRosterV1p2ResourcesPathParameters,
  OneRosterV1p2ResourcesProjectionOptions,
  OneRosterV1p2ResourcesReadOptions,
  OneRosterV1p2ResourcesSingletonOptions,
  OneRosterV1p2ResourcesSingletonProjectionOptions,
} from "./resources/client.js";

export {
  oneRosterV1p2ProviderAssessmentResultsOperationIds,
  oneRosterV1p2ProviderBaseGradebookOperationIds,
  oneRosterV1p2ProviderGradebookOperationIds,
  oneRosterV1p2ProviderResourcesOperationIds,
  oneRosterV1p2ProviderRosteringOperationIds,
  findOneRosterV1p2ProviderHandler,
  getOneRosterV1p2ProviderOperationIds,
} from "./provider/service.js";
export type {
  OneRosterV1p2GradebookProviderService,
  OneRosterV1p2GradebookProviderServiceSubset,
  OneRosterV1p2ProviderAuthorizationFacts,
  OneRosterV1p2ProviderFailure,
  OneRosterV1p2ProviderOperationHandler,
  OneRosterV1p2ProviderOperationInput,
  OneRosterV1p2ProviderPage,
  OneRosterV1p2ProviderPrincipal,
  OneRosterV1p2ProviderRequestContext,
  OneRosterV1p2ProviderServices,
  OneRosterV1p2ProviderSuccess,
  OneRosterV1p2ResourcesProviderService,
  OneRosterV1p2ResourcesProviderServiceSubset,
  OneRosterV1p2RosteringProviderService,
  OneRosterV1p2RosteringProviderServiceSubset,
} from "./provider/service.js";
export {
  oneRosterV1p2ProviderForbidden,
  oneRosterV1p2ProviderUnauthorized,
} from "./provider/authorization.js";
export type {
  OneRosterV1p2ProviderAuthorize,
  OneRosterV1p2ProviderAuthorizationFailure,
} from "./provider/authorization.js";
export { createOneRosterV1p2ProviderRouter } from "./provider/router.js";
export type {
  OneRosterV1p2ProviderRouter,
  OneRosterV1p2ProviderRouterConfigurationError,
  OneRosterV1p2ProviderRouterOptions,
} from "./provider/router.js";
export {
  createOneRosterV1p2ProviderPage,
  createOneRosterV1p2ProviderStatusResponse,
  serializeOneRosterV1p2ProviderSuccess,
} from "./provider/response.js";
export type { OneRosterV1p2ProviderWireResponse } from "./provider/response.js";
export { buildOneRosterV1p2ProviderDiscoveryDocument } from "./provider/discovery.js";
export type {
  OneRosterV1p2ProviderDiscoveryError,
  OneRosterV1p2ProviderDiscoveryOptions,
} from "./provider/discovery.js";
