export {
  oneRosterV1p2GeneratedBasePaths as oneRosterV1p2BasePaths,
  oneRosterV1p2GeneratedOperationIdsByProviderKind as oneRosterV1p2OperationIdsByProviderKind,
  oneRosterV1p2GeneratedOperationIdsByService as oneRosterV1p2OperationIdsByService,
  oneRosterV1p2GeneratedOperations as oneRosterV1p2Operations,
} from "./operation.generated.js";
export type {
  OneRosterV1p2GeneratedOperationId as OneRosterV1p2OperationId,
  OneRosterV1p2GeneratedProviderOperationId as OneRosterV1p2ProviderOperationId,
  OneRosterV1p2GeneratedPathParameters,
  OneRosterV1p2Operation,
  OneRosterV1p2OperationMethod,
  OneRosterV1p2QueryCategory,
  OneRosterV1p2ResponseKind,
  OneRosterV1p2ProviderOperationKind,
  OneRosterV1p2Service,
} from "./operation.generated.js";

import {
  oneRosterV1p2GeneratedOperations,
  type OneRosterV1p2Operation,
} from "./operation.generated.js";

/** Build an official 1EdTech scope URI. */
export function oneRosterV1p2Scope(name: string): string {
  return `https://purl.imsglobal.org/spec/or/v1p2/scope/${name}`;
}

/** Find an operation by its generated official operation ID. */
export function findOneRosterV1p2Operation(
  operationId: string,
): OneRosterV1p2Operation | undefined {
  return oneRosterV1p2GeneratedOperations.find(
    (candidate) => candidate.operationId === operationId,
  );
}
