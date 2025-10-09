/**
 * Write-Time Indexer - Parallel book-keeping for KERI events
 *
 * This indexer maintains state alongside KERI storage, enabling:
 * - Mutual verification with raw KERI data
 * - Fast graph traversal for visualizations
 * - Fail-fast integrity checking
 *
 * The indexer is updated in parallel with KERI storage (not derived from it),
 * allowing both to serve as checks on each other.
 */

import type { KerStore } from '../../storage/types';
import type { SAID, AID } from '../../storage/types';
import { parseCesrStream, parseIndexedSignatures } from '../signing';
import { verifyEvent } from '../verification';
import type {
  IndexerState,
  KELEntry,
  TELEntry,
  EventSignature,
  EventReference,
  IntegrityReport,
  IntegrityError,
  RegistryNode,
} from './types';

export class WriteTimeIndexer {
  constructor(private store: KerStore) {}

  // ========================================
  // WRITE OPERATIONS (called during DSL ops)
  // ========================================

  /**
   * Add a KEL event to the index
   * Called after store.putEvent() for KEL events
   *
   * @throws {Error} If event lacks required signature/publicKey (fail-fast)
   */
  async addKelEvent(kelSaid: SAID, eventBytes: Uint8Array): Promise<void> {
    // Parse event and extract metadata
    const parsed = parseCesrStream(eventBytes);
    const eventText = new TextDecoder().decode(parsed.event);
    const jsonStart = eventText.indexOf('{');
    if (jsonStart < 0) {
      throw new Error(`Failed to parse KEL event: no JSON found`);
    }

    const event = JSON.parse(eventText.substring(jsonStart));

    // Extract signatures and public keys
    const signers = await this.extractSigners(parsed, event);
    if (signers.length === 0) {
      throw new Error(
        `INTEGRITY ERROR: KEL event ${event.d} has no signatures. ` +
        `All KERI events must be signed.`
      );
    }

    // Build KEL entry
    const kelEntry: KELEntry = {
      eventId: event.d,
      eventType: event.t as 'icp' | 'rot' | 'ixn',
      signers,
      sequenceNumber: parseInt(event.s || '0'),
      timestamp: event.dt || new Date().toISOString(),
      priorEventId: event.p,
      format: 'cesr',
      eventData: new TextDecoder().decode(eventBytes),
      references: this.extractKelReferences(event),
      currentKeys: event.k,
      nextKeyDigests: event.n,
      witnesses: event.b,
    };

    // Verify integrity before storing
    await this.verifyKelEntry(kelEntry, eventBytes);

    // Store in index
    await this.appendKelEntry(kelSaid, kelEntry);
  }

  /**
   * Add a TEL event to the index
   * Called after store.putEvent() for TEL events
   *
   * @throws {Error} If event lacks required signature/publicKey (fail-fast)
   */
  async addTelEvent(telSaid: SAID, eventBytes: Uint8Array): Promise<void> {
    // Parse event and extract metadata
    const parsed = parseCesrStream(eventBytes);
    const eventText = new TextDecoder().decode(parsed.event);
    const jsonStart = eventText.indexOf('{');
    if (jsonStart < 0) {
      throw new Error(`Failed to parse TEL event: no JSON found`);
    }

    const event = JSON.parse(eventText.substring(jsonStart));

    // Extract signatures and public keys
    const signers = await this.extractSigners(parsed, event);
    if (signers.length === 0) {
      throw new Error(
        `INTEGRITY ERROR: TEL event ${event.d} has no signatures. ` +
        `All KERI events must be signed.`
      );
    }

    // Extract child registry ID from seal (if present)
    let childRegistryId: SAID | undefined;
    if (event.t === 'ixn' && event.a && Array.isArray(event.a)) {
      for (const seal of event.a) {
        if (seal.i) {
          childRegistryId = seal.i;
          break;
        }
      }
    }

    // Build TEL entry
    const telEntry: TELEntry = {
      eventId: event.d,
      eventType: event.t as 'vcp' | 'iss' | 'rev' | 'ixn',
      signers,
      sequenceNumber: parseInt(event.s || '0'),
      timestamp: event.dt || new Date().toISOString(),
      priorEventId: event.p,
      format: 'cesr',
      eventData: new TextDecoder().decode(eventBytes),
      references: this.extractTelReferences(event),
      registryId: event.ri,
      acdcSaid: event.i && event.t !== 'vcp' ? event.i : undefined,
      backers: event.b,
      parentRegistryId: event.e?.parent?.n,
      childRegistryId,
    };

    // Verify integrity before storing
    await this.verifyTelEntry(telEntry, eventBytes);

    // Store in index
    await this.appendTelEntry(telSaid, telEntry);
  }

  /**
   * Set alias for a KERI entity
   */
  async setAlias(
    scope: 'schemas' | 'KELs' | 'TELs' | 'ACDCs',
    said: SAID,
    alias: string
  ): Promise<void> {
    const aliases = await this.getAliases(scope);

    aliases.byId[said] = alias;
    aliases.byAlias[alias] = said;

    await this.saveAliases(scope, aliases);
  }

  // ========================================
  // READ OPERATIONS (query index)
  // ========================================

  /**
   * Get all KEL events for an identifier
   */
  async getKelEvents(kelSaid: SAID): Promise<KELEntry[]> {
    const key = `xref:kel:${kelSaid}`;
    const data = await this.store.kv.get(key);

    if (!data) return [];

    return JSON.parse(new TextDecoder().decode(data));
  }

  /**
   * Get all TEL events for a registry
   */
  async getTelEvents(telSaid: SAID): Promise<TELEntry[]> {
    const key = `xref:tel:${telSaid}`;
    const data = await this.store.kv.get(key);

    if (!data) return [];

    return JSON.parse(new TextDecoder().decode(data));
  }

  /**
   * Get credential status from indexed TEL
   */
  async getCredentialStatus(
    credentialId: SAID
  ): Promise<'issued' | 'revoked' | 'not-found'> {
    // Find which registry contains this credential
    const telAliases = await this.getAliases('TELs');

    for (const telId of Object.keys(telAliases.byId)) {
      const events = await this.getTelEvents(telId);

      // Find ISS event for this credential
      const issEvent = events.find(
        e => e.eventType === 'iss' && e.acdcSaid === credentialId
      );

      if (issEvent) {
        // Check if there's a subsequent REV event
        const revEvent = events.find(
          e => e.eventType === 'rev' &&
               e.acdcSaid === credentialId &&
               e.sequenceNumber > issEvent.sequenceNumber
        );

        return revEvent ? 'revoked' : 'issued';
      }
    }

    return 'not-found';
  }

  // ========================================
  // GRAPH TRAVERSAL
  // ========================================

  /**
   * Get credential chain (following edges)
   */
  async getCredentialChain(credentialId: SAID): Promise<SAID[]> {
    const chain: SAID[] = [credentialId];
    const visited = new Set<SAID>([credentialId]);

    // Find TEL events for this credential
    const telAliases = await this.getAliases('TELs');

    for (const telId of Object.keys(telAliases.byId)) {
      const events = await this.getTelEvents(telId);

      const issEvent = events.find(
        e => e.eventType === 'iss' && e.acdcSaid === credentialId
      );

      if (issEvent) {
        // Follow edge references
        for (const ref of issEvent.references) {
          if (ref.type === 'ACDC' && !visited.has(ref.id)) {
            visited.add(ref.id);
            // Recursively get parent credential chain
            const parentChain = await this.getCredentialChain(ref.id);
            chain.push(...parentChain);
          }
        }
        break;
      }
    }

    return chain;
  }

  /**
   * Get registry hierarchy tree
   */
  async getRegistryHierarchy(registryId: SAID): Promise<RegistryNode> {
    const events = await this.getTelEvents(registryId);
    const aliases = await this.getAliases('TELs');
    const acdcAliases = await this.getAliases('ACDCs');

    const node: RegistryNode = {
      registryId,
      alias: aliases.byId[registryId],
      childRegistries: [],
      credentials: [],
    };

    // Find parent from VCP event
    const vcp = events.find(e => e.eventType === 'vcp');
    if (vcp?.parentRegistryId) {
      node.parentRegistryId = vcp.parentRegistryId;
    }

    // Find child registries from IXN events
    for (const event of events) {
      if (event.eventType === 'ixn' && event.childRegistryId) {
        const childNode = await this.getRegistryHierarchy(event.childRegistryId);
        node.childRegistries.push(childNode);
      }
    }

    // Find credentials from ISS events
    for (const event of events) {
      if (event.eventType === 'iss' && event.acdcSaid) {
        const status = await this.getCredentialStatus(event.acdcSaid);
        node.credentials.push({
          credentialId: event.acdcSaid,
          alias: acdcAliases.byId[event.acdcSaid],
          status: status as 'issued' | 'revoked',
        });
      }
    }

    return node;
  }

  // ========================================
  // EXPORT & VERIFICATION
  // ========================================

  /**
   * Export complete indexer state
   */
  async exportState(): Promise<IndexerState> {
    const state: IndexerState = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      kels: {},
      tels: {},
      aliasById: {
        schemas: {},
        KELs: {},
        TELs: {},
        ACDCs: {},
      },
      idsByAlias: {
        schemas: {},
        KELs: {},
        TELs: {},
        ACDCs: {},
      },
    };

    // Export KELs
    const kelAliases = await this.getAliases('KELs');
    for (const kelId of Object.keys(kelAliases.byId)) {
      state.kels[kelId] = await this.getKelEvents(kelId);
    }

    // Export TELs
    const telAliases = await this.getAliases('TELs');
    for (const telId of Object.keys(telAliases.byId)) {
      state.tels[telId] = await this.getTelEvents(telId);
    }

    // Export aliases
    state.aliasById.schemas = (await this.getAliases('schemas')).byId;
    state.aliasById.KELs = kelAliases.byId;
    state.aliasById.TELs = telAliases.byId;
    state.aliasById.ACDCs = (await this.getAliases('ACDCs')).byId;

    state.idsByAlias.schemas = (await this.getAliases('schemas')).byAlias;
    state.idsByAlias.KELs = kelAliases.byAlias;
    state.idsByAlias.TELs = telAliases.byAlias;
    state.idsByAlias.ACDCs = (await this.getAliases('ACDCs')).byAlias;

    return state;
  }

  /**
   * Verify indexer integrity against raw KERI storage
   */
  async verifyIntegrity(): Promise<IntegrityReport> {
    const errors: IntegrityError[] = [];
    let eventsChecked = 0;
    let totalKelEvents = 0;
    let totalTelEvents = 0;

    // Verify KELs
    const kelAliases = await this.getAliases('KELs');
    for (const [kelId, alias] of Object.entries(kelAliases.byId)) {
      try {
        const indexedEvents = await this.getKelEvents(kelId);
        const keriEvents = await this.store.listKel(kelId);

        totalKelEvents += keriEvents.length;

        if (indexedEvents.length !== keriEvents.length) {
          errors.push({
            type: 'event-mismatch',
            kelOrTelId: kelId,
            message: `KEL ${alias} has ${keriEvents.length} events in KERI but ${indexedEvents.length} in index`,
          });
        }

        for (const indexedEvent of indexedEvents) {
          eventsChecked++;
          const keriEvent = keriEvents.find(e => e.meta.d === indexedEvent.eventId);

          if (!keriEvent) {
            errors.push({
              type: 'missing-event',
              eventId: indexedEvent.eventId,
              kelOrTelId: kelId,
              message: `Event ${indexedEvent.eventId} in index but not in KERI storage`,
            });
            continue;
          }

          // Verify signatures match
          await this.verifyEventSignatures(indexedEvent, keriEvent.raw, errors);
        }
      } catch (error) {
        errors.push({
          type: 'corrupted-data',
          kelOrTelId: kelId,
          message: `Failed to verify KEL ${alias}: ${error}`,
        });
      }
    }

    // Verify TELs
    const telAliases = await this.getAliases('TELs');
    for (const [telId, alias] of Object.entries(telAliases.byId)) {
      try {
        const indexedEvents = await this.getTelEvents(telId);
        const keriEvents = await this.store.listTel(telId);

        totalTelEvents += keriEvents.length;

        if (indexedEvents.length !== keriEvents.length) {
          errors.push({
            type: 'event-mismatch',
            kelOrTelId: telId,
            message: `TEL ${alias} has ${keriEvents.length} events in KERI but ${indexedEvents.length} in index`,
          });
        }

        for (const indexedEvent of indexedEvents) {
          eventsChecked++;
          const keriEvent = keriEvents.find(e => e.meta.d === indexedEvent.eventId);

          if (!keriEvent) {
            errors.push({
              type: 'missing-event',
              eventId: indexedEvent.eventId,
              kelOrTelId: telId,
              message: `Event ${indexedEvent.eventId} in index but not in KERI storage`,
            });
            continue;
          }

          // Verify signatures match
          await this.verifyEventSignatures(indexedEvent, keriEvent.raw, errors);
        }
      } catch (error) {
        errors.push({
          type: 'corrupted-data',
          kelOrTelId: telId,
          message: `Failed to verify TEL ${alias}: ${error}`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      timestamp: new Date().toISOString(),
      stats: {
        totalKelEvents,
        totalTelEvents,
        eventsChecked,
        errorsFound: errors.length,
      },
      errors,
    };
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  /**
   * Extract signers (public keys + signatures) from event
   */
  private async extractSigners(
    parsed: { event: Uint8Array; signatures?: Uint8Array },
    event: any
  ): Promise<EventSignature[]> {
    if (!parsed.signatures) {
      return [];
    }

    const indexedSigs = parseIndexedSignatures(parsed.signatures);
    const signers: EventSignature[] = [];

    // Get public keys from event's 'k' field (current keys)
    const publicKeys = event.k || [];

    for (const sig of indexedSigs) {
      const publicKey = publicKeys[sig.index] || null;

      if (!publicKey) {
        throw new Error(
          `INTEGRITY ERROR: Event ${event.d} signature at index ${sig.index} ` +
          `has no corresponding public key in 'k' field`
        );
      }

      signers.push({
        publicKey,
        signature: sig.signature,
        signingIndex: sig.index,
      });
    }

    return signers;
  }

  /**
   * Extract references from KEL event
   */
  private extractKelReferences(event: any): EventReference[] {
    const refs: EventReference[] = [];

    // IXN events may have seals (anchoring TELs/registries)
    if (event.t === 'ixn' && event.a && Array.isArray(event.a)) {
      for (const seal of event.a) {
        if (seal.i) {
          // This is a TEL anchor seal
          refs.push({
            type: 'TEL',
            id: seal.i,
            relationship: 'child-registry-created',
          });
        }
      }
    }

    return refs;
  }

  /**
   * Extract references from TEL event
   */
  private extractTelReferences(event: any): EventReference[] {
    const refs: EventReference[] = [];

    // VCP events may have parent registry
    if (event.t === 'vcp') {
      if (event.e?.parent?.n) {
        refs.push({
          type: 'TEL',
          id: event.e.parent.n,
          relationship: 'parent-registry',
        });
      }

      // Issuer KEL reference
      if (event.ii) {
        refs.push({
          type: 'KEL',
          id: event.ii,
          relationship: 'issuer-kel',
        });
      }
    }

    // ISS/REV events reference registry
    if ((event.t === 'iss' || event.t === 'rev') && event.ri) {
      refs.push({
        type: 'TEL',
        id: event.ri,
        relationship: 'credential-registry',
      });
    }

    return refs;
  }

  /**
   * Verify KEL entry integrity (fail-fast)
   */
  private async verifyKelEntry(
    entry: KELEntry,
    eventBytes: Uint8Array
  ): Promise<void> {
    // Verify at least one signer
    if (entry.signers.length === 0) {
      throw new Error(
        `INTEGRITY ERROR: KEL event ${entry.eventId} has no signers`
      );
    }

    // Verify signatures
    const publicKeys = entry.signers.map(s => s.publicKey);
    const verifyResult = await verifyEvent(eventBytes, publicKeys, 1);

    if (!verifyResult.valid) {
      throw new Error(
        `INTEGRITY ERROR: KEL event ${entry.eventId} signature verification failed: ` +
        `${verifyResult.errors.join(', ')}`
      );
    }
  }

  /**
   * Verify TEL entry integrity (fail-fast)
   */
  private async verifyTelEntry(
    entry: TELEntry,
    eventBytes: Uint8Array
  ): Promise<void> {
    // Verify at least one signer
    if (entry.signers.length === 0) {
      throw new Error(
        `INTEGRITY ERROR: TEL event ${entry.eventId} has no signers`
      );
    }

    // Verify signatures
    const publicKeys = entry.signers.map(s => s.publicKey);
    const verifyResult = await verifyEvent(eventBytes, publicKeys, 1);

    if (!verifyResult.valid) {
      throw new Error(
        `INTEGRITY ERROR: TEL event ${entry.eventId} signature verification failed: ` +
        `${verifyResult.errors.join(', ')}`
      );
    }
  }

  /**
   * Verify event signatures during integrity check
   */
  private async verifyEventSignatures(
    indexedEvent: KELEntry | TELEntry,
    keriEventBytes: Uint8Array,
    errors: IntegrityError[]
  ): Promise<void> {
    try {
      const publicKeys = indexedEvent.signers.map(s => s.publicKey);
      const verifyResult = await verifyEvent(keriEventBytes, publicKeys, 1);

      if (!verifyResult.valid) {
        errors.push({
          type: 'invalid-signature',
          eventId: indexedEvent.eventId,
          message: `Signature verification failed: ${verifyResult.errors.join(', ')}`,
        });
      }
    } catch (error) {
      errors.push({
        type: 'invalid-signature',
        eventId: indexedEvent.eventId,
        message: `Failed to verify signature: ${error}`,
      });
    }
  }

  /**
   * Append KEL entry to storage
   */
  private async appendKelEntry(kelSaid: SAID, entry: KELEntry): Promise<void> {
    const entries = await this.getKelEvents(kelSaid);
    entries.push(entry);

    const key = `xref:kel:${kelSaid}`;
    const data = new TextEncoder().encode(JSON.stringify(entries, null, 2));

    await this.store.kv.put(key, data);
  }

  /**
   * Append TEL entry to storage
   */
  private async appendTelEntry(telSaid: SAID, entry: TELEntry): Promise<void> {
    const entries = await this.getTelEvents(telSaid);
    entries.push(entry);

    const key = `xref:tel:${telSaid}`;
    const data = new TextEncoder().encode(JSON.stringify(entries, null, 2));

    await this.store.kv.put(key, data);
  }

  /**
   * Get aliases for a scope
   */
  private async getAliases(
    scope: 'schemas' | 'KELs' | 'TELs' | 'ACDCs'
  ): Promise<{ byId: Record<string, string>; byAlias: Record<string, string> }> {
    const key = `xref:aliases:${scope.toLowerCase()}`;
    const data = await this.store.kv.get(key);

    if (!data) {
      return { byId: {}, byAlias: {} };
    }

    return JSON.parse(new TextDecoder().decode(data));
  }

  /**
   * Save aliases for a scope
   */
  private async saveAliases(
    scope: 'schemas' | 'KELs' | 'TELs' | 'ACDCs',
    aliases: { byId: Record<string, string>; byAlias: Record<string, string> }
  ): Promise<void> {
    const key = `xref:aliases:${scope.toLowerCase()}`;
    const data = new TextEncoder().encode(JSON.stringify(aliases, null, 2));

    await this.store.kv.put(key, data);
  }
}
