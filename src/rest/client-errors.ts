import type { OneRosterRestRegistryDiagnostic } from "./client-factory.js";

export interface RegistryErrorBase {
  readonly operationId: string;
  readonly message: string;
}

export interface RegistryQueryError<
  TTag extends string,
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
> extends RegistryErrorBase {
  readonly _tag: TTag;
  readonly code: "invalid_query";
  readonly diagnostics: ReadonlyArray<TDiagnostic>;
}

export interface RegistryPayloadError<TTag extends string> extends RegistryErrorBase {
  readonly _tag: TTag;
  readonly code: "payload_validation_failure";
  readonly diagnostics: ReadonlyArray<{ readonly code: string; readonly path: string }>;
}

export interface RegistryConfigurationError<
  TTag extends string,
  TCode extends string,
> extends RegistryErrorBase {
  readonly _tag: TTag;
  readonly code: TCode;
}

/** Static error-shape policy used to infer version-specific registry failures. */
export interface OneRosterRestRegistryErrorDescriptors {
  readonly query: {
    readonly tag: string;
    readonly createDiagnostic: (
      path: string,
      message: string,
    ) => OneRosterRestRegistryDiagnostic & { readonly message: string };
  };
  readonly payload: {
    readonly errorTag: string;
    readonly createDiagnostic: (
      code: "payload.invalid_value",
      path: string,
      message: string,
    ) => OneRosterRestRegistryDiagnostic;
  };
  readonly configuration: {
    readonly tag: string;
    readonly code: string;
    readonly incompleteMessage: string;
  };
}

/** Query diagnostic inferred from one registry error policy. */
export type RegistryQueryDiagnosticFor<TDescriptors extends OneRosterRestRegistryErrorDescriptors> =
  ReturnType<TDescriptors["query"]["createDiagnostic"]>;

/** Payload diagnostic inferred from one registry error policy. */
export type RegistryPayloadDiagnosticFor<
  TDescriptors extends OneRosterRestRegistryErrorDescriptors,
> = ReturnType<TDescriptors["payload"]["createDiagnostic"]>;

/** Error constructors inferred from one registry error policy object. */
export interface OneRosterRestRegistryErrorMappers<
  TDescriptors extends OneRosterRestRegistryErrorDescriptors,
> {
  readonly runtimeQueryError: (
    operationId: string,
    diagnostics: ReadonlyArray<RegistryQueryDiagnosticFor<TDescriptors>>,
  ) => RegistryQueryError<TDescriptors["query"]["tag"], RegistryQueryDiagnosticFor<TDescriptors>>;
  readonly createSourcedIdDiagnostic: (
    message: string,
  ) => RegistryPayloadDiagnosticFor<TDescriptors>;
  readonly singletonPayloadError: (
    operationId: string,
    message: string,
  ) => RegistryPayloadError<TDescriptors["payload"]["errorTag"]>;
  readonly writePayloadError: (
    operationId: string,
    diagnostics: ReadonlyArray<{ readonly code: string; readonly path: string }>,
    message: string,
  ) => RegistryPayloadError<TDescriptors["payload"]["errorTag"]>;
  readonly incompleteRegistryError: (
    operationId: string,
    message?: string,
  ) => RegistryConfigurationError<
    TDescriptors["configuration"]["tag"],
    TDescriptors["configuration"]["code"]
  >;
}

/** Build the error constructors shared by all registry-driven REST adapters. */
export function createOneRosterRestRegistryErrorMappers<
  const TDescriptors extends OneRosterRestRegistryErrorDescriptors,
>(descriptors: TDescriptors): OneRosterRestRegistryErrorMappers<TDescriptors>;
export function createOneRosterRestRegistryErrorMappers(
  descriptors: OneRosterRestRegistryErrorDescriptors,
): unknown {
  const mappers: OneRosterRestRegistryErrorMappers<OneRosterRestRegistryErrorDescriptors> = {
    runtimeQueryError: (operationId, diagnostics) => ({
      _tag: descriptors.query.tag,
      code: "invalid_query",
      operationId,
      diagnostics,
      message: "The REST method options contain an invalid query or runtime option.",
    }),
    createSourcedIdDiagnostic: (message) =>
      descriptors.payload.createDiagnostic("payload.invalid_value", "$.sourcedId", message),
    singletonPayloadError: (operationId, message) => ({
      _tag: descriptors.payload.errorTag,
      code: "payload_validation_failure",
      operationId,
      diagnostics: [{ code: "payload.invalid_value", path: "$" }],
      message,
    }),
    writePayloadError: (operationId, diagnostics, message) => ({
      _tag: descriptors.payload.errorTag,
      code: "payload_validation_failure",
      operationId,
      diagnostics: diagnostics.map(({ code, path }) => ({ code, path })),
      message,
    }),
    incompleteRegistryError: (
      operationId,
      message = descriptors.configuration.incompleteMessage,
    ) => ({
      _tag: descriptors.configuration.tag,
      code: descriptors.configuration.code,
      operationId,
      message,
    }),
  };
  return mappers;
}
