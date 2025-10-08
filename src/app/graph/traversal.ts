/**
 * KERI Event Traversal - Tree-based recursive traversal of KERI graph
 *
 * Resolves any SAID and recursively traverses all ancestors:
 * - KEL events → prior KEL events → inception
 * - TEL events → prior TEL events → VCP → anchor KEL event → KEL chain
 * - ACDCs → issuance TEL event → TEL chain → anchor → KEL chain
 * - ACDC edges → linked credentials (recursive)
 * - Holder/Issuer AIDs → their KEL chains
 * - Schemas
 */

import type { KerStore, SAID, AID, EventMeta, GraphNodeKind } from '../../storage/types';
import type { KeritsDSL } from '../dsl/types';

/**
 * Resolved node with metadata
 */
export interface ResolvedNode {
  id: SAID;
  kind: GraphNodeKind;
  label?: string;
  meta?: any;
  data?: any; // Full event/entity data
}

/**
 * Edge relationship between nodes
 */
export interface TraversalEdge {
  kind: 'PRIOR' | 'ANCHOR' | 'ISSUES' | 'REVOKES' | 'USES_SCHEMA' | 'EDGE' | 'ISSUER' | 'HOLDER';
  from: SAID;
  to: SAID;
  label?: string; // For EDGE relationships, the edge name
}

/**
 * Tree node representing a traversed entity and its ancestors
 */
export interface TraversalNode {
  /** The resolved node */
  node: ResolvedNode;

  /** Parent nodes (ancestors) */
  parents: TraversalNode[];

  /** Edge from parent to this node */
  edgeFromParent?: TraversalEdge;
}

/**
 * Options for traversal
 */
export interface TraversalOptions {
  /** Maximum depth to traverse (default: unlimited) */
  maxDepth?: number;

  /** Include ACDC edge credentials */
  includeEdges?: boolean;

  /** Include holder/issuer AID KELs */
  includeAidKels?: boolean;

  /** Include schema references */
  includeSchemas?: boolean;

  /** Filter to specific node kinds */
  filterKinds?: GraphNodeKind[];
}

/**
 * KERI Event Traversal - resolves and traverses KERI graph structure
 */
export class KeriTraversal {
  constructor(
    private store: KerStore,
    private dsl: KeritsDSL
  ) {}

  /**
   * Resolve a SAID to its node representation
   * Checks KEL, TEL, ACDC, and Schema storage
   */
  async resolveId(id: SAID): Promise<ResolvedNode | null> {
    // Try ACDC first (most specific)
    const acdc = await this.resolveACDC(id);
    if (acdc) return acdc;

    // Try KEL event
    const kel = await this.resolveKEL(id);
    if (kel) return kel;

    // Try TEL event
    const tel = await this.resolveTEL(id);
    if (tel) return tel;

    // Try Schema
    const schema = await this.resolveSchema(id);
    if (schema) return schema;

    // Try AID (identifier itself)
    const aid = await this.resolveAID(id);
    if (aid) return aid;

    return null;
  }

  /**
   * Resolve ACDC by SAID
   */
  private async resolveACDC(id: SAID): Promise<ResolvedNode | null> {
    try {
      const acdcData = await this.store.getACDC(id);
      if (!acdcData) return null;

      // Get alias if available
      const alias = await this.store.getSaidAlias('acdc', id);

      return {
        id,
        kind: 'ACDC',
        label: alias || 'Credential',
        meta: {
          alias,
          issuerAid: acdcData.i,
          holderAid: acdcData.a?.i,
          schemaId: acdcData.s,
          registryId: acdcData.ri,
        },
        data: acdcData,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolve KEL event by SAID
   */
  private async resolveKEL(id: SAID): Promise<ResolvedNode | null> {
    try {
      // Try to get event directly
      const event = await this.store.getEvent(id);
      if (!event || !event.meta.i) return null;

      // Verify it's a KEL event (has 'i' but not 'ri')
      if (event.meta.ri !== undefined) return null;

      // Get account alias if this is an AID
      let label = event.meta.t;
      const accountAlias = await this.store.getSaidAlias('kel', event.meta.i);
      if (accountAlias && event.meta.s === '0') {
        label = `${accountAlias} (${event.meta.t})`;
      }

      return {
        id,
        kind: 'KEL_EVT',
        label,
        meta: event.meta,
        data: event,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolve TEL event by SAID
   */
  private async resolveTEL(id: SAID): Promise<ResolvedNode | null> {
    try {
      const event = await this.store.getEvent(id);
      if (!event || !event.meta.ri) return null;

      // Get registry alias if available
      let label = event.meta.t;
      const registryAlias = await this.store.getSaidAlias('tel', event.meta.ri);
      if (registryAlias) {
        label = `${registryAlias} (${event.meta.t})`;
      }

      return {
        id,
        kind: 'TEL_EVT',
        label,
        meta: event.meta,
        data: event,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolve Schema by SAID
   */
  private async resolveSchema(id: SAID): Promise<ResolvedNode | null> {
    try {
      const schemaData = await this.store.getSchema(id);
      if (!schemaData) return null;

      const alias = await this.store.getSaidAlias('schema', id);

      return {
        id,
        kind: 'SCHEMA',
        label: alias || schemaData.$id || 'Schema',
        meta: { alias },
        data: schemaData,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolve AID (identifier)
   */
  private async resolveAID(id: AID): Promise<ResolvedNode | null> {
    try {
      // Check if this is a known account
      const alias = await this.store.getSaidAlias('kel', id);
      if (!alias) return null;

      return {
        id,
        kind: 'AID',
        label: alias,
        meta: { alias },
      };
    } catch {
      return null;
    }
  }

  /**
   * Traverse ancestors from a starting SAID
   * Returns a tree structure with all ancestor nodes
   */
  async traverse(
    startId: SAID,
    opts: TraversalOptions = {}
  ): Promise<TraversalNode | null> {
    const seen = new Set<SAID>();
    const maxDepth = opts.maxDepth ?? Infinity;

    return this.traverseRecursive(startId, seen, 0, maxDepth, opts);
  }

  /**
   * Recursive traversal implementation
   */
  private async traverseRecursive(
    id: SAID,
    seen: Set<SAID>,
    depth: number,
    maxDepth: number,
    opts: TraversalOptions
  ): Promise<TraversalNode | null> {
    // Check depth limit
    if (depth > maxDepth) return null;

    // Check for cycles
    if (seen.has(id)) return null;
    seen.add(id);

    // Resolve the node
    const node = await this.resolveId(id);
    if (!node) return null;

    // Filter by kind if specified
    if (opts.filterKinds && !opts.filterKinds.includes(node.kind)) {
      return null;
    }

    // Build parent relationships based on node kind
    const parents: TraversalNode[] = [];

    switch (node.kind) {
      case 'ACDC':
        await this.traverseACDCParents(node, parents, seen, depth, maxDepth, opts);
        break;

      case 'TEL_EVT':
        await this.traverseTELParents(node, parents, seen, depth, maxDepth, opts);
        break;

      case 'KEL_EVT':
        await this.traverseKELParents(node, parents, seen, depth, maxDepth, opts);
        break;

      case 'AID':
        await this.traverseAIDParents(node, parents, seen, depth, maxDepth, opts);
        break;

      case 'SCHEMA':
        // Schemas have no parents in KERI structure
        break;
    }

    return {
      node,
      parents,
    };
  }

  /**
   * Traverse ACDC parents
   */
  private async traverseACDCParents(
    node: ResolvedNode,
    parents: TraversalNode[],
    seen: Set<SAID>,
    depth: number,
    maxDepth: number,
    opts: TraversalOptions
  ): Promise<void> {
    const acdcData = node.data;

    // 1. Issuance TEL event
    // The issEvent might be in the ACDC data, or we need to find it from the TEL
    let issEventId = acdcData?.issEvent;

    // If not in ACDC data, search TEL for issuance event
    if (!issEventId && node.meta?.registryId) {
      try {
        const telEvents = await this.store.listTel(node.meta.registryId);
        const issEvent = telEvents.find(e => e.meta.acdcSaid === node.id && e.meta.t === 'iss');
        if (issEvent) {
          issEventId = issEvent.meta.d;
        }
      } catch {
        // Registry not found or no TEL
      }
    }

    if (issEventId) {
      const issNode = await this.traverseRecursive(issEventId, seen, depth + 1, maxDepth, opts);
      if (issNode) {
        issNode.edgeFromParent = { kind: 'ISSUES', from: issEventId, to: node.id };
        parents.push(issNode);
      }
    }

    // 2. Edge credentials (linked ACDCs)
    if (opts.includeEdges !== false && acdcData?.e) {
      for (const [edgeName, edgeData] of Object.entries(acdcData.e as Record<string, any>)) {
        const edgeCredId = edgeData?.n;
        if (edgeCredId && typeof edgeCredId === 'string') {
          const edgeNode = await this.traverseRecursive(edgeCredId, seen, depth + 1, maxDepth, opts);
          if (edgeNode) {
            edgeNode.edgeFromParent = { kind: 'EDGE', from: node.id, to: edgeCredId, label: edgeName };
            parents.push(edgeNode);
          }
        }
      }
    }

    // 3. Schema reference
    if (opts.includeSchemas !== false && node.meta?.schemaId) {
      const schemaNode = await this.traverseRecursive(node.meta.schemaId, seen, depth + 1, maxDepth, opts);
      if (schemaNode) {
        schemaNode.edgeFromParent = { kind: 'USES_SCHEMA', from: node.id, to: node.meta.schemaId };
        parents.push(schemaNode);
      }
    }

    // 4. Issuer AID KEL
    if (opts.includeAidKels !== false && node.meta?.issuerAid) {
      const issuerNode = await this.traverseRecursive(node.meta.issuerAid, seen, depth + 1, maxDepth, opts);
      if (issuerNode) {
        issuerNode.edgeFromParent = { kind: 'ISSUER', from: node.id, to: node.meta.issuerAid };
        parents.push(issuerNode);
      }
    }

    // 5. Holder AID KEL
    if (opts.includeAidKels !== false && node.meta?.holderAid) {
      const holderNode = await this.traverseRecursive(node.meta.holderAid, seen, depth + 1, maxDepth, opts);
      if (holderNode) {
        holderNode.edgeFromParent = { kind: 'HOLDER', from: node.id, to: node.meta.holderAid };
        parents.push(holderNode);
      }
    }
  }

  /**
   * Traverse TEL event parents
   */
  private async traverseTELParents(
    node: ResolvedNode,
    parents: TraversalNode[],
    seen: Set<SAID>,
    depth: number,
    maxDepth: number,
    opts: TraversalOptions
  ): Promise<void> {
    const meta = node.meta as EventMeta;

    // 1. Prior TEL event
    if (meta.p) {
      const priorNode = await this.traverseRecursive(meta.p, seen, depth + 1, maxDepth, opts);
      if (priorNode) {
        priorNode.edgeFromParent = { kind: 'PRIOR', from: meta.p, to: node.id };
        parents.push(priorNode);
      }
    }

    // 2. For VCP (registry inception), find anchor in KEL
    if (meta.t === 'vcp' && meta.i) {
      // The VCP event should be anchored in the controller's KEL
      // We need to find the KEL event that anchors this registry
      const kelEvents = await this.store.listKel(meta.i);
      for (const kelEvent of kelEvents) {
        // Check if this KEL event anchors our registry
        // This would be in the event's seals/anchors (implementation-specific)
        // For now, traverse the controller's AID
        const aidNode = await this.traverseRecursive(meta.i, seen, depth + 1, maxDepth, opts);
        if (aidNode) {
          aidNode.edgeFromParent = { kind: 'ANCHOR', from: meta.i, to: node.id };
          parents.push(aidNode);
        }
        break; // Only add once
      }
    }
  }

  /**
   * Traverse KEL event parents
   */
  private async traverseKELParents(
    node: ResolvedNode,
    parents: TraversalNode[],
    seen: Set<SAID>,
    depth: number,
    maxDepth: number,
    opts: TraversalOptions
  ): Promise<void> {
    const meta = node.meta as EventMeta;

    // Prior KEL event
    if (meta.p) {
      const priorNode = await this.traverseRecursive(meta.p, seen, depth + 1, maxDepth, opts);
      if (priorNode) {
        priorNode.edgeFromParent = { kind: 'PRIOR', from: meta.p, to: node.id };
        parents.push(priorNode);
      }
    }
  }

  /**
   * Traverse AID parents (its KEL inception)
   */
  private async traverseAIDParents(
    node: ResolvedNode,
    parents: TraversalNode[],
    seen: Set<SAID>,
    depth: number,
    maxDepth: number,
    opts: TraversalOptions
  ): Promise<void> {
    // Get the KEL for this AID
    const kelEvents = await this.store.listKel(node.id);

    // Get the latest (HEAD) event
    if (kelEvents.length > 0) {
      const latestEvent = kelEvents[kelEvents.length - 1];
      const latestNode = await this.traverseRecursive(latestEvent.meta.d, seen, depth + 1, maxDepth, opts);
      if (latestNode) {
        latestNode.edgeFromParent = { kind: 'PRIOR', from: latestEvent.meta.d, to: node.id };
        parents.push(latestNode);
      }
    }
  }

  /**
   * Convert tree to flat graph structure (for existing visualizations)
   */
  static treeToGraph(tree: TraversalNode): { nodes: ResolvedNode[]; edges: TraversalEdge[] } {
    const nodes: ResolvedNode[] = [];
    const edges: TraversalEdge[] = [];
    const seenIds = new Set<SAID>();

    function traverse(treeNode: TraversalNode) {
      // Add node if not seen
      if (!seenIds.has(treeNode.node.id)) {
        nodes.push(treeNode.node);
        seenIds.add(treeNode.node.id);
      }

      // Add edge if present
      if (treeNode.edgeFromParent) {
        edges.push(treeNode.edgeFromParent);
      }

      // Traverse parents
      for (const parent of treeNode.parents) {
        traverse(parent);
      }
    }

    traverse(tree);
    return { nodes, edges };
  }
}

/**
 * Create a KeriTraversal instance
 */
export function createKeriTraversal(store: KerStore, dsl: KeritsDSL): KeriTraversal {
  return new KeriTraversal(store, dsl);
}
