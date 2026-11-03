/**
 * Immutable ACL tree: named nodes + privilege roots.
 * Stored as an entity association. Updates return new trees.
 */
import type { AclNode } from './types.js';

export type AclOp = 'read' | 'write' | 'admin';

export type AclTree = {
  readonly nodes: Readonly<Record<string, AclNode>>;
  /** system → op → nodeId */
  readonly privileges: Readonly<Record<string, Partial<Record<AclOp, string>>>>;
};
