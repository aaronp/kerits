/**
 * KeriGraph - Build graph visualization from KERI data
 *
 * This class takes KEL, TEL, ACDC, and Schema data and generates
 * a graph structure for visualization.
 */

import type { KerStore, Graph, GraphNode, GraphEdge } from '../../storage/types';
import type { KeritsDSL } from '../dsl/types';

export interface KeriGraphOptions {
  /** Include TEL events in the graph */
  includeTel?: boolean;
  /** Include credential (ACDC) nodes */
  includeCredentials?: boolean;
  /** Include schema nodes */
  includeSchemas?: boolean;
  /** Filter to specific AID */
  filterAid?: string;
  /** Filter to specific registry ID */
  filterRegistryId?: string;
}

/**
 * KeriGraph - Build graph structure from KERI data
 */
export class KeriGraph {
  constructor(private store: KerStore, private dsl: KeritsDSL) {}

  /**
   * Build graph from KERI data
   */
  async build(opts: KeriGraphOptions = {}): Promise<Graph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeId = (from: string, to: string, kind: string) => `${from}-${kind}-${to}`;

    // Get all accounts (AIDs)
    const accountAliases = await this.dsl.accountNames();

    for (const accountAlias of accountAliases) {
      const account = await this.dsl.getAccount(accountAlias);
      if (!account) continue;

      // Filter if specific AID requested
      if (opts.filterAid && opts.filterAid !== account.aid) continue;

      // Add AID node
      nodes.push({
        id: account.aid,
        kind: 'AID',
        label: accountAlias,
        meta: { alias: accountAlias },
      });

      // Get KEL events
      const kelEvents = await this.store.listKel(account.aid);
      for (const kelEvent of kelEvents) {
        const eventId = kelEvent.meta.d;
        nodes.push({
          id: eventId,
          kind: 'KEL_EVT',
          label: kelEvent.meta.t,
          meta: kelEvent.meta,
        });

        // Add PRIOR edge if there's a previous event
        if (kelEvent.meta.p) {
          edges.push({
            id: edgeId(kelEvent.meta.p, eventId, 'PRIOR'),
            from: kelEvent.meta.p,
            to: eventId,
            kind: 'PRIOR',
          });
        }
      }

      // Get all registries for this account
      const accountDsl = await this.dsl.account(accountAlias);
      if (!accountDsl) continue;

      const registryAliases = await accountDsl.listRegistries();
      for (const regAlias of registryAliases) {
        const registryDsl = await accountDsl.registry(regAlias);
        if (!registryDsl) continue;

        const registryId = registryDsl.registry.registryId;

        // Filter if specific registry requested
        if (opts.filterRegistryId && opts.filterRegistryId !== registryId) continue;

        // Add registry node
        nodes.push({
          id: registryId,
          kind: 'TEL_REGISTRY',
          label: regAlias,
          meta: { alias: regAlias, accountAid: account.aid },
        });

        // Find anchor event in KEL
        const anchorEvent = registryDsl.registry.anchorEvent;
        if (anchorEvent) {
          edges.push({
            id: edgeId(anchorEvent, registryId, 'ANCHOR'),
            from: anchorEvent,
            to: registryId,
            kind: 'ANCHOR',
          });
        }

        // Get TEL events if requested
        if (opts.includeTel !== false) {
          const telEvents = await registryDsl.getTel();
          for (const telEvent of telEvents) {
            const eventId = telEvent.d;
            nodes.push({
              id: eventId,
              kind: 'TEL_EVT',
              label: telEvent.t,
              meta: telEvent,
            });

            // Add PRIOR edge if there's a previous event
            if (telEvent.p) {
              edges.push({
                id: edgeId(telEvent.p, eventId, 'PRIOR'),
                from: telEvent.p,
                to: eventId,
                kind: 'PRIOR',
              });
            }
          }
        }

        // Get ACDCs if requested
        if (opts.includeCredentials !== false) {
          const acdcAliases = await registryDsl.listACDCs();
          for (const acdcAlias of acdcAliases) {
            const acdcDsl = await registryDsl.acdc(acdcAlias);
            if (!acdcDsl) continue;

            const credentialId = acdcDsl.acdc.credentialId;

            // Add ACDC node
            nodes.push({
              id: credentialId,
              kind: 'ACDC',
              label: acdcAlias,
              meta: { alias: acdcAlias, issuerAid: acdcDsl.acdc.issuerAid },
            });

            // Add edge from issuance event to ACDC
            const issEvent = acdcDsl.acdc.issEvent;
            if (issEvent) {
              edges.push({
                id: edgeId(issEvent, credentialId, 'ISSUES'),
                from: issEvent,
                to: credentialId,
                kind: 'ISSUES',
              });
            }

            // Add edge to schema
            if (opts.includeSchemas !== false) {
              const schemaId = acdcDsl.acdc.schemaId;
              if (schemaId) {
                edges.push({
                  id: edgeId(credentialId, schemaId, 'USES_SCHEMA'),
                  from: credentialId,
                  to: schemaId,
                  kind: 'USES_SCHEMA',
                });
              }
            }
          }
        }
      }
    }

    // Get all schemas if requested
    if (opts.includeSchemas !== false) {
      const schemaAliases = await this.dsl.listSchemas();
      for (const schemaAlias of schemaAliases) {
        const schemaDsl = await this.dsl.schema(schemaAlias);
        if (!schemaDsl) continue;

        const schemaId = schemaDsl.schema.schemaSaid;

        // Only add schema node if it doesn't already exist
        if (!nodes.find(n => n.id === schemaId)) {
          nodes.push({
            id: schemaId,
            kind: 'SCHEMA',
            label: schemaAlias,
            meta: { alias: schemaAlias },
          });
        }
      }
    }

    return { nodes, edges };
  }
}

/**
 * Create a KeriGraph instance
 */
export function createKeriGraph(store: KerStore, dsl: KeritsDSL): KeriGraph {
  return new KeriGraph(store, dsl);
}
