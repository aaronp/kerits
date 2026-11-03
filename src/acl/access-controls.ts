/**
 * Flat AccessControls projection for remotes — one key set + node SAID per op.
 * AclTree remains SoT; remotes never store the graph.
 *
 * Field roles (do not conflate):
 * - `AccessControl.version` — privilege **node SAID** (`node.d`). Wire `aclHash`
 *   must equal this. Stable across KEL key rotation with the same aid children.
 * - `AccessControls.tip` — SAID over per-slot **key digests**. Primary local≡remote
 *   check (`tipsMatch`). Changes when resolved keys change; `isValid` ignores tip.
 *
 * @see docs/superpowers/specs/2026-09-24-access-controls-tip-said-design.md
 */

import { decodeKey } from '../cesr/keys.js';
import { saidOf } from '../common/data.js';
import type { PublicKey, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { normalizeKeys } from './normalize.js';
import { type AidKeyLookup, resolve } from './resolve.js';
import type { AclOp, AclTree } from './tree.js';

export type AccessControl = {
  readonly keys: readonly PublicKey[];
  /**
   * Privilege node SAID (`node.d`). Use as `SignedAclMessageV1.aclHash`.
   * Not a tree SAID; not a keys commitment — see `AccessControls.tip`.
   */
  readonly version: SAID;
};

export type AccessControls = {
  readonly read: AccessControl;
  readonly write: AccessControl;
  readonly admin: AccessControl;
  /**
   * Keys-commitment SAID for {read,write,admin} (via `accessControlsTip`).
   * Compare with `tipsMatch` for local≡remote; never use for `aclHash` / `isValid`.
   */
  readonly tip: SAID;
};

export type AccessControlsError =
  | { kind: 'privilege-not-found'; system: string; op: AclOp }
  | { kind: 'resolution-error'; reason: string }
  | { kind: 'invalid-key'; key: string; reason: string }
  | { kind: 'invalid-shape'; reason: string };

/** SAID of a single slot's normalized key set. */
export function slotKeysSaid(keys: readonly PublicKey[]): SAID {
  return saidOf({ keys: normalizeKeys(keys), d: '' }) as SAID;
}

/**
 * Tip SAID: commitment to resolved key sets (not privilege-node versions).
 * Formula: saidOf({ read: slotKeysSaid(...), write: …, admin: …, d: '' }).
 * Ignores any existing `tip` on input — always recomputes from keys.
 */
export function accessControlsTip(ac: Pick<AccessControls, 'read' | 'write' | 'admin'> | AccessControls): SAID {
  return saidOf({
    read: slotKeysSaid(ac.read.keys),
    write: slotKeysSaid(ac.write.keys),
    admin: slotKeysSaid(ac.admin.keys),
    d: '',
  }) as SAID;
}

function withTip(ac: Pick<AccessControls, 'read' | 'write' | 'admin'>): AccessControls {
  return { ...ac, tip: accessControlsTip(ac) };
}

function slotOf(
  tree: AclTree,
  system: string,
  op: AclOp,
  expandAid: AidKeyLookup,
): Result<AccessControl, AccessControlsError> {
  const nodeId = tree.privileges[system]?.[op];
  if (!nodeId) return err({ kind: 'privilege-not-found', system, op });
  const node = tree.nodes[nodeId];
  if (!node) return err({ kind: 'resolution-error', reason: `node-not-found:${nodeId}` });
  const keys = resolve(node, (id) => tree.nodes[id], expandAid);
  if (!keys.ok) return err({ kind: 'resolution-error', reason: keys.error.kind });
  return ok({
    keys: normalizeKeys([...keys.value]) as PublicKey[],
    version: node.d,
  });
}

/** Project read/write/admin AccessControls for one privilege system. */
export function projectAccessControls(
  tree: AclTree,
  system: string,
  expandAid: AidKeyLookup = () => [],
): Result<AccessControls, AccessControlsError> {
  const read = slotOf(tree, system, 'read', expandAid);
  if (!read.ok) return read;
  const write = slotOf(tree, system, 'write', expandAid);
  if (!write.ok) return write;
  const admin = slotOf(tree, system, 'admin', expandAid);
  if (!admin.ok) return admin;
  return ok(withTip({ read: read.value, write: write.value, admin: admin.value }));
}

function validateKeys(keys: readonly string[]): Result<PublicKey[], AccessControlsError> {
  const out: PublicKey[] = [];
  for (const key of keys) {
    try {
      const decoded = decodeKey(key);
      if (decoded.algo !== 'ed25519') {
        return err({ kind: 'invalid-key', key, reason: `unsupported algo ${decoded.algo}` });
      }
      out.push(key as PublicKey);
    } catch (e) {
      return err({
        kind: 'invalid-key',
        key,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return ok(normalizeKeys(out) as PublicKey[]);
}

function importSlot(raw: { keys?: unknown; version?: unknown }): Result<AccessControl, AccessControlsError> {
  if (!raw || typeof raw !== 'object') {
    return err({ kind: 'invalid-shape', reason: 'slot not an object' });
  }
  if (typeof raw.version !== 'string' || raw.version.length === 0) {
    return err({ kind: 'invalid-shape', reason: 'version required' });
  }
  if (!Array.isArray(raw.keys)) {
    return err({ kind: 'invalid-shape', reason: 'keys must be an array' });
  }
  const keys = validateKeys(raw.keys.map(String));
  if (!keys.ok) return keys;
  return ok({ keys: keys.value, version: raw.version as SAID });
}

/** Re-import remote AccessControls: validate keys; recompute tip (ignore caller tip). */
export function importAccessControls(raw: {
  read?: unknown;
  write?: unknown;
  admin?: unknown;
  tip?: unknown;
}): Result<AccessControls, AccessControlsError> {
  const read = importSlot((raw.read ?? {}) as { keys?: unknown; version?: unknown });
  if (!read.ok) return read;
  const write = importSlot((raw.write ?? {}) as { keys?: unknown; version?: unknown });
  if (!write.ok) return write;
  const admin = importSlot((raw.admin ?? {}) as { keys?: unknown; version?: unknown });
  if (!admin.ok) return admin;
  return ok(withTip({ read: read.value, write: write.value, admin: admin.value }));
}

/** Pick the slot matching op from a full AccessControls. */
export function accessControlForOp(acs: AccessControls, op: AclOp): AccessControl {
  if (op === 'read') return acs.read;
  if (op === 'write') return acs.write;
  if (op === 'admin') return acs.admin;
  throw new Error(`Unsupported AclOp: ${op}`);
}
