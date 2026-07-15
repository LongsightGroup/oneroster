import { ok, type Result } from "../../result.js";
import {
  createOneRosterRestFilterFacade,
  type OneRosterRestFilterOperator,
  type OneRosterRestFilterValue,
} from "../../rest/filter.js";

/** OneRoster REST filter operators. */
export type OneRosterV1p2FilterOperator = OneRosterRestFilterOperator;

/** Scalar values accepted by the typed filter serializer. */
export type OneRosterV1p2FilterValue = OneRosterRestFilterValue;

/** One filter clause in the OneRoster baseline grammar. */
export interface OneRosterV1p2FilterClause {
  readonly _tag: "OneRosterV1p2FilterClause";
  readonly field: string;
  readonly operator: OneRosterV1p2FilterOperator;
  readonly value: OneRosterV1p2FilterValue;
}

interface OneRosterV1p2FilterCombination {
  readonly _tag: "OneRosterV1p2FilterCombination";
  readonly left: OneRosterV1p2FilterClause;
  readonly join: "AND" | "OR";
  readonly right: OneRosterV1p2FilterClause;
}

/** A filter with one clause or exactly two clauses joined once. */
export type OneRosterV1p2Filter = OneRosterV1p2FilterClause | OneRosterV1p2FilterCombination;

/** A typed query/filter diagnostic. */
export interface OneRosterV1p2QueryDiagnostic {
  readonly _tag: "OneRosterV1p2PayloadDiagnostic";
  readonly path: string;
  readonly message: string;
  readonly code:
    | "query.invalid_field"
    | "query.invalid_operator"
    | "query.invalid_value"
    | "query.invalid_combination";
}

type FilterResult<TValue> = Result<TValue, ReadonlyArray<OneRosterV1p2QueryDiagnostic>>;

const filter = createOneRosterRestFilterFacade<
  OneRosterV1p2FilterClause,
  OneRosterV1p2FilterCombination,
  OneRosterV1p2QueryDiagnostic,
  FilterResult<OneRosterV1p2Filter>
>(
  {
    isClauseInput: (input) => input["_tag"] === "OneRosterV1p2FilterClause",
    isCombinationInput: (input) => input["_tag"] === "OneRosterV1p2FilterCombination",
    isCombination,
    createClause: (field, operator, value) => ({
      _tag: "OneRosterV1p2FilterClause",
      field,
      operator,
      value,
    }),
    createCombination: (left, join, right) => ({
      _tag: "OneRosterV1p2FilterCombination",
      left,
      join,
      right,
    }),
    createDiagnostic: (code, path, message) => ({
      _tag: "OneRosterV1p2PayloadDiagnostic",
      code: `query.${code}`,
      path,
      message,
    }),
  },
  (combination) => ok(combination),
);

/** Public v1.2 filter operations assembled by the shared grammar facade. */
export const {
  create: createOneRosterV1p2FilterClause,
  equals: createOneRosterV1p2EqualsFilter,
  notEquals: createOneRosterV1p2NotEqualsFilter,
  greaterThan: createOneRosterV1p2GreaterThanFilter,
  greaterThanOrEqual: createOneRosterV1p2GreaterThanOrEqualFilter,
  lessThan: createOneRosterV1p2LessThanFilter,
  lessThanOrEqual: createOneRosterV1p2LessThanOrEqualFilter,
  contains: createOneRosterV1p2ContainsFilter,
  combine: combineOneRosterV1p2Filters,
  parse: parseOneRosterV1p2FilterInput,
  parseExpression: parseOneRosterV1p2FilterExpression,
  serialize: serializeOneRosterV1p2Filter,
} = filter;

function isCombination(input: OneRosterV1p2Filter): input is OneRosterV1p2FilterCombination {
  return input._tag === "OneRosterV1p2FilterCombination";
}
