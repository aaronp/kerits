/**
 * Hierarchical KVS path → AccessControls: closest prefix up the path.
 * Paths are plain segment arrays (no StoragePath dependency).
 */

import type { PublicKey, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { type AccessControls, importAccessControls } from './access-controls.js';
import { type CheckError, type CheckOpts, isValid, isValidRotation } from './check.js';
import type { SignedAclMessageV1 } from './signed-message.js';

/** Join path segments with `/` for system ids and maps. */
export function joinPathSegments(segments: readonly string[]): string {
  return segments.join('/');
}

/** `kvs:{aid}/{prefix}` — wire `system` for an ACL rooted at prefix under aid. */
export function kvsAclSystemId(aid: string, prefixSegments: readonly string[]): string {
  const prefix = joinPathSegments(prefixSegments);
  return prefix.length === 0 ? `kvs:${aid}` : `kvs:${aid}/${prefix}`;
}

/**
 * Storage key segments for an ACL document under an AID root (after `{aid}/`).
 * Example: `['.acl', 'rkvs', 'entity-graph', 'access-controls']`
 */
export function aclDocumentPath(prefixSegments: readonly string[]): readonly string[] {
  return ['.acl', ...prefixSegments, 'access-controls'];
}

export type PathAclError =
  | { kind: 'no-covering-acl'; path: string }
  | { kind: 'acl-exists'; prefix: string }
  | { kind: 'acl-missing'; prefix: string }
  | { kind: 'bootstrap-key-rejected' }
  | { kind: 'system-mismatch'; expected: string; got: string }
  | CheckError;

/** All ancestor prefixes of path, longest first (including path itself, excluding empty). */
export function ancestorPrefixes(pathSegments: readonly string[]): readonly (readonly string[])[] {
  const out: string[][] = [];
  for (let len = pathSegments.length; len >= 1; len--) {
    out.push(pathSegments.slice(0, len));
  }
  return out;
}

/**
 * Closest registered ACL prefix at or above `pathSegments`.
 * `registered` keys are `joinPathSegments(prefix)`.
 */
export function resolveClosestAclPrefix(
  pathSegments: readonly string[],
  registered: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): readonly string[] | undefined {
  const has = (key: string) => (registered instanceof Set ? registered.has(key) : registered.has(key));
  for (const prefix of ancestorPrefixes(pathSegments)) {
    if (has(joinPathSegments(prefix))) return prefix;
  }
  // Root ACL (empty prefix) covers the whole AID namespace
  if (has('')) return [];
  return undefined;
}

/** Closest ACL strictly above `prefixSegments` (parent for install). */
export function resolveParentAclPrefix(
  prefixSegments: readonly string[],
  registered: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): readonly string[] | undefined {
  if (prefixSegments.length === 0) return undefined;
  return resolveClosestAclPrefix(prefixSegments.slice(0, -1), registered);
}

export type AclInstallMode = 'bootstrap' | 'parent-admin' | 'self-admin';

/** Decide how to authorize installing or updating ACL at `prefixSegments`. */
export function aclInstallMode(
  prefixSegments: readonly string[],
  registered: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): Result<{ mode: AclInstallMode; parentPrefix?: readonly string[] }, PathAclError> {
  const key = joinPathSegments(prefixSegments);
  const has = (k: string) => (registered instanceof Set ? registered.has(k) : registered.has(k));
  if (has(key)) {
    return ok({ mode: 'self-admin' });
  }
  const parent = resolveParentAclPrefix(prefixSegments, registered);
  if (!parent) {
    return ok({ mode: 'bootstrap' });
  }
  return ok({ mode: 'parent-admin', parentPrefix: parent });
}

export type AcceptWriteInput = {
  readonly aid: string;
  readonly pathSegments: readonly string[];
  readonly acls: ReadonlyMap<string, AccessControls>;
  readonly msg: SignedAclMessageV1;
  readonly opts: CheckOpts;
};

/** Authorize a data write/delete against closest covering ACL. */
export function acceptPathWrite(
  input: AcceptWriteInput,
): Result<{ prefix: readonly string[]; accessControls: AccessControls }, PathAclError> {
  const prefix = resolveClosestAclPrefix(input.pathSegments, input.acls);
  if (!prefix) {
    return err({ kind: 'no-covering-acl', path: joinPathSegments(input.pathSegments) });
  }
  const acs = input.acls.get(joinPathSegments(prefix));
  if (!acs) {
    return err({ kind: 'no-covering-acl', path: joinPathSegments(input.pathSegments) });
  }
  const expectedSystem = kvsAclSystemId(input.aid, prefix);
  if (input.msg.system !== expectedSystem) {
    return err({ kind: 'system-mismatch', expected: expectedSystem, got: input.msg.system });
  }
  if (input.msg.operation !== 'write') {
    return err({ kind: 'system-mismatch', expected: 'write', got: input.msg.operation });
  }
  const checked = isValid(acs.write, input.msg, input.opts);
  if (!checked.ok) return checked;
  return ok({ prefix, accessControls: acs });
}

export type AcceptAclPutInput = {
  readonly aid: string;
  readonly prefixSegments: readonly string[];
  readonly acls: ReadonlyMap<string, AccessControls>;
  readonly nextRaw: unknown;
  readonly msg: SignedAclMessageV1;
  readonly opts: CheckOpts;
  /** Published KSN current keys — required for bootstrap. */
  readonly bootstrapKeys: readonly PublicKey[];
};

/**
 * Authorize install/update of AccessControls at prefix.
 * Returns imported next ACS on success (caller persists + records messageId).
 */
export function acceptAclPut(
  input: AcceptAclPutInput,
): Result<{ next: AccessControls; mode: AclInstallMode }, PathAclError> {
  const imported = importAccessControls(input.nextRaw as { read?: unknown; write?: unknown; admin?: unknown });
  if (!imported.ok) {
    return err({ kind: 'acl-missing', prefix: `import:${imported.error.kind}` });
  }
  const modeR = aclInstallMode(input.prefixSegments, input.acls);
  if (!modeR.ok) return modeR;
  const { mode, parentPrefix } = modeR.value;
  const expectedSystem =
    mode === 'parent-admin' && parentPrefix
      ? kvsAclSystemId(input.aid, parentPrefix)
      : kvsAclSystemId(input.aid, input.prefixSegments);

  if (input.msg.operation !== 'admin') {
    return err({ kind: 'system-mismatch', expected: 'admin', got: input.msg.operation });
  }
  if (input.msg.system !== expectedSystem) {
    return err({ kind: 'system-mismatch', expected: expectedSystem, got: input.msg.system });
  }

  if (mode === 'bootstrap') {
    if (!input.bootstrapKeys.includes(input.msg.signerPublicKey)) {
      return err({ kind: 'bootstrap-key-rejected' });
    }
    // Bootstrap: verify signature + digest against a synthetic slot of KSN keys
    const synthetic: { keys: readonly PublicKey[]; version: SAID } = {
      keys: input.bootstrapKeys,
      version: input.msg.aclHash,
    };
    const checked = isValidRotation(synthetic, input.msg, input.nextRaw, input.opts);
    if (!checked.ok) return checked;
    return ok({ next: imported.value, mode });
  }

  if (mode === 'self-admin') {
    const existing = input.acls.get(joinPathSegments(input.prefixSegments));
    if (!existing) return err({ kind: 'acl-missing', prefix: joinPathSegments(input.prefixSegments) });
    const checked = isValidRotation(existing.admin, input.msg, input.nextRaw, input.opts);
    if (!checked.ok) return checked;
    return ok({ next: imported.value, mode });
  }

  // parent-admin
  const parent = parentPrefix!;
  const parentAcs = input.acls.get(joinPathSegments(parent));
  if (!parentAcs) return err({ kind: 'acl-missing', prefix: joinPathSegments(parent) });
  const checked = isValidRotation(parentAcs.admin, input.msg, input.nextRaw, input.opts);
  if (!checked.ok) return checked;
  return ok({ next: imported.value, mode });
}
