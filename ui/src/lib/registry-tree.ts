/**
 * Registry tree hierarchy utilities
 *
 * Builds registry tree structure by traversing KERI parent relationships
 */

import type { RegistryDSL } from '@kerits/app/dsl/types';

export interface RegistryNode {
  registryId: string;
  alias: string;
  issuerAid: string;
  parentRegistryId?: string;
  depth: number;
  children: RegistryNode[];
}

/**
 * Build registry tree hierarchy from DSL
 * Calculates depth by traversing parent chain to KEL root
 */
export async function buildRegistryTree(
  registryAliases: string[],
  getRegistry: (alias: string) => Promise<RegistryDSL | null>
): Promise<RegistryNode[]> {
  // First pass: Load all registries and create node map
  const registryMap = new Map<string, RegistryNode>();
  const aliasToIdMap = new Map<string, string>();

  for (const alias of registryAliases) {
    const registryDsl = await getRegistry(alias);
    if (registryDsl) {
      const registry = registryDsl.registry;
      aliasToIdMap.set(alias, registry.registryId);

      registryMap.set(registry.registryId, {
        registryId: registry.registryId,
        alias: registry.alias,
        issuerAid: registry.issuerAid,
        parentRegistryId: registry.parentRegistryId,
        depth: 0, // Will calculate in second pass
        children: [],
      });
    }
  }

  // Second pass: Calculate depth by traversing parent chain
  for (const node of registryMap.values()) {
    node.depth = calculateDepth(node, registryMap);
  }

  // Third pass: Build tree structure
  const rootNodes: RegistryNode[] = [];

  for (const node of registryMap.values()) {
    if (node.parentRegistryId) {
      const parent = registryMap.get(node.parentRegistryId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found in map, treat as root
        console.warn(`Parent registry ${node.parentRegistryId} not found for ${node.alias}`);
        rootNodes.push(node);
      }
    } else {
      // No parent = root node
      rootNodes.push(node);
    }
  }

  // Sort children alphabetically
  const sortChildren = (nodes: RegistryNode[]) => {
    nodes.sort((a, b) => a.alias.localeCompare(b.alias));
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(rootNodes);

  return rootNodes;
}

/**
 * Calculate depth by traversing parent chain until we reach a root (no parent)
 * This relies on the KERI data model - depth is how many parent hops to the KEL
 */
function calculateDepth(
  node: RegistryNode,
  registryMap: Map<string, RegistryNode>
): number {
  let depth = 0;
  let current: RegistryNode | undefined = node;

  // Traverse up the parent chain
  while (current?.parentRegistryId) {
    depth++;
    current = registryMap.get(current.parentRegistryId);

    // Safety check: prevent infinite loops
    if (depth > 100) {
      console.error('Possible circular parent reference detected for', node.alias);
      break;
    }
  }

  return depth;
}

/**
 * Find a node in the tree by registry ID
 */
export function findNodeById(
  nodes: RegistryNode[],
  registryId: string
): RegistryNode | null {
  for (const node of nodes) {
    if (node.registryId === registryId) {
      return node;
    }
    const found = findNodeById(node.children, registryId);
    if (found) return found;
  }
  return null;
}

/**
 * Get the path from root to a specific node
 */
export function getNodePath(
  nodes: RegistryNode[],
  registryId: string,
  currentPath: string[] = []
): string[] | null {
  for (const node of nodes) {
    const newPath = [...currentPath, node.registryId];
    if (node.registryId === registryId) {
      return newPath;
    }
    const found = getNodePath(node.children, registryId, newPath);
    if (found) return found;
  }
  return null;
}
