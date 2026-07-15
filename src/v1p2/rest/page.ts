import { type Result } from "../../result.js";
import { parseOneRosterRestPageMetadata, type OneRosterRestPageLinks } from "../../rest/page.js";
import type { OneRosterV1p2PaginationError } from "./error.js";
import type { OneRosterV1p2Query } from "./query.js";

/** Parsed RFC 8288 pagination relation links. */
export type OneRosterV1p2PageLinks = OneRosterRestPageLinks;

/** A validated collection page with bounded traversal metadata. */
export interface OneRosterV1p2Page<TValue> {
  readonly items: ReadonlyArray<TValue>;
  readonly limit: number;
  readonly offset: number;
  readonly totalCount?: number;
  readonly links: OneRosterV1p2PageLinks;
}

/** Parse page metadata from standard response headers. */
export function parseOneRosterV1p2PageMetadata(
  headers: Headers,
  query: OneRosterV1p2Query | undefined,
  operationId: string,
): Result<
  Pick<OneRosterV1p2Page<never>, "limit" | "offset" | "totalCount" | "links">,
  OneRosterV1p2PaginationError
> {
  return parseOneRosterRestPageMetadata(headers, query, operationId, 100, paginationError);
}

function paginationError(operationId: string): OneRosterV1p2PaginationError {
  return {
    _tag: "OneRosterV1p2PaginationError",
    code: "malformed_pagination",
    operationId,
    message: "Pagination metadata is malformed.",
  };
}
