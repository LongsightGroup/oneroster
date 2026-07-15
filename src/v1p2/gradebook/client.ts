import { type Result } from "../../result.js";
import type {
  OneRosterV1p2Category,
  OneRosterV1p2LineItem,
  OneRosterV1p2Result,
  OneRosterV1p2ScoreScale,
} from "../model/gradebook.js";
import {
  parseOneRosterV1p2CategoryCollection,
  parseOneRosterV1p2CategorySingleton,
  parseOneRosterV1p2LineItemCollection,
  parseOneRosterV1p2LineItemSingleton,
  parseOneRosterV1p2ResultCollection,
  parseOneRosterV1p2ResultSingleton,
  parseOneRosterV1p2ScoreScaleCollection,
  parseOneRosterV1p2ScoreScaleSingleton,
} from "../rest/payload.js";
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
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import type {
  inferRestClientFromDefinitions,
  OneRosterRestWritePolicy,
  OneRosterRestWriteSuccess,
} from "../../rest/client-types.js";
import {
  createOneRosterV1p2CollectionDefinition,
  createOneRosterV1p2DeleteDefinition,
  createOneRosterV1p2PostDefinition,
  createOneRosterV1p2PutDefinition,
  createOneRosterV1p2RestClientFromRegistry,
  createOneRosterV1p2SingletonDefinition,
  type OneRosterV1p2RegistryDefinition,
} from "../rest/client-factory.js";
import {
  createOneRosterV1p2CategoryWritePayload,
  createOneRosterV1p2LineItemCollectionWritePayload,
  createOneRosterV1p2LineItemWritePayload,
  createOneRosterV1p2ResultCollectionWritePayload,
  createOneRosterV1p2ResultWritePayload,
  createOneRosterV1p2ScoreScaleWritePayload,
} from "./write-payload.js";
import { parseOneRosterV1p2GuidPairSet } from "./guid-pair-set.js";

/** Read options without field projection. */
export type OneRosterV1p2GradebookReadOptions = OneRosterRestCollectionOptions<OneRosterV1p2Query>;

/** Read options with a compile-time checked field projection. */
export type OneRosterV1p2GradebookProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestCollectionProjectionOptions<TEntity, OneRosterV1p2Query, TField>;

/** Singleton read options without field projection. */
export type OneRosterV1p2GradebookSingletonOptions = OneRosterRestSingletonOptions;

/** Singleton read options with a compile-time checked field projection. */
export type OneRosterV1p2GradebookSingletonProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = OneRosterRestSingletonProjectionOptions<TEntity, TField>;

/** Optional caller-owned cancellation for Gradebook mutations. */
export interface OneRosterV1p2GradebookWriteOptions {
  readonly signal?: AbortSignal;
}

/** Explicit success returned by a Gradebook mutation. */
export type OneRosterV1p2GradebookWriteSuccess = OneRosterRestWriteSuccess;

/** Exact generated path parameters for the base Gradebook operation subset. */
export type OneRosterV1p2GradebookPathParameters = Pick<
  OneRosterV1p2GeneratedPathParameters,
  keyof typeof definitions
>;

/** Typed base Gradebook pull and passback client. Assessment Profile operations are not exposed here. */
type GradebookWritePolicy = OneRosterRestWritePolicy<OneRosterV1p2GradebookWriteOptions>;

export type OneRosterV1p2GradebookClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p2GradebookPathParameters,
  OneRosterV1p2Query,
  OneRosterV1p2GradebookReadOptions,
  OneRosterV1p2GradebookSingletonOptions,
  OneRosterV1p2RestError,
  OneRosterV1p2PayloadDiagnostic,
  GradebookWritePolicy,
  never,
  true
>;

const definitions = {
  getAllCategories: createOneRosterV1p2CollectionDefinition(
    "categories",
    parseOneRosterV1p2CategoryCollection,
    "iterateAllCategories",
  ),
  getCategory: createOneRosterV1p2SingletonDefinition(
    "category",
    parseOneRosterV1p2CategorySingleton,
  ),
  getCategoriesForClass: createOneRosterV1p2CollectionDefinition(
    "categories",
    parseOneRosterV1p2CategoryCollection,
    "iterateCategoriesForClass",
  ),
  getLineItemsForClass: createOneRosterV1p2CollectionDefinition(
    "lineItems",
    parseOneRosterV1p2LineItemCollection,
    "iterateLineItemsForClass",
  ),
  getResultsForLineItemForClass: createOneRosterV1p2CollectionDefinition(
    "results",
    parseOneRosterV1p2ResultCollection,
    "iterateResultsForLineItemForClass",
  ),
  getResultsForClass: createOneRosterV1p2CollectionDefinition(
    "results",
    parseOneRosterV1p2ResultCollection,
    "iterateResultsForClass",
  ),
  getScoreScalesForClass: createOneRosterV1p2CollectionDefinition(
    "scoreScales",
    parseOneRosterV1p2ScoreScaleCollection,
    "iterateScoreScalesForClass",
  ),
  getResultsForStudentForClass: createOneRosterV1p2CollectionDefinition(
    "results",
    parseOneRosterV1p2ResultCollection,
    "iterateResultsForStudentForClass",
  ),
  getAllLineItems: createOneRosterV1p2CollectionDefinition(
    "lineItems",
    parseOneRosterV1p2LineItemCollection,
    "iterateAllLineItems",
  ),
  getLineItem: createOneRosterV1p2SingletonDefinition(
    "lineItem",
    parseOneRosterV1p2LineItemSingleton,
  ),
  getAllResults: createOneRosterV1p2CollectionDefinition(
    "results",
    parseOneRosterV1p2ResultCollection,
    "iterateAllResults",
  ),
  getResult: createOneRosterV1p2SingletonDefinition("result", parseOneRosterV1p2ResultSingleton),
  getScoreScalesForSchool: createOneRosterV1p2CollectionDefinition(
    "scoreScales",
    parseOneRosterV1p2ScoreScaleCollection,
    "iterateScoreScalesForSchool",
  ),
  getAllScoreScales: createOneRosterV1p2CollectionDefinition(
    "scoreScales",
    parseOneRosterV1p2ScoreScaleCollection,
    "iterateAllScoreScales",
  ),
  getScoreScale: createOneRosterV1p2SingletonDefinition(
    "scoreScale",
    parseOneRosterV1p2ScoreScaleSingleton,
  ),
  deleteCategory: createOneRosterV1p2DeleteDefinition(),
  putCategory: createOneRosterV1p2PutDefinition<OneRosterV1p2Category>(
    "category",
    createOneRosterV1p2CategoryWritePayload,
  ),
  postResultsForAcademicSessionForClass: createOneRosterV1p2PostDefinition<
    ReadonlyArray<OneRosterV1p2Result>
  >(createOneRosterV1p2ResultCollectionWritePayload, parseOneRosterV1p2GuidPairSet),
  postLineItemsForClass: createOneRosterV1p2PostDefinition<ReadonlyArray<OneRosterV1p2LineItem>>(
    createOneRosterV1p2LineItemCollectionWritePayload,
    parseOneRosterV1p2GuidPairSet,
  ),
  deleteLineItem: createOneRosterV1p2DeleteDefinition(),
  putLineItem: createOneRosterV1p2PutDefinition<OneRosterV1p2LineItem>(
    "lineItem",
    createOneRosterV1p2LineItemWritePayload,
  ),
  postResultsForLineItem: createOneRosterV1p2PostDefinition<ReadonlyArray<OneRosterV1p2Result>>(
    createOneRosterV1p2ResultCollectionWritePayload,
    parseOneRosterV1p2GuidPairSet,
  ),
  deleteResult: createOneRosterV1p2DeleteDefinition(),
  putResult: createOneRosterV1p2PutDefinition<OneRosterV1p2Result>(
    "result",
    createOneRosterV1p2ResultWritePayload,
  ),
  postLineItemsForSchool: createOneRosterV1p2PostDefinition<ReadonlyArray<OneRosterV1p2LineItem>>(
    createOneRosterV1p2LineItemCollectionWritePayload,
    parseOneRosterV1p2GuidPairSet,
  ),
  deleteScoreScale: createOneRosterV1p2DeleteDefinition(),
  putScoreScale: createOneRosterV1p2PutDefinition<OneRosterV1p2ScoreScale>(
    "scoreScale",
    createOneRosterV1p2ScoreScaleWritePayload,
  ),
} as const satisfies Readonly<Record<string, OneRosterV1p2RegistryDefinition>>;

/** Create the base Gradebook client over the registry-driven portable transport. */
export function createOneRosterV1p2GradebookClient(
  input: unknown,
): Result<OneRosterV1p2GradebookClient, OneRosterV1p2ConfigurationError> {
  return createOneRosterV1p2RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p2GradebookPathParameters,
    OneRosterV1p2GradebookReadOptions,
    OneRosterV1p2GradebookSingletonOptions,
    never,
    OneRosterV1p2GradebookWriteOptions,
    OneRosterV1p2GradebookWriteSuccess
  >(input, definitions, {
    singletonPayloadMessage: "The Gradebook response did not contain a parsed entity.",
    writePayloadMessage: "The Gradebook write payload is invalid.",
    sourcedIdMessage: "The path sourcedId must match the write entity sourcedId.",
  });
}
