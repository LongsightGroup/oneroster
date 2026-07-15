import { err, ok, type Result } from "../result.js";
import type {
  OneRosterRestCollectionBounds,
  OneRosterRestCollectionRequest,
  OneRosterRestIterationBounds,
  OneRosterRestOperation,
  OneRosterRestPage,
  OneRosterRestQuery,
  OneRosterRestTransportRequest,
  OneRosterRestTransportResponse,
} from "./transport.js";
import type {
  OneRosterRestCollectAllOptions,
  OneRosterRestIterationOptions,
  OneRosterRestReadOptions,
  OneRosterRestRuntimeOptionReader,
  OneRosterRestWriteOptionReader,
  OneRosterRestWriteOptions,
} from "./runtime-options.js";
import type { OneRosterRestRegistryClient } from "./client-types.js";
import {
  operationMatchesOneRosterRestDefinition as operationMatchesDefinition,
  validateOneRosterRestMethodArity as validateMethodArity,
  validateOneRosterRestOptionalOptionsArity as validateOptionalOptionsArity,
} from "./client-registry-validation.js";

/** The diagnostic shape required by registry payload definitions. */
export interface OneRosterRestRegistryDiagnostic {
  readonly code: string;
  readonly path: string;
}

/** A parser for an exact response envelope. */
export type OneRosterRestEnvelopeParser<
  TValue,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> = (input: unknown, path: string) => Result<TValue, ReadonlyArray<TDiagnostic>>;

/** A registry definition for a typed collection read. */
export interface OneRosterRestCollectionDefinition<
  TEntity,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
> {
  readonly kind: "collection";
  readonly parser: OneRosterRestEnvelopeParser<ReadonlyArray<TEntity>, TDiagnostic>;
  readonly iterateMethodName: TIterateMethodName;
  readonly collectMethodName?: TCollectMethodName;
}

/** A registry definition for a typed singleton read. */
export interface OneRosterRestSingletonDefinition<
  TEntity,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> {
  readonly kind: "singleton";
  readonly parser: OneRosterRestEnvelopeParser<TEntity, TDiagnostic>;
}

/** A registry definition for an idempotent delete operation. */
export interface OneRosterRestDeleteDefinition {
  readonly kind: "delete";
}

/** A registry definition for a validated PUT operation. */
export interface OneRosterRestPutDefinition<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TInput = unknown,
> {
  readonly kind: "put";
  readonly entityProperty: string;
  /** Type-only payload input retained for registry-derived client contracts. */
  readonly inputType?: TInput;
  readonly createPayload: (input: unknown) => Result<unknown, ReadonlyArray<TDiagnostic>>;
}

/** A registry definition for a validated POST operation. */
export interface OneRosterRestPostDefinition<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TInput = unknown,
> {
  readonly kind: "post";
  /** Type-only payload input retained for registry-derived client contracts. */
  readonly inputType?: TInput;
  readonly createPayload: (input: unknown) => Result<unknown, ReadonlyArray<TDiagnostic>>;
  readonly responseParser?: OneRosterRestEnvelopeParser<unknown, TDiagnostic>;
}

/** One operation definition accepted by the registry-driven client factory. */
export type OneRosterRestRegistryDefinition<TDiagnostic extends OneRosterRestRegistryDiagnostic> =
  | OneRosterRestCollectionDefinition<unknown, TDiagnostic, string, string | undefined>
  | OneRosterRestSingletonDefinition<unknown, TDiagnostic>
  | OneRosterRestDeleteDefinition
  | OneRosterRestPutDefinition<TDiagnostic>
  | OneRosterRestPostDefinition<TDiagnostic>;

/** Version-specific error and transport seams used by the common factory. */
export interface OneRosterRestRegistryClientOptions<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> {
  readonly singletonPayloadMessage: string;
  readonly writePayloadMessage: string;
  readonly sourcedIdMessage: string;
  readonly createTransport: (
    input: unknown,
  ) => Result<
    OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
    TConfigurationError
  >;
  readonly findOperation: (operationId: string) => TOperation | undefined;
  readonly incompleteRegistryError: (operationId: string, message?: string) => TConfigurationError;
  readonly singletonPayloadError: (operationId: string, message: string) => TError;
  readonly writePayloadError: (
    operationId: string,
    diagnostics: ReadonlyArray<OneRosterRestRegistryDiagnostic>,
    message: string,
  ) => TError;
  readonly createSourcedIdDiagnostic: (message: string) => TDiagnostic;
  readonly readRuntimeOptions: OneRosterRestRuntimeOptionReader<TQuery, TError>;
  readonly readIterationRuntimeOptions: OneRosterRestRuntimeOptionReader<
    TQuery,
    TError,
    OneRosterRestIterationOptions<TQuery>
  >;
  readonly readCollectAllRuntimeOptions: OneRosterRestRuntimeOptionReader<
    TQuery,
    TError,
    OneRosterRestCollectAllOptions<TQuery>
  >;
  readonly readWriteRuntimeOptions: OneRosterRestWriteOptionReader<TError>;
}

/** The transport contract needed by the registry method installer. */
export interface OneRosterRestRegistryTransport<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> {
  request<TValue>(
    input: OneRosterRestTransportRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestTransportResponse<TValue>, TError>>;
  requestPage<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic>,
  ): Promise<Result<OneRosterRestPage<TValue>, TError>>;
  iteratePages<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestIterationBounds,
  ): AsyncGenerator<Result<OneRosterRestPage<TValue>, TError>, void, void>;
  collectAll<TValue>(
    input: OneRosterRestCollectionRequest<TOperation, TQuery, TValue, TDiagnostic> &
      OneRosterRestCollectionBounds,
  ): Promise<Result<ReadonlyArray<TValue>, TError>>;
}

interface OneRosterRestMethodOptions<TQuery extends OneRosterRestQuery> {
  readonly pathParameters?: Readonly<Record<string, string>>;
  readonly query?: TQuery;
  readonly signal?: AbortSignal;
}

type OneRosterRestMutationDefinition<TDiagnostic extends OneRosterRestRegistryDiagnostic> =
  | OneRosterRestDeleteDefinition
  | OneRosterRestPutDefinition<TDiagnostic>
  | OneRosterRestPostDefinition<TDiagnostic>;

const mutationKindPolicy = {
  delete: { trailingArgumentCount: 1, optionsArgumentOffset: 0 },
  put: { trailingArgumentCount: 2, optionsArgumentOffset: 1 },
  post: { trailingArgumentCount: 2, optionsArgumentOffset: 1 },
} as const satisfies Readonly<
  Record<
    OneRosterRestMutationDefinition<OneRosterRestRegistryDiagnostic>["kind"],
    { readonly trailingArgumentCount: 1 | 2; readonly optionsArgumentOffset: 0 | 1 }
  >
>;

/** Create a collection definition whose parser returns the unwrapped entity array. */
export function createOneRosterRestUnwrappedCollectionDefinition<
  TEntity,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
>(
  parser: OneRosterRestEnvelopeParser<ReadonlyArray<TEntity>, TDiagnostic>,
  iterateMethodName: TIterateMethodName,
  collectMethodName?: TCollectMethodName,
): OneRosterRestCollectionDefinition<TEntity, TDiagnostic, TIterateMethodName, TCollectMethodName> {
  return {
    kind: "collection",
    parser,
    iterateMethodName,
    ...(collectMethodName === undefined ? {} : { collectMethodName }),
  };
}

/** Create a collection definition whose parser returns an exact response envelope. */
export function createOneRosterRestEnvelopeCollectionDefinition<
  TEntity,
  TProperty extends string,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TIterateMethodName extends string,
  TCollectMethodName extends string | undefined = undefined,
>(
  property: TProperty,
  parser: OneRosterRestEnvelopeParser<
    { readonly [Property in TProperty]: ReadonlyArray<TEntity> },
    TDiagnostic
  >,
  iterateMethodName: TIterateMethodName,
  collectMethodName?: TCollectMethodName,
): OneRosterRestCollectionDefinition<TEntity, TDiagnostic, TIterateMethodName, TCollectMethodName> {
  return createOneRosterRestUnwrappedCollectionDefinition(
    (input, path) => {
      const parsed = parser(input, path);
      if (parsed._tag === "err") return parsed;
      return ok(parsed.value[property]);
    },
    iterateMethodName,
    collectMethodName,
  );
}

/** Create a singleton definition whose parser returns the unwrapped entity. */
export function createOneRosterRestUnwrappedSingletonDefinition<
  TEntity,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  parser: OneRosterRestEnvelopeParser<TEntity, TDiagnostic>,
): OneRosterRestSingletonDefinition<TEntity, TDiagnostic> {
  return { kind: "singleton", parser };
}

/** Create a singleton definition whose parser returns an exact response envelope. */
export function createOneRosterRestEnvelopeSingletonDefinition<
  TEntity,
  TProperty extends string,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  property: TProperty,
  parser: OneRosterRestEnvelopeParser<{ readonly [Property in TProperty]: TEntity }, TDiagnostic>,
): OneRosterRestSingletonDefinition<TEntity, TDiagnostic> {
  return createOneRosterRestUnwrappedSingletonDefinition((input, path) => {
    const parsed = parser(input, path);
    if (parsed._tag === "err") return parsed;
    return ok(parsed.value[property]);
  });
}

/** Create a registry definition for a no-body delete. */
export function createOneRosterRestDeleteDefinition(): OneRosterRestDeleteDefinition {
  return { kind: "delete" };
}

/** Create a registry definition for a singleton PUT envelope. */
export function createOneRosterRestPutDefinition<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TInput = unknown,
>(
  entityProperty: string,
  createPayload: (input: unknown) => Result<unknown, ReadonlyArray<TDiagnostic>>,
): OneRosterRestPutDefinition<TDiagnostic, TInput> {
  return { kind: "put", entityProperty, createPayload };
}

/** Create a registry definition for a collection POST envelope. */
export function createOneRosterRestPostDefinition<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TInput = unknown,
>(
  createPayload: (input: unknown) => Result<unknown, ReadonlyArray<TDiagnostic>>,
  responseParser?: OneRosterRestEnvelopeParser<unknown, TDiagnostic>,
): OneRosterRestPostDefinition<TDiagnostic, TInput> {
  return {
    kind: "post",
    createPayload,
    ...(responseParser === undefined ? {} : { responseParser }),
  };
}

/** Create a typed client by installing methods from operation and parser metadata. */
export function createOneRosterRestClientFromRegistry<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TDefinitions extends Readonly<Record<string, OneRosterRestRegistryDefinition<TDiagnostic>>>,
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError extends TError,
  TPathParameters extends object,
  TCollectionOptions,
  TSingletonOptions,
  TCollectAllOptions = never,
  TWriteOptions = never,
  TWriteSuccess = never,
  TProjection extends boolean = false,
>(
  input: unknown,
  definitions: TDefinitions,
  options: OneRosterRestRegistryClientOptions<
    TOperation,
    TQuery,
    TError,
    TConfigurationError,
    TDiagnostic
  >,
): Result<
  OneRosterRestRegistryClient<
    TDefinitions,
    TPathParameters,
    TQuery,
    TCollectionOptions,
    TSingletonOptions,
    TError,
    TDiagnostic,
    TCollectAllOptions,
    TWriteOptions,
    TWriteSuccess,
    TProjection
  >,
  TConfigurationError
> {
  const transport = options.createTransport(input);
  if (transport._tag === "err") return transport;
  const client: Record<string, unknown> = {};
  const expectedKeys: Array<string> = [];
  for (const [operationId, definition] of Object.entries(definitions)) {
    const operation = options.findOperation(operationId);
    if (operation === undefined) return err(options.incompleteRegistryError(operationId));
    if (!operationMatchesDefinition(operation, definition)) {
      return err(
        options.incompleteRegistryError(
          operationId,
          `Operation ${operationId} metadata does not match its ${definition.kind} client definition.`,
        ),
      );
    }
    expectedKeys.push(operationId);
    client[operationId] = createMethod(transport.value, operation, definition, options);
    if (definition.kind === "collection") {
      const iterateOperationId = definition.iterateMethodName;
      expectedKeys.push(iterateOperationId);
      client[iterateOperationId] = createIteratePagesMethod(
        transport.value,
        operation,
        definition,
        options,
      );
    }
    if (definition.kind === "collection" && definition.collectMethodName !== undefined) {
      const collectOperationId = definition.collectMethodName;
      expectedKeys.push(collectOperationId);
      client[collectOperationId] = createCollectAllMethod(
        transport.value,
        operation,
        definition,
        options,
      );
    }
  }
  type Client = OneRosterRestRegistryClient<
    TDefinitions,
    TPathParameters,
    TQuery,
    TCollectionOptions,
    TSingletonOptions,
    TError,
    TDiagnostic,
    TCollectAllOptions,
    TWriteOptions,
    TWriteSuccess,
    TProjection
  >;
  if (!isCompleteRegistryClient<Client>(client, expectedKeys)) {
    return err(options.incompleteRegistryError("registry"));
  }
  Object.freeze(client);
  return ok(client);
}

function createIteratePagesMethod<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  transport: OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
  operation: TOperation,
  definition: OneRosterRestCollectionDefinition<unknown, TDiagnostic, string, string | undefined>,
  options: OneRosterRestRegistryClientOptions<TOperation, TQuery, TError, TError, TDiagnostic>,
): (
  ...args: ReadonlyArray<unknown>
) => AsyncGenerator<Result<OneRosterRestPage<unknown>, TError>, void, void> {
  return async function* (...args) {
    const arityError = validateMethodArity(operation, args, 1, options);
    if (arityError !== undefined) {
      yield err(arityError);
      return;
    }
    const parsedOptions = options.readIterationRuntimeOptions(
      args[operation.pathParameters.length],
      operation.operationId,
    );
    if (parsedOptions._tag === "err") {
      yield err(parsedOptions.error);
      return;
    }
    const runtimeOptions = parsedOptions.value;
    yield* transport.iteratePages({
      operation,
      parsePayload: definition.parser,
      maxPages: runtimeOptions.maxPages,
      ...(runtimeOptions.maxItems === undefined ? {} : { maxItems: runtimeOptions.maxItems }),
      ...pathAndOptions(operation, args, runtimeOptions),
    });
  };
}

function createMethod<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError extends TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  transport: OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
  operation: TOperation,
  definition: OneRosterRestRegistryDefinition<TDiagnostic>,
  options: OneRosterRestRegistryClientOptions<
    TOperation,
    TQuery,
    TError,
    TConfigurationError,
    TDiagnostic
  >,
): (...args: ReadonlyArray<unknown>) => Promise<Result<unknown, TError>> {
  if (definition.kind === "collection") {
    return async (...args) => {
      const arityError = validateOptionalOptionsArity(operation, args, options);
      if (arityError !== undefined) return err(arityError);
      const methodOptions = readMethodOptions(operation, args, options.readRuntimeOptions);
      if (methodOptions._tag === "err") return err(methodOptions.error);
      return transport.requestPage({
        operation,
        parsePayload: definition.parser,
        ...methodOptions.value,
      });
    };
  }
  if (definition.kind === "singleton") {
    return async (...args) => {
      const arityError = validateOptionalOptionsArity(operation, args, options);
      if (arityError !== undefined) return err(arityError);
      const methodOptions = readMethodOptions(operation, args, options.readRuntimeOptions);
      if (methodOptions._tag === "err") return err(methodOptions.error);
      const response = await transport.request({
        operation,
        responseParser: definition.parser,
        ...methodOptions.value,
      });
      if (response._tag === "err") return response;
      if (response.value.data === undefined) {
        return err(
          options.singletonPayloadError(operation.operationId, options.singletonPayloadMessage),
        );
      }
      return ok(response.value.data);
    };
  }
  return createMutationMethod(transport, operation, definition, options);
}

function createMutationMethod<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError extends TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  transport: OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
  operation: TOperation,
  definition: OneRosterRestMutationDefinition<TDiagnostic>,
  options: OneRosterRestRegistryClientOptions<
    TOperation,
    TQuery,
    TError,
    TConfigurationError,
    TDiagnostic
  >,
): (...args: ReadonlyArray<unknown>) => Promise<Result<unknown, TError>> {
  const policy = mutationKindPolicy[definition.kind];
  return async (...args) => {
    const arityError = validateMethodArity(operation, args, policy.trailingArgumentCount, options);
    if (arityError !== undefined) return err(arityError);
    const pathLength = operation.pathParameters.length;
    const parsedOptions = options.readWriteRuntimeOptions(
      args[pathLength + policy.optionsArgumentOffset],
      operation.operationId,
    );
    if (parsedOptions._tag === "err") return err(parsedOptions.error);

    let body: unknown;
    let responseParser: OneRosterRestEnvelopeParser<unknown, TDiagnostic> | undefined;
    if (definition.kind !== "delete") {
      const payload = definition.createPayload(args[pathLength]);
      if (payload._tag === "err") {
        return err(
          options.writePayloadError(
            operation.operationId,
            payload.error,
            options.writePayloadMessage,
          ),
        );
      }
      body = payload.value;
      if (definition.kind === "put") {
        const sourcedId = args[0];
        if (
          typeof sourcedId !== "string" ||
          !bodyHasSourcedId(body, sourcedId, definition.entityProperty)
        ) {
          return err(
            options.writePayloadError(
              operation.operationId,
              [
                options.createSourcedIdDiagnostic(
                  "The path sourcedId must match the write entity sourcedId.",
                ),
              ],
              options.sourcedIdMessage,
            ),
          );
        }
      } else {
        responseParser = definition.responseParser;
      }
    }
    return mutation(transport, operation, args, body, responseParser, parsedOptions.value.signal);
  };
}

function readMethodOptions<TQuery extends OneRosterRestQuery, TError>(
  operation: OneRosterRestOperation,
  args: ReadonlyArray<unknown>,
  readRuntimeOptions: OneRosterRestRuntimeOptionReader<TQuery, TError>,
): Result<OneRosterRestMethodOptions<TQuery>, TError> {
  const parsedOptions = readRuntimeOptions(
    args[operation.pathParameters.length],
    operation.operationId,
  );
  if (parsedOptions._tag === "err") return err(parsedOptions.error);
  return ok(pathAndOptions(operation, args, parsedOptions.value));
}

function createCollectAllMethod<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  transport: OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
  operation: TOperation,
  definition: OneRosterRestCollectionDefinition<unknown, TDiagnostic, string, string | undefined>,
  options: OneRosterRestRegistryClientOptions<TOperation, TQuery, TError, TError, TDiagnostic>,
): (...args: ReadonlyArray<unknown>) => Promise<Result<ReadonlyArray<unknown>, TError>> {
  return async (...args) => {
    const arityError = validateMethodArity(operation, args, 1, options);
    if (arityError !== undefined) return err(arityError);
    const parsedOptions = options.readCollectAllRuntimeOptions(
      args[operation.pathParameters.length],
      operation.operationId,
    );
    if (parsedOptions._tag === "err") return err(parsedOptions.error);
    const runtimeOptions = parsedOptions.value;
    return transport.collectAll({
      operation,
      parsePayload: definition.parser,
      maxPages: runtimeOptions.maxPages,
      maxItems: runtimeOptions.maxItems,
      ...pathAndOptions(operation, args, runtimeOptions),
    });
  };
}

async function mutation<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  transport: OneRosterRestRegistryTransport<TOperation, TQuery, TError, TDiagnostic>,
  operation: TOperation,
  values: ReadonlyArray<unknown>,
  body: unknown,
  responseParser: OneRosterRestEnvelopeParser<unknown, TDiagnostic> | undefined,
  signal: OneRosterRestWriteOptions["signal"],
): Promise<Result<{ readonly operationId: string; readonly status: number }, TError>> {
  const response = await transport.request({
    operation,
    ...(body === undefined ? {} : { body }),
    ...(responseParser === undefined ? {} : { responseParser }),
    pathParameters: pathParameters(operation, values),
    ...(signal === undefined ? {} : { signal }),
  });
  if (response._tag === "err") return response;
  return ok({ operationId: operation.operationId, status: response.value.status });
}

function pathAndOptions<TQuery extends OneRosterRestQuery>(
  operation: OneRosterRestOperation,
  args: ReadonlyArray<unknown>,
  options: OneRosterRestReadOptions<TQuery>,
): OneRosterRestMethodOptions<TQuery> {
  return {
    ...(operation.pathParameters.length === 0
      ? {}
      : { pathParameters: pathParameters(operation, args) }),
    ...(options.query === undefined ? {} : { query: options.query }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  };
}

function pathParameters(
  operation: OneRosterRestOperation,
  values: ReadonlyArray<unknown>,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [index, name] of operation.pathParameters.entries()) {
    const value = values[index];
    if (typeof value === "string") result[name] = value;
  }
  return result;
}

function bodyHasSourcedId(body: unknown, sourcedId: string, envelopeProperty: string): boolean {
  if (!isRecord(body)) return false;
  const entity = body[envelopeProperty];
  if (!isRecord(entity)) return false;
  return "sourcedId" in entity && entity["sourcedId"] === sourcedId;
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- SAFETY: TRegistryClient is the exact registry-derived contract narrowed by this runtime key-shape guard.
function isCompleteRegistryClient<TRegistryClient extends object>(
  input: object,
  expectedKeys: ReadonlyArray<string>,
): input is TRegistryClient {
  const actualKeys = Object.keys(input);
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => actualKeys.includes(key)) &&
    Object.values(input).every((value) => typeof value === "function")
  );
}
