import { type Result } from "../../result.js";
import type { OneRosterV1p2Resource } from "../model/resources.js";
import {
  parseOneRosterV1p2ResourceCollection,
  parseOneRosterV1p2ResourceSingleton,
} from "../rest/payload.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
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
} from "../../rest/client-types.js";
import {
  createOneRosterV1p2CollectionDefinition,
  createOneRosterV1p2RestClientFromRegistry,
  createOneRosterV1p2SingletonDefinition,
  type OneRosterV1p2RegistryDefinition,
} from "../rest/client-factory.js";

/** Resource collection options without field projection. */
export type OneRosterV1p2ResourcesReadOptions = OneRosterRestCollectionOptions<OneRosterV1p2Query>;

/** Resource collection options with a compile-time checked field projection. */
export type OneRosterV1p2ResourcesProjectionOptions<
  TField extends OneRosterRestEntityField<OneRosterV1p2Resource>,
> = OneRosterRestCollectionProjectionOptions<OneRosterV1p2Resource, OneRosterV1p2Query, TField>;

/** Resource singleton options without field projection. */
export type OneRosterV1p2ResourcesSingletonOptions = OneRosterRestSingletonOptions;

/** Resource singleton options with a compile-time checked field projection. */
export type OneRosterV1p2ResourcesSingletonProjectionOptions<
  TField extends OneRosterRestEntityField<OneRosterV1p2Resource>,
> = OneRosterRestSingletonProjectionOptions<OneRosterV1p2Resource, TField>;

/** Exact generated path parameters for the Resources operation subset. */
export type OneRosterV1p2ResourcesPathParameters = Pick<
  OneRosterV1p2GeneratedPathParameters,
  keyof typeof definitions
>;

/** Read-only OneRoster 1.2 Resources consumer. */
export type OneRosterV1p2ResourcesClient = inferRestClientFromDefinitions<
  typeof definitions,
  OneRosterV1p2ResourcesPathParameters,
  OneRosterV1p2Query,
  OneRosterV1p2ResourcesReadOptions,
  OneRosterV1p2ResourcesSingletonOptions,
  OneRosterV1p2RestError,
  OneRosterV1p2PayloadDiagnostic,
  OneRosterRestWritePolicy,
  never,
  true
>;

const definitions = {
  getAllResources: createOneRosterV1p2CollectionDefinition(
    "resources",
    parseOneRosterV1p2ResourceCollection,
    "iterateAllResources",
  ),
  getResource: createOneRosterV1p2SingletonDefinition(
    "resource",
    parseOneRosterV1p2ResourceSingleton,
  ),
  getResourcesForClass: createOneRosterV1p2CollectionDefinition(
    "resources",
    parseOneRosterV1p2ResourceCollection,
    "iterateResourcesForClass",
  ),
  getResourcesForCourse: createOneRosterV1p2CollectionDefinition(
    "resources",
    parseOneRosterV1p2ResourceCollection,
    "iterateResourcesForCourse",
  ),
  getResourcesForUser: createOneRosterV1p2CollectionDefinition(
    "resources",
    parseOneRosterV1p2ResourceCollection,
    "iterateResourcesForUser",
  ),
} as const satisfies Readonly<Record<string, OneRosterV1p2RegistryDefinition>>;

/** Create the registry-driven Resources client. */
export function createOneRosterV1p2ResourcesClient(
  input: unknown,
): Result<OneRosterV1p2ResourcesClient, OneRosterV1p2ConfigurationError> {
  return createOneRosterV1p2RestClientFromRegistry<
    typeof definitions,
    OneRosterV1p2ResourcesPathParameters,
    OneRosterV1p2ResourcesReadOptions,
    OneRosterV1p2ResourcesSingletonOptions
  >(input, definitions, {
    singletonPayloadMessage: "The Resources response did not contain a parsed resource.",
    writePayloadMessage: "The Resources write payload is invalid.",
    sourcedIdMessage: "The path sourcedId must match the write entity sourcedId.",
  });
}
