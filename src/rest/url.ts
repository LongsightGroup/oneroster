import { err, ok, type Result } from "../result.js";

/** Substitute and encode required operation path parameters. */
export function substituteOneRosterRestPathParameters<TError>(
  operation: {
    readonly operationId: string;
    readonly path: string;
    readonly pathParameters: ReadonlyArray<string>;
  },
  pathParameters: Readonly<Record<string, string>> | undefined,
  createError: (
    operationId: string,
    code: "missing_path_parameter" | "invalid_path_parameter",
    parameter: string,
  ) => TError,
): Result<string, TError> {
  let path = operation.path;
  for (const parameter of operation.pathParameters) {
    const value = pathParameters?.[parameter];
    if (value === undefined) {
      return err(createError(operation.operationId, "missing_path_parameter", parameter));
    }
    if (value.length === 0) {
      return err(createError(operation.operationId, "invalid_path_parameter", parameter));
    }
    path = path.replace(`{${parameter}}`, encodeURIComponent(value));
  }
  return ok(path);
}
