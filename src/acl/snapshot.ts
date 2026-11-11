/**
 * Immutable Snapshot: flat key set + purpose + recomputed hash.
 * Hash commits to the resolved key set, not the ACL graph.
 */

import { decodeKey } from '../cesr/keys.js';
import { saidOf } from '../common/data.js';
import type { PublicKey, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { normalizeKeys } from './normalize.js';

/**
 * KeyUse: which kind of key an ACL snapshot lists — `sign` (writers' signing keys) or `enc` (readers'
 * encryption keys). Part of the snapshot's hash (the `purpose` field keeps its name for that reason).
 *
 * Not to be confused with `SignPurpose` (why a sign request is being made) or the sdk's `KeyLabel`
 * (a stored label on a key-store row).
 */
export type KeyUse = 'sign' | 'enc';

export type Snapshot = {
  readonly purpose: KeyUse;
  readonly keys: readonly PublicKey[];
  readonly hash: SAID;
};

export type SnapshotError =
  | { kind: 'invalid-purpose'; purpose: string }
  | { kind: 'invalid-key'; key: string; reason: string }
  | { kind: 'snapshot-hash-mismatch'; expected: SAID; provided: SAID };

function isKeyUse(p: string): p is KeyUse {
  return p === 'sign' || p === 'enc';
}

function validateKeys(purpose: KeyUse, keys: Iterable<PublicKey>): Result<PublicKey[], SnapshotError> {
  const out: PublicKey[] = [];
  for (const key of keys) {
    try {
      const decoded = decodeKey(key);
      // v1: both sign and enc snapshots use CESR Ed25519 verify keys on the wire;
      // enc recipients convert Ed→X25519 at JWE time. Reject non-ed25519.
      if (decoded.algo !== 'ed25519') {
        return err({ kind: 'invalid-key', key, reason: `unsupported algo ${decoded.algo} for ${purpose}` });
      }
      out.push(key);
    } catch (e) {
      return err({
        kind: 'invalid-key',
        key,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return ok(normalizeKeys(out));
}

function computeHash(purpose: KeyUse, keys: readonly PublicKey[]): SAID {
  return saidOf({ purpose, keys, d: '' }) as SAID;
}

function freezeSnapshot(purpose: KeyUse, keys: readonly PublicKey[], hash: SAID): Snapshot {
  return Object.freeze({
    purpose,
    keys: Object.freeze([...keys]) as readonly PublicKey[],
    hash,
  });
}

/** Build a snapshot from purpose + keys (always recomputes hash). */
export function snapshotOf(purpose: KeyUse, keys: Iterable<PublicKey>): Snapshot {
  if (!isKeyUse(purpose)) {
    throw new Error(`invalid snapshot purpose: ${purpose}`);
  }
  const validated = validateKeys(purpose, keys);
  if (!validated.ok) {
    throw new Error(`invalid snapshot key: ${validated.error.kind} ${JSON.stringify(validated.error)}`);
  }
  const hash = computeHash(purpose, validated.value);
  return freezeSnapshot(purpose, validated.value, hash);
}

/** Import a raw snapshot: recompute hash; reject substitution / bad keys. */
export function importSnapshot(raw: {
  purpose: string;
  keys: readonly string[];
  hash?: string;
}): Result<Snapshot, SnapshotError> {
  if (!isKeyUse(raw.purpose)) {
    return err({ kind: 'invalid-purpose', purpose: raw.purpose });
  }
  const validated = validateKeys(raw.purpose, raw.keys as PublicKey[]);
  if (!validated.ok) return validated;
  const hash = computeHash(raw.purpose, validated.value);
  if (raw.hash !== undefined && raw.hash !== hash) {
    return err({
      kind: 'snapshot-hash-mismatch',
      expected: hash,
      provided: raw.hash as SAID,
    });
  }
  return ok(freezeSnapshot(raw.purpose, validated.value, hash));
}
