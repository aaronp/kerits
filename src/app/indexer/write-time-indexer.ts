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
import { s } from '../../types/keri';
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
  constructor(private store: KerStore) { }

  /**
   * Factory method to create indexer and ensure detailed error context
   *
   * Usage: await WriteTimeIndexer.withStore(store).addKelEvent(aid, bytes)
   */
  static withStore(store: KerStore): WriteTimeIndexer {
    return new WriteTimeIndexer(store);
  }

  // ========================================
  // WRITE OPERATIONS (called during DSL ops)
  // ========================================

  /**
   * Add a KEL event to the index
   * Called after store.putEvent() for KEL events
   *
   * @throws {Error} If event lacks required signature/publicKey (fail-fast)
   */
  async addKelEvent(kelAid: AID, eventBytes: Uint8Array): Promise<void> {
    try {
      // Parse event and extract metadata
      const parsed = parseCesrStream(eventBytes);
      const eventText = new TextDecoder().decode(parsed.event);
      const jsonStart = eventText.indexOf('{');
      if (jsonStart < 0) {
        throw new Error(`Failed to parse KEL event: no JSON found`);
      }

      const event = JSON.parse(eventText.substring(jsonStart));

      // Extract signatures and public keys
      const signers = await this.extractSigners({ ...parsed, signatures: parsed.signatures || undefined }, event);
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
      await this.appendKelEntry(kelAid, kelEntry);
    } catch (error) {
      throw new Error(
        `Failed to update indexer for KEL ${kelAid}: ${error}. ` +
        `KERI event was stored but index is now inconsistent.`
      );
    }
  }

  /**
   * Add a TEL event to the index
   * Called after store.putEvent() for TEL events
   *
   * @throws {Error} If event lacks required signature/publicKey (fail-fast)
   */
  async addTelEvent(telSaid: SAID, eventBytes: Uint8Array): Promise<void> {
    try {
      // Parse event and extract metadata
      const parsed = parseCesrStream(eventBytes);
      const eventText = new TextDecoder().decode(parsed.event);
      const jsonStart = eventText.indexOf('{');
      if (jsonStart < 0) {
        throw new Error(`Failed to parse TEL event: no JSON found`);
      }

      const event = JSON.parse(eventText.substring(jsonStart));

      // Extract signatures and public keys
      const signers = await this.extractSigners({ ...parsed, signatures: parsed.signatures || undefined }, event);
      if (signers.length === 0) {
        throw new Error(
          `INTEGRITY ERROR: TEL event ${event.d} has no signatures. ` +
          `All KERI events must be signed.`
        );
      }

      // Extract child registry ID from seal (if present)
      let childRegistryId: SAID | undefined;
      if (event.t === 'ixn' && event.a) {
        // TEL IXN seals can be in two formats:
        // 1. Array of seal objects: [{i: "...", d: "..."}]
        // 2. Single object with childRegistry field: {registryAnchor: true, childRegistry: "..."}
        if (Array.isArray(event.a)) {
          for (const seal of event.a) {
            if (seal.i) {
              childRegistryId = seal.i;
              break;
            }
          }
        } else if (event.a.childRegistry) {
          childRegistryId = event.a.childRegistry;
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
    } catch (error) {
      throw new Error(
        `Failed to update indexer for TEL ${telSaid}: ${error}. ` +
        `KERI event was stored but index is now inconsistent.`
      );
    }
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
  async getKelEvents(kelAid: AID): Promise<KELEntry[]> {
    const key = `xref:kel:${kelAid}`;
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
      const events = await this.getTelEvents(s(telId).asSAID());

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
      const events = await this.getTelEvents(s(telId).asSAID());

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
      state.kels[kelId] = await this.getKelEvents(s(kelId).asAID());
    }

    // Export TELs
    const telAliases = await this.getAliases('TELs');
    for (const telId of Object.keys(telAliases.byId)) {
      state.tels[telId] = await this.getTelEvents(s(telId).asSAID());
    }

    // Export aliases
    state.aliasById.schemas = (await this.getAliases('schemas')).byId as { [SAID: string]: string };
    state.aliasById.KELs = kelAliases.byId as { [SAID: string]: string };
    state.aliasById.TELs = telAliases.byId as { [SAID: string]: string };
    state.aliasById.ACDCs = (await this.getAliases('ACDCs')).byId as { [SAID: string]: string };

    state.idsByAlias.schemas = (await this.getAliases('schemas')).byAlias as { [alias: string]: SAID };
    state.idsByAlias.KELs = kelAliases.byAlias as { [alias: string]: SAID };
    state.idsByAlias.TELs = telAliases.byAlias as { [alias: string]: SAID };
    state.idsByAlias.ACDCs = (await this.getAliases('ACDCs')).byAlias as { [alias: string]: SAID };

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
        const indexedEvents = await this.getKelEvents(s(kelId).asAID());
        const keriEvents = await this.store.listKel(s(kelId).asAID());

        totalKelEvents += keriEvents.length;

        if (indexedEvents.length !== keriEvents.length) {
          errors.push({
            type: 'event-mismatch',
            kelOrTelId: s(kelId).asSAID(),
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
              kelOrTelId: s(kelId).asSAID(),
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
          kelOrTelId: s(kelId).asSAID(),
          message: `Failed to verify KEL ${alias}: ${error}`,
        });
      }
    }

    // Verify TELs
    const telAliases = await this.getAliases('TELs');
    for (const [telId, alias] of Object.entries(telAliases.byId)) {
      try {
        const indexedEvents = await this.getTelEvents(s(telId).asSAID());
        const keriEvents = await this.store.listTel(s(telId).asSAID());

        totalTelEvents += keriEvents.length;

        if (indexedEvents.length !== keriEvents.length) {
          errors.push({
            type: 'event-mismatch',
            kelOrTelId: s(telId).asSAID(),
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
              kelOrTelId: s(telId).asSAID(),
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
          kelOrTelId: s(telId).asSAID(),
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

    // Get public keys from event
    let publicKeys: string[] = [];

    if (event.t === 'icp' && event.k) {
      // ICP events: 'k' field contains the signing keys
      publicKeys = event.k;
    } else if (event.t === 'rot' && event.i) {
      // ROT events: 'k' field contains NEW keys, but event is signed with PRIOR keys
      // Need to find the prior event to get signing keys
      try {
        const kelEvents = await this.store.listKel(event.i);

        // Find the event referenced by 'p' (prior event digest)
        let priorEventIndex = -1;
        for (let i = 0; i < kelEvents.length; i++) {
          if (kelEvents[i].meta.d === event.p) {
            priorEventIndex = i;
            break;
          }
        }

        if (priorEventIndex === -1) {
          throw new Error(
            `INTEGRITY ERROR: Could not find prior event ${event.p} for ROT event ${event.d}`
          );
        }

        // Scan backwards from prior event to find most recent event with keys (ICP or ROT)
        // This handles cases where prior is an IXN (which has no 'k' field)
        for (let i = priorEventIndex; i >= 0; i--) {
          const kelEvent = kelEvents[i];
          const { event: eventBytes } = parseCesrStream(kelEvent.raw);
          const eventText = new TextDecoder().decode(eventBytes);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            const parsedEvent = JSON.parse(eventText.substring(jsonStart));
            // ICP and ROT events have 'k' field with keys
            if (parsedEvent.k && parsedEvent.k.length > 0) {
              publicKeys = parsedEvent.k;
              break;
            }
          }
        }

        if (publicKeys.length === 0) {
          throw new Error(
            `INTEGRITY ERROR: Could not find keys in KEL for ROT ${event.d} (scanned back from prior ${event.p})`
          );
        }
      } catch (error) {
        throw new Error(
          `INTEGRITY ERROR: Failed to get prior keys for ROT event ${event.d}: ${error}`
        );
      }
    } else if (event.t === 'ixn' && event.i && !event.ri) {
      // KEL IXN events don't have 'k' - get current keys from KEL
      // Need to find the most recent ICP or ROT (events with 'k' field)
      try {
        const kelEvents = await this.store.listKel(event.i);

        // Scan backwards through KEL to find the most recent event with keys
        for (let i = kelEvents.length - 1; i >= 0; i--) {
          const kelEvent = kelEvents[i];
          const { event: eventBytes } = parseCesrStream(kelEvent.raw);
          const eventText = new TextDecoder().decode(eventBytes);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            const parsedEvent = JSON.parse(eventText.substring(jsonStart));
            if (parsedEvent.k && parsedEvent.k.length > 0) {
              publicKeys = parsedEvent.k;
              break;
            }
          }
        }

        if (publicKeys.length === 0) {
          throw new Error(
            `INTEGRITY ERROR: Could not find current keys for KEL ${event.i} (no ICP/ROT in ${kelEvents.length} events)`
          );
        }
      } catch (error) {
        throw new Error(
          `INTEGRITY ERROR: Failed to get KEL keys for IXN event ${event.d}: ${error}`
        );
      }
    } else if (event.ii) {
      // VCP events have issuer KEL in 'ii' field
      try {
        const issuerKelEvents = await this.store.listKel(event.ii);
        if (issuerKelEvents.length === 0) {
          throw new Error(`No KEL events found for issuer ${event.ii}`);
        }

        // Find the most recent KEL event that has keys (ICP or ROT)
        for (let i = issuerKelEvents.length - 1; i >= 0; i--) {
          const kelEvent = issuerKelEvents[i];
          const { event: eventBytes } = parseCesrStream(kelEvent.raw);
          const eventText = new TextDecoder().decode(eventBytes);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            const parsedEvent = JSON.parse(eventText.substring(jsonStart));
            if (parsedEvent.k && parsedEvent.k.length > 0) {
              publicKeys = parsedEvent.k;
              break;
            }
          }
        }

        if (publicKeys.length === 0) {
          throw new Error(
            `INTEGRITY ERROR: Could not find signing keys for issuer ${event.ii}`
          );
        }
      } catch (error) {
        throw new Error(
          `INTEGRITY ERROR: Failed to get issuer keys for VCP event ${event.d}: ${error}`
        );
      }
    } else if ((event.t === 'iss' || event.t === 'rev' || event.t === 'ixn') && event.ri) {
      // TEL IXN events (registry interactions) - get keys from registry issuer's KEL
      // First need to find the registry's issuer from its VCP
      try {
        const telEvents = await this.store.listTel(event.ri);
        if (telEvents.length === 0) {
          throw new Error(`No TEL events found for registry ${event.ri}`);
        }

        // Find VCP to get issuer
        let issuerAid: string | null = null;
        for (const telEvent of telEvents) {
          if (telEvent.meta.t === 'vcp') {
            const { event: eventBytes } = parseCesrStream(telEvent.raw);
            const eventText = new TextDecoder().decode(eventBytes);
            const jsonStart = eventText.indexOf('{');
            if (jsonStart >= 0) {
              const vcpEvent = JSON.parse(eventText.substring(jsonStart));
              issuerAid = vcpEvent.ii;
              break;
            }
          }
        }

        if (!issuerAid) {
          throw new Error(`Could not find issuer for registry ${event.ri}`);
        }

        // Now get the issuer's keys
        const issuerKelEvents = await this.store.listKel(s(issuerAid).asAID());
        for (let i = issuerKelEvents.length - 1; i >= 0; i--) {
          const kelEvent = issuerKelEvents[i];
          const { event: eventBytes } = parseCesrStream(kelEvent.raw);
          const eventText = new TextDecoder().decode(eventBytes);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            const parsedEvent = JSON.parse(eventText.substring(jsonStart));
            if (parsedEvent.k && parsedEvent.k.length > 0) {
              publicKeys = parsedEvent.k;
              break;
            }
          }
        }

        if (publicKeys.length === 0) {
          throw new Error(
            `INTEGRITY ERROR: Could not find signing keys for registry issuer ${issuerAid}`
          );
        }
      } catch (error) {
        throw new Error(
          `INTEGRITY ERROR: Failed to get keys for TEL IXN event ${event.d}: ${error}`
        );
      }
    }

    if (publicKeys.length === 0) {
      throw new Error(
        `INTEGRITY ERROR: Event ${event.d} has no public keys available`
      );
    }

    for (const sig of indexedSigs) {
      const publicKey = publicKeys[sig.index] || null;

      if (!publicKey) {
        throw new Error(
          `INTEGRITY ERROR: Event ${event.d} signature at index ${sig.index} ` +
          `has no corresponding public key (event has ${publicKeys.length} keys)`
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

    // TEL IXN events may reference child registries
    if (event.t === 'ixn' && event.a) {
      // Handle both seal formats
      if (Array.isArray(event.a)) {
        for (const seal of event.a) {
          if (seal.i) {
            refs.push({
              type: 'TEL',
              id: seal.i,
              relationship: 'child-registry-created',
            });
          }
        }
      } else if (event.a.childRegistry) {
        refs.push({
          type: 'TEL',
          id: event.a.childRegistry,
          relationship: 'child-registry-created',
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
  private async appendKelEntry(kelAid: AID, entry: KELEntry): Promise<void> {
    const entries = await this.getKelEvents(kelAid);
    entries.push(entry);

    const key = `xref:kel:${kelAid}`;
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
