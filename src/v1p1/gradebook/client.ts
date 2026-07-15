import { type Result } from "../../result.js";
import {
  parseOneRosterV1p1Category,
  parseOneRosterV1p1LineItem,
  parseOneRosterV1p1Result,
  type OneRosterV1p1Category,
  type OneRosterV1p1LineItem,
  type OneRosterV1p1Result,
} from "../model/gradebook.js";
import type { OneRosterV1p1PayloadDiagnostic } from "../model/primitive.js";
import {
  createOneRosterV1p1CollectionParser,
  createOneRosterV1p1SingletonParser,
} from "../rest/payload.js";
import type { OneRosterV1p1ConfigurationError, OneRosterV1p1RestError } from "../rest/error.js";
import type { OneRosterV1p1Query } from "../rest/query.js";
import type {
  OneRosterV1p1GeneratedPathParameters,
  OneRosterV1p1GradebookOperationId,
} from "../rest/operation.js";
import type {
  inferRestClientFromDefinitions,
  OneRosterRestWritePolicy,
  OneRosterRestWriteSuccess,
} from "../../rest/client-types.js";
import {
  createOneRosterV1p1CollectionDefinition as collectionDefinition,
  createOneRosterV1p1DeleteDefinition,
  createOneRosterV1p1PutDefinition,
  createOneRosterV1p1PutPayload,
  createOneRosterV1p1RestClientFromRegistry,
  createOneRosterV1p1SingletonDefinition as singletonDefinition,
  type OneRosterV1p1RegistryDefinition,
} from "../rest/client-factory.js";

/** Options shared by Gradebook reads. */
export interface OneRosterV1p1GradebookReadOptions {
  readonly query?: OneRosterV1p1Query;
  readonly signal?: AbortSignal;
}

/** Optional caller-owned cancellation for Gradebook mutations. */
export interface OneRosterV1p1GradebookWriteOptions {
  readonly signal?: AbortSignal;
}

/** Safe mutation result. */
export type OneRosterV1p1GradebookWriteSuccess = OneRosterRestWriteSuccess;

type OneRosterV1p1GradebookPathParameters = OneRosterV1p1GeneratedPathParameters;

/** Complete typed v1.1 Gradebook pull and passback consumer. */
type GradebookWritePolicy = OneRosterRestWritePolicy<OneRosterV1p1GradebookWriteOptions>;

export type OneRosterV1p1GradebookClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p1GradebookPathParameters,
  OneRosterV1p1Query,
  OneRosterV1p1GradebookReadOptions,
  OneRosterV1p1GradebookReadOptions,
  OneRosterV1p1RestError,
  OneRosterV1p1PayloadDiagnostic,
  GradebookWritePolicy
>;

const categories = createOneRosterV1p1CollectionParser("categories", parseOneRosterV1p1Category);
const category = createOneRosterV1p1SingletonParser("category", parseOneRosterV1p1Category);
const lineItems = createOneRosterV1p1CollectionParser("lineItems", parseOneRosterV1p1LineItem);
const lineItem = createOneRosterV1p1SingletonParser("lineItem", parseOneRosterV1p1LineItem);
const results = createOneRosterV1p1CollectionParser("results", parseOneRosterV1p1Result);
const result = createOneRosterV1p1SingletonParser("result", parseOneRosterV1p1Result);

const definitions = {
  getAllCategories: collectionDefinition(categories, "iterateAllCategories"),
  getCategory: singletonDefinition(category),
  deleteCategory: createOneRosterV1p1DeleteDefinition(),
  putCategory: createOneRosterV1p1PutDefinition<OneRosterV1p1Category>(
    "category",
    createOneRosterV1p1PutPayload("category"),
  ),
  getAllLineItems: collectionDefinition(lineItems, "iterateAllLineItems"),
  getLineItem: singletonDefinition(lineItem),
  deleteLineItem: createOneRosterV1p1DeleteDefinition(),
  putLineItem: createOneRosterV1p1PutDefinition<OneRosterV1p1LineItem>(
    "lineItem",
    createOneRosterV1p1PutPayload("lineItem"),
  ),
  getAllResults: collectionDefinition(results, "iterateAllResults"),
  getResult: singletonDefinition(result),
  deleteResult: createOneRosterV1p1DeleteDefinition(),
  putResult: createOneRosterV1p1PutDefinition<OneRosterV1p1Result>(
    "result",
    createOneRosterV1p1PutPayload("result"),
  ),
  getResultsForClass: collectionDefinition(results, "iterateResultsForClass"),
  getLineItemsForClass: collectionDefinition(lineItems, "iterateLineItemsForClass"),
  getResultsForLineItemForClass: collectionDefinition(results, "iterateResultsForLineItemForClass"),
  getResultsForStudentForClass: collectionDefinition(results, "iterateResultsForStudentForClass"),
} as const satisfies Readonly<
  Record<OneRosterV1p1GradebookOperationId, OneRosterV1p1RegistryDefinition>
>;

/** Create the v1.1 Gradebook client. */
export function createOneRosterV1p1GradebookClient(
  input: unknown,
): Result<OneRosterV1p1GradebookClient, OneRosterV1p1ConfigurationError> {
  return createOneRosterV1p1RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p1GradebookPathParameters,
    OneRosterV1p1GradebookReadOptions,
    OneRosterV1p1GradebookReadOptions,
    never,
    OneRosterV1p1GradebookWriteOptions,
    OneRosterV1p1GradebookWriteSuccess
  >(input, definitions, {
    singletonPayloadMessage: "The singleton envelope did not contain a parsed entity.",
    writePayloadMessage: "The v1.1 Gradebook write payload is invalid.",
    sourcedIdMessage: "The v1.1 Gradebook write sourcedId does not match the path.",
  });
}
