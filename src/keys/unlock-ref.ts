import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import type { Result } from '../result.js';
import { err, ok } from '../result.js';

/**
 * What unlocks a vault-encrypted key: the mechanism, plus the non-secret coordinates that pick out the exact secret.
 * Two keys with equal refs decrypt under the same secret; different secrets always have different refs.
 *
 * Vault keys only. A key held by an external KeyStore (HSM, ssh file used in place, remote device) has no UnlockRef:
 * that store owns its own unlock (see KeyRef in the design doc; external location not built yet).
 */
export type UnlockRef =
  | { readonly mechanism: 'passkey-prf'; readonly credentialId: string }
  | { readonly mechanism: 'passphrase'; readonly passphraseId: string }
  | { readonly mechanism: 'unused' };

export type UnlockMechanism = UnlockRef['mechanism'];

export type UnlockRefJson = {
  readonly mechanism: string;
  readonly credentialId?: string;
  readonly passphraseId?: string;
};

export type InvalidUnlockRef = { readonly kind: 'invalid-unlock-ref'; readonly raw: unknown };

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function unreachable(ref: never): never {
  throw new Error(`Unsupported unlock mechanism: ${JSON.stringify(ref)}`);
}

export namespace UnlockRefs {
  export function passkeyPrf(credentialId: string): UnlockRef {
    return { mechanism: 'passkey-prf', credentialId };
  }

  /** `passphraseId` = {@link passphraseIdFor}(secret): derived, so equal ids ⇔ same secret. */
  export function passphrase(passphraseId: string): UnlockRef {
    return { mechanism: 'passphrase', passphraseId };
  }

  export function unused(): UnlockRef {
    return { mechanism: 'unused' };
  }

  /** base64url(HKDF-SHA256(secret, info "kerits-passphrase-id", 16 bytes)). Deterministic; non-reversible. */
  export function passphraseIdFor(secret: Uint8Array): string {
    const info = new TextEncoder().encode('kerits-passphrase-id');
    return base64url(hkdf(sha256, secret, new Uint8Array(0), info, 16));
  }

  /** Exhaustive per mechanism. */
  export function equals(a: UnlockRef, b: UnlockRef): boolean {
    switch (a.mechanism) {
      case 'passkey-prf':
        return b.mechanism === 'passkey-prf' && a.credentialId === b.credentialId;
      case 'passphrase':
        return b.mechanism === 'passphrase' && a.passphraseId === b.passphraseId;
      case 'unused':
        return b.mechanism === 'unused';
      default:
        return unreachable(a);
    }
  }

  /** Storage marshalling only. */
  export function toJSON(ref: UnlockRef): UnlockRefJson {
    switch (ref.mechanism) {
      case 'passkey-prf':
        return { mechanism: ref.mechanism, credentialId: ref.credentialId };
      case 'passphrase':
        return { mechanism: ref.mechanism, passphraseId: ref.passphraseId };
      case 'unused':
        return { mechanism: ref.mechanism };
      default:
        return unreachable(ref);
    }
  }

  export function fromJSON(raw: unknown): Result<UnlockRef, InvalidUnlockRef> {
    const invalid = err({ kind: 'invalid-unlock-ref', raw } as const);
    if (typeof raw !== 'object' || raw === null) return invalid;
    const { mechanism, credentialId, passphraseId } = raw as Record<string, unknown>;
    const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
    if (mechanism === 'passkey-prf') return nonEmpty(credentialId) ? ok(passkeyPrf(credentialId)) : invalid;
    if (mechanism === 'passphrase') return nonEmpty(passphraseId) ? ok(passphrase(passphraseId)) : invalid;
    if (mechanism === 'unused') return ok(unused());
    return invalid;
  }

  /** Human/log form, e.g. `passkey-prf:<credentialId>`. Never parsed back. */
  export function describe(ref: UnlockRef): string {
    switch (ref.mechanism) {
      case 'passkey-prf':
        return `passkey-prf:${ref.credentialId}`;
      case 'passphrase':
        return `passphrase:${ref.passphraseId}`;
      case 'unused':
        return 'unused';
      default:
        return unreachable(ref);
    }
  }
}
