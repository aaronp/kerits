/**
 * Pure ACL graph: named nodes whose children expand to public keys.
 * AID leaves resolve via AidKeyLookup (KEL/KSN) — keys are not stored under AID nodes.
 */
import type { AID, PublicKey, SAID } from '../common/types.js';

export type { PublicKey };

/** Graph edge target: nested node, AID expander, or key leaf. */
export type AclRef =
  | { kind: 'aid'; aid: AID }
  | { kind: 'key'; publicKey: PublicKey }
  | { kind: 'node'; nodeId: string };

/** Privilege / mutator target. */
export type AclTarget = { kind: 'node'; nodeId: string } | { kind: 'any-authenticated' };

/**
 * Named ACL node. `mutators` is not used by resolve — only for SAID / edit policy.
 */
export type AclNode = {
  nodeId: string;
  children: AclRef[];
  d: SAID;
  mutators?: AclTarget;
};

export type ResolvedNode = {
  nodeSAID: SAID;
  keys: Set<PublicKey>;
  d: SAID;
};

export type ResolutionLimits = {
  maxDepth: number;
  maxChildrenPerNode: number;
  maxExpandedKeys: number;
  maxTransitiveNodes: number;
};

export const DEFAULT_RESOLUTION_LIMITS: ResolutionLimits = {
  maxDepth: 8,
  maxChildrenPerNode: 256,
  maxExpandedKeys: 1024,
  maxTransitiveNodes: 64,
};

/** Bounds distinct nodes re-resolved in a single cascade pass. */
export const MAX_CASCADE_NODES = 32;

export type ResolutionError =
  | { kind: 'cycle-detected'; path: string[] }
  | { kind: 'node-too-deep'; depth: number }
  | { kind: 'node-too-large'; nodeId: string; count: number }
  | { kind: 'node-not-found'; nodeId: string }
  | { kind: 'resolution-limit-exceeded'; reason: string };

/** @deprecated Use MAX_CASCADE_NODES */
export const MAX_CASCADE_GROUPS = MAX_CASCADE_NODES;
