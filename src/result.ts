/** Discriminated union for expected success/failure outcomes. */
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/** Construct a success result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Construct a failure result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
