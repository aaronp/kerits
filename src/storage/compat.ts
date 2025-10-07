/**
 * Compatibility wrapper that implements KerStore interface using KerStore2
 * This allows gradual migration of DSL code to KerStore2
 */

import type { KerStore, StoredWithMeta, PutResult as PutResult1, SAID, AID, Graph, Kv } from './types';
import type { KerStore2, PutResult as PutResult2 } from './types2';

/**
 * Wraps KerStore2 to provide backward-compatible KerStore interface
 */
export function createKerStoreCompat(store2: KerStore2, kv: Kv): KerStore {
  return {
    // Write path
    async putEvent(rawCesr: Uint8Array): Promise<PutResult1> {
      const result = await store2.putEvent(rawCesr);
      // Convert PutResult2 to PutResult1 format
      return {
        said: result.said,
        stored: {
          raw: new Uint8Array(0), // Not stored in result anymore
          kind: result.meta.v || 'KERI10JSON',
          size: rawCesr.length,
          ingestedAt: new Date().toISOString()
        },
        meta: result.meta,
        attachments: [] // Not tracked in PutResult anymore
      };
    },

    async putAlias(scope: string, id: string, alias: string): Promise<void> {
      // Convert generic scope to typed scope
      const typedScope = scope as 'kel' | 'tel' | 'schema' | 'acdc';
      await store2.putAlias(typedScope, id, alias);
    },

    async delAlias(scope: string, idOrAlias: string, byAlias?: boolean): Promise<void> {
      const typedScope = scope as 'kel' | 'tel' | 'schema' | 'acdc';
      if (byAlias) {
        // Delete by alias name
        await store2.delAlias(typedScope, idOrAlias);
      } else {
        // Delete by SAID - need to look up the alias first
        const alias = await store2.getSaidAlias(typedScope, idOrAlias);
        if (alias) {
          await store2.delAlias(typedScope, alias);
        }
      }
    },

    // Read path
    async getEvent(said: SAID): Promise<StoredWithMeta | null> {
      const result = await store2.getEvent(said);
      if (!result) return null;

      // Convert to StoredWithMeta format (note: field is 'event' not 'stored')
      return {
        event: {
          said,
          raw: result.raw,
          kind: result.meta.v || 'KERI10JSON',
          size: result.raw.length,
          ingestedAt: new Date().toISOString()
        },
        meta: result.meta,
        attachments: []
      };
    },

    async listKel(aid: AID, fromS?: number, toS?: number): Promise<StoredWithMeta[]> {
      const events = await store2.listKel(aid, fromS, toS);
      return events.map(e => ({
        event: {
          said: e.said,
          raw: e.raw,
          kind: e.meta.v || 'KERI10JSON',
          size: e.raw.length,
          ingestedAt: new Date().toISOString()
        },
        meta: e.meta,
        attachments: []
      }));
    },

    async listTel(ri: SAID, fromS?: number, toS?: number): Promise<StoredWithMeta[]> {
      const events = await store2.listTel(ri, fromS);
      // Filter by toS if provided
      let filtered = events;
      if (fromS !== undefined || toS !== undefined) {
        filtered = events.filter(e => {
          const s = parseInt(e.meta.s || '0', 16);
          if (fromS !== undefined && s < fromS) return false;
          if (toS !== undefined && s > toS) return false;
          return true;
        });
      }
      return filtered.map(e => ({
        event: {
          said: e.said,
          raw: e.raw,
          kind: e.meta.v || 'KERI10JSON',
          size: e.raw.length,
          ingestedAt: new Date().toISOString()
        },
        meta: e.meta,
        attachments: []
      }));
    },

    async getByPrior(p: SAID): Promise<StoredWithMeta[]> {
      const events = await store2.getByPrior(p);
      return events.map(e => ({
        event: {
          said: e.meta.d,
          raw: e.raw,
          kind: e.meta.v || 'KERI10JSON',
          size: e.raw.length,
          ingestedAt: new Date().toISOString()
        },
        meta: e.meta,
        attachments: []
      }));
    },

    // Alias lookup
    async aliasToId(scope: string, alias: string): Promise<string | null> {
      const typedScope = scope as 'kel' | 'tel' | 'schema' | 'acdc';
      return await store2.getAliasSaid(typedScope, alias);
    },

    async idToAlias(scope: string, id: string): Promise<string | null> {
      const typedScope = scope as 'kel' | 'tel' | 'schema' | 'acdc';
      return await store2.getSaidAlias(typedScope, id);
    },

    // Graph DSL
    async buildGraph(opts?: { limit?: number; scopeAliases?: string[] }): Promise<Graph> {
      return await store2.buildGraph(opts);
    },

    // List aliases in a scope
    async listAliases(scope: string): Promise<string[]> {
      const typedScope = scope as 'kel' | 'tel' | 'schema' | 'acdc';
      return await store2.listAliases(typedScope);
    },

    // Expose KV for advanced usage
    kv
  };
}
