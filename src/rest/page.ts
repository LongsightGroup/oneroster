import { err, ok, type Result } from "../result.js";

/** The relation links shared by OneRoster collection pages. */
export interface OneRosterRestPageLinks {
  readonly first?: string;
  readonly prev?: string;
  readonly next?: string;
  readonly last?: string;
}

/** The pagination metadata shared by versioned OneRoster REST bindings. */
export interface OneRosterRestPageMetadata {
  readonly limit: number;
  readonly offset: number;
  readonly totalCount?: number;
  readonly links: OneRosterRestPageLinks;
}

/** Determine whether a parsed page advertises or implies another page. */
export function hasMoreOneRosterRestPage(
  page: OneRosterRestPageMetadata & { readonly items: ReadonlyArray<unknown> },
): boolean {
  if (page.links.next !== undefined) return true;
  if (page.totalCount !== undefined) {
    return page.offset + page.items.length < page.totalCount;
  }
  return page.items.length > 0;
}

/** Parse the standard OneRoster pagination headers without retaining response bodies. */
export function parseOneRosterRestPageMetadata<TError>(
  headers: Headers,
  query: { readonly limit?: number; readonly offset?: number } | undefined,
  operationId: string,
  defaultLimit: number,
  createError: (operationId: string) => TError,
): Result<OneRosterRestPageMetadata, TError> {
  const totalHeader = headers.get("X-Total-Count");
  let totalCount: number | undefined;
  if (totalHeader !== null) {
    if (!/^\d+$/.test(totalHeader)) return err(createError(operationId));
    const parsed = Number(totalHeader);
    if (!Number.isSafeInteger(parsed) || parsed < 0) return err(createError(operationId));
    totalCount = parsed;
  }
  const links = parseOneRosterRestPageLinks(headers.get("Link"), createError, operationId);
  if (links._tag === "err") return links;
  return ok({
    limit: query?.limit ?? defaultLimit,
    offset: query?.offset ?? 0,
    links: links.value,
    ...(totalCount === undefined ? {} : { totalCount }),
  });
}

function parseOneRosterRestPageLinks<TError>(
  header: string | null,
  createError: (operationId: string) => TError,
  operationId: string,
): Result<OneRosterRestPageLinks, TError> {
  if (header === null || header.trim() === "") return ok({});
  const links: {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  } = {};
  for (const part of header.split(",")) {
    const match = /^\s*<([^>]+)>\s*;\s*rel="([^"]+)"\s*$/.exec(part);
    if (match === null) return err(createError(operationId));
    const target = match[1];
    const relation = match[2];
    if (target === undefined || relation === undefined || target.length === 0) {
      return err(createError(operationId));
    }
    if (relation === "first" || relation === "prev" || relation === "next" || relation === "last") {
      if (links[relation] !== undefined) return err(createError(operationId));
      links[relation] = target;
    }
  }
  return ok(links);
}
