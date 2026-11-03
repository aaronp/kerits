/**
 * Acl namespace — pure operators over immutable AclTree.
 * Prefer Acl.fromTree(tree) for a discoverable Ops surface.
 */
import { err, ok, type Result } from '../result.js';
import { type AccessControls, type AccessControlsError, projectAccessControls } from './access-controls.js';
import { makeAclNode } from './make-node.js';
import { type AidKeyLookup, resolve as resolveNode } from './resolve.js';
import { type KeyPurpose, type Snapshot, snapshotOf } from './snapshot.js';
import type { AclOp, AclTree } from './tree.js';
import type { AclNode, AclRef, PublicKey, ResolutionError } from './types.js';

function empty(): AclTree {
  return { nodes: {}, privileges: {} };
}

function node(id: string, children: AclRef[]): AclNode {
  return makeAclNode(id, children);
}

function putNode(tree: AclTree, n: AclNode): AclTree {
  return {
    nodes: { ...tree.nodes, [n.nodeId]: n },
    privileges: tree.privileges,
  };
}

function setChildren(tree: AclTree, nodeId: string, children: AclRef[]): AclTree {
  return putNode(tree, makeAclNode(nodeId, children));
}

function setPrivilege(tree: AclTree, system: string, op: AclOp, nodeId: string): AclTree {
  const prev = tree.privileges[system] ?? {};
  return {
    nodes: tree.nodes,
    privileges: {
      ...tree.privileges,
      [system]: { ...prev, [op]: nodeId },
    },
  };
}

function resolve(
  tree: AclTree,
  nodeId: string,
  expandAid: AidKeyLookup = () => [],
): Result<Set<PublicKey>, ResolutionError> {
  const root = tree.nodes[nodeId];
  if (!root) {
    return err({ kind: 'node-not-found', nodeId });
  }
  return resolveNode(root, (id) => tree.nodes[id], expandAid);
}

function snapshot(
  tree: AclTree,
  system: string,
  op: AclOp,
  purpose: KeyPurpose,
  expandAid?: AidKeyLookup,
): Result<Snapshot, ResolutionError | { kind: 'privilege-not-found'; system: string; op: AclOp }> {
  const nodeId = tree.privileges[system]?.[op];
  if (!nodeId) {
    return err({ kind: 'privilege-not-found', system, op });
  }
  const keys = resolve(tree, nodeId, expandAid);
  if (!keys.ok) return keys;
  try {
    return ok(snapshotOf(purpose, keys.value));
  } catch (e) {
    return err({
      kind: 'resolution-limit-exceeded',
      reason: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Tree-bound ops — discoverable via Acl.fromTree(tree). Mutators return the next AclTree. */
export class AclOps {
  constructor(readonly tree: AclTree) {}

  putNode(n: AclNode): AclTree {
    return putNode(this.tree, n);
  }

  setChildren(nodeId: string, children: AclRef[]): AclTree {
    return setChildren(this.tree, nodeId, children);
  }

  setPrivilege(system: string, op: AclOp, nodeId: string): AclTree {
    return setPrivilege(this.tree, system, op, nodeId);
  }

  resolve(nodeId: string, expandAid: AidKeyLookup = () => []): Result<Set<PublicKey>, ResolutionError> {
    return resolve(this.tree, nodeId, expandAid);
  }

  snapshot(
    system: string,
    op: AclOp,
    purpose: KeyPurpose,
    expandAid?: AidKeyLookup,
  ): Result<Snapshot, ResolutionError | { kind: 'privilege-not-found'; system: string; op: AclOp }> {
    return snapshot(this.tree, system, op, purpose, expandAid);
  }

  accessControls(system: string, expandAid: AidKeyLookup = () => []): Result<AccessControls, AccessControlsError> {
    return projectAccessControls(this.tree, system, expandAid);
  }
}

function fromTree(tree: AclTree): AclOps {
  return new AclOps(tree);
}

export const Acl = {
  empty,
  node,
  fromTree,
  /** @deprecated Prefer Acl.fromTree(tree).putNode(n) */
  putNode,
  /** @deprecated Prefer Acl.fromTree(tree).setChildren(...) */
  setChildren,
  /** @deprecated Prefer Acl.fromTree(tree).setPrivilege(...) */
  setPrivilege,
  /** @deprecated Prefer Acl.fromTree(tree).resolve(...) */
  resolve,
  /** @deprecated Prefer Acl.fromTree(tree).snapshot(...) */
  snapshot,
} as const;
