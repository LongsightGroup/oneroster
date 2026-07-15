import type {
  OneRosterRestRegistryDefinition,
  OneRosterRestRegistryDiagnostic,
} from "./client-factory.js";
import type { OneRosterRestOperation } from "./transport.js";

/** Minimal configuration-error seam used by registry installation guards. */
export interface OneRosterRestRegistryConfigurationErrors<TError> {
  readonly incompleteRegistryError: (operationId: string, message?: string) => TError;
}

/** Verify that generated HTTP/response metadata agrees with a client definition. */
export function operationMatchesOneRosterRestDefinition<
  TDiagnostic extends OneRosterRestRegistryDiagnostic,
>(
  operation: OneRosterRestOperation,
  definition: OneRosterRestRegistryDefinition<TDiagnostic>,
): boolean {
  switch (definition.kind) {
    case "collection":
      return operation.method === "GET" && operation.responseKind === "collection";
    case "singleton":
      return operation.method === "GET" && operation.responseKind === "singleton";
    case "delete":
      return operation.method === "DELETE" && operation.responseKind === "noContent";
    case "put":
      return (
        operation.method === "PUT" &&
        (operation.responseKind === "noContent" || operation.responseKind === "write")
      );
    case "post":
      return operation.method === "POST" && operation.responseKind === "write";
  }
  return false;
}

/** Reject read calls that cannot contain every path parameter and at most one options value. */
export function validateOneRosterRestOptionalOptionsArity<TError>(
  operation: OneRosterRestOperation,
  args: ReadonlyArray<unknown>,
  errors: OneRosterRestRegistryConfigurationErrors<TError>,
): TError | undefined {
  const pathCount = operation.pathParameters.length;
  if (args.length === pathCount || args.length === pathCount + 1) return undefined;
  return invalidArity(operation, args.length, "zero or one options argument", errors);
}

/** Reject calls that cannot contain every path parameter and their method-specific values. */
export function validateOneRosterRestMethodArity<TError>(
  operation: OneRosterRestOperation,
  args: ReadonlyArray<unknown>,
  trailingArgumentCount: 1 | 2,
  errors: OneRosterRestRegistryConfigurationErrors<TError>,
): TError | undefined {
  const expected = operation.pathParameters.length + trailingArgumentCount;
  if (args.length === expected || args.length === expected - 1) return undefined;
  const trailing =
    trailingArgumentCount === 1 ? "one options argument" : "one value and one options argument";
  return invalidArity(operation, args.length, trailing, errors);
}

function invalidArity<TError>(
  operation: OneRosterRestOperation,
  actual: number,
  expected: string,
  errors: OneRosterRestRegistryConfigurationErrors<TError>,
): TError {
  return errors.incompleteRegistryError(
    operation.operationId,
    `Operation ${operation.operationId} received ${actual} arguments; expected ${operation.pathParameters.length} path arguments plus ${expected}.`,
  );
}
