import { type Result } from "../../result.js";
import type { OneRosterV1p2AssessmentLineItem, OneRosterV1p2AssessmentResult } from "./model.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import {
  createOneRosterV1p2AssessmentLineItemWritePayload,
  createOneRosterV1p2AssessmentResultWritePayload,
  parseOneRosterV1p2AssessmentLineItemCollection,
  parseOneRosterV1p2AssessmentLineItemSingleton,
  parseOneRosterV1p2AssessmentResultCollection,
  parseOneRosterV1p2AssessmentResultSingleton,
} from "./payload.js";
import type { OneRosterV1p2ConfigurationError, OneRosterV1p2RestError } from "../rest/error.js";
import type { OneRosterV1p2Query } from "../rest/query.js";
import type { OneRosterV1p2GeneratedPathParameters } from "../rest/operation.js";
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
  OneRosterRestWriteSuccess,
} from "../../rest/client-types.js";
import {
  createOneRosterV1p2CollectionDefinition,
  createOneRosterV1p2DeleteDefinition,
  createOneRosterV1p2PutDefinition,
  createOneRosterV1p2RestClientFromRegistry,
  createOneRosterV1p2SingletonDefinition,
  type OneRosterV1p2RegistryDefinition,
} from "../rest/client-factory.js";

/** Assessment Results Profile collection read options without field projection. */
export type OneRosterV1p2AssessmentResultsReadOptions =
  OneRosterRestCollectionOptions<OneRosterV1p2Query>;

/** Assessment Results Profile collection read options with a checked projection. */
export type OneRosterV1p2AssessmentResultsProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestCollectionProjectionOptions<TEntity, OneRosterV1p2Query, TField>;

/** Assessment Results Profile singleton options without field projection. */
export type OneRosterV1p2AssessmentResultsSingletonOptions = OneRosterRestSingletonOptions;

/** Assessment Results Profile singleton options with a checked projection. */
export type OneRosterV1p2AssessmentResultsSingletonProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestSingletonProjectionOptions<TEntity, TField>;

/** Required cancellation input for Assessment Results Profile mutations. */
export interface OneRosterV1p2AssessmentResultsWriteOptions {
  readonly signal: AbortSignal;
}

/** Explicit success returned by an Assessment Results Profile mutation. */
export type OneRosterV1p2AssessmentResultsWriteSuccess = OneRosterRestWriteSuccess;

/** Exact generated path parameters for the Assessment Results operation subset. */
export type OneRosterV1p2AssessmentResultsPathParameters = Pick<
  OneRosterV1p2GeneratedPathParameters,
  keyof typeof definitions
>;

/** OneRoster 1.2 Assessment Results Profile v1.0 client over the Gradebook service root. */
type AssessmentResultsWritePolicy =
  OneRosterRestWritePolicy<OneRosterV1p2AssessmentResultsWriteOptions>;

export type OneRosterV1p2AssessmentResultsClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p2AssessmentResultsPathParameters,
  OneRosterV1p2Query,
  OneRosterV1p2AssessmentResultsReadOptions,
  OneRosterV1p2AssessmentResultsSingletonOptions,
  OneRosterV1p2RestError,
  OneRosterV1p2PayloadDiagnostic,
  AssessmentResultsWritePolicy,
  never,
  true
>;

const definitions = {
  getAllAssessmentLineItems: createOneRosterV1p2CollectionDefinition(
    "assessmentLineItems",
    parseOneRosterV1p2AssessmentLineItemCollection,
    "iterateAllAssessmentLineItems",
  ),
  getAssessmentLineItem: createOneRosterV1p2SingletonDefinition(
    "assessmentLineItem",
    parseOneRosterV1p2AssessmentLineItemSingleton,
  ),
  deleteAssessmentLineItem: createOneRosterV1p2DeleteDefinition(),
  putAssessmentLineItem: createOneRosterV1p2PutDefinition<OneRosterV1p2AssessmentLineItem>(
    "assessmentLineItem",
    createOneRosterV1p2AssessmentLineItemWritePayload,
  ),
  getAllAssessmentResults: createOneRosterV1p2CollectionDefinition(
    "assessmentResults",
    parseOneRosterV1p2AssessmentResultCollection,
    "iterateAllAssessmentResults",
  ),
  getAssessmentResult: createOneRosterV1p2SingletonDefinition(
    "assessmentResult",
    parseOneRosterV1p2AssessmentResultSingleton,
  ),
  deleteAssessmentResult: createOneRosterV1p2DeleteDefinition(),
  putAssessmentResult: createOneRosterV1p2PutDefinition<OneRosterV1p2AssessmentResult>(
    "assessmentResult",
    createOneRosterV1p2AssessmentResultWritePayload,
  ),
} as const satisfies Readonly<Record<string, OneRosterV1p2RegistryDefinition>>;

/** Create the Assessment Results Profile client over the registry-driven transport. */
export function createOneRosterV1p2AssessmentResultsClient(
  input: unknown,
): Result<OneRosterV1p2AssessmentResultsClient, OneRosterV1p2ConfigurationError> {
  return createOneRosterV1p2RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p2AssessmentResultsPathParameters,
    OneRosterV1p2AssessmentResultsReadOptions,
    OneRosterV1p2AssessmentResultsSingletonOptions,
    never,
    OneRosterV1p2AssessmentResultsWriteOptions,
    OneRosterV1p2AssessmentResultsWriteSuccess
  >(input, definitions, {
    singletonPayloadMessage:
      "The Assessment Results Profile response did not contain a parsed entity.",
    writePayloadMessage: "The Assessment Results Profile write payload is invalid.",
    sourcedIdMessage: "The path sourcedId must match the assessment write entity sourcedId.",
  });
}
