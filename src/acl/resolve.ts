/**
 * Recursive ACL node resolution: expand nested nodes to constituent public keys.
 * Pure — all state via callbacks. AID leaves come from lookupAidKeys (KEL/KSN).
 */
import type { AID, PublicKey } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import type { AclNode, ResolutionError, ResolutionLimits } from './types.js';
import { DEFAULT_RESOLUTION_LIMITS } from './types.js';

export type NodeLookup = (nodeId: string) => AclNode | undefined;

/** Current public keys for an AID (from KSN). */
export type AidKeyLookup = (aid: AID) => readonly PublicKey[];

export function resolve(
  node: AclNode,
  lookupNode: NodeLookup,
  lookupAidKeys: AidKeyLookup,
  limits?: ResolutionLimits,
  /** @internal */ _visited?: Set<string>,
  /** @internal */ _depth?: number,
  /** @internal */ _nodeCount?: { value: number },
): Result<Set<PublicKey>, ResolutionError> {
  const lim = limits ?? DEFAULT_RESOLUTION_LIMITS;
  const depth = _depth ?? 0;
  const visited = _visited ?? new Set<string>();
  const nodeCount = _nodeCount ?? { value: 0 };

  if (depth > lim.maxDepth) {
    return err({ kind: 'node-too-deep', depth });
  }

  if (node.children.length > lim.maxChildrenPerNode) {
    return err({ kind: 'node-too-large', nodeId: node.nodeId, count: node.children.length });
  }

  visited.add(node.nodeId);
  const keys = new Set<PublicKey>();

  for (const child of node.children) {
    switch (child.kind) {
      case 'key':
        keys.add(child.publicKey);
        break;

      case 'aid': {
        for (const k of lookupAidKeys(child.aid)) keys.add(k);
        break;
      }

      case 'node': {
        if (visited.has(child.nodeId)) {
          return err({ kind: 'cycle-detected', path: [...visited, child.nodeId] });
        }
        nodeCount.value++;
        if (nodeCount.value > lim.maxTransitiveNodes) {
          return err({
            kind: 'resolution-limit-exceeded',
            reason: `transitive node count exceeded limit of ${lim.maxTransitiveNodes}`,
          });
        }
        const nested = lookupNode(child.nodeId);
        if (!nested) {
          return err({ kind: 'node-not-found', nodeId: child.nodeId });
        }
        const result = resolve(nested, lookupNode, lookupAidKeys, lim, new Set(visited), depth + 1, nodeCount);
        if (!result.ok) return result;
        for (const k of result.value) keys.add(k);
        break;
      }

      default: {
        const _exhaustive: never = child;
        return err({
          kind: 'resolution-limit-exceeded',
          reason: `unsupported acl ref: ${JSON.stringify(_exhaustive)}`,
        });
      }
    }
  }

  if (keys.size > lim.maxExpandedKeys) {
    return err({
      kind: 'resolution-limit-exceeded',
      reason: `expanded key count ${keys.size} exceeded limit of ${lim.maxExpandedKeys}`,
    });
  }

  return ok(keys);
}
