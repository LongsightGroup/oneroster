import {
  createOneRosterRestFilterFacade,
  type OneRosterRestFilterOperator,
  type OneRosterRestFilterValue,
} from "../../rest/filter.js";

/** Scalar values accepted by the v1.1 filter grammar. */
export type OneRosterV1p1FilterValue = OneRosterRestFilterValue;

/** One validated v1.1 filter clause. */
export interface OneRosterV1p1FilterClause {
  readonly field: string;
  readonly operator: OneRosterRestFilterOperator;
  readonly value: OneRosterV1p1FilterValue;
}

interface OneRosterV1p1FilterCombination {
  readonly left: OneRosterV1p1FilterClause;
  readonly join: "AND" | "OR";
  readonly right: OneRosterV1p1FilterClause;
}

/** A v1.1 filter with at most one logical join. */
export type OneRosterV1p1Filter = OneRosterV1p1FilterClause | OneRosterV1p1FilterCombination;

/** Query diagnostics that contain no rejected query value. */
export interface OneRosterV1p1QueryDiagnostic {
  readonly _tag: "OneRosterV1p1QueryDiagnostic";
  readonly code: "invalid_field" | "invalid_operator" | "invalid_value" | "invalid_combination";
  readonly path: string;
  readonly message: string;
}

const filter = createOneRosterRestFilterFacade<
  OneRosterV1p1FilterClause,
  OneRosterV1p1FilterCombination,
  OneRosterV1p1QueryDiagnostic,
  OneRosterV1p1Filter
>(
  {
    isClauseInput: isClauseInput,
    isCombinationInput: isCombinationInput,
    isCombination,
    createClause: (field, operator, value) => ({ field, operator, value }),
    createCombination: (left, join, right) => ({ left, join, right }),
    createDiagnostic: (code, path, message) => ({
      _tag: "OneRosterV1p1QueryDiagnostic",
      code,
      path,
      message,
    }),
  },
  (combination) => combination,
);

/** Public v1.1 filter operations assembled by the shared grammar facade. */
export const {
  create: createOneRosterV1p1FilterClause,
  equals: createOneRosterV1p1EqualsFilter,
  notEquals: createOneRosterV1p1NotEqualsFilter,
  greaterThan: createOneRosterV1p1GreaterThanFilter,
  greaterThanOrEqual: createOneRosterV1p1GreaterThanOrEqualFilter,
  lessThan: createOneRosterV1p1LessThanFilter,
  lessThanOrEqual: createOneRosterV1p1LessThanOrEqualFilter,
  contains: createOneRosterV1p1ContainsFilter,
  combine: combineOneRosterV1p1Filters,
  parse: parseOneRosterV1p1FilterInput,
  parseExpression: parseOneRosterV1p1FilterExpression,
  serialize: serializeOneRosterV1p1Filter,
} = filter;

function isCombination(input: OneRosterV1p1Filter): input is OneRosterV1p1FilterCombination {
  return "left" in input;
}

function isClauseInput(input: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(input);
  return (
    keys.length === 3 &&
    keys.includes("field") &&
    keys.includes("operator") &&
    keys.includes("value")
  );
}

function isCombinationInput(input: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(input);
  return (
    keys.length === 3 && keys.includes("left") && keys.includes("join") && keys.includes("right")
  );
}
