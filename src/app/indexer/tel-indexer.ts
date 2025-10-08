/**
 * TEL Indexer - Aggregates TEL chains to compute ACDC state
 *
 * Uses query-time indexing (replay on demand) rather than materialized views.
 */

import type { KerStore } from '../../storage/types.js';
import type { SAID, AID } from '../../storage/types.js';
import type {
  IndexedRegistry,
  IndexedACDC,
  SchemaUsage,
  CounterpartyInfo,
  TELEventSummary,
} from './types.js';

/**
 * TEL Indexer - Replays TEL events to compute aggregated state
 */
export class TELIndexer {
  constructor(private store: KerStore) {}

  /**
   * Index a single registry
   * Replays all TEL events to compute current state
   */
  async indexRegistry(registryId: SAID): Promise<IndexedRegistry> {
    // Get all TEL events for this registry
    const telEvents = await this.store.listTel(registryId);

    // Find inception event (vcp)
    const vcp = telEvents.find(e => e.meta.t === 'vcp');
    if (!vcp) {
      throw new Error(`Registry ${registryId} has no inception event`);
    }

    const registry: IndexedRegistry = {
      registryId,
      issuerAid: vcp.meta.i!,
      inceptionAt: vcp.meta.dt || new Date().toISOString(),
      backers: this.extractBackers(vcp),
      credentialCount: 0,
      issuedCount: 0,
      revokedCount: 0,
      credentials: [],
    };

    // Track credentials by SAID
    const credentialMap = new Map<SAID, IndexedACDC>();

    // Replay TEL events in order
    for (const telEvent of telEvents) {
      const { meta, said, raw } = telEvent;

      if (meta.t === 'iss') {
        // Issuance event
        const credId = meta.acdcSaid!;
        if (!credId) continue;

        // Get the ACDC itself
        const acdcEvent = await this.store.getEvent(credId);
        if (!acdcEvent) continue;

        // Parse ACDC data - handle both Uint8Array and already-parsed cases
        let acdcData: any;
        const raw = acdcEvent.raw;

        // Helper function to extract JSON from CESR-framed text
        const parseCesrFramed = (text: string): any => {
          // Remove CESR framing like "-ACDC10JSON00015_{...}"
          const stripped = text.startsWith('-') ? text.slice(1) : text;
          const hasFrame = stripped.startsWith('KERI') || stripped.startsWith('ACDC');
          const jsonStr = hasFrame
            ? text.replace(/^-(KERI|ACDC)[^\{]*({.*)$/s, '$2')
            : text;
          return JSON.parse(jsonStr);
        };

        if (raw instanceof Uint8Array) {
          const text = new TextDecoder().decode(raw);
          acdcData = parseCesrFramed(text);
        } else if (typeof raw === 'string') {
          acdcData = parseCesrFramed(raw);
        } else if (Array.isArray(raw) || (typeof raw === 'object' && '0' in raw)) {
          // Handle deserialized Uint8Array (object with numeric keys)
          const bytes = Array.isArray(raw) ? new Uint8Array(raw) : new Uint8Array(Object.values(raw));
          const text = new TextDecoder().decode(bytes);
          acdcData = parseCesrFramed(text);
        } else {
          // Already parsed as JSON object
          acdcData = raw;
        }

        const indexed: IndexedACDC = {
          credentialId: credId,
          registryId,
          issuerAid: acdcData.i || meta.issuerAid || vcp.meta.i!,
          holderAid: acdcData.a?.i, // Recipient from subject
          issuedAt: meta.dt || new Date().toISOString(),
          issuanceEventSaid: said,
          schemas: acdcData.s ? [{
            schemaSaid: acdcData.s,
            firstUsedAt: meta.dt || new Date().toISOString(),
            eventSaid: said,
          }] : [],
          status: 'issued',
          latestData: this.extractCredentialData(acdcData),
          edges: acdcData.e || {},
          linkedTo: acdcData.e ? Object.values(acdcData.e).map((edge: any) => edge.n) : [],
          linkedFrom: [], // Will be populated after all credentials are indexed
          counterparties: this.extractCounterparties(acdcData, meta),
          telEvents: [{
            eventSaid: said,
            eventType: 'iss',
            timestamp: meta.dt || new Date().toISOString(),
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid || acdcData.i,
            summary: `Issued by ${(meta.issuerAid || acdcData.i || 'unknown').substring(0, 12)}...`,
          }],
        };

        credentialMap.set(credId, indexed);
        registry.issuedCount++;
        registry.credentialCount++;

      } else if (meta.t === 'rev') {
        // Revocation event
        const credId = meta.acdcSaid!;
        if (!credId) continue;

        const indexed = credentialMap.get(credId);

        if (indexed) {
          indexed.status = 'revoked';
          indexed.revokedAt = meta.dt || new Date().toISOString();
          indexed.revocationEventSaid = said;
          indexed.telEvents.push({
            eventSaid: said,
            eventType: 'rev',
            timestamp: meta.dt || new Date().toISOString(),
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid,
            summary: `Revoked by ${(meta.issuerAid || 'unknown').substring(0, 12)}...`,
          });

          registry.revokedCount++;
        }

      } else if (meta.t === 'ixn') {
        // Interaction event (endorsement, attestation, etc.)
        const credId = meta.acdcSaid!;
        if (!credId) continue;

        const indexed = credentialMap.get(credId);

        if (indexed) {
          indexed.telEvents.push({
            eventSaid: said,
            eventType: 'ixn',
            timestamp: meta.dt || new Date().toISOString(),
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid,
            summary: `Interaction by ${(meta.issuerAid || 'unknown').substring(0, 12)}...`,
          });

          // Update counterparties if new actor
          if (meta.issuerAid) {
            this.addCounterparty(
              indexed,
              meta.issuerAid,
              'endorser',
              meta.dt || new Date().toISOString(),
              said
            );
          }
        }
      }
    }

    // Convert map to array
    registry.credentials = Array.from(credentialMap.values());

    // Second pass: populate linkedFrom by building reverse edge index
    for (const cred of registry.credentials) {
      for (const linkedToId of cred.linkedTo) {
        const linkedCred = credentialMap.get(linkedToId);
        if (linkedCred && !linkedCred.linkedFrom.includes(cred.credentialId)) {
          linkedCred.linkedFrom.push(cred.credentialId);
        }
      }
    }

    return registry;
  }

  /**
   * Index a specific ACDC
   */
  async indexACDC(credentialId: SAID, registryId: SAID): Promise<IndexedACDC> {
    const registry = await this.indexRegistry(registryId);
    const acdc = registry.credentials.find(c => c.credentialId === credentialId);

    if (!acdc) {
      throw new Error(`ACDC ${credentialId} not found in registry ${registryId}`);
    }

    return acdc;
  }

  /**
   * Extract backers from registry inception event
   */
  private extractBackers(vcp: any): AID[] {
    // TODO: Parse baks field from vcp event when available
    return [];
  }

  /**
   * Extract credential data from ACDC
   * Returns the subject attributes (a field)
   */
  private extractCredentialData(acdcData: any): Record<string, any> {
    if (acdcData.a) {
      // Make a copy and remove the d (SAID) and i (holder) fields
      const { d, i, dt, ...data } = acdcData.a;
      return data;
    }
    return {};
  }

  /**
   * Extract counterparties from ACDC and metadata
   */
  private extractCounterparties(
    acdcData: any,
    meta: any
  ): CounterpartyInfo[] {
    const parties: CounterpartyInfo[] = [];
    const timestamp = meta.dt || '';

    // Issuer
    if (acdcData.i) {
      parties.push({
        aid: acdcData.i,
        role: 'issuer',
        firstInteractionAt: timestamp,
        eventSaids: [meta.d],
      });
    }

    // Holder (recipient)
    if (acdcData.a?.i && acdcData.a.i !== acdcData.i) {
      parties.push({
        aid: acdcData.a.i,
        role: 'holder',
        firstInteractionAt: timestamp,
        eventSaids: [meta.d],
      });
    }

    return parties;
  }

  /**
   * Add a counterparty to the indexed ACDC
   */
  private addCounterparty(
    indexed: IndexedACDC,
    aid: AID,
    role: CounterpartyInfo['role'],
    timestamp: string,
    eventSaid: SAID
  ): void {
    let party = indexed.counterparties.find(p => p.aid === aid);

    if (!party) {
      party = {
        aid,
        role,
        firstInteractionAt: timestamp,
        eventSaids: [],
      };
      indexed.counterparties.push(party);
    }

    if (!party.eventSaids.includes(eventSaid)) {
      party.eventSaids.push(eventSaid);
    }
  }
}
