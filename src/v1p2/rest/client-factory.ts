import { type Result } from "../../result.js";
import {
  createOneRosterRestVersionClientFactory,
  createRestRegistryAdapter,
  type OneRosterRestRegistryClientMessages,
} from "../../rest/registry-adapter.js";
import {
  createOneRosterRestEnvelopeCollectionDefinition,
  createOneRosterRestDeleteDefinition,
  createOneRosterRestPostDefinition,
  createOneRosterRestPutDefinition,
  createOneRosterRestEnvelopeSingletonDefinition,
  type OneRosterRestCollectionDefinition,
  type OneRosterRestDeleteDefinition,
  type OneRosterRestEnvelopeParser,
  type OneRosterRestPostDefinition,
  type OneRosterRestPutDefinition,
  type OneRosterRestRegistryDefinition,
  type OneRosterRestSingletonDefinition,
} from "../../rest/client-factory.js";
import type {
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadParser,
} from "../model/json-value.js";
import type { OneRosterV1p2ConfigurationError, OneRosterV1p2RestError } from "./error.js";
import { findOneRosterV1p2Operation, type OneRosterV1p2Operation } from "./operation.js";
import { parseOneRosterV1p2QueryInput, type OneRosterV1p2Query } from "./query.js";
import type { OneRosterV1p2QueryDiagnostic } from "./filter.js";
import { createOneRosterV1p2RestTransport } from "./transport.js";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

const registryAdapter = createRestRegistryAdapter({
  createTransport: createOneRosterV1p2RestTransport,
  findOperation: findOneRosterV1p2Operation,
  parseQuery: parseOneRosterV1p2QueryInput,
  errorDescriptors: {
    query: {
      tag: "OneRosterV1p2QueryError",
      createDiagnostic: queryDiagnostic,
    },
    payload: {
      errorTag: "OneRosterV1p2PayloadError",
      createDiagnostic: payloadDiagnostic,
    },
    configuration: {
      tag: "OneRosterV1p2ConfigurationError",
      code: "invalid_operation_registry",
      incompleteMessage: "The OneRoster operation registry is incomplete.",
    },
  },
});

/** A registry definition for a typed collection read. */
export type OneRosterV1p2CollectionDefinition<
  TEntity,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
> = OneRosterRestCollectionDefinition<
  TEntity,
  OneRosterV1p2PayloadDiagnostic,
  TIterateMethodName,
  TCollectMethodName
>;

/** A registry definition for a typed singleton read. */
export type OneRosterV1p2SingletonDefinition<TEntity> = OneRosterRestSingletonDefinition<
  TEntity,
  OneRosterV1p2PayloadDiagnostic
>;

/** A registry definition for an idempotent delete operation. */
export type OneRosterV1p2DeleteDefinition = OneRosterRestDeleteDefinition;

/** A registry definition for a validated PUT operation. */
export type OneRosterV1p2PutDefinition<TEntity = unknown> = OneRosterRestPutDefinition<
  OneRosterV1p2PayloadDiagnostic,
  TEntity
>;

/** A registry definition for a validated POST operation. */
export type OneRosterV1p2PostDefinition<TInput = unknown> = OneRosterRestPostDefinition<
  OneRosterV1p2PayloadDiagnostic,
  TInput
>;

/** One operation definition accepted by the v1.2 registry-driven client factory. */
export type OneRosterV1p2RegistryDefinition =
  OneRosterRestRegistryDefinition<OneRosterV1p2PayloadDiagnostic>;

/** Factory policy for the small differences between public v1.2 clients. */
export type OneRosterV1p2RegistryClientOptions = OneRosterRestRegistryClientMessages;

/** Create a collection definition from an exact OneRoster response envelope parser. */
export function createOneRosterV1p2CollectionDefinition<
  TEntity,
  TProperty extends string,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
>(
  property: TProperty,
  parser: OneRosterRestEnvelopeParser<
    { readonly [Property in TProperty]: ReadonlyArray<TEntity> },
    OneRosterV1p2PayloadDiagnostic
  >,
  iterateMethodName: TIterateMethodName,
  collectMethodName?: TCollectMethodName,
): OneRosterV1p2CollectionDefinition<TEntity, TIterateMethodName, TCollectMethodName> {
  return createOneRosterRestEnvelopeCollectionDefinition(
    property,
    parser,
    iterateMethodName,
    collectMethodName,
  );
}

/** Create a singleton definition from an exact OneRoster response envelope parser. */
export function createOneRosterV1p2SingletonDefinition<TEntity, TProperty extends string>(
  property: TProperty,
  parser: OneRosterRestEnvelopeParser<
    { readonly [Property in TProperty]: TEntity },
    OneRosterV1p2PayloadDiagnostic
  >,
): OneRosterV1p2SingletonDefinition<TEntity> {
  return createOneRosterRestEnvelopeSingletonDefinition(property, parser);
}

/** Create a registry definition for a no-body delete. */
export function createOneRosterV1p2DeleteDefinition(): OneRosterV1p2DeleteDefinition {
  return createOneRosterRestDeleteDefinition();
}

/** Create a registry definition for a singleton PUT envelope. */
export function createOneRosterV1p2PutDefinition<TEntity = unknown>(
  entityProperty: string,
  createPayload: (input: unknown) => Result<unknown, Diagnostics>,
): OneRosterV1p2PutDefinition<TEntity> {
  return createOneRosterRestPutDefinition(entityProperty, createPayload);
}

/** Create a registry definition for a collection POST envelope. */
export function createOneRosterV1p2PostDefinition<TInput = unknown>(
  createPayload: (input: unknown) => Result<unknown, Diagnostics>,
  responseParser?: OneRosterV1p2PayloadParser<unknown>,
): OneRosterV1p2PostDefinition<TInput> {
  const parser: OneRosterRestEnvelopeParser<unknown, OneRosterV1p2PayloadDiagnostic> | undefined =
    responseParser;
  return createOneRosterRestPostDefinition(createPayload, parser);
}

/** Create a v1.2 client by installing methods from operation and parser metadata. */
export const createOneRosterV1p2RestClientFromRegistry = createOneRosterRestVersionClientFactory<
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2Operation,
  OneRosterV1p2Query,
  OneRosterV1p2RestError,
  OneRosterV1p2ConfigurationError,
  true
>(registryAdapter);

function queryDiagnostic(path: string, message: string): OneRosterV1p2QueryDiagnostic {
  return {
    _tag: "OneRosterV1p2PayloadDiagnostic",
    code: "query.invalid_value",
    path,
    message,
  };
}

function payloadDiagnostic(
  code: OneRosterV1p2PayloadDiagnostic["code"],
  path: string,
  message: string,
): OneRosterV1p2PayloadDiagnostic {
  return {
    _tag: "OneRosterV1p2PayloadDiagnostic",
    code,
    path,
    message,
  };
}
