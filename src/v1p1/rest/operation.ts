export { oneRosterV1p1GeneratedOperations as oneRosterV1p1Operations } from "./operation.generated.js";
export type {
  OneRosterV1p1GeneratedPathParameters,
  OneRosterV1p1GradebookOperationId,
  OneRosterV1p1Operation,
  OneRosterV1p1OperationMethod,
  OneRosterV1p1QueryCategory,
  OneRosterV1p1ResourcesOperationId,
  OneRosterV1p1ResponseKind,
  OneRosterV1p1RosteringOperationId,
  OneRosterV1p1Service,
} from "./operation.generated.js";

import {
  oneRosterV1p1GeneratedOperations,
  type OneRosterV1p1Operation,
} from "./operation.generated.js";

/** The combined v1.1 service root required by the standard. */
export const oneRosterV1p1BasePath = "/ims/oneroster/v1p1" as const;

/** Build an official v1.1 OAuth scope URI. */
export function oneRosterV1p1Scope(name: string): string {
  return `https://purl.imsglobal.org/spec/or/v1p1/scope/${name}`;
}

/** Find one operation by its generated official service-call identifier. */
export function findOneRosterV1p1Operation(
  operationId: string,
): OneRosterV1p1Operation | undefined {
  return oneRosterV1p1GeneratedOperations.find((entry) => entry.operationId === operationId);
}

/** The Rostering operation identifiers, in specification order. */
export const oneRosterV1p1RosteringOperationIds: ReadonlyArray<string> = Object.freeze(
  oneRosterV1p1GeneratedOperations
    .filter((entry) => entry.service === "rostering")
    .map((entry) => entry.operationId),
);

/** The Gradebook operation identifiers, in specification order. */
export const oneRosterV1p1GradebookOperationIds: ReadonlyArray<string> = Object.freeze(
  oneRosterV1p1GeneratedOperations
    .filter((entry) => entry.service === "gradebook")
    .map((entry) => entry.operationId),
);
