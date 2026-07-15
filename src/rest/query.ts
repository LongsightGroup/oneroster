import { err, ok, type Result } from "../result.js";
import type { OneRosterRestQuery } from "./transport.js";

/** Codes emitted by the shared query URL serializer. */
export type OneRosterRestQueryDiagnosticCode =
  | "invalid_field"
  | "invalid_operator"
  | "invalid_value"
  | "invalid_combination";

/** The version-neutral shape accepted by OneRoster collection query serializers. */
export type OneRosterRestQueryShape<TFilter = unknown> = OneRosterRestQuery<TFilter>;

/** Version policy used by the shared OneRoster query parser. */
export interface OneRosterRestQueryGrammar<TFilter, TDiagnostic> {
  readonly parseFilter: (input: unknown) => Result<TFilter, ReadonlyArray<TDiagnostic>>;
  readonly parseFilterExpression: (input: string) => Result<TFilter, ReadonlyArray<TDiagnostic>>;
  readonly serializeFilter: (filter: TFilter) => string;
  readonly createDiagnostic: (
    code: OneRosterRestQueryDiagnosticCode,
    path: string,
    message: string,
  ) => TDiagnostic;
  readonly requireOrderByForSort: boolean;
  readonly requireSafeIntegers: boolean;
}

/** Cohesive parsing, validation, serialization, and traversal-offset query operations. */
export interface OneRosterRestQueryParser<TFilter, TDiagnostic> {
  readonly parse: (
    input: unknown,
  ) => Result<OneRosterRestQueryShape<TFilter>, ReadonlyArray<TDiagnostic>>;
  readonly parseUrl: (
    input: URLSearchParams,
    allowedCategories?: ReadonlyArray<OneRosterRestQueryCategory>,
  ) => Result<OneRosterRestQueryShape<TFilter> | undefined, ReadonlyArray<TDiagnostic>>;
  readonly create: (
    input: OneRosterRestQueryShape<TFilter>,
  ) => Result<OneRosterRestQueryShape<TFilter>, ReadonlyArray<TDiagnostic>>;
  readonly serialize: (
    query: OneRosterRestQueryShape<TFilter>,
    allowedCategories?: ReadonlyArray<OneRosterRestQueryCategory>,
  ) => Result<string, ReadonlyArray<TDiagnostic>>;
  readonly withOffset: (
    query: OneRosterRestQueryShape<TFilter> | undefined,
    offset: number,
  ) => Result<OneRosterRestQueryShape<TFilter>, ReadonlyArray<TDiagnostic>>;
}

/** Query categories controlled by operation metadata. */
export type OneRosterRestQueryCategory =
  | "limit"
  | "offset"
  | "sort"
  | "orderBy"
  | "filter"
  | "fields";

const allQueryCategories: ReadonlyArray<OneRosterRestQueryCategory> = [
  "limit",
  "offset",
  "sort",
  "orderBy",
  "filter",
  "fields",
];

/** Create one version-adapted parser for the complete OneRoster query grammar. */
export function createOneRosterRestQueryParser<TFilter, TDiagnostic>(
  grammar: OneRosterRestQueryGrammar<TFilter, TDiagnostic>,
): OneRosterRestQueryParser<TFilter, TDiagnostic> {
  type Query = OneRosterRestQueryShape<TFilter>;
  type QueryResult<TValue> = Result<TValue, ReadonlyArray<TDiagnostic>>;
  const diagnostic = grammar.createDiagnostic;

  function create(input: Query): QueryResult<Query> {
    const validInteger = grammar.requireSafeIntegers ? Number.isSafeInteger : Number.isInteger;
    if (input.limit !== undefined && (!validInteger(input.limit) || input.limit <= 0)) {
      return err([diagnostic("invalid_value", "$.limit", "limit must be a positive integer.")]);
    }
    if (input.offset !== undefined && (!validInteger(input.offset) || input.offset < 0)) {
      return err([
        diagnostic("invalid_value", "$.offset", "offset must be a non-negative integer."),
      ]);
    }
    if (input.sort !== undefined && !validFieldPath(input.sort)) {
      return err([diagnostic("invalid_field", "$.sort", "sort must be a safe field path.")]);
    }
    if (input.orderBy !== undefined && input.sort === undefined) {
      return err([diagnostic("invalid_combination", "$.orderBy", "orderBy requires sort.")]);
    }
    if (grammar.requireOrderByForSort && input.sort !== undefined && input.orderBy === undefined) {
      return err([diagnostic("invalid_combination", "$.sort", "sort requires orderBy.")]);
    }
    if (input.fields !== undefined && !validFields(input.fields)) {
      return err([
        diagnostic("invalid_field", "$.fields", "fields must contain safe, non-empty field paths."),
      ]);
    }
    return ok({
      ...(input.limit === undefined ? {} : { limit: input.limit }),
      ...(input.offset === undefined ? {} : { offset: input.offset }),
      ...(input.sort === undefined ? {} : { sort: input.sort }),
      ...(input.orderBy === undefined ? {} : { orderBy: input.orderBy }),
      ...(input.filter === undefined ? {} : { filter: input.filter }),
      ...(input.fields === undefined ? {} : { fields: [...input.fields] }),
    });
  }

  function parse(input: unknown): QueryResult<Query> {
    if (!isRecord(input)) {
      return err([diagnostic("invalid_value", "$", "query must be an object.")]);
    }
    const limit = optionalNumber(input["limit"], "$.limit", diagnostic);
    if (limit._tag === "err") return limit;
    const offset = optionalNumber(input["offset"], "$.offset", diagnostic);
    if (offset._tag === "err") return offset;
    const sort = optionalString(input["sort"], "$.sort", diagnostic);
    if (sort._tag === "err") return sort;
    const orderBy = optionalOrderBy(input["orderBy"], diagnostic);
    if (orderBy._tag === "err") return orderBy;
    const fields = optionalFields(input["fields"], diagnostic);
    if (fields._tag === "err") return fields;
    const filter =
      input["filter"] === undefined
        ? ok<TFilter | undefined>(undefined)
        : grammar.parseFilter(input["filter"]);
    if (filter._tag === "err") return filter;
    return create({
      ...(limit.value === undefined ? {} : { limit: limit.value }),
      ...(offset.value === undefined ? {} : { offset: offset.value }),
      ...(sort.value === undefined ? {} : { sort: sort.value }),
      ...(orderBy.value === undefined ? {} : { orderBy: orderBy.value }),
      ...(filter.value === undefined ? {} : { filter: filter.value }),
      ...(fields.value === undefined ? {} : { fields: fields.value }),
    });
  }

  function serialize(
    query: Query,
    allowedCategories: ReadonlyArray<OneRosterRestQueryCategory> = allQueryCategories,
  ): QueryResult<string> {
    const valid = create(query);
    if (valid._tag === "err") return valid;
    return serializeOneRosterRestQuery(
      valid.value,
      allowedCategories,
      grammar.serializeFilter,
      diagnostic,
    );
  }

  function parseUrl(
    params: URLSearchParams,
    allowedCategories: ReadonlyArray<OneRosterRestQueryCategory> = allQueryCategories,
  ): QueryResult<Query | undefined> {
    const keys = [...params.keys()];
    if (keys.length === 0) return ok(undefined);
    const allowed = new Set(allowedCategories);
    const values: Record<string, string> = {};
    for (const key of new Set(keys)) {
      if (!isQueryCategory(key) || !allowed.has(key)) {
        return err([
          diagnostic(
            "invalid_combination",
            `$.${key}`,
            "This operation does not allow this query parameter.",
          ),
        ]);
      }
      const entries = params.getAll(key);
      if (entries.length !== 1 || entries[0] === undefined) {
        return err([
          diagnostic("invalid_value", `$.${key}`, "Query parameters must occur exactly once."),
        ]);
      }
      values[key] = entries[0];
    }
    const limit = parseUrlInteger(values["limit"], "$.limit", diagnostic);
    if (limit._tag === "err") return limit;
    const offset = parseUrlInteger(values["offset"], "$.offset", diagnostic);
    if (offset._tag === "err") return offset;
    const orderBy = parseUrlOrderBy(values["orderBy"], diagnostic);
    if (orderBy._tag === "err") return orderBy;
    const filter =
      values["filter"] === undefined
        ? ok<TFilter | undefined>(undefined)
        : grammar.parseFilterExpression(values["filter"]);
    if (filter._tag === "err") return filter;
    return create({
      ...(limit.value === undefined ? {} : { limit: limit.value }),
      ...(offset.value === undefined ? {} : { offset: offset.value }),
      ...(values["sort"] === undefined ? {} : { sort: values["sort"] }),
      ...(orderBy.value === undefined ? {} : { orderBy: orderBy.value }),
      ...(filter.value === undefined ? {} : { filter: filter.value }),
      ...(values["fields"] === undefined ? {} : { fields: values["fields"].split(",") }),
    });
  }

  return {
    parse,
    parseUrl,
    create,
    serialize,
    withOffset: (query, offset) => create({ ...query, offset }),
  };
}

function parseUrlInteger<TDiagnostic>(
  input: string | undefined,
  path: string,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<number | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined) return ok(undefined);
  if (!/^(?:0|[1-9][0-9]*)$/.test(input)) {
    return err([diagnostic("invalid_value", path, "The query parameter must be an integer.")]);
  }
  return ok(Number(input));
}

function isQueryCategory(input: string): input is OneRosterRestQueryCategory {
  return allQueryCategories.some((category) => category === input);
}

function parseUrlOrderBy<TDiagnostic>(
  input: string | undefined,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<"asc" | "desc" | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined || input === "asc" || input === "desc") return ok(input);
  return err([diagnostic("invalid_value", "$.orderBy", "orderBy must be either asc or desc.")]);
}

/** Serialize validated OneRoster query fields in their normative URL order. */
export function serializeOneRosterRestQuery<TFilter, TDiagnostic>(
  query: OneRosterRestQueryShape<TFilter>,
  allowedCategories: ReadonlyArray<"limit" | "offset" | "sort" | "orderBy" | "filter" | "fields">,
  serializeFilter: (filter: TFilter) => string,
  createDiagnostic: (
    code: OneRosterRestQueryDiagnosticCode,
    path: string,
    message: string,
  ) => TDiagnostic,
): Result<string, ReadonlyArray<TDiagnostic>> {
  const allowed = new Set(allowedCategories);
  const params = new URLSearchParams();
  const fields: ReadonlyArray<{
    readonly category: OneRosterRestQueryCategory;
    readonly present: boolean;
    readonly serialize: () => string;
  }> = [
    {
      category: "limit",
      present: query.limit !== undefined,
      serialize: () => String(query.limit),
    },
    {
      category: "offset",
      present: query.offset !== undefined,
      serialize: () => String(query.offset),
    },
    { category: "sort", present: query.sort !== undefined, serialize: () => query.sort ?? "" },
    {
      category: "orderBy",
      present: query.orderBy !== undefined,
      serialize: () => query.orderBy ?? "",
    },
    {
      category: "filter",
      present: query.filter !== undefined,
      serialize: () => (query.filter === undefined ? "" : serializeFilter(query.filter)),
    },
    {
      category: "fields",
      present: query.fields !== undefined,
      serialize: () => query.fields?.join(",") ?? "",
    },
  ];
  for (const field of fields) {
    if (!field.present) continue;
    if (!allowed.has(field.category)) {
      return err([
        createDiagnostic(
          "invalid_combination",
          `$.${field.category}`,
          `This operation does not allow ${field.category}.`,
        ),
      ]);
    }
    params.set(field.category, field.serialize());
  }
  return ok(params.toString());
}

function optionalNumber<TDiagnostic>(
  input: unknown,
  path: string,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<number | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined) return ok(undefined);
  return typeof input === "number"
    ? ok(input)
    : err([diagnostic("invalid_value", path, "The query value must be a number.")]);
}

function optionalString<TDiagnostic>(
  input: unknown,
  path: string,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<string | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined) return ok(undefined);
  return typeof input === "string"
    ? ok(input)
    : err([diagnostic("invalid_value", path, "The query value must be a string.")]);
}

function optionalOrderBy<TDiagnostic>(
  input: unknown,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<"asc" | "desc" | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined) return ok(undefined);
  return input === "asc" || input === "desc"
    ? ok(input)
    : err([diagnostic("invalid_value", "$.orderBy", "orderBy must be asc or desc.")]);
}

function optionalFields<TDiagnostic>(
  input: unknown,
  diagnostic: OneRosterRestQueryGrammar<unknown, TDiagnostic>["createDiagnostic"],
): Result<ReadonlyArray<string> | undefined, ReadonlyArray<TDiagnostic>> {
  if (input === undefined) return ok(undefined);
  if (!Array.isArray(input) || !input.every((field) => typeof field === "string")) {
    return err([diagnostic("invalid_value", "$.fields", "fields must be an array of strings.")]);
  }
  return ok(input.filter((field): field is string => typeof field === "string"));
}

function validFieldPath(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(value);
}

function validFields(fields: ReadonlyArray<string>): boolean {
  return fields.length > 0 && fields.every(validFieldPath);
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
