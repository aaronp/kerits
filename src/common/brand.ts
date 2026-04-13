/**
 * Type Branding Utilities
 *
 * Provides branded/opaque types to prevent mixing different string encodings
 * (CESR/QB64, raw bytes, hex, base64url) at compile time.
 *
 * Example:
 * ```ts
 * type Ed25519PublicQb64 = Brand<'Ed25519PublicQb64'>;
 * type Ed25519PrivateQb64 = Brand<'Ed25519PrivateQb64'>;
 *
 * // These are incompatible at compile time:
 * const pub: Ed25519PublicQb64 = "DwhateverQb64..." as Ed25519PublicQb64;
 * const priv: Ed25519PrivateQb64 = pub; // ❌ Type error!
 * ```
 */

/**
 * Brand a base type T with a unique flavor
 *
 * @template Flavor - A unique string literal to distinguish this branded type
 * @template T - The base type to brand (defaults to string)
 *
 * Creates a nominally-typed wrapper that prevents accidental mixing of
 * similar-but-different values (e.g., public vs private keys, CESR vs raw bytes).
 *
 * The branded type is structurally compatible with its base type T at runtime,
 * but TypeScript treats it as incompatible with other brands or the raw type.
 */
export type Brand<Flavor extends string, T = string> = T & {
  readonly __brand: Flavor;
};

/**
 * Type guard helper for runtime validation with branding
 *
 * Use this to create validator functions that both check values at runtime
 * and cast them to a branded type.
 *
 * Example:
 * ```ts
 * function asEd25519PublicQb64(input: string): Ed25519PublicQb64 {
 *   if (!input.startsWith('D') || input.length !== 44) {
 *     throw new Error('Invalid Ed25519 public key QB64');
 *   }
 *   return input as Ed25519PublicQb64;
 * }
 * ```
 */
export type BrandValidator<T extends Brand<string, any>> = (input: string) => T;
