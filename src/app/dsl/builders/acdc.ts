/**
 * ACDCDSL - ACDC (credential) operations
 */

import type { KerStore } from '../../../storage/types';
import { type ACDCDSL, type ACDC, type Registry, type CredentialStatus, type ExportDSL, type IndexedACDC, type SchemaUsage, type CounterpartyInfo, type TELEventSummary } from '../types';
import { revokeCredential } from '../../helpers';
import { exportAcdc } from './export';
import { TELIndexer } from '../../indexer/index.js';
import { createGrant, type ExchangeMessage } from '../../../ipex';

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
        issuerAid: acdc.issuerAid,
      });
    },

    async status(): Promise<CredentialStatus> {
      // Get TEL events for this registry
      const telEvents = await store.listTel(registry.registryId);

      // Find events related to this credential, sorted by sequence number (newest last)
      const credEvents = telEvents
        .filter(e => e.meta.acdcSaid === acdc.credentialId)
        .sort((a, b) => {
          const sA = parseInt(a.meta.s || '0', 16);
          const sB = parseInt(b.meta.s || '0', 16);
          return sA - sB;
        });

      // Check the latest event
      const latestEvent = credEvents[credEvents.length - 1];
      if (!latestEvent) {
        return { revoked: false, status: 'issued' };
      }

      if (latestEvent.meta.t === 'rev') {
        return { revoked: true, status: 'revoked' };
      }

      return { revoked: false, status: 'issued' };
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

    async getEdges(): Promise<Record<string, import('../types').EdgeBlock>> {
      const acdcData = await store.getACDC(acdc.credentialId);
      return acdcData?.e || {};
    },

    async getLinkedCredentials(): Promise<ACDCDSL[]> {
      const edges = await this.getEdges();
      const linked: ACDCDSL[] = [];

      for (const edge of Object.values(edges)) {
        const linkedAcdcData = await store.getACDC(edge.n);
        if (linkedAcdcData) {
          const linkedAcdcObj = {
            credentialId: edge.n,
            registryId: linkedAcdcData.ri || registry.registryId,
            schemaId: linkedAcdcData.s || '',
            issuerAid: linkedAcdcData.i || '',
            holderAid: linkedAcdcData.a?.i || '',
            data: linkedAcdcData.a || {},
            issuedAt: linkedAcdcData.dt || new Date().toISOString(),
          };
          linked.push(createACDCDSL(linkedAcdcObj, registry, store));
        }
      }

      return linked;
    },

    async getLinkedFrom(): Promise<ACDCDSL[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(acdc.credentialId, registry.registryId);
      const linkedFrom: ACDCDSL[] = [];

      for (const linkedFromId of indexed.linkedFrom) {
        const linkedAcdcData = await store.getACDC(linkedFromId);
        if (linkedAcdcData) {
          const linkedAcdcObj = {
            credentialId: linkedFromId,
            registryId: linkedAcdcData.ri || registry.registryId,
            schemaId: linkedAcdcData.s || '',
            issuerAid: linkedAcdcData.i || '',
            holderAid: linkedAcdcData.a?.i || '',
            data: linkedAcdcData.a || {},
            issuedAt: linkedAcdcData.dt || new Date().toISOString(),
          };
          linkedFrom.push(createACDCDSL(linkedAcdcObj, registry, store));
        }
      }

      return linkedFrom;
    },

    async exportIPEX(): Promise<string> {
      // Get the ACDC data
      const acdcData = await store.getACDC(acdc.credentialId);
      if (!acdcData) {
        throw new Error(`ACDC not found: ${acdc.credentialId}`);
      }

      // Get the issuance event from TEL
      const telEvents = await store.listTel(registry.registryId);
      const issEvent = telEvents.find(e =>
        e.meta.t === 'iss' && e.meta.acdcSaid === acdc.credentialId
      );
      if (!issEvent) {
        throw new Error(`Issuance event not found for credential: ${acdc.credentialId}`);
      }

      // Parse signatures from CESR attachments if present
      let issEventWithSigs = { ...issEvent.meta };
      if (issEvent.raw) {
        try {
          const { parseCesrStream, parseIndexedSignatures } = await import('../../signing');
          const { signatures } = parseCesrStream(issEvent.raw);
          if (signatures) {
            const parsedSigs = parseIndexedSignatures(signatures);
            issEventWithSigs.sigs = parsedSigs.map(s => s.signature);

            // Try to get public key from KEL
            const kelEvents = await store.listKel(acdc.issuerAid);
            const icpEvent = kelEvents.find(e => e.meta.t === 'icp');
            if (icpEvent?.meta.k) {
              issEventWithSigs.k = icpEvent.meta.k;
            }
          }
        } catch (error) {
          // If parsing fails, continue without signatures
          console.warn('Failed to parse ISS event signatures:', error);
        }
      }

      // Get the latest KEL event for anchoring
      const kelEvents = await store.listKel(acdc.issuerAid);
      const ancEvent = kelEvents[kelEvents.length - 1];
      if (!ancEvent) {
        throw new Error(`No KEL events found for issuer: ${acdc.issuerAid}`);
      }

      // Create IPEX grant message
      const grantMessage = createGrant({
        sender: acdc.issuerAid,
        recipient: acdc.holderAid,
        credential: acdcData,
        issEvent: issEventWithSigs,
        ancEvent: ancEvent.meta,
        message: `Credential: ${acdc.credentialId.substring(0, 12)}...`,
      });

      // Return as JSON string for clipboard/transmission
      return JSON.stringify(grantMessage, null, 2);
    },
  };
}
