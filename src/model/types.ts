/**
 * Core KERI Type Definitions
 *
 * Common types used across the model layer.
 * Single source of truth for SAID, AID, and ALIAS types.
 */

/**
 * SAID - Self-Addressing IDentifier
 *
 * A SAID is a cryptographic digest of the data it identifies.
 * The digest is embedded in the data itself, making it self-referential.
 *
 * Represented as a branded string type to prevent mixing with regular strings.
 */
export type SAID = string & { readonly __brand: 'SAID' };

/**
 * AID - Autonomic IDentifier
 *
 * A KERI identifier that controls its own key state.
 * Represented as a branded string type to prevent mixing with regular strings.
 */
export type AID = string & { readonly __brand: 'AID' };

/**
 * A user-friendly alias to key identifiers against
 */
export type ALIAS = string & { readonly __brand: 'ALIAS' };

/**
 * Threshold - Key or witness threshold
 *
 * Can be a whole number or fractional threshold.
 * Represented as a string to preserve precision and allow fractional values.
 */
export type Threshold = string & { readonly __brand: 'Threshold' };

export type Effect<T> =
    | { kind: 'notify', topic: string, payload: T }
    | { kind: 'anchor', said: SAID }
    | { kind: 'persist', key: string, value: unknown };

export type Result<T> = Readonly<{
    ok: true; data: T; effects?: ReadonlyArray<Effect<any>>;
}> | Readonly<{
    ok: false; error: string; details?: unknown;
}>;

export const ok = <T>(data: T, effects: Effect<any>[] = []): Result<T> => ({ ok: true, data, effects });
export const err = (error: string, details?: unknown): Result<never> => ({ ok: false, error, details });
