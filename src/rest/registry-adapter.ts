import type { Result } from "../result.js";
import {
  createOneRosterRestClientFromRegistry,
  type OneRosterRestRegistryDiagnostic,
  type OneRosterRestRegistryClientOptions,
  type OneRosterRestRegistryDefinition,
} from "./client-factory.js";
import type { OneRosterRestRegistryClient } from "./client-types.js";
import {
  createOneRosterRestRegistryErrorMappers,
  type RegistryConfigurationError,
  type RegistryPayloadError,
  type RegistryQueryError,
  type OneRosterRestRegistryErrorDescriptors,
  type RegistryPayloadDiagnosticFor,
  type RegistryQueryDiagnosticFor,
} from "./client-errors.js";
import {
  createOneRosterRestRuntimeOptionReaders,
  createOneRosterRestWriteOptionReader,
  type OneRosterRestCollectAllOptions,
  type OneRosterRestIterationOptions,
  type OneRosterRestRuntimeDiagnostic,
  type OneRosterRestRuntimeOptionReader,
  type OneRosterRestWriteOptionReader,
} from "./runtime-options.js";
import type { OneRosterRestOperation, OneRosterRestQuery } from "./transport.js";

/** Per-client payload messages layered over a version registry adapter. */
export interface OneRosterRestRegistryClientMessages {
  readonly singletonPayloadMessage: string;
  readonly writePayloadMessage: string;
  readonly sourcedIdMessage: string;
}

/** One inferable policy object for version-specific registry behavior. */
export interface OneRosterRestRegistryAdapterPolicy {
  readonly createTransport: (input: unknown) => Result<unknown, unknown>;
  readonly findOperation: (operationId: string) => OneRosterRestOperation | undefined;
  readonly parseQuery: (
    input: unknown,
  ) => Result<OneRosterRestQuery, ReadonlyArray<OneRosterRestRuntimeDiagnostic>>;
  readonly errorDescriptors: OneRosterRestRegistryErrorDescriptors;
}

type PolicyDescriptors<TPolicy extends OneRosterRestRegistryAdapterPolicy> =
  TPolicy["errorDescriptors"];

type PolicyQuery<TPolicy extends OneRosterRestRegistryAdapterPolicy> = ResultValue<
  ReturnType<TPolicy["parseQuery"]>
>;

type ResultValue<TResult> = TResult extends { readonly _tag: "ok"; readonly value: infer TValue }
  ? TValue
  : never;

type OneRosterRestRegistryAdapterSeams<
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> = Omit<
  OneRosterRestRegistryClientOptions<TOperation, TQuery, TError, TConfigurationError, TDiagnostic>,
  keyof OneRosterRestRegistryClientMessages
>;

/**
 * Compose query parsing, runtime option validation, transport creation, and
 * version-specific registry errors behind one adapter seam.
 */
export interface OneRosterRestRegistryAdapter<TPolicy extends OneRosterRestRegistryAdapterPolicy> {
  readonly createTransport: TPolicy["createTransport"];
  readonly findOperation: TPolicy["findOperation"];
  readonly incompleteRegistryError: (
    operationId: string,
    message?: string,
  ) => RegistryConfigurationError<
    PolicyDescriptors<TPolicy>["configuration"]["tag"],
    PolicyDescriptors<TPolicy>["configuration"]["code"]
  >;
  readonly singletonPayloadError: (
    operationId: string,
    message: string,
  ) => RegistryPayloadError<PolicyDescriptors<TPolicy>["payload"]["errorTag"]>;
  readonly writePayloadError: (
    operationId: string,
    diagnostics: ReadonlyArray<OneRosterRestRegistryDiagnostic>,
    message: string,
  ) => RegistryPayloadError<PolicyDescriptors<TPolicy>["payload"]["errorTag"]>;
  readonly createSourcedIdDiagnostic: (
    message: string,
  ) => RegistryPayloadDiagnosticFor<PolicyDescriptors<TPolicy>>;
  readonly readRuntimeOptions: OneRosterRestRuntimeOptionReader<
    PolicyQuery<TPolicy>,
    RegistryQueryError<
      PolicyDescriptors<TPolicy>["query"]["tag"],
      RegistryQueryDiagnosticFor<PolicyDescriptors<TPolicy>>
    >
  >;
  readonly readIterationRuntimeOptions: OneRosterRestRuntimeOptionReader<
    PolicyQuery<TPolicy>,
    RegistryQueryError<
      PolicyDescriptors<TPolicy>["query"]["tag"],
      RegistryQueryDiagnosticFor<PolicyDescriptors<TPolicy>>
    >,
    OneRosterRestIterationOptions<PolicyQuery<TPolicy>>
  >;
  readonly readCollectAllRuntimeOptions: OneRosterRestRuntimeOptionReader<
    PolicyQuery<TPolicy>,
    RegistryQueryError<
      PolicyDescriptors<TPolicy>["query"]["tag"],
      RegistryQueryDiagnosticFor<PolicyDescriptors<TPolicy>>
    >,
    OneRosterRestCollectAllOptions<PolicyQuery<TPolicy>>
  >;
  readonly readWriteRuntimeOptions: OneRosterRestWriteOptionReader<
    RegistryQueryError<
      PolicyDescriptors<TPolicy>["query"]["tag"],
      RegistryQueryDiagnosticFor<PolicyDescriptors<TPolicy>>
    >
  >;
}

/** Infer a complete version registry adapter from one policy object. */
export function createRestRegistryAdapter<const TPolicy extends OneRosterRestRegistryAdapterPolicy>(
  options: TPolicy,
): OneRosterRestRegistryAdapter<TPolicy>;
export function createRestRegistryAdapter(
  options: OneRosterRestRegistryAdapterPolicy,
): OneRosterRestRegistryAdapter<OneRosterRestRegistryAdapterPolicy> {
  const errors = createOneRosterRestRegistryErrorMappers(options.errorDescriptors);
  const createQueryDiagnostic = options.errorDescriptors.query.createDiagnostic;
  const runtimeOptionReaders = createOneRosterRestRuntimeOptionReaders(
    options.parseQuery,
    createQueryDiagnostic,
    errors.runtimeQueryError,
  );
  const readWriteRuntimeOptions = createOneRosterRestWriteOptionReader(
    createQueryDiagnostic,
    errors.runtimeQueryError,
  );

  return {
    createTransport: options.createTransport,
    findOperation: options.findOperation,
    incompleteRegistryError: errors.incompleteRegistryError,
    singletonPayloadError: errors.singletonPayloadError,
    writePayloadError: errors.writePayloadError,
    createSourcedIdDiagnostic: errors.createSourcedIdDiagnostic,
    readRuntimeOptions: runtimeOptionReaders.read,
    readIterationRuntimeOptions: runtimeOptionReaders.iterate,
    readCollectAllRuntimeOptions: runtimeOptionReaders.collectAll,
    readWriteRuntimeOptions,
  };
}

/** Bind version transport, registry, and diagnostics once for all of that version's clients. */
export function createOneRosterRestVersionClientFactory<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TOperation extends OneRosterRestOperation,
  TQuery extends OneRosterRestQuery,
  TError,
  TConfigurationError extends TError,
  TProjection extends boolean = false,
>(
  adapter: OneRosterRestRegistryAdapterSeams<
    TOperation,
    TQuery,
    TError,
    TConfigurationError,
    TDiagnostic
  >,
) {
  return function createVersionClient<
    TDefinitions extends Readonly<Record<string, OneRosterRestRegistryDefinition<TDiagnostic>>>,
    TPathParameters extends object,
    TCollectionOptions,
    TSingletonOptions,
    TCollectAllOptions = never,
    TWriteOptions = never,
    TWriteSuccess = never,
  >(
    input: unknown,
    definitions: TDefinitions,
    messages: OneRosterRestRegistryClientMessages,
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
    return createOneRosterRestClientFromRegistry<
      TDiagnostic,
      TDefinitions,
      TOperation,
      TQuery,
      TError,
      TConfigurationError,
      TPathParameters,
      TCollectionOptions,
      TSingletonOptions,
      TCollectAllOptions,
      TWriteOptions,
      TWriteSuccess,
      TProjection
    >(input, definitions, { ...messages, ...adapter });
  };
}
