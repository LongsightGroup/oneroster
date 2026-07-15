import type { Result } from "../../result.js";
import { createOneRosterRestQueryParser } from "../../rest/query.js";
import type { OneRosterRestQuery } from "../../rest/transport.js";
import {
  parseOneRosterV1p1FilterInput,
  parseOneRosterV1p1FilterExpression,
  serializeOneRosterV1p1Filter,
  type OneRosterV1p1Filter,
  type OneRosterV1p1QueryDiagnostic,
} from "./filter.js";
export {
  combineOneRosterV1p1Filters,
  createOneRosterV1p1FilterClause,
  serializeOneRosterV1p1Filter,
} from "./filter.js";
export type {
  OneRosterV1p1Filter,
  OneRosterV1p1FilterClause,
  OneRosterV1p1FilterValue,
  OneRosterV1p1QueryDiagnostic,
} from "./filter.js";

/** Validated v1.1 collection query with the v1.1 filter AST at the shared seam. */
export type OneRosterV1p1Query = OneRosterRestQuery<OneRosterV1p1Filter>;

type QueryResult<TValue> = Result<TValue, ReadonlyArray<OneRosterV1p1QueryDiagnostic>>;

const queryParser = createOneRosterRestQueryParser<
  OneRosterV1p1Filter,
  OneRosterV1p1QueryDiagnostic
>({
  parseFilter: parseOneRosterV1p1FilterInput,
  parseFilterExpression: parseOneRosterV1p1FilterExpression,
  serializeFilter: serializeOneRosterV1p1Filter,
  createDiagnostic: (code, path, message) => ({
    _tag: "OneRosterV1p1QueryDiagnostic",
    code,
    path,
    message,
  }),
  requireOrderByForSort: false,
  requireSafeIntegers: true,
});

/** Parse an unknown runtime query object before URL serialization. */
export const parseOneRosterV1p1QueryInput: (input: unknown) => QueryResult<OneRosterV1p1Query> =
  queryParser.parse;

/** Validate query options. */
export const createOneRosterV1p1Query: (
  input: OneRosterV1p1Query,
) => QueryResult<OneRosterV1p1Query> = queryParser.create;

/** Serialize the v1.1 query exactly once. */
export const serializeOneRosterV1p1Query: (
  query: OneRosterV1p1Query,
  allowedCategories?: ReadonlyArray<"limit" | "offset" | "sort" | "orderBy" | "filter" | "fields">,
) => QueryResult<string> = queryParser.serialize;

/** Return a query with a new offset for bounded traversal. */
export const withOneRosterV1p1QueryOffset: (
  query: OneRosterV1p1Query | undefined,
  offset: number,
) => QueryResult<OneRosterV1p1Query> = queryParser.withOffset;
