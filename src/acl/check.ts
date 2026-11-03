/**
 * Pure ACL check / applyAdmin — no mutation of input tree.
 */
import { err, ok, type Result } from '../result.js';
import type { AccessControl } from './access-controls.js';
import { Acl } from './acl.js';
import { aclPayloadOf, payloadDigestOf, type SignedAclMessageV1, verifyAclMessageSignature } from './signed-message.js';
import type { Snapshot } from './snapshot.js';
import type { AclOp, AclTree } from './tree.js';
import type { AclRef } from './types.js';

export type CheckOpts = {
  now: number; // Unix ms UTC
};

export type CheckError =
  | { kind: 'expired' }
  | { kind: 'digest-mismatch' }
  | { kind: 'signature-invalid' }
  | { kind: 'acl-hash-mismatch'; expected: string; provided: string }
  | { kind: 'signer-not-in-snapshot' }
  | { kind: 'privilege-not-found'; system: string; op: AclOp }
  | { kind: 'invalid-admin-payload'; reason: string }
  | { kind: 'snapshot-error'; reason: string };

export type VerifyFn = (msg: SignedAclMessageV1) => boolean;

function verifyDigestAndSig(msg: SignedAclMessageV1, verify: VerifyFn): Result<void, CheckError> {
  if (payloadDigestOf(msg.payload) !== msg.payloadDigest) {
    return err({ kind: 'digest-mismatch' });
  }
  if (!verify(msg)) {
    return err({ kind: 'signature-invalid' });
  }
  return ok(undefined);
}

function checkExpiry(msg: SignedAclMessageV1, now: number): Result<void, CheckError> {
  if (now >= msg.expiresAt) return err({ kind: 'expired' });
  return ok(undefined);
}

function checkAgainstAccessControlInner(
  ac: AccessControl,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  const exp = checkExpiry(msg, opts.now);
  if (!exp.ok) return exp;
  const dig = verifyDigestAndSig(msg, verify);
  if (!dig.ok) return dig;
  if (msg.aclHash !== ac.version) {
    return err({
      kind: 'acl-hash-mismatch',
      expected: ac.version,
      provided: msg.aclHash,
    });
  }
  if (!ac.keys.includes(msg.signerPublicKey)) {
    return err({ kind: 'signer-not-in-snapshot' });
  }
  return ok(undefined);
}

/** Authorise msg against one AccessControl slot (digest, sig, key membership, version). */
export function isValid(ac: AccessControl, msg: SignedAclMessageV1, opts: CheckOpts): Result<void, CheckError> {
  return checkAgainstAccessControlInner(ac, msg, opts, verifyAclMessageSignature);
}

/**
 * Authorise an ACL rotation: isValid, with the payload rebuilt from the ACL being installed (aclPayloadOf),
 * never the payload the message carried — so a signature over one ACL cannot install another.
 */
export function isValidRotation(
  ac: AccessControl,
  msg: SignedAclMessageV1,
  next: unknown,
  opts: CheckOpts,
): Result<void, CheckError> {
  return isValid(ac, { ...msg, payload: aclPayloadOf(next) }, opts);
}

/** @deprecated Prefer isValid */
export function checkAgainstAccessControl(
  ac: AccessControl,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
): Result<void, CheckError> {
  return isValid(ac, msg, opts);
}

export function isValidWithVerify(
  ac: AccessControl,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  return checkAgainstAccessControlInner(ac, msg, opts, verify);
}

/** @deprecated Prefer isValidWithVerify */
export function checkAgainstAccessControlWithVerify(
  ac: AccessControl,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  return isValidWithVerify(ac, msg, opts, verify);
}

/**
 * Legacy: authorise against a flat Snapshot (key-set hash).
 * Prefer checkAgainstAccessControl (node SAID version).
 */
function checkAgainstSnapshotInner(
  snapshot: Snapshot,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  const exp = checkExpiry(msg, opts.now);
  if (!exp.ok) return exp;
  const dig = verifyDigestAndSig(msg, verify);
  if (!dig.ok) return dig;
  if (msg.aclHash !== snapshot.hash) {
    return err({
      kind: 'acl-hash-mismatch',
      expected: snapshot.hash,
      provided: msg.aclHash,
    });
  }
  if (!snapshot.keys.includes(msg.signerPublicKey)) {
    return err({ kind: 'signer-not-in-snapshot' });
  }
  return ok(undefined);
}

/** @deprecated Prefer checkAgainstAccessControl — Snapshot.hash is key-set hash, not node SAID. */
export function checkAgainstSnapshot(
  snapshot: Snapshot,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
): Result<void, CheckError> {
  return checkAgainstSnapshotInner(snapshot, msg, opts, verifyAclMessageSignature);
}

/** @deprecated Prefer checkAgainstAccessControlWithVerify. */
export function checkAgainstSnapshotWithVerify(
  snapshot: Snapshot,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  return checkAgainstSnapshotInner(snapshot, msg, opts, verify);
}

/** Authorise against tree privileges (aclHash = privilege node SAID). */
export function check(tree: AclTree, msg: SignedAclMessageV1, opts: CheckOpts): Result<void, CheckError> {
  return checkWithVerify(tree, msg, opts, verifyAclMessageSignature);
}

export function checkWithVerify(
  tree: AclTree,
  msg: SignedAclMessageV1,
  opts: CheckOpts,
  verify: VerifyFn,
): Result<void, CheckError> {
  // Partial trees (write+admin only) — project each op independently
  const nodeId = tree.privileges[msg.system]?.[msg.operation];
  if (!nodeId) {
    return err({ kind: 'privilege-not-found', system: msg.system, op: msg.operation });
  }
  const node = tree.nodes[nodeId];
  if (!node) return err({ kind: 'snapshot-error', reason: `node-not-found:${nodeId}` });
  const keys = Acl.resolve(tree, nodeId);
  if (!keys.ok) return err({ kind: 'snapshot-error', reason: keys.error.kind });
  const ac: AccessControl = {
    keys: [...keys.value],
    version: node.d,
  };
  return isValidWithVerify(ac, msg, opts, verify);
}

/** Admin patch applied after successful admin check. */
export type AclAdminPatch = {
  putNodes?: Array<{ nodeId: string; children: AclRef[] }>;
  privileges?: Array<{ system: string; op: AclOp; nodeId: string }>;
};

function parseAdminPatch(payload: Uint8Array): Result<AclAdminPatch, CheckError> {
  try {
    const text = new TextDecoder().decode(payload);
    const json = JSON.parse(text) as AclAdminPatch;
    if (json === null || typeof json !== 'object') {
      return err({ kind: 'invalid-admin-payload', reason: 'not an object' });
    }
    return ok(json);
  } catch (e) {
    return err({
      kind: 'invalid-admin-payload',
      reason: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Returns next tree; input unchanged. */
export function applyAdmin(tree: AclTree, msg: SignedAclMessageV1, opts: CheckOpts): Result<AclTree, CheckError> {
  if (msg.operation !== 'admin') {
    return err({ kind: 'invalid-admin-payload', reason: 'operation must be admin' });
  }
  const checked = check(tree, msg, opts);
  if (!checked.ok) return checked;

  const patch = parseAdminPatch(msg.payload);
  if (!patch.ok) return patch;

  let next = tree;
  for (const n of patch.value.putNodes ?? []) {
    next = Acl.putNode(next, Acl.node(n.nodeId, n.children));
  }
  for (const p of patch.value.privileges ?? []) {
    next = Acl.setPrivilege(next, p.system, p.op, p.nodeId);
  }
  return ok(next);
}
