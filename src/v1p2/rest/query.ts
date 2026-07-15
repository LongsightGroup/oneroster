import type { Result } from "../../result.js";
import { createOneRosterRestQueryParser } from "../../rest/query.js";
import type { OneRosterRestQuery } from "../../rest/transport.js";
import {
  parseOneRosterV1p2FilterInput,
  parseOneRosterV1p2FilterExpression,
  serializeOneRosterV1p2Filter,
  type OneRosterV1p2Filter,
  type OneRosterV1p2QueryDiagnostic,
} from "./filter.js";
import type { OneRosterV1p2QueryCategory } from "./operation.js";

/** Immutable validated v1.2 collection query with its typed filter AST. */
export type OneRosterV1p2Query = OneRosterRestQuery<OneRosterV1p2Filter>;

/** Host-friendly input for creating a validated query. */
export interface OneRosterV1p2QueryInput {
  readonly limit?: number;
  readonly offset?: number;
  readonly sort?: string;
  readonly orderBy?: "asc" | "desc";
  readonly filter?: OneRosterV1p2Filter;
  readonly fields?: ReadonlyArray<string>;
}

type QueryResult<TValue> = Result<TValue, ReadonlyArray<OneRosterV1p2QueryDiagnostic>>;

const queryParser = createOneRosterRestQueryParser<
  OneRosterV1p2Filter,
  OneRosterV1p2QueryDiagnostic
>({
  parseFilter: parseOneRosterV1p2FilterInput,
  parseFilterExpression: parseOneRosterV1p2FilterExpression,
  serializeFilter: serializeOneRosterV1p2Filter,
  createDiagnostic: (code, path, message) => ({
    _tag: "OneRosterV1p2PayloadDiagnostic",
    code: `query.${code}`,
    path,
    message,
  }),
  requireOrderByForSort: true,
  requireSafeIntegers: false,
});

/** Parse an unknown runtime query object before URL serialization. */
export const parseOneRosterV1p2QueryInput: (input: unknown) => QueryResult<OneRosterV1p2Query> =
  queryParser.parse;

/** Parse URL query parameters against one operation's allowed query categories. */
export const parseOneRosterV1p2QueryParameters: (
  input: URLSearchParams,
  allowedCategories?: ReadonlyArray<OneRosterV1p2QueryCategory>,
) => QueryResult<OneRosterV1p2Query | undefined> = queryParser.parseUrl;

/** Validate typed query options before they cross the URL boundary. */
export const createOneRosterV1p2Query: (
  input: OneRosterV1p2QueryInput,
) => QueryResult<OneRosterV1p2Query> = queryParser.create;

/** Serialize a validated query with URLSearchParams exactly once. */
export const serializeOneRosterV1p2Query: (
  query: OneRosterV1p2Query,
  allowedCategories?: ReadonlyArray<OneRosterV1p2QueryCategory>,
) => QueryResult<string> = queryParser.serialize;

/** Return a copy of a query with a new offset for bounded collection traversal. */
export const withOneRosterV1p2QueryOffset: (
  query: OneRosterV1p2Query | undefined,
  offset: number,
) => QueryResult<OneRosterV1p2Query> = queryParser.withOffset;
