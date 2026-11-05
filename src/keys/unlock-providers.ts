import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import type { Grant, UnlockProvider, WithGrantOptions } from './types.js';
import { UnlockRefs } from './unlock-ref.js';

/** Provider handing out a fixed secret, stamped with the passphrase ref derived from it. */
function fixedSecretProvider(secret: Uint8Array): UnlockProvider {
  const ref = UnlockRefs.passphrase(UnlockRefs.passphraseIdFor(secret));
  return {
    ref,
    withGrant<A>(
      optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
      maybeFn?: (grant: Grant) => Promise<A>,
    ): Promise<A> {
      const [options, fn] = typeof optionsOrFn === 'function' ? [{}, optionsOrFn] : [optionsOrFn, maybeFn!];
      return fn({ ref, secret, salt: options.salt });
    },
  };
}

export namespace UnlockProviders {
  /**
   * Fixed passphrase — derives a 32-byte secret via HKDF-SHA256. Ref = passphrase ref derived from that secret,
   * so the same phrase always yields an equal ref and different phrases differ.
   * Note: pre-computes secret at construction — acceptable for deterministic test providers.
   * Real platform providers (passkey PRF, iOS Keychain) challenge the user inside withGrant.
   */
  export function passphrase(phrase: string): UnlockProvider {
    const encoder = new TextEncoder();
    return fixedSecretProvider(
      hkdf(sha256, encoder.encode(phrase), new Uint8Array(0), encoder.encode('vault-passphrase'), 32),
    );
  }

  /** Fixed secret — for testing. Caller supplies the raw secret bytes; ref is a passphrase ref derived from them. */
  export function fixed(secret: Uint8Array): UnlockProvider {
    return fixedSecretProvider(secret);
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
    message = 'No unlock secret configured for this vault — open grants via Identity.withControllerGrant',
  ): UnlockProvider {
    return {
      ref: UnlockRefs.unused(),
      withGrant<A>(
        _optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
        _maybeFn?: (grant: Grant) => Promise<A>,
      ): Promise<A> {
        return Promise.reject(new Error(message));
      },
    };
  }
}
