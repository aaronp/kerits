/**
 * RegistryDSL - Credential registry operations
 */

import type { KerStore } from '../../../storage/types';
import type { RegistryDSL, Registry, Account, IssueParams, TelEvent, GraphOptions, ExportDSL, IndexedRegistry, IndexedACDC } from '../types';
import type { ACDCDSL } from '../types';
import { createACDCDSL } from './acdc';
import { exportTel } from './export';
import { TELIndexer } from '../../indexer/index.js';

/**
 * Create a RegistryDSL for a specific registry
 */
export function createRegistryDSL(
  registry: Registry,
  account: Account,
  store: KerStore
): RegistryDSL {
  return {
    registry,
    account,

    async issue(params: IssueParams): Promise<ACDCDSL> {
      const { issueCredential } = await import('../../helpers');

      // Validate params
      if (!params.schema) {
        throw new Error('Schema is required');
      }
      if (!params.holder) {
        throw new Error('Holder is required');
      }

      // Resolve schema
      let schemaId = params.schema;
      if (!schemaId.startsWith('E')) {
        // Assume it's an alias
        const resolvedSchemaId = await store.aliasToId('schema', params.schema);
        if (!resolvedSchemaId) {
          throw new Error(`Schema not found: ${params.schema}`);
        }
        schemaId = resolvedSchemaId;
      }

      // Resolve holder
      let holderAid = params.holder;
      if (!holderAid.startsWith('D') && !holderAid.startsWith('E')) {
        // Assume it's an alias
        const resolvedHolderAid = await store.aliasToId('kel', params.holder);
        if (!resolvedHolderAid) {
          throw new Error(`Holder account not found: ${params.holder}`);
        }
        holderAid = resolvedHolderAid;
      }

      // Issue credential
      const { credentialId, acdc } = await issueCredential(store, {
        registryId: registry.registryId,
        schemaId,
        issuerAid: account.aid,
        holderAid,
        credentialData: params.data,
      });

      // Store alias if provided
      if (params.alias) {
        await store.putAlias('acdc', credentialId, params.alias);
      }

      const acdcObj = {
        alias: params.alias,
        credentialId,
        registryId: registry.registryId,
        schemaId,
        issuerAid: account.aid,
        holderAid,
        data: params.data,
        issuedAt: new Date().toISOString(),
      };

      return createACDCDSL(acdcObj, registry, store);
    },

    async acdc(alias: string): Promise<ACDCDSL | null> {
      const credentialId = await store.aliasToId('acdc', alias);
      if (!credentialId) {
        return null;
      }

      // Get credential from storage
      const stored = await store.getEvent(credentialId);
      if (!stored) {
        return null;
      }

      // Extract ACDC data from stored event
      // This is a simplified version - in production, parse the full ACDC
      const acdcObj = {
        alias,
        credentialId,
        registryId: registry.registryId,
        schemaId: '', // Would extract from stored event
        issuerAid: account.aid,
        holderAid: '', // Would extract from stored event
        data: {},
        issuedAt: stored.meta.dt || '',
      };

      return createACDCDSL(acdcObj, registry, store);
    },

    async listACDCs(): Promise<string[]> {
      return store.listAliases('acdc');
    },

    async getTel(): Promise<TelEvent[]> {
      const events = await store.listTel(registry.registryId);
      return events.map(e => ({
        t: e.meta.t,
        d: e.meta.d,
        ri: e.meta.ri,
        s: e.meta.s,
        ...e.meta,
      }));
    },

    async graph(opts?: GraphOptions): Promise<any> {
      // For now, return global graph
      // TODO: Filter to only this registry's events
      return store.buildGraph(opts);
    },

    async export(): Promise<ExportDSL> {
      return exportTel(store, registry.registryId, account.aid);
    },

    async index(): Promise<IndexedRegistry> {
      const indexer = new TELIndexer(store);
      return indexer.indexRegistry(registry.registryId);
    },

    async listCredentials(): Promise<IndexedACDC[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexRegistry(registry.registryId);
      return indexed.credentials;
    },
  };
}
