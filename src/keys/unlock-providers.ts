import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import type { Grant, UnlockProvider, UnlockProviderId, WithGrantOptions } from './types.js';

function bytesToHex(bytes: Uint8Array, length: number): string {
  return Array.from(bytes.slice(0, length))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Default stable id for passphrase unlock — not derived from the secret (kind:implementation). */
export const DEFAULT_PASSPHRASE_UNLOCK_PROVIDER_ID = 'passphrase:default' as UnlockProviderId;

/** Product UI passphrase UnlockProvider id (modal prompt / login-bound instance). */
export const UI_PASSPHRASE_UNLOCK_PROVIDER_ID = 'passphrase:ui' as UnlockProviderId;

/** Id for {@link UnlockProviders.unused} — must never encrypt real keys. */
export const UNUSED_UNLOCK_PROVIDER_ID = 'unused:must-set-explicit' as UnlockProviderId;

export namespace UnlockProviders {
  /**
   * Fixed passphrase — derives a 32-byte secret via HKDF-SHA256.
   * Id is a stable handle (default {@link DEFAULT_PASSPHRASE_UNLOCK_PROVIDER_ID});
   * wrong phrase still fails vault decrypt.
   * Note: pre-computes secret at construction — acceptable for deterministic test providers.
   * Real platform providers (passkey PRF, iOS Keychain) challenge the user inside withGrant.
   */
  export function passphrase(phrase: string, id: string = DEFAULT_PASSPHRASE_UNLOCK_PROVIDER_ID): UnlockProvider {
    const encoder = new TextEncoder();
    const secret = hkdf(sha256, encoder.encode(phrase), new Uint8Array(0), encoder.encode('vault-passphrase'), 32);
    const providerId = id as UnlockProviderId;
    return {
      id: providerId,
      withGrant<A>(
        optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
        maybeFn?: (grant: Grant) => Promise<A>,
      ): Promise<A> {
        const [options, fn] = typeof optionsOrFn === 'function' ? [{}, optionsOrFn] : [optionsOrFn, maybeFn!];
        return fn({ unlockProviderId: providerId, secret, salt: options.salt });
      },
    };
  }

  /**
   * Fixed secret — for testing. Caller supplies the raw secret bytes.
   * The id is 'fixed:<hex of first 4 bytes>'.
   */
  export function fixed(secret: Uint8Array): UnlockProvider {
    const id = `fixed:${bytesToHex(secret, 4)}` as UnlockProviderId;
    return {
      id,
      withGrant<A>(
        optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
        maybeFn?: (grant: Grant) => Promise<A>,
      ): Promise<A> {
        const [options, fn] = typeof optionsOrFn === 'function' ? [{}, optionsOrFn] : [optionsOrFn, maybeFn!];
        return fn({ unlockProviderId: id, secret, salt: options.salt });
      },
    };
  }

  /**
   * Sentinel default for wallets constructed without an explicit UnlockProvider.
   *
   * Browser / product wallets use this as vault `defaultProvider` so we never
   * silently encrypt under a shared passphrase. On profile open, register the
   * live UnlockProvider; product DSL opens grants via the controller key stamp
   * (sdk `Identity.withControllerGrant` → KeyManagement.withGrantForKey).
   *
   * Passkey cannot be the SDK default (platform-specific).
   */
  export function unused(
    message = 'BUG: vault defaultProvider is unused — register the profile UnlockProvider on open, then Identity.withControllerGrant',
  ): UnlockProvider {
    return {
      id: UNUSED_UNLOCK_PROVIDER_ID,
      withGrant<A>(
        _optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
        _maybeFn?: (grant: Grant) => Promise<A>,
      ): Promise<A> {
        return Promise.reject(new Error(message));
      },
    };
  }
}
