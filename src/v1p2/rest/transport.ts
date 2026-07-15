import { err, ok, type Result } from "../../result.js";
import {
  readOneRosterV1p2BearerValue,
  type OneRosterV1p2AccessToken,
  type OneRosterV1p2AuthenticationError,
} from "./access-token.js";
import type { OneRosterV1p2ClientConfiguration } from "./client-configuration.js";
import { createOneRosterV1p2ClientConfiguration } from "./client-configuration.js";
import type { OneRosterV1p2ConfigurationError, OneRosterV1p2RestError } from "./error.js";
import type { OneRosterV1p2StatusInfo } from "../model/status.js";
import { parseOneRosterV1p2StatusInfo } from "../model/status.js";
import type { OneRosterV1p2Operation } from "./operation.js";
import { parseOneRosterV1p2PageMetadata, type OneRosterV1p2Page } from "./page.js";
import {
  serializeOneRosterV1p2Query,
  withOneRosterV1p2QueryOffset,
  type OneRosterV1p2Query,
} from "./query.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import {
  createOneRosterRestMechanics,
  isOneRosterRestAbortCause,
  isOneRosterRestJsonContentType,
  type OneRosterRestCollectionBounds,
  type OneRosterRestIterationBounds,
  type OneRosterRestCollectionRequest,
  type OneRosterRestTransportRequest,
  type OneRosterRestTransportResponse,
} from "../../rest/transport.js";
import { substituteOneRosterRestPathParameters } from "../../rest/url.js";
import { createOneRosterRestTransportErrors } from "../../rest/transport-errors.js";
import { parseOneRosterRestQueryFromLink } from "../../rest/query-from-link.js";

const transportErrors = createOneRosterRestTransportErrors("OneRosterV1p2", {
  cancellation: "The OneRoster request was cancelled.",
  network: "The OneRoster request could not be completed.",
  query: "The OneRoster query is invalid.",
  pathParameter: "A required path parameter is missing or invalid.",
  contentType: "The OneRoster response content type is not JSON.",
  json: "The OneRoster response was not valid JSON.",
  payload: "The OneRoster response failed payload validation.",
  pagination: "The OneRoster pagination metadata is malformed.",
  collectionLimit: "The OneRoster collection bound was reached.",
});

/** A successful transport response with safe headers and optional parsed data. */
export type OneRosterV1p2TransportResponse<TValue> = OneRosterRestTransportResponse<TValue>;

/** A typed request through the shared REST boundary. */
export type OneRosterV1p2TransportRequest<TValue> = OneRosterRestTransportRequest<
  OneRosterV1p2Operation,
  OneRosterV1p2Query,
  TValue,
  OneRosterV1p2PayloadDiagnostic
>;

/** A collection request for one-page or bounded traversal APIs. */
export type OneRosterV1p2CollectionRequest<TValue> = OneRosterRestCollectionRequest<
  OneRosterV1p2Operation,
  OneRosterV1p2Query,
  TValue,
  OneRosterV1p2PayloadDiagnostic
>;

/** Bounds required by the all-pages collector. */
export type OneRosterV1p2CollectionBounds = OneRosterRestCollectionBounds;

/** Bounds required by lazy page iteration. */
export type OneRosterV1p2IterationBounds = OneRosterRestIterationBounds;

/** The portable OneRoster REST transport seam. */
export interface OneRosterV1p2RestTransport {
  request<TValue>(
    input: OneRosterV1p2TransportRequest<TValue>,
  ): Promise<Result<OneRosterV1p2TransportResponse<TValue>, OneRosterV1p2RestError>>;
  requestPage<TValue>(
    input: OneRosterV1p2CollectionRequest<TValue>,
  ): Promise<Result<OneRosterV1p2Page<TValue>, OneRosterV1p2RestError>>;
  iteratePages<TValue>(
    input: OneRosterV1p2CollectionRequest<TValue> & OneRosterV1p2IterationBounds,
  ): AsyncGenerator<Result<OneRosterV1p2Page<TValue>, OneRosterV1p2RestError>, void, void>;
  collectAll<TValue>(
    input: OneRosterV1p2CollectionRequest<TValue> & OneRosterV1p2CollectionBounds,
  ): Promise<Result<ReadonlyArray<TValue>, OneRosterV1p2RestError>>;
}

/** Create the shared transport after validating explicit configuration. */
export function createOneRosterV1p2RestTransport(
  input: unknown,
): Result<OneRosterV1p2RestTransport, OneRosterV1p2ConfigurationError> {
  const configuration = createOneRosterV1p2ClientConfiguration(input);
  if (configuration._tag === "err") return configuration;
  const value = configuration.value;
  return ok(
    createOneRosterRestMechanics<
      OneRosterV1p2Operation,
      OneRosterV1p2Query,
      OneRosterV1p2RestError,
      OneRosterV1p2PayloadDiagnostic
    >({
      fetch: value.fetch,
      retryClock: value.retryClock,
      ...(value.retryPolicy === undefined ? {} : { retryPolicy: value.retryPolicy }),
      resolveUrl: (operation, pathParameters, query) =>
        buildRequestUrl(value, operation, pathParameters, query),
      authorize: async ({ operation, signal }) => {
        let tokenResult: Result<OneRosterV1p2AccessToken, OneRosterV1p2AuthenticationError>;
        try {
          tokenResult = await value.accessTokenProvider(operation.requiredScopes, signal);
        } catch (cause: unknown) {
          if (signal.aborted || isOneRosterRestAbortCause(cause)) {
            return err(transportErrors.cancellation(operation.operationId));
          }
          return err(authenticationError(operation.operationId, "token_failed"));
        }
        if (tokenResult._tag === "err") {
          if (tokenResult.error.code === "cancelled" || signal.aborted) {
            return err(transportErrors.cancellation(operation.operationId));
          }
          return err(authenticationError(operation.operationId, tokenResult.error));
        }
        return ok({ Authorization: `Bearer ${readOneRosterV1p2BearerValue(tokenResult.value)}` });
      },
      parseHttpError: httpError,
      parsePageMetadata: (headers, query, operationId) =>
        parseOneRosterV1p2PageMetadata(headers, query, operationId),
      withQueryOffset,
      queryFromLink: (link, current, fallbackOffset, operationId) =>
        parseOneRosterRestQueryFromLink({
          link,
          current,
          fallbackOffset,
          operationId,
          withLinkLimit: (query, limit) => (limit === undefined ? query : { ...query, limit }),
          withQueryOffset,
          paginationError: transportErrors.pagination,
        }),
      skipResponseBody: () => false,
      errors: {
        cancellation: transportErrors.cancellation,
        network: transportErrors.network,
        authorization: (operationId) => authenticationError(operationId, "token_failed"),
        contentType: transportErrors.contentType,
        json: transportErrors.json,
        payload: transportErrors.payload,
        pagination: transportErrors.pagination,
        collectionLimit: transportErrors.collectionLimit,
      },
    }),
  );
}

function buildRequestUrl(
  configuration: OneRosterV1p2ClientConfiguration,
  operation: OneRosterV1p2Operation,
  pathParameters: Readonly<Record<string, string>> | undefined,
  query: OneRosterV1p2Query | undefined,
): Result<string, OneRosterV1p2RestError> {
  const base = configuration.serviceBaseUrls[operation.service];
  if (base === undefined) {
    return err(
      configurationError(
        operation.operationId,
        "missing_service_url",
        "The operation's service base URL is not configured.",
      ),
    );
  }
  const path = substituteOneRosterRestPathParameters(
    operation,
    pathParameters,
    transportErrors.pathParameter,
  );
  if (path._tag === "err") return path;
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${path.value}`;
  if (query !== undefined) {
    const serialized = serializeOneRosterV1p2Query(query, operation.allowedQuery);
    if (serialized._tag === "err") {
      return err(transportErrors.query(operation.operationId, serialized.error));
    }
    url.search = serialized.value;
  }
  return ok(url.toString());
}

function withQueryOffset(
  query: OneRosterV1p2Query | undefined,
  offset: number,
  operationId: string,
): Result<OneRosterV1p2Query, OneRosterV1p2RestError> {
  const nextQuery = withOneRosterV1p2QueryOffset(query, offset);
  if (nextQuery._tag === "err") return err(transportErrors.query(operationId, nextQuery.error));
  return nextQuery;
}

async function httpError(
  operationId: string,
  response: Response,
  headers: Readonly<Record<string, string>>,
): Promise<OneRosterV1p2RestError> {
  let statusInfo: OneRosterV1p2StatusInfo | undefined;
  let malformed = false;
  if (isOneRosterRestJsonContentType(response.headers.get("content-type") ?? undefined)) {
    try {
      const body: unknown = JSON.parse(await response.text());
      const parsed = parseOneRosterV1p2StatusInfo(body);
      if (parsed._tag === "ok") statusInfo = parsed.value;
      else malformed = true;
    } catch (cause: unknown) {
      void cause;
      malformed = true;
    }
  } else {
    malformed = true;
  }
  return {
    _tag: "OneRosterV1p2HttpError",
    code: "http_failure",
    operationId,
    status: response.status,
    headers: {
      ...(headers["content-type"] === undefined ? {} : { contentType: headers["content-type"] }),
      ...(headers["retry-after"] === undefined ? {} : { retryAfter: headers["retry-after"] }),
      ...(headers["x-request-id"] === undefined ? {} : { requestId: headers["x-request-id"] }),
    },
    ...(statusInfo === undefined ? {} : { statusInfo }),
    statusPayloadMalformed: malformed,
    message: "The OneRoster service returned a non-success HTTP status.",
  };
}

function configurationError(
  operationId: string,
  code: "missing_service_url",
  message: string,
): OneRosterV1p2RestError {
  return { _tag: "OneRosterV1p2ConfigurationError", code, operationId, message };
}

function authenticationError(
  operationId: string,
  authentication: OneRosterV1p2AuthenticationError | OneRosterV1p2AuthenticationError["code"],
): OneRosterV1p2RestError {
  const value: OneRosterV1p2AuthenticationError =
    typeof authentication === "string"
      ? {
          _tag: "OneRosterV1p2AuthenticationError",
          code: authentication,
          message: "The OneRoster access token could not be acquired.",
        }
      : authentication;
  return {
    _tag: "OneRosterV1p2AuthenticationRestError",
    code: "authentication_failure",
    operationId,
    authentication: value,
    message: "The OneRoster access token could not be acquired.",
  };
}
