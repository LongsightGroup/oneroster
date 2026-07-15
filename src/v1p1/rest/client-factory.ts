import { ok, type Result } from "../../result.js";
import {
  createOneRosterRestVersionClientFactory,
  createRestRegistryAdapter,
  type OneRosterRestRegistryClientMessages,
} from "../../rest/registry-adapter.js";
import {
  createOneRosterRestDeleteDefinition,
  createOneRosterRestPutDefinition,
  createOneRosterRestUnwrappedCollectionDefinition,
  createOneRosterRestUnwrappedSingletonDefinition,
  type OneRosterRestCollectionDefinition,
  type OneRosterRestDeleteDefinition,
  type OneRosterRestPutDefinition,
  type OneRosterRestRegistryDefinition,
  type OneRosterRestSingletonDefinition,
} from "../../rest/client-factory.js";
import type {
  OneRosterV1p1PayloadDiagnostic,
  OneRosterV1p1PayloadParser,
} from "../model/primitive.js";
import type { OneRosterV1p1ConfigurationError, OneRosterV1p1RestError } from "./error.js";
import { findOneRosterV1p1Operation, type OneRosterV1p1Operation } from "./operation.js";
import {
  parseOneRosterV1p1QueryInput,
  type OneRosterV1p1Query,
  type OneRosterV1p1QueryDiagnostic,
} from "./query.js";
import { createOneRosterV1p1RestTransport } from "./transport.js";

type Diagnostics = ReadonlyArray<OneRosterV1p1PayloadDiagnostic>;

const registryAdapter = createRestRegistryAdapter({
  createTransport: createOneRosterV1p1RestTransport,
  findOperation: findOneRosterV1p1Operation,
  parseQuery: parseOneRosterV1p1QueryInput,
  errorDescriptors: {
    query: {
      tag: "OneRosterV1p1QueryError",
      createDiagnostic: queryDiagnostic,
    },
    payload: {
      errorTag: "OneRosterV1p1PayloadError",
      createDiagnostic: payloadDiagnostic,
    },
    configuration: {
      tag: "OneRosterV1p1ConfigurationError",
      code: "invalid_operation_registry",
      incompleteMessage: "The v1.1 operation registry is incomplete.",
    },
  },
});

/** A registry definition for a typed collection read. */
export type OneRosterV1p1CollectionDefinition<
  TEntity,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
> = OneRosterRestCollectionDefinition<
  TEntity,
  OneRosterV1p1PayloadDiagnostic,
  TIterateMethodName,
  TCollectMethodName
>;

/** A registry definition for a typed singleton read. */
export type OneRosterV1p1SingletonDefinition<TEntity> = OneRosterRestSingletonDefinition<
  TEntity,
  OneRosterV1p1PayloadDiagnostic
>;

/** A registry definition for an idempotent delete operation. */
export type OneRosterV1p1DeleteDefinition = OneRosterRestDeleteDefinition;

/** A registry definition for a validated PUT operation. */
export type OneRosterV1p1PutDefinition<TEntity = unknown> = OneRosterRestPutDefinition<
  OneRosterV1p1PayloadDiagnostic,
  TEntity
>;

/** One operation definition accepted by the v1.1 registry-driven client factory. */
export type OneRosterV1p1RegistryDefinition =
  OneRosterRestRegistryDefinition<OneRosterV1p1PayloadDiagnostic>;

/** Factory policy for the v1.1 public clients. */
export type OneRosterV1p1RegistryClientOptions = OneRosterRestRegistryClientMessages;

/** Create a collection definition from an exact v1.1 response envelope parser. */
export function createOneRosterV1p1CollectionDefinition<
  TEntity,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
>(
  parser: OneRosterV1p1PayloadParser<ReadonlyArray<TEntity>>,
  iterateMethodName: TIterateMethodName,
  collectMethodName?: TCollectMethodName,
): OneRosterV1p1CollectionDefinition<TEntity, TIterateMethodName, TCollectMethodName> {
  return createOneRosterRestUnwrappedCollectionDefinition(
    parser,
    iterateMethodName,
    collectMethodName,
  );
}

/** Create a singleton definition from an exact v1.1 response envelope parser. */
export function createOneRosterV1p1SingletonDefinition<TEntity>(
  parser: OneRosterV1p1PayloadParser<TEntity>,
): OneRosterV1p1SingletonDefinition<TEntity> {
  return createOneRosterRestUnwrappedSingletonDefinition(parser);
}

/** Create a registry definition for a no-body delete. */
export function createOneRosterV1p1DeleteDefinition(): OneRosterV1p1DeleteDefinition {
  return createOneRosterRestDeleteDefinition();
}

/** Create a registry definition for a singleton PUT envelope. */
export function createOneRosterV1p1PutDefinition<TEntity = unknown>(
  entityProperty: string,
  createPayload: (input: unknown) => Result<unknown, Diagnostics>,
): OneRosterV1p1PutDefinition<TEntity> {
  return createOneRosterRestPutDefinition(entityProperty, createPayload);
}

/** Create a PUT definition whose payload is the operation's entity envelope. */
export function createOneRosterV1p1PutPayload(
  entityProperty: string,
): (input: unknown) => Result<unknown, Diagnostics> {
  return (input) => ok({ [entityProperty]: input });
}

/** Create a v1.1 client by installing methods from operation and parser metadata. */
export const createOneRosterV1p1RestClientFromRegistry = createOneRosterRestVersionClientFactory<
  OneRosterV1p1PayloadDiagnostic,
  OneRosterV1p1Operation,
  OneRosterV1p1Query,
  OneRosterV1p1RestError,
  OneRosterV1p1ConfigurationError
>(registryAdapter);

function queryDiagnostic(path: string, message: string): OneRosterV1p1QueryDiagnostic {
  return { _tag: "OneRosterV1p1QueryDiagnostic", code: "invalid_value", path, message };
}

function payloadDiagnostic(
  code: OneRosterV1p1PayloadDiagnostic["code"],
  path: string,
  message: string,
): OneRosterV1p1PayloadDiagnostic {
  return {
    _tag: "OneRosterV1p1PayloadDiagnostic",
    code,
    path,
    message,
  };
}
