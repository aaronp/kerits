/**
 * ACDCDSL - ACDC (credential) operations
 */

import type { KerStore } from '../../../storage/types';
import type { ACDCDSL, ACDC, Registry, CredentialStatus, ExportDSL, IndexedACDC, SchemaUsage, CounterpartyInfo, TELEventSummary } from '../types';
import { revokeCredential } from '../../helpers';
import { exportAcdc } from './export';
import { TELIndexer } from '../../indexer/index.js';

/**
 * Create an ACDCDSL for a specific ACDC
 */
export function createACDCDSL(
  acdc: ACDC,
  registry: Registry,
  store: KerStore
): ACDCDSL {
  return {
    acdc,
    registry,

    async revoke(): Promise<void> {
      await revokeCredential(store, {
        registryId: registry.registryId,
        credentialId: acdc.credentialId,
      });
    },

    async status(): Promise<CredentialStatus> {
      // Get TEL events for this registry
      const telEvents = await store.listTel(registry.registryId);

      // Find events related to this credential
      for (const event of telEvents.reverse()) {
        if (event.meta.acdcSaid === acdc.credentialId) {
          if (event.meta.t === 'rev') {
            return CredentialStatus.Revoked;
          }
          if (event.meta.t === 'iss') {
            return CredentialStatus.Issued;
          }
        }
      }

      return CredentialStatus.Issued;
    },

    async graph(): Promise<any> {
      // For now, return global graph
      // TODO: Filter to only this ACDC's events
      return store.buildGraph();
    },

    async export(): Promise<ExportDSL> {
      return exportAcdc(
        store,
        acdc.credentialId,
        registry.registryId,
        acdc.issuerAid
      );
    },

    async index(): Promise<IndexedACDC> {
      const indexer = new TELIndexer(store);
      return indexer.indexACDC(acdc.credentialId, registry.registryId);
    },

    async getLatestData(): Promise<Record<string, any>> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(acdc.credentialId, registry.registryId);
      return indexed.latestData;
    },

    async getSchemas(): Promise<SchemaUsage[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(acdc.credentialId, registry.registryId);
      return indexed.schemas;
    },

    async getCounterparties(): Promise<CounterpartyInfo[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(acdc.credentialId, registry.registryId);
      return indexed.counterparties;
    },

    async getHistory(): Promise<TELEventSummary[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(acdc.credentialId, registry.registryId);
      return indexed.telEvents;
    },
  };
}
