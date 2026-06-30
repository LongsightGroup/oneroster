/** Result of an operation that models expected failures in the return type. */
export type Result<TValue, TError> =
  | { readonly _tag: "ok"; readonly value: TValue }
  | { readonly _tag: "err"; readonly error: TError };

/** Create a successful result. */
export function ok<TValue>(value: TValue): Result<TValue, never> {
  return { _tag: "ok", value };
}

/** Create a failed result. */
export function err<TError>(error: TError): Result<never, TError> {
  return { _tag: "err", error };
}
