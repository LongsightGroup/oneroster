import { err, ok, type Result } from "../result.js";

/** Operators supported by the shared OneRoster REST filter grammar. */
export type OneRosterRestFilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "~";

/** Scalar values supported by the shared OneRoster REST filter grammar. */
export type OneRosterRestFilterValue = string | number | boolean;

/** Structural clause understood by the shared filter serializer. */
export interface OneRosterRestFilterClause {
  readonly field: string;
  readonly operator: OneRosterRestFilterOperator;
  readonly value: OneRosterRestFilterValue;
}

/** Structural two-clause combination understood by the shared filter serializer. */
export interface OneRosterRestFilterCombination<TClause extends OneRosterRestFilterClause> {
  readonly left: TClause;
  readonly join: "AND" | "OR";
  readonly right: TClause;
}

/** Stable grammar failure kinds translated by each version facade. */
export type OneRosterRestFilterFailureKind =
  | "invalid_filter"
  | "invalid_clause"
  | "invalid_field"
  | "invalid_operator"
  | "invalid_value"
  | "invalid_combination";

/** Stable diagnostic codes adapted to each version's public namespace. */
export type OneRosterRestFilterDiagnosticCode =
  | "invalid_field"
  | "invalid_operator"
  | "invalid_value"
  | "invalid_combination";

/** Version adapter used by the shared filter parser. */
export interface OneRosterRestFilterGrammar<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
> {
  readonly isClauseInput: (input: Readonly<Record<string, unknown>>) => boolean;
  readonly isCombinationInput: (input: Readonly<Record<string, unknown>>) => boolean;
  readonly isCombination: (input: TClause | TCombination) => input is TCombination;
  readonly createClause: (
    field: string,
    operator: OneRosterRestFilterOperator,
    value: OneRosterRestFilterValue,
  ) => TClause;
  readonly createCombination: (left: TClause, join: "AND" | "OR", right: TClause) => TCombination;
  readonly createDiagnostic: (
    code: OneRosterRestFilterDiagnosticCode,
    path: string,
    message: string,
  ) => TDiagnostic;
}

/** Complete version-adapted filter API backed by one shared grammar implementation. */
export interface OneRosterRestFilterFacade<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
  TCombineResult,
> extends OneRosterRestFilterClauseConstructors<TClause, TDiagnostic> {
  readonly combine: (left: TClause, join: "AND" | "OR", right: TClause) => TCombineResult;
  readonly parse: (input: unknown) => Result<TClause | TCombination, ReadonlyArray<TDiagnostic>>;
  readonly parseExpression: (
    input: string,
  ) => Result<TClause | TCombination, ReadonlyArray<TDiagnostic>>;
  readonly serialize: (filter: TClause | TCombination) => string;
}

/** Named clause constructors backed by one versioned filter grammar. */
export interface OneRosterRestFilterClauseConstructors<
  TClause extends OneRosterRestFilterClause,
  TDiagnostic,
> {
  readonly create: (
    field: string,
    operator: OneRosterRestFilterOperator,
    value: OneRosterRestFilterValue,
  ) => Result<TClause, ReadonlyArray<TDiagnostic>>;
  readonly equals: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly notEquals: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly greaterThan: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly greaterThanOrEqual: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly lessThan: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly lessThanOrEqual: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
  readonly contains: OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic>;
}

type OneRosterRestFilterConvenienceConstructor<
  TClause extends OneRosterRestFilterClause,
  TDiagnostic,
> = (field: string, value: OneRosterRestFilterValue) => Result<TClause, ReadonlyArray<TDiagnostic>>;

/** Create one cohesive filter API from version-specific structural and diagnostic data. */
export function createOneRosterRestFilterFacade<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
  TCombineResult,
>(
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
  mapCombination: (combination: TCombination) => TCombineResult,
): OneRosterRestFilterFacade<TClause, TCombination, TDiagnostic, TCombineResult> {
  const constructors = createOneRosterRestFilterClauseConstructors(grammar);
  return {
    ...constructors,
    combine: (left, join, right) => mapCombination(grammar.createCombination(left, join, right)),
    parse: (input) => parseOneRosterRestFilterInput(input, grammar),
    parseExpression: (input) => parseOneRosterRestFilterExpression(input, grammar),
    serialize: (filter) =>
      serializeOneRosterRestFilter<TClause, TCombination>(filter, grammar.isCombination),
  };
}

/** Create all standard clause constructors from one versioned grammar adapter. */
export function createOneRosterRestFilterClauseConstructors<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): OneRosterRestFilterClauseConstructors<TClause, TDiagnostic> {
  const create = (
    field: string,
    operator: OneRosterRestFilterOperator,
    value: OneRosterRestFilterValue,
  ): Result<TClause, ReadonlyArray<TDiagnostic>> =>
    createOneRosterRestFilterClause(field, operator, value, grammar);
  const withOperator =
    (
      operator: OneRosterRestFilterOperator,
    ): OneRosterRestFilterConvenienceConstructor<TClause, TDiagnostic> =>
    (field, value) =>
      create(field, operator, value);

  return {
    create,
    equals: withOperator("="),
    notEquals: withOperator("!="),
    greaterThan: withOperator(">"),
    greaterThanOrEqual: withOperator(">="),
    lessThan: withOperator("<"),
    lessThanOrEqual: withOperator("<="),
    contains: withOperator("~"),
  };
}

/** Create and validate one versioned filter clause through the shared grammar. */
export function createOneRosterRestFilterClause<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  field: string,
  operator: OneRosterRestFilterOperator,
  value: OneRosterRestFilterValue,
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): Result<TClause, ReadonlyArray<TDiagnostic>> {
  return parseClause(grammar.createClause(field, operator, value), "$", grammar);
}

/** Parse one clause or one two-clause combination through a version adapter. */
export function parseOneRosterRestFilterInput<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  input: unknown,
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): Result<TClause | TCombination, ReadonlyArray<TDiagnostic>> {
  if (!isRecord(input)) {
    return err([createFilterDiagnostic(grammar, "invalid_filter", "$.filter")]);
  }
  if (!grammar.isCombinationInput(input)) {
    return parseClause(input, "$.filter", grammar);
  }
  const left = parseClause(input["left"], "$.filter.left", grammar);
  if (left._tag === "err") return left;
  const join = input["join"];
  if (join !== "AND" && join !== "OR") {
    return err([createFilterDiagnostic(grammar, "invalid_combination", "$.filter.join")]);
  }
  const right = parseClause(input["right"], "$.filter.right", grammar);
  if (right._tag === "err") return right;
  return ok(grammar.createCombination(left.value, join, right.value));
}

/** Parse the normative URL filter expression into one versioned filter AST. */
export function parseOneRosterRestFilterExpression<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  input: string,
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): Result<TClause | TCombination, ReadonlyArray<TDiagnostic>> {
  const combined = filterCombinationExpression.exec(input);
  if (combined !== null) {
    const left = parseExpressionClause(combined, 1, "$.filter.left", grammar);
    if (left._tag === "err") return left;
    const right = parseExpressionClause(combined, 5, "$.filter.right", grammar);
    if (right._tag === "err") return right;
    const join = combined[4];
    if (join !== "AND" && join !== "OR") {
      return err([createFilterDiagnostic(grammar, "invalid_combination", "$.filter.join")]);
    }
    return ok(grammar.createCombination(left.value, join, right.value));
  }
  const clause = filterClauseExpression.exec(input);
  return clause === null
    ? err([createFilterDiagnostic(grammar, "invalid_filter", "$.filter")])
    : parseExpressionClause(clause, 1, "$.filter", grammar);
}

/** Serialize one clause or one two-clause combination without URL encoding. */
export function serializeOneRosterRestFilter<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
>(
  filter: TClause | TCombination,
  isCombination: (input: TClause | TCombination) => input is TCombination,
): string {
  if (!isCombination(filter)) return serializeClause(filter);
  return `${serializeClause(filter.left)} ${filter.join} ${serializeClause(filter.right)}`;
}

function parseClause<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  input: unknown,
  path: string,
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): Result<TClause, ReadonlyArray<TDiagnostic>> {
  if (!isRecord(input) || !grammar.isClauseInput(input)) {
    return err([createFilterDiagnostic(grammar, "invalid_clause", path)]);
  }
  const field = input["field"];
  if (typeof field !== "string" || !isSafeField(field)) {
    return err([createFilterDiagnostic(grammar, "invalid_field", `${path}.field`)]);
  }
  const operator = input["operator"];
  if (!isOperator(operator)) {
    return err([createFilterDiagnostic(grammar, "invalid_operator", `${path}.operator`)]);
  }
  const value = input["value"];
  if (!isValue(value)) {
    return err([createFilterDiagnostic(grammar, "invalid_value", `${path}.value`)]);
  }
  return ok(grammar.createClause(field, operator, value));
}

const fieldExpression = "([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*)";
const operatorExpression = "(!=|>=|<=|=|>|<|~)";
const valueExpression = "'((?:''|[^'])*)'";
const filterClauseExpression = new RegExp(
  `^${fieldExpression}${operatorExpression}${valueExpression}$`,
);
const filterCombinationExpression = new RegExp(
  `^${fieldExpression}${operatorExpression}${valueExpression} (AND|OR) ${fieldExpression}${operatorExpression}${valueExpression}$`,
);

function parseExpressionClause<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  match: RegExpExecArray,
  offset: number,
  path: string,
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
): Result<TClause, ReadonlyArray<TDiagnostic>> {
  const field = match[offset];
  const operator = match[offset + 1];
  const value = match[offset + 2];
  if (field === undefined || operator === undefined || value === undefined) {
    return err([createFilterDiagnostic(grammar, "invalid_filter", path)]);
  }
  if (!isOperator(operator)) {
    return err([createFilterDiagnostic(grammar, "invalid_operator", `${path}.operator`)]);
  }
  return ok(grammar.createClause(field, operator, value.replaceAll("''", "'")));
}

function createFilterDiagnostic<
  TClause extends OneRosterRestFilterClause,
  TCombination extends OneRosterRestFilterCombination<TClause>,
  TDiagnostic,
>(
  grammar: OneRosterRestFilterGrammar<TClause, TCombination, TDiagnostic>,
  kind: OneRosterRestFilterFailureKind,
  path: string,
): TDiagnostic {
  switch (kind) {
    case "invalid_field":
      return grammar.createDiagnostic("invalid_field", path, "The filter field path is invalid.");
    case "invalid_operator":
      return grammar.createDiagnostic("invalid_operator", path, "The filter operator is invalid.");
    case "invalid_combination":
      return grammar.createDiagnostic("invalid_combination", path, "join must be AND or OR.");
    case "invalid_filter":
      return grammar.createDiagnostic("invalid_value", path, "filter must be an object.");
    case "invalid_clause":
      return grammar.createDiagnostic("invalid_value", path, "A filter clause is invalid.");
    case "invalid_value":
      return grammar.createDiagnostic("invalid_value", path, "The filter value is invalid.");
    default: {
      const exhaustiveKind: never = kind;
      throw new Error(`Unhandled OneRoster filter failure kind: ${String(exhaustiveKind)}.`);
    }
  }
}

function serializeClause(clause: OneRosterRestFilterClause): string {
  return `${clause.field}${clause.operator}'${String(clause.value).replaceAll("'", "''")}'`;
}

function isOperator(input: unknown): input is OneRosterRestFilterOperator {
  return (
    input === "=" ||
    input === "!=" ||
    input === ">" ||
    input === ">=" ||
    input === "<" ||
    input === "<=" ||
    input === "~"
  );
}

function isValue(input: unknown): input is OneRosterRestFilterValue {
  return (
    typeof input === "string" ||
    typeof input === "boolean" ||
    (typeof input === "number" && Number.isFinite(input))
  );
}

function isSafeField(input: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(input);
}

function isRecord(input: unknown): input is Readonly<Record<string, unknown>> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}
