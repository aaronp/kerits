/**
 * ACDCDSL - ACDC (credential) operations
 */

import type { KerStore } from '../../../storage/types';
import type { KeyManager } from '../../keymanager';
import { type ACDCDSL, type ACDC, type Registry, type CredentialStatus, type ExportDSL, type IndexedACDC, type SchemaUsage, type CounterpartyInfo, type TELEventSummary } from '../types';
import { revokeCredential } from '../../helpers';
import { exportAcdc } from './export';
import { TELIndexer } from '../../indexer/index.js';
import { createGrant, type ExchangeMessage } from '../../../ipex';
import { s } from '../../../types/keri';

/**
 * Create an ACDCDSL for a specific ACDC
 */
export function createACDCDSL(
  acdc: ACDC,
  registry: Registry,
  store: KerStore,
  keyManager?: KeyManager
): ACDCDSL {
  return {
    acdc,
    registry,

    async revoke(): Promise<void> {
      await revokeCredential(store, {
        registryId: registry.registryId,
        credentialId: acdc.credentialId,
        issuerAid: acdc.issuerAid,
      }, keyManager);
    },

    async status(): Promise<CredentialStatus> {
      // Get TEL events for this registry
      const telEvents = await store.listTel(s(registry.registryId).asSAID());

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
      return indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
    },

    async getLatestData(): Promise<Record<string, any>> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
      return indexed.latestData;
    },

    async getSchemas(): Promise<SchemaUsage[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
      return indexed.schemas;
    },

    async getCounterparties(): Promise<CounterpartyInfo[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
      return indexed.counterparties;
    },

    async getHistory(): Promise<TELEventSummary[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
      return indexed.telEvents;
    },

    async getEdges(): Promise<Record<string, import('../types').EdgeBlock>> {
      const acdcData = await store.getACDC(s(acdc.credentialId).asSAID());
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
          linked.push(createACDCDSL(linkedAcdcObj, registry, store, keyManager));
        }
      }

      return linked;
    },

    async getLinkedFrom(): Promise<ACDCDSL[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexACDC(s(acdc.credentialId).asSAID(), s(registry.registryId).asSAID());
      const linkedFrom: ACDCDSL[] = [];

      for (const linkedFromId of indexed.linkedFrom) {
        const linkedAcdcData = await store.getACDC(s(linkedFromId).asSAID());
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
          linkedFrom.push(createACDCDSL(linkedAcdcObj, registry, store, keyManager));
        }
      }

      return linkedFrom;
    },

    async exportIPEX(): Promise<string> {
      // Get the ACDC data
      const acdcData = await store.getACDC(s(acdc.credentialId).asSAID());
      if (!acdcData) {
        throw new Error(`ACDC not found: ${acdc.credentialId}`);
      }

      // Try to get the original ISS event metadata (preserved from IPEX import)
      // This includes the issuer's signature and public keys
      const issMetaKey = {
        path: ['acdc', acdc.credentialId, 'iss-meta'],
        type: 'json' as const,
      };
      let issEventWithSigs: any;

      try {
        const issMetaBytes = await store.kv.getStructured!(issMetaKey);
        if (issMetaBytes) {
          const issMetaJson = new TextDecoder().decode(issMetaBytes);
          issEventWithSigs = JSON.parse(issMetaJson);
          console.log('Using preserved ISS event metadata with signatures');
        }
      } catch (error) {
        console.log('No preserved ISS metadata, extracting from TEL');
      }

      // Fallback: Extract ISS event from TEL if no preserved metadata
      if (!issEventWithSigs) {
        const telEvents = await store.listTel(s(registry.registryId).asSAID());
        const issEvent = telEvents.find(e =>
          e.meta.t === 'iss' && e.meta.acdcSaid === acdc.credentialId
        );
        if (!issEvent) {
          throw new Error(`Issuance event not found for credential: ${acdc.credentialId}`);
        }

        // Parse signatures from CESR attachments if present
        issEventWithSigs = { ...issEvent.meta };
        if (issEvent.raw) {
          try {
            const { parseCesrStream, parseIndexedSignatures } = await import('../../signing');
            const { signatures } = parseCesrStream(issEvent.raw);
            if (signatures) {
              const parsedSigs = parseIndexedSignatures(signatures);
              issEventWithSigs.sigs = parsedSigs.map(s => s.signature);

              // Try to get public key from KEL
              const kelEvents = await store.listKel(s(acdc.issuerAid).asAID());
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
      }

      // Get the latest KEL event for anchoring (if available)
      // When a holder shares an accepted credential, they may not have the issuer's KEL
      const kelEvents = await store.listKel(s(acdc.issuerAid).asAID());
      let ancEventData: any = undefined;

      if (kelEvents.length > 0) {
        const ancEvent = kelEvents[kelEvents.length - 1];
        ancEventData = { ...ancEvent.meta };

        // If anchoring event is IXN (no keys), add keys from the most recent establishment event
        if (ancEvent.meta.t === 'ixn') {
          // Find the most recent establishment event (ICP or ROT) before this IXN
          for (let i = kelEvents.length - 1; i >= 0; i--) {
            const event = kelEvents[i];
            if (event.meta.t === 'icp' || event.meta.t === 'rot') {
              // Parse the raw CESR to get the full event with keys
              const rawText = new TextDecoder().decode(event.raw);
              const jsonMatch = rawText.match(/\{[^]*\}/); // Extract JSON object
              if (jsonMatch) {
                try {
                  const eventJson = JSON.parse(jsonMatch[0]);
                  if (eventJson.k && Array.isArray(eventJson.k)) {
                    ancEventData.k = eventJson.k;
                  }
                } catch (e) {
                  console.warn('Failed to parse KEL event JSON:', e);
                }
              }
              break;
            }
          }
        }
      }

      // Create IPEX grant message
      // Sender is the owner of the registry (current user sharing the credential)
      const grantMessage = createGrant({
        sender: registry.issuerAid,
        recipient: acdc.holderAid,
        credential: acdcData,
        issEvent: issEventWithSigs,
        ancEvent: ancEventData,
        message: `Credential: ${acdc.credentialId.substring(0, 12)}...`,
      });

      // Return as JSON string for clipboard/transmission
      return JSON.stringify(grantMessage, null, 2);
    },
  };
}
