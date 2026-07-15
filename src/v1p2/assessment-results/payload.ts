import { ok, type Result } from "../../result.js";
import type { OneRosterV1p2PayloadDiagnostic } from "../model/json-value.js";
import {
  parseOneRosterV1p2AssessmentLineItem,
  parseOneRosterV1p2AssessmentResult,
  type OneRosterV1p2AssessmentLineItem,
  type OneRosterV1p2AssessmentResult,
} from "./model.js";
import {
  parseOneRosterV1p2AssessmentLineItemCollection as parseGeneratedAssessmentLineItemCollection,
  parseOneRosterV1p2AssessmentLineItemSingleton as parseGeneratedAssessmentLineItemSingleton,
  parseOneRosterV1p2AssessmentResultCollection as parseGeneratedAssessmentResultCollection,
  parseOneRosterV1p2AssessmentResultSingleton as parseGeneratedAssessmentResultSingleton,
} from "../rest/payload.generated.js";
import type {
  OneRosterV1p2CollectionPayload,
  OneRosterV1p2SingletonPayload,
} from "../rest/payload-core.js";

/** A typed Assessment Results Profile collection envelope. */
export type OneRosterV1p2AssessmentResultsCollectionPayload<
  TEntity,
  TProperty extends string,
> = OneRosterV1p2CollectionPayload<TEntity, TProperty>;

/** A typed Assessment Results Profile singleton envelope. */
export type OneRosterV1p2AssessmentResultsSingletonPayload<
  TEntity,
  TProperty extends string,
> = OneRosterV1p2SingletonPayload<TEntity, TProperty>;

type Diagnostics = ReadonlyArray<OneRosterV1p2PayloadDiagnostic>;

/** Parse the `assessmentLineItems` collection envelope. */
export function parseOneRosterV1p2AssessmentLineItemCollection(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsCollectionPayload<
    OneRosterV1p2AssessmentLineItem,
    "assessmentLineItems"
  >,
  Diagnostics
> {
  return parseGeneratedAssessmentLineItemCollection(input);
}

/** Parse the `assessmentLineItem` singleton envelope. */
export function parseOneRosterV1p2AssessmentLineItemSingleton(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsSingletonPayload<
    OneRosterV1p2AssessmentLineItem,
    "assessmentLineItem"
  >,
  Diagnostics
> {
  return parseGeneratedAssessmentLineItemSingleton(input);
}

/** Parse the `assessmentResults` collection envelope. */
export function parseOneRosterV1p2AssessmentResultCollection(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsCollectionPayload<
    OneRosterV1p2AssessmentResult,
    "assessmentResults"
  >,
  Diagnostics
> {
  return parseGeneratedAssessmentResultCollection(input);
}

/** Parse the `assessmentResult` singleton envelope. */
export function parseOneRosterV1p2AssessmentResultSingleton(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsSingletonPayload<OneRosterV1p2AssessmentResult, "assessmentResult">,
  Diagnostics
> {
  return parseGeneratedAssessmentResultSingleton(input);
}

/** Validate and build a singleton assessment line-item write envelope. */
export function createOneRosterV1p2AssessmentLineItemWritePayload(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsSingletonPayload<
    OneRosterV1p2AssessmentLineItem,
    "assessmentLineItem"
  >,
  Diagnostics
> {
  const parsed = parseOneRosterV1p2AssessmentLineItem(input);
  if (parsed._tag === "err") return parsed;
  return ok({ assessmentLineItem: parsed.value });
}

/** Validate and build a singleton assessment result write envelope. */
export function createOneRosterV1p2AssessmentResultWritePayload(
  input: unknown,
): Result<
  OneRosterV1p2AssessmentResultsSingletonPayload<OneRosterV1p2AssessmentResult, "assessmentResult">,
  Diagnostics
> {
  const parsed = parseOneRosterV1p2AssessmentResult(input);
  if (parsed._tag === "err") return parsed;
  return ok({ assessmentResult: parsed.value });
}
