/** Public, explicitly versioned OneRoster 1.1 REST contracts and consumers. */

export {
  parseOneRosterV1p1AcademicSession,
  parseOneRosterV1p1Class,
  parseOneRosterV1p1Course,
  parseOneRosterV1p1Demographics,
  parseOneRosterV1p1Enrollment,
  parseOneRosterV1p1Org,
  parseOneRosterV1p1Resource,
  parseOneRosterV1p1User,
} from "./model/rostering.js";
export type {
  OneRosterV1p1AcademicSession,
  OneRosterV1p1AcademicSessionType,
  OneRosterV1p1Class,
  OneRosterV1p1ClassType,
  OneRosterV1p1Course,
  OneRosterV1p1Demographics,
  OneRosterV1p1Enrollment,
  OneRosterV1p1EnrollmentRole,
  OneRosterV1p1Org,
  OneRosterV1p1OrgType,
  OneRosterV1p1Reference,
  OneRosterV1p1Resource,
  OneRosterV1p1RoleType,
  OneRosterV1p1User,
  OneRosterV1p1UserId,
  OneRosterV1p1UserRole,
} from "./model/rostering.js";

export {
  parseOneRosterV1p1Category,
  parseOneRosterV1p1LineItem,
  parseOneRosterV1p1Result,
} from "./model/gradebook.js";
export type {
  OneRosterV1p1Category,
  OneRosterV1p1LineItem,
  OneRosterV1p1Result,
  OneRosterV1p1ScoreStatus,
} from "./model/gradebook.js";

export {
  parseOneRosterV1p1Date,
  parseOneRosterV1p1DateTime,
  parseOneRosterV1p1SourcedId,
} from "./model/primitive.js";
export type {
  OneRosterV1p1Date,
  OneRosterV1p1DateTime,
  OneRosterV1p1ExtensionToken,
  OneRosterV1p1JsonObject,
  OneRosterV1p1JsonValue,
  OneRosterV1p1LifecycleStatus,
  OneRosterV1p1PayloadDiagnostic,
  OneRosterV1p1PayloadDiagnosticCode,
  OneRosterV1p1PayloadParser,
  OneRosterV1p1SourcedId,
} from "./model/primitive.js";

export {
  combineOneRosterV1p1Filters,
  createOneRosterV1p1ContainsFilter,
  createOneRosterV1p1EqualsFilter,
  createOneRosterV1p1FilterClause,
  createOneRosterV1p1GreaterThanFilter,
  createOneRosterV1p1GreaterThanOrEqualFilter,
  createOneRosterV1p1LessThanFilter,
  createOneRosterV1p1LessThanOrEqualFilter,
  createOneRosterV1p1NotEqualsFilter,
  serializeOneRosterV1p1Filter,
} from "./rest/filter.js";
export type {
  OneRosterV1p1Filter,
  OneRosterV1p1FilterClause,
  OneRosterV1p1FilterValue,
  OneRosterV1p1QueryDiagnostic,
} from "./rest/filter.js";
export {
  createOneRosterV1p1Query,
  serializeOneRosterV1p1Query,
  withOneRosterV1p1QueryOffset,
} from "./rest/query.js";
export type { OneRosterV1p1Query } from "./rest/query.js";

export {
  findOneRosterV1p1Operation,
  oneRosterV1p1BasePath,
  oneRosterV1p1GradebookOperationIds,
  oneRosterV1p1Operations,
  oneRosterV1p1RosteringOperationIds,
  oneRosterV1p1Scope,
} from "./rest/operation.js";
export type {
  OneRosterV1p1GeneratedPathParameters,
  OneRosterV1p1GradebookOperationId,
  OneRosterV1p1Operation,
  OneRosterV1p1OperationMethod,
  OneRosterV1p1QueryCategory,
  OneRosterV1p1ResourcesOperationId,
  OneRosterV1p1ResponseKind,
  OneRosterV1p1RosteringOperationId,
  OneRosterV1p1Service,
} from "./rest/operation.js";

export { createOneRosterV1p1RosteringClient } from "./rostering/client.js";
export type {
  OneRosterV1p1RosteringClient,
  OneRosterV1p1RosteringCollectionOptions,
  OneRosterV1p1RosteringCollectAllOptions,
  OneRosterV1p1RosteringSingletonOptions,
} from "./rostering/client.js";
export { createOneRosterV1p1GradebookClient } from "./gradebook/client.js";
export type {
  OneRosterV1p1GradebookClient,
  OneRosterV1p1GradebookReadOptions,
  OneRosterV1p1GradebookWriteOptions,
  OneRosterV1p1GradebookWriteSuccess,
} from "./gradebook/client.js";

export { createOneRosterV1p1RestTransport } from "./rest/transport.js";
export type {
  OneRosterRestRetryBackoffContext,
  OneRosterRestRetryClock,
  OneRosterRestRetryPolicyInput,
} from "../rest/retry.js";
export type {
  OneRosterV1p1ClientConfigurationInput,
  OneRosterV1p1CollectionBounds,
  OneRosterV1p1CollectionRequest,
  OneRosterV1p1Fetch,
  OneRosterV1p1IterationBounds,
  OneRosterV1p1RestTransport,
  OneRosterV1p1TransportRequest,
  OneRosterV1p1TransportResponse,
} from "./rest/transport.js";
export type {
  OneRosterV1p1AuthorizationError,
  OneRosterV1p1AuthorizationInput,
  OneRosterV1p1RequestAuthorizer,
} from "./rest/authorization.js";
export { createOneRosterV1p1OAuth1Authorizer } from "./rest/oauth1-authorizer.js";
export type {
  OneRosterV1p1OAuth1AuthorizerOptions,
  OneRosterV1p1OAuth1Credentials,
} from "./rest/oauth1-authorizer.js";
export type { OneRosterV1p1RestError } from "./rest/error.js";
export type { OneRosterV1p1Page, OneRosterV1p1PageLinks } from "./rest/page.js";
export { hasMoreOneRosterRestPage as hasMoreOneRosterV1p1Page } from "../rest/page.js";
