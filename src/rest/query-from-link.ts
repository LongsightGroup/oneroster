import { err, type Result } from "../result.js";
import type { OneRosterRestQuery } from "./transport.js";

/** Parse a pagination link into the next version-specific query. */
export function parseOneRosterRestQueryFromLink<TQuery extends OneRosterRestQuery, TError>(input: {
  readonly link: string;
  readonly current: TQuery | undefined;
  readonly fallbackOffset: number;
  readonly operationId: string;
  readonly withLinkLimit?: (
    current: TQuery | undefined,
    limit: number | undefined,
  ) => TQuery | undefined;
  readonly withQueryOffset: (
    query: TQuery | undefined,
    offset: number,
    operationId: string,
  ) => Result<TQuery, TError>;
  readonly paginationError: (operationId: string) => TError;
}): Result<TQuery, TError> {
  let url: URL;
  try {
    url = new URL(input.link, "https://oneroster.invalid");
  } catch (cause: unknown) {
    void cause;
    return err(input.paginationError(input.operationId));
  }

  const offsetText = url.searchParams.get("offset");
  const offset = offsetText === null ? input.fallbackOffset : Number(offsetText);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return err(input.paginationError(input.operationId));
  }

  let query = input.current;
  if (input.withLinkLimit !== undefined) {
    const limitText = url.searchParams.get("limit");
    const limit = limitText === null ? input.current?.limit : Number(limitText);
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit <= 0)) {
      return err(input.paginationError(input.operationId));
    }
    query = input.withLinkLimit(input.current, limit);
  }

  return input.withQueryOffset(query, offset, input.operationId);
}
