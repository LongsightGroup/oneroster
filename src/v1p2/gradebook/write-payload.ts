import { err, ok, type Result } from "../../result.js";
import type {
  OneRosterV1p2PayloadDiagnostic,
  OneRosterV1p2PayloadParser,
} from "../model/json-value.js";
import {
  parseOneRosterV1p2Category,
  parseOneRosterV1p2LineItem,
  parseOneRosterV1p2Result,
  parseOneRosterV1p2ScoreScale,
  type OneRosterV1p2Category,
  type OneRosterV1p2LineItem,
  type OneRosterV1p2Result,
  type OneRosterV1p2ScoreScale,
} from "../model/gradebook.js";
import type {
  OneRosterV1p2CollectionPayload,
  OneRosterV1p2SingletonPayload,
} from "../rest/payload.js";

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Build a validated category singleton write envelope without mutating the input. */
export function createOneRosterV1p2CategoryWritePayload(
  input: unknown,
): Result<OneRosterV1p2SingletonPayload<OneRosterV1p2Category, "category">, Diagnostics> {
  return singletonPayload("category", input, parseOneRosterV1p2Category);
}

/** Build a validated line-item singleton write envelope without mutating the input. */
export function createOneRosterV1p2LineItemWritePayload(
  input: unknown,
): Result<OneRosterV1p2SingletonPayload<OneRosterV1p2LineItem, "lineItem">, Diagnostics> {
  return singletonPayload("lineItem", input, parseOneRosterV1p2LineItem);
}

/** Build a validated result singleton write envelope without mutating the input. */
export function createOneRosterV1p2ResultWritePayload(
  input: unknown,
): Result<OneRosterV1p2SingletonPayload<OneRosterV1p2Result, "result">, Diagnostics> {
  return singletonPayload("result", input, parseOneRosterV1p2Result);
}

/** Build a validated score-scale singleton write envelope without mutating the input. */
export function createOneRosterV1p2ScoreScaleWritePayload(
  input: unknown,
): Result<OneRosterV1p2SingletonPayload<OneRosterV1p2ScoreScale, "scoreScale">, Diagnostics> {
  return singletonPayload("scoreScale", input, parseOneRosterV1p2ScoreScale);
}

/** Build a non-empty validated line-item collection write envelope. */
export function createOneRosterV1p2LineItemCollectionWritePayload(
  input: unknown,
): Result<OneRosterV1p2CollectionPayload<OneRosterV1p2LineItem, "lineItems">, Diagnostics> {
  return collectionPayload("lineItems", input, parseOneRosterV1p2LineItem);
}

/** Build a non-empty validated result collection write envelope. */
export function createOneRosterV1p2ResultCollectionWritePayload(
  input: unknown,
): Result<OneRosterV1p2CollectionPayload<OneRosterV1p2Result, "results">, Diagnostics> {
  return collectionPayload("results", input, parseOneRosterV1p2Result);
}

function singletonPayload<TEntity, TProperty extends string>(
  property: TProperty,
  input: unknown,
  parser: (input: unknown) => Result<TEntity, Diagnostics>,
): Result<OneRosterV1p2SingletonPayload<TEntity, TProperty>, Diagnostics> {
  const parsed = parser(input);
  if (parsed._tag === "err") return parsed;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the envelope key is the validated literal supplied to this builder.
  return ok({ [property]: parsed.value } as unknown as OneRosterV1p2SingletonPayload<
    TEntity,
    TProperty
  >);
}

function collectionPayload<TEntity, TProperty extends string>(
  property: TProperty,
  input: unknown,
  parser: OneRosterV1p2PayloadParser<TEntity>,
): Result<OneRosterV1p2CollectionPayload<TEntity, TProperty>, Diagnostics> {
  if (!Array.isArray(input))
    return err([invalidType("$", "Expected a non-empty collection array.")]);
  if (input.length === 0)
    return err([invalidValue("$", "A Gradebook write collection cannot be empty.")]);
  const values: Array<TEntity> = [];
  for (const [index, value] of input.entries()) {
    const parsed = parser(value, `$[${index}]`);
    if (parsed._tag === "err") return parsed;
    values.push(parsed.value);
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: the envelope key and every item were validated by the builder.
  return ok({ [property]: values } as unknown as OneRosterV1p2CollectionPayload<
    TEntity,
    TProperty
  >);
}

function invalidType(path: string, message: string): OneRosterV1p2PayloadDiagnostic {
  return {
    _tag: "OneRosterV1p2PayloadDiagnostic",
    code: "payload.invalid_type",
    path,
    message,
  };
}

function invalidValue(path: string, message: string): OneRosterV1p2PayloadDiagnostic {
  return {
    _tag: "OneRosterV1p2PayloadDiagnostic",
    code: "payload.invalid_value",
    path,
    message,
  };
}
