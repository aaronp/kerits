# Indexer Implementation Plan

## Overview

Implement a parallel book-keeping indexer that tracks KERI events alongside the raw KERI storage, enabling:
1. **Mutual verification** between KERI data and indexed state
2. **Fast graph traversal** for visualizations (SVG, git graphs)
3. **Fail-fast integrity checking** on every write
4. **Multi-signature support** (future-proof)

---

## Type Definitions

### Core Types

**File**: `src/app/indexer/types.ts` (extend existing)

```typescript
/**
 * Signature information for an event
 * Supports both single-sig and multi-sig identifiers
 */
export interface EventSignature {
  publicKey: string;      // ED25519 public key (CESR-encoded verfer)
  signature: string;      // ED25519 signature (CESR-encoded)
  signingIndex?: number;  // Index in multi-sig setup (0 for single-sig)
}

/**
 * Reference to another KERI entity
 */
export interface EventReference {
  type: 'KEL' | 'TEL' | 'ACDC';
  id: SAID;                              // Target SAID
  relationship: ReferenceRelationship;   // Type of relationship
}

export type ReferenceRelationship =
  // KEL references
  | 'issuer-kel'                 // TEL → KEL (issuer)
  | 'signer-kel'                 // Any event → KEL (who signed)

  // TEL references
  | 'parent-registry'            // TEL → TEL (child → parent)
  | 'child-registry-created'     // TEL → TEL (parent → child)
  | 'credential-registry'        // ACDC → TEL (which registry issued it)

  // ACDC references (edges)
  | 'edge'                       // ACDC → ACDC (credential chain edge)
  | 'edge:parentCredential'      // Specific edge name
  | 'edge:educationCred'         // (any custom edge name)
  // ... more edge types as defined in ACDC

/**
 * KEL event entry in indexer
 */
export interface KELEntry {
  // Identity & signatures
  eventId: SAID;                 // Event SAID (d field)
  eventType: 'icp' | 'rot' | 'ixn';
  signers: EventSignature[];     // At least 1 signer required

  // Temporal ordering
  sequenceNumber: number;        // Sequence number (s field)
  timestamp: string;             // ISO timestamp (dt field)
  priorEventId?: SAID;           // Prior event SAID (p field)

  // Event data
  format: 'cesr';                // Always CESR (matches KERI storage)
  eventData: string;             // CESR-encoded event as text

  // References
  references: EventReference[];  // Links to other entities

  // KEL-specific fields
  currentKeys?: string[];        // Current key set (k field)
  nextKeyDigests?: string[];     // Next key digests (n field)
  witnesses?: string[];          // Witness list (for rot events)
}

/**
 * TEL event entry in indexer
 */
export interface TELEntry {
  // Identity & signatures
  eventId: SAID;                 // Event SAID (d field)
  eventType: 'vcp' | 'iss' | 'rev' | 'ixn';
  signers: EventSignature[];     // At least 1 signer required

  // Temporal ordering
  sequenceNumber: number;        // Sequence number (s field)
  timestamp: string;             // ISO timestamp (dt field)
  priorEventId?: SAID;           // Prior event SAID (for ixn events)

  // Event data
  format: 'cesr';                // Always CESR
  eventData: string;             // CESR-encoded event as text

  // References
  references: EventReference[];  // Links to KELs, TELs, ACDCs

  // TEL-specific fields
  registryId?: SAID;             // Registry identifier (ri field)
  acdcSaid?: SAID;               // Credential SAID (for iss/rev events)
  backers?: string[];            // Backer AIDs (for vcp events)

  // Registry hierarchy (for vcp/ixn events)
  parentRegistryId?: SAID;       // Parent registry (for nested registries)
  childRegistryId?: SAID;        // Child registry (when creating nested)
}

/**
 * Complete indexer state (export format)
 */
export interface IndexerState {
  version: string;               // Indexer schema version (e.g., "1.0.0")
  generatedAt: string;           // ISO timestamp of export

  // Event logs
  kels: {
    [kelSAID: string]: KELEntry[];
  };

  tels: {
    [telSAID: string]: TELEntry[];
  };

  // Bidirectional alias mappings
  aliasById: {
    schemas: { [SAID: string]: string };
    KELs: { [SAID: string]: string };
    TELs: { [SAID: string]: string };
    ACDCs?: { [SAID: string]: string };  // Optional: credential aliases
  };

  idsByAlias: {
    schemas: { [alias: string]: SAID };
    KELs: { [alias: string]: SAID };
    TELs: { [alias: string]: SAID };
    ACDCs?: { [alias: string]: SAID };   // Optional: credential aliases
  };
}

/**
 * Integrity check report
 */
export interface IntegrityReport {
  valid: boolean;
  timestamp: string;

  // Overall statistics
  stats: {
    totalKelEvents: number;
    totalTelEvents: number;
    eventsChecked: number;
    errorsFound: number;
  };

  // Detailed errors (if any)
  errors: IntegrityError[];
}

export interface IntegrityError {
  type: 'missing-signature' | 'invalid-signature' | 'missing-publickey'
       | 'event-mismatch' | 'missing-event' | 'corrupted-data';
  eventId?: SAID;
  kelOrTelId?: SAID;
  message: string;
  details?: any;
}

/**
 * Registry hierarchy node (for graph traversal)
 */
export interface RegistryNode {
  registryId: SAID;
  alias?: string;
  parentRegistryId?: SAID;
  childRegistries: RegistryNode[];
  credentials: {
    credentialId: SAID;
    alias?: string;
    status: 'issued' | 'revoked';
  }[];
}
```

---

## Storage Schema

### Location
Store in `.keri/xref/` as per [docs/design.md](../docs/design.md):

```
.keri/
  xref/
    indexer-state.json       # Full state export (for backups/export)
    kels/
      {AID}.json            # KEL entries for each AID
    tels/
      {RID}.json            # TEL entries for each registry
    aliases.json            # Bidirectional alias mappings
```

### Storage Keys

**KV Paths**:
```typescript
// KEL entries
`xref:kel:{AID}` → KELEntry[]

// TEL entries
`xref:tel:{RID}` → TELEntry[]

// Aliases
`xref:aliases:schemas` → { byId: {}, byAlias: {} }
`xref:aliases:kels` → { byId: {}, byAlias: {} }
`xref:aliases:tels` → { byId: {}, byAlias: {} }
`xref:aliases:acdcs` → { byId: {}, byAlias: {} }
```

---

## Implementation: Core Indexer Class

**File**: `src/app/indexer/write-time-indexer.ts` (new)

```typescript
/**
 * Write-Time Indexer - Parallel book-keeping for KERI events
 *
 * This indexer maintains state alongside KERI storage, enabling:
 * - Mutual verification with raw KERI data
 * - Fast graph traversal for visualizations
 * - Fail-fast integrity checking
 */

import type { KerStore } from '../../storage/types';
import type { SAID, AID, EventType } from '../../storage/types';
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
      eventData: eventText,
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

    // Build TEL entry
    const telEntry: TELEntry = {
      eventId: event.d,
      eventType: event.t as 'vcp' | 'iss' | 'rev' | 'ixn',
      signers,
      sequenceNumber: parseInt(event.s || '0'),
      timestamp: event.dt || new Date().toISOString(),
      priorEventId: event.p,
      format: 'cesr',
      eventData: eventText,
      references: this.extractTelReferences(event),
      registryId: event.ri,
      acdcSaid: event.i && event.t !== 'vcp' ? event.i : undefined,
      backers: event.b,
      parentRegistryId: event.e?.parent?.n,
      childRegistryId: event.a?.[0]?.i, // Child registry from seal
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
    // (This requires scanning TELs - could be optimized with reverse index)
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

    // Verify KELs
    const kelAliases = await this.getAliases('KELs');
    for (const [kelId, alias] of Object.entries(kelAliases.byId)) {
      try {
        const indexedEvents = await this.getKelEvents(kelId);
        const keriEvents = await this.store.listKel(kelId);

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
        totalKelEvents: Object.values(kelAliases.byId).length,
        totalTelEvents: Object.values(telAliases.byId).length,
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

    // ISS/REV events reference credentials and registry
    if (event.t === 'iss' || event.t === 'rev') {
      if (event.ri) {
        refs.push({
          type: 'TEL',
          id: event.ri,
          relationship: 'credential-registry',
        });
      }
    }

    // ISS events may reference parent credentials via ACDC edges
    if (event.t === 'iss' && event.i) {
      // Need to fetch ACDC to get edges
      // We'll get edges from the ACDC itself
      // (This is stored separately in the ACDC event)
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

    // For ICP events, verify AID matches first public key
    if (entry.eventType === 'icp' && entry.currentKeys && entry.currentKeys.length > 0) {
      // Self-certifying identifier: AID should be derived from first key
      // (This is a KERI-specific check)
      const firstKey = entry.currentKeys[0];
      const expectedAid = entry.eventId; // In KERI, ICP's 'd' = 'i' = first key

      // We can add stricter validation here if needed
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
```

---

## DSL Integration Pattern

### Example: Adding Indexer to `createIdentity()`

**File**: `src/app/helpers.ts`

**Before**:
```typescript
export async function createIdentity(
  store: KerStore,
  params: { alias: string; keys: string[]; nextKeys: string[]; },
  keyManager?: KeyManager
): Promise<{ aid: string; icp: any }> {
  // ... create ICP event ...

  // Store signed event
  await store.putEvent(finalBytes);

  // Store alias mapping
  await store.putAlias('kel', aid, alias);

  return { aid, icp };
}
```

**After**:
```typescript
export async function createIdentity(
  store: KerStore,
  params: { alias: string; keys: string[]; nextKeys: string[]; },
  keyManager?: KeyManager
): Promise<{ aid: string; icp: any }> {
  // ... create ICP event ...

  // Store signed event in KERI storage
  await store.putEvent(finalBytes);

  // Store alias mapping in KERI storage
  await store.putAlias('kel', aid, alias);

  // === INDEXER UPDATE (parallel book-keeping) ===
  try {
    const indexer = new WriteTimeIndexer(store);

    // Add to indexer (with integrity checks)
    await indexer.addKelEvent(aid, finalBytes);

    // Update alias in indexer
    await indexer.setAlias('KELs', aid, alias);
  } catch (error) {
    // Fail fast - throw error to show data inconsistency
    throw new Error(
      `INTEGRITY ERROR: Failed to update indexer for KEL ${alias}: ${error}. ` +
      `KERI event was stored but index is now inconsistent.`
    );
  }

  return { aid, icp };
}
```

### All DSL Methods Requiring Updates

| File | Method | Event Type | Index Update |
|------|--------|-----------|--------------|
| [helpers.ts](../src/app/helpers.ts#L29) | `createIdentity()` | ICP | `addKelEvent()` + `setAlias('KELs')` |
| [helpers.ts](../src/app/helpers.ts#L91) | `createRegistry()` | VCP + IXN | `addTelEvent()` (VCP) + `addKelEvent()` (IXN) + `setAlias('TELs')` |
| [helpers.ts](../src/app/helpers.ts#L275) | `issueCredential()` | ISS | `addTelEvent()` + `setAlias('ACDCs')` if alias provided |
| [helpers.ts](../src/app/helpers.ts#L395) | `revokeCredential()` | REV | `addTelEvent()` |
| [account.ts](../src/app/dsl/builders/account.ts#L25) | `rotateKeys()` | ROT | `addKelEvent()` |
| [registry.ts](../src/app/dsl/builders/registry.ts#L26) | `issue()` | ISS | Via `issueCredential()` helper |
| [registry.ts](../src/app/dsl/builders/registry.ts#L230) | `revoke()` | REV | Via `revokeCredential()` helper |
| [registry.ts](../src/app/dsl/builders/registry.ts#L265) | `accept()` | ISS | `addTelEvent()` |
| [registry.ts](../src/app/dsl/builders/registry.ts#L359) | `createRegistry()` | VCP + IXN | Via `createRegistry()` helper |

---

## Testing Strategy

### New Test Files

1. **`test/app/write-time-indexer.test.ts`** - Core indexer operations
   - Adding KEL events
   - Adding TEL events
   - Extracting signers/references
   - Fail-fast on missing signatures

2. **`test/app/indexer-integrity.test.ts`** - Integrity verification
   - Verify KEL/TEL consistency
   - Detect missing events
   - Detect invalid signatures
   - Full state export/import

3. **`test/app/indexer-graph.test.ts`** - Graph traversal
   - Credential chains
   - Registry hierarchy
   - Reference following

### Update Existing Tests

- **`test/app/indexer.test.ts`** - Update for new API
- **`test/app/indexer-integration.test.ts`** - Add indexer verification

---

## Implementation Timeline

### Phase 1: Core Indexer (Days 1-2)
- [ ] Create type definitions in `types.ts`
- [ ] Implement `WriteTimeIndexer` class
- [ ] Add basic write operations (addKelEvent, addTelEvent)
- [ ] Add fail-fast integrity checks
- [ ] Unit tests for core operations

### Phase 2: DSL Integration (Days 3-4)
- [ ] Update `createIdentity()` in helpers.ts
- [ ] Update `createRegistry()` in helpers.ts
- [ ] Update `issueCredential()` in helpers.ts
- [ ] Update `revokeCredential()` in helpers.ts
- [ ] Update `rotateKeys()` in account.ts
- [ ] Update `accept()` in registry.ts
- [ ] Integration tests

### Phase 3: Graph Traversal (Day 5)
- [ ] Implement `getCredentialChain()`
- [ ] Implement `getRegistryHierarchy()`
- [ ] Implement `getCredentialStatus()`
- [ ] Graph traversal tests

### Phase 4: Export & Verification (Day 6)
- [ ] Implement `exportState()`
- [ ] Implement `verifyIntegrity()`
- [ ] Integrity check tests
- [ ] Full state export tests

### Phase 5: Cleanup & Documentation (Day 7)
- [ ] Update documentation
- [ ] Add inline code comments
- [ ] Create example usage guide
- [ ] Final integration testing

---

## Next Steps

Ready to start implementation? I'll begin with:

1. Create type definitions in `src/app/indexer/types.ts`
2. Create `WriteTimeIndexer` class in `src/app/indexer/write-time-indexer.ts`
3. Update `helpers.ts` `createIdentity()` as the first DSL integration example
4. Add tests for basic operations

Should I proceed?
