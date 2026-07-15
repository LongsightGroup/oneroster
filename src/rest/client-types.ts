import type { Result } from "../result.js";
import type {
  OneRosterRestCollectionDefinition,
  OneRosterRestDeleteDefinition,
  OneRosterRestPostDefinition,
  OneRosterRestPutDefinition,
  OneRosterRestRegistryDefinition,
  OneRosterRestRegistryDiagnostic,
  OneRosterRestSingletonDefinition,
} from "./client-factory.js";
import type {
  OneRosterRestCollectionBounds,
  OneRosterRestIterationBounds,
  OneRosterRestPage,
  OneRosterRestQuery,
} from "./transport.js";
import type {
  OneRosterRestCollectionOptions,
  OneRosterRestCollectionProjectionOptions,
  OneRosterRestEntityField,
  OneRosterRestSingletonOptions,
  OneRosterRestSingletonProjectionOptions,
} from "./projection.js";

type OperationId<TDefinitions> = Extract<keyof TDefinitions, string>;

type DefinitionFor<TDefinitions, K extends OperationId<TDefinitions>> = TDefinitions[K];

/** Shared success value returned by registry-driven REST mutations. */
export interface OneRosterRestWriteSuccess {
  readonly operationId: string;
  readonly status: number;
}

/** Type policy for the write portion of a registry-derived client. */
export interface OneRosterRestWritePolicy<
  TOptions = unknown,
  TSuccess = OneRosterRestWriteSuccess,
> {
  readonly options: TOptions;
  readonly success: TSuccess;
}

type PathParametersFor<
  TPathParameters extends object,
  K extends string,
> = K extends keyof TPathParameters
  ? TPathParameters[K] extends ReadonlyArray<unknown>
    ? TPathParameters[K]
    : []
  : [];

type CollectionOperationId<TDefinitions> = {
  [K in OperationId<TDefinitions>]: DefinitionFor<TDefinitions, K> extends {
    readonly kind: "collection";
  }
    ? DefinitionFor<TDefinitions, K> extends OneRosterRestCollectionDefinition<
        infer _TEntity,
        infer _TDiagnostic,
        infer _TIterateMethodName,
        infer TCollectMethodName
      >
      ? TCollectMethodName extends string
        ? K
        : never
      : never
    : never;
}[OperationId<TDefinitions>];

type EveryCollectionOperationId<TDefinitions> = {
  [K in OperationId<TDefinitions>]: DefinitionFor<TDefinitions, K> extends {
    readonly kind: "collection";
  }
    ? K
    : never;
}[OperationId<TDefinitions>];

type IterateMethodNameFor<TDefinition> =
  TDefinition extends OneRosterRestCollectionDefinition<
    infer _TEntity,
    infer _TDiagnostic,
    infer TIterateMethodName,
    infer _TCollectMethodName
  >
    ? TIterateMethodName
    : never;

type CollectMethodNameFor<TDefinition> =
  TDefinition extends OneRosterRestCollectionDefinition<
    infer _TEntity,
    infer _TDiagnostic,
    infer _TIterateMethodName,
    infer TCollectMethodName
  >
    ? TCollectMethodName extends string
      ? TCollectMethodName
      : never
    : never;

/** Shared collection method overloads used by registry-derived clients. */
export type OneRosterRestCollectionMethod<
  TEntity,
  TParameters extends ReadonlyArray<unknown>,
  TQuery extends OneRosterRestQuery,
  TCollectionOptions,
  TError,
  TProjection extends boolean,
> = TProjection extends true
  ? {
      (
        ...args: [...TParameters, input?: OneRosterRestCollectionOptions<TQuery>]
      ): Promise<Result<OneRosterRestPage<TEntity>, TError>>;
      <TField extends OneRosterRestEntityField<TEntity>>(
        ...args: [
          ...TParameters,
          input: OneRosterRestCollectionProjectionOptions<TEntity, TQuery, TField>,
        ]
      ): Promise<Result<OneRosterRestPage<Pick<TEntity, TField>>, TError>>;
    }
  : (
      ...args: [...TParameters, input?: TCollectionOptions]
    ) => Promise<Result<OneRosterRestPage<TEntity>, TError>>;

/** Shared singleton method overloads used by registry-derived clients. */
export type OneRosterRestSingletonMethod<
  TEntity,
  TParameters extends ReadonlyArray<unknown>,
  TSingletonOptions,
  TError,
  TProjection extends boolean,
> = TProjection extends true
  ? {
      (
        ...args: [...TParameters, input?: OneRosterRestSingletonOptions]
      ): Promise<Result<TEntity, TError>>;
      <TField extends OneRosterRestEntityField<TEntity>>(
        ...args: [...TParameters, input: OneRosterRestSingletonProjectionOptions<TEntity, TField>]
      ): Promise<Result<Pick<TEntity, TField>, TError>>;
    }
  : (...args: [...TParameters, input?: TSingletonOptions]) => Promise<Result<TEntity, TError>>;

/** Shared collect-all method overloads used by registry-derived clients. */
export type OneRosterRestCollectAllMethod<
  TEntity,
  TParameters extends ReadonlyArray<unknown>,
  TQuery extends OneRosterRestQuery,
  TCollectAllOptions,
  TError,
  TProjection extends boolean,
> = TProjection extends true
  ? {
      (
        ...args: [
          ...TParameters,
          input: OneRosterRestCollectionOptions<TQuery> & OneRosterRestCollectionBounds,
        ]
      ): Promise<Result<ReadonlyArray<TEntity>, TError>>;
      <TField extends OneRosterRestEntityField<TEntity>>(
        ...args: [
          ...TParameters,
          input: OneRosterRestCollectionProjectionOptions<TEntity, TQuery, TField> &
            OneRosterRestCollectionBounds,
        ]
      ): Promise<Result<ReadonlyArray<Pick<TEntity, TField>>, TError>>;
    }
  : (
      ...args: [...TParameters, input: TCollectAllOptions]
    ) => Promise<Result<ReadonlyArray<TEntity>, TError>>;

/** Shared lazy page-iteration overloads used by registry-derived clients. */
export type OneRosterRestIteratePagesMethod<
  TEntity,
  TParameters extends ReadonlyArray<unknown>,
  TQuery extends OneRosterRestQuery,
  TCollectAllOptions,
  TError,
  TProjection extends boolean,
> = TProjection extends true
  ? {
      (
        ...args: [
          ...TParameters,
          input: OneRosterRestCollectionOptions<TQuery> & OneRosterRestIterationBounds,
        ]
      ): AsyncGenerator<Result<OneRosterRestPage<TEntity>, TError>, void, void>;
      <TField extends OneRosterRestEntityField<TEntity>>(
        ...args: [
          ...TParameters,
          input: OneRosterRestCollectionProjectionOptions<TEntity, TQuery, TField> &
            OneRosterRestIterationBounds,
        ]
      ): AsyncGenerator<Result<OneRosterRestPage<Pick<TEntity, TField>>, TError>, void, void>;
    }
  : (
      ...args: [
        ...TParameters,
        input: Omit<TCollectAllOptions, "maxItems"> & { readonly maxItems?: number },
      ]
    ) => AsyncGenerator<Result<OneRosterRestPage<TEntity>, TError>, void, void>;

/** Shared mutation method contract used by registry-derived clients. */
export type OneRosterRestWriteMethod<
  TInput,
  TParameters extends ReadonlyArray<unknown>,
  TWriteOptions,
  TWriteSuccess,
  TError,
> = (
  ...args: [...TParameters, value: TInput, options: TWriteOptions]
) => Promise<Result<TWriteSuccess, TError>>;

/** Shared delete method contract used by registry-derived clients. */
export type OneRosterRestDeleteMethod<
  TParameters extends ReadonlyArray<unknown>,
  TWriteOptions,
  TWriteSuccess,
  TError,
> = (...args: [...TParameters, options: TWriteOptions]) => Promise<Result<TWriteSuccess, TError>>;

type MethodForDefinition<
  TDefinition,
  TParameters extends ReadonlyArray<unknown>,
  TQuery extends OneRosterRestQuery,
  TCollectionOptions,
  TSingletonOptions,
  TWriteOptions,
  TWriteSuccess,
  TError,
  TProjection extends boolean,
> =
  TDefinition extends OneRosterRestCollectionDefinition<
    infer TEntity,
    infer _TEnvelopeDiagnostic,
    infer _TIterateMethodName,
    infer _TCollectMethodName
  >
    ? OneRosterRestCollectionMethod<
        TEntity,
        TParameters,
        TQuery,
        TCollectionOptions,
        TError,
        TProjection
      >
    : TDefinition extends OneRosterRestSingletonDefinition<
          infer TEntity,
          infer _TEnvelopeDiagnostic
        >
      ? OneRosterRestSingletonMethod<TEntity, TParameters, TSingletonOptions, TError, TProjection>
      : TDefinition extends OneRosterRestPutDefinition<infer _TPayloadDiagnostic, infer TInput>
        ? OneRosterRestWriteMethod<TInput, TParameters, TWriteOptions, TWriteSuccess, TError>
        : TDefinition extends OneRosterRestPostDefinition<infer _TPayloadDiagnostic, infer TInput>
          ? OneRosterRestWriteMethod<TInput, TParameters, TWriteOptions, TWriteSuccess, TError>
          : TDefinition extends OneRosterRestDeleteDefinition
            ? OneRosterRestDeleteMethod<TParameters, TWriteOptions, TWriteSuccess, TError>
            : never;

/** Derive one complete client contract from its typed registry definitions. */
export type OneRosterRestRegistryClient<
  TDefinitions extends Readonly<Record<string, OneRosterRestRegistryDefinition<TDiagnostic>>>,
  TPathParameters extends object,
  TQuery extends OneRosterRestQuery,
  TCollectionOptions,
  TSingletonOptions,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TCollectAllOptions = never,
  TWriteOptions = never,
  TWriteSuccess = never,
  TProjection extends boolean = false,
> = {
  readonly [K in OperationId<TDefinitions>]: MethodForDefinition<
    DefinitionFor<TDefinitions, K>,
    PathParametersFor<TPathParameters, K>,
    TQuery,
    TCollectionOptions,
    TSingletonOptions,
    TWriteOptions,
    TWriteSuccess,
    TError,
    TProjection
  >;
} & {
  readonly [K in CollectionOperationId<TDefinitions> as CollectMethodNameFor<
    DefinitionFor<TDefinitions, K>
  >]: OneRosterRestCollectAllMethod<
    DefinitionFor<TDefinitions, K> extends OneRosterRestCollectionDefinition<
      infer TEntity,
      infer _TEnvelopeDiagnostic,
      infer _TIterateMethodName,
      infer _TCollectMethodName
    >
      ? TEntity
      : never,
    PathParametersFor<TPathParameters, K>,
    TQuery,
    TCollectAllOptions,
    TError,
    TProjection
  >;
} & {
  readonly [K in EveryCollectionOperationId<TDefinitions> as IterateMethodNameFor<
    DefinitionFor<TDefinitions, K>
  >]: OneRosterRestIteratePagesMethod<
    DefinitionFor<TDefinitions, K> extends OneRosterRestCollectionDefinition<
      infer TEntity,
      infer _TEnvelopeDiagnostic,
      infer _TIterateMethodName,
      infer _TCollectMethodName
    >
      ? TEntity
      : never,
    PathParametersFor<TPathParameters, K>,
    TQuery,
    TCollectAllOptions,
    TError,
    TProjection
  >;
};

/** Derive a complete client contract from definitions and a named write policy. */
export type inferRestClientFromDefinitions<
  TDefinitions extends Readonly<Record<string, OneRosterRestRegistryDefinition<TDiagnostic>>>,
  TPathParameters extends object,
  TQuery extends OneRosterRestQuery,
  TCollectionOptions,
  TSingletonOptions,
  TError,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
  TWritePolicy extends OneRosterRestWritePolicy = OneRosterRestWritePolicy,
  TCollectAllOptions = never,
  TProjection extends boolean = false,
> = OneRosterRestRegistryClient<
  TDefinitions,
  TPathParameters,
  TQuery,
  TCollectionOptions,
  TSingletonOptions,
  TError,
  TDiagnostic,
  TCollectAllOptions,
  TWritePolicy["options"],
  TWritePolicy["success"],
  TProjection
>;
