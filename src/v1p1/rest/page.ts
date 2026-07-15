import { type Result } from "../../result.js";
import { parseOneRosterRestPageMetadata, type OneRosterRestPageLinks } from "../../rest/page.js";
import type { OneRosterV1p1PaginationError } from "./error.js";
import type { OneRosterV1p1Query } from "./query.js";

/** Parsed RFC 8288 relation links. */
export type OneRosterV1p1PageLinks = OneRosterRestPageLinks;

/** A validated v1.1 collection page. */
export interface OneRosterV1p1Page<TValue> {
  readonly items: ReadonlyArray<TValue>;
  readonly limit: number;
  readonly offset: number;
  readonly totalCount?: number;
  readonly links: OneRosterV1p1PageLinks;
}

/** Parse v1.1 pagination headers without retaining response bodies. */
export function parseOneRosterV1p1PageMetadata(
  headers: Headers,
  query: OneRosterV1p1Query | undefined,
  operationId: string,
): Result<
  Pick<OneRosterV1p1Page<never>, "limit" | "offset" | "totalCount" | "links">,
  OneRosterV1p1PaginationError
> {
  return parseOneRosterRestPageMetadata(headers, query, operationId, 100, paginationError);
}

function paginationError(operationId: string): OneRosterV1p1PaginationError {
  return {
    _tag: "OneRosterV1p1PaginationError",
    code: "malformed_pagination",
    operationId,
    message: "OneRoster pagination metadata is malformed.",
  };
}
