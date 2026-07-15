interface OneRosterRestTransportErrorMessages {
  readonly cancellation: string;
  readonly network: string;
  readonly query: string;
  readonly pathParameter: string;
  readonly contentType: string;
  readonly json: string;
  readonly payload: string;
  readonly pagination: string;
  readonly collectionLimit: string;
}

type OneRosterRestPayloadDiagnostic = {
  readonly code: string;
  readonly path: string;
};

type OneRosterRestCollectionLimitKind = "maxPages" | "maxItems" | "repeatedUrl";

/** Create the shared transport failures while preserving version-specific tags and messages. */
export function createOneRosterRestTransportErrors<const TTagPrefix extends string>(
  tagPrefix: TTagPrefix,
  messages: OneRosterRestTransportErrorMessages,
) {
  return {
    cancellation: (operationId: string) => ({
      _tag: `${tagPrefix}CancellationError` as const,
      code: "cancelled" as const,
      operationId,
      message: messages.cancellation,
    }),
    network: (operationId: string) => ({
      _tag: `${tagPrefix}NetworkError` as const,
      code: "network_failure" as const,
      operationId,
      message: messages.network,
    }),
    query: <TDiagnostic>(operationId: string, diagnostics: ReadonlyArray<TDiagnostic>) => ({
      _tag: `${tagPrefix}QueryError` as const,
      code: "invalid_query" as const,
      operationId,
      diagnostics,
      message: messages.query,
    }),
    pathParameter: (
      operationId: string,
      code: "missing_path_parameter" | "invalid_path_parameter",
      parameter: string,
    ) => ({
      _tag: `${tagPrefix}PathParameterError` as const,
      code,
      operationId,
      parameter,
      message: messages.pathParameter,
    }),
    contentType: (operationId: string, contentType: string | undefined) => ({
      _tag: `${tagPrefix}ContentTypeError` as const,
      code: "unexpected_content_type" as const,
      operationId,
      ...(contentType === undefined ? {} : { contentType }),
      message: messages.contentType,
    }),
    json: (operationId: string) => ({
      _tag: `${tagPrefix}JsonError` as const,
      code: "malformed_json" as const,
      operationId,
      message: messages.json,
    }),
    payload: (operationId: string, diagnostics: ReadonlyArray<OneRosterRestPayloadDiagnostic>) => ({
      _tag: `${tagPrefix}PayloadError` as const,
      code: "payload_validation_failure" as const,
      operationId,
      diagnostics,
      message: messages.payload,
    }),
    pagination: (operationId: string) => ({
      _tag: `${tagPrefix}PaginationError` as const,
      code: "malformed_pagination" as const,
      operationId,
      message: messages.pagination,
    }),
    collectionLimit: (operationId: string, limitKind: OneRosterRestCollectionLimitKind) => ({
      _tag: `${tagPrefix}CollectionLimitError` as const,
      code: "collection_limit" as const,
      operationId,
      limitKind,
      message: messages.collectionLimit,
    }),
  };
}
