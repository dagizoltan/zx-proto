/**
 * Functional Result Type Helper
 *
 * @template T, E
 * @typedef {{ ok: true, value: T }} Ok
 * @typedef {{ ok: false, error: E }} Err
 * @typedef {Ok<T> | Err<E>} Result
 */

export const Ok = (value) => ({ ok: true, value });
export const Err = (error) => ({ ok: false, error });

export const isOk = (result) => result.ok;
export const isErr = (result) => !result.ok;

/**
 * Unwraps a Result, throwing the error if present.
 * USE CAREFULLY - violates functional principles if used without catching.
 */
export const unwrap = (result) => {
  if (result.ok) return result.value;
  throw result.error;
};

/**
 * Maps a Result<T, E> to Result<U, E> by applying fn to value if Ok.
 */
export const map = (result, fn) => {
  if (result.ok) return Ok(fn(result.value));
  return result;
};

/**
 * Maps a Result<T, E> to Result<T, F> by applying fn to error if Err.
 */
export const mapErr = (result, fn) => {
  if (!result.ok) return Err(fn(result.error));
  return result;
};
