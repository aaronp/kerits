# ACDC Indexer Design

## Problem Statement

Users need to explore their ACDC data in a tree-like structure:
```
Registry → ACDC → Schema → Fields (with latest values)
```

To enable this, we need an **Indexer** that can:
1. **Aggregate TEL chains** - Replay TEL events to compute current state
2. **List all schemas** used by an ACDC
3. **Get latest data** for an ACDC (current attribute values)
4. **List counterparties** - All SAIDs that have interacted in the TEL chain

## Opinion & Approach

### Architecture Choice: **Query-Time Indexing** (Recommended)

I recommend a **query-time indexing** approach rather than a persistent materialized view, because:

✅ **Simplicity** - No separate index storage, no sync issues
✅ **Consistency** - Always accurate since it reads from source of truth
✅ **Storage efficiency** - No duplication of data
✅ **Development speed** - No complex cache invalidation logic
✅ **KERI philosophy** - Verifiable by replay, not trusting cached state

The performance trade-off is acceptable because:
- TEL chains are typically short (inception → issuance → maybe revocation)
- ACDCs are immutable once issued (only status changes)
- Caching can be added later if needed at the DSL level

### Alternative Considered: **Materialized Index**

A materialized index (separate KV prefix with aggregated state) was considered but **rejected** for MVP:

❌ **Complexity** - Requires write-time updates, cache invalidation
❌ **Consistency challenges** - Index can get out of sync with events
❌ **Storage overhead** - Duplicates data already in event log
❌ **Premature optimization** - TEL chains are small, replay is cheap

**Future consideration**: If performance becomes an issue with large registries (1000+ credentials), implement as a **read-through cache** layer.

---

## Design

### 1. Indexer Module Location

```
src/app/indexer/
├── types.ts           # Indexer-specific types
├── tel-indexer.ts     # TEL chain aggregation logic
├── acdc-indexer.ts    # ACDC-specific queries
└── index.ts           # Public exports
```

### 2. Core Types

```typescript
/**
 * Aggregated ACDC state from TEL chain
 */
interface IndexedACDC {
  // Identity
  credentialId: SAID;           // ACDC SAID
  registryId: SAID;             // Registry identifier

  // Issuance info
  issuerAid: AID;               // Who issued
  holderAid?: AID;              // Who holds (recipient)
  issuedAt: string;             // ISO timestamp from iss event
  issuanceEventSaid: SAID;      // iss event SAID

  // Schema info
  schemas: SchemaUsage[];       // All schemas referenced (allows versioning)

  // Current state
  status: 'issued' | 'revoked'; // Current status
  revokedAt?: string;           // ISO timestamp if revoked
  revocationEventSaid?: SAID;   // rev event SAID if revoked

  // Credential data
  latestData: Record<string, any>; // Current attribute values (from a.d in ACDC)

  // Interaction history
  counterparties: CounterpartyInfo[]; // All parties in TEL chain
  telEvents: TELEventSummary[];      // Summarized TEL history
}

/**
 * Schema usage tracking
 */
interface SchemaUsage {
  schemaSaid: SAID;             // Schema identifier
  firstUsedAt: string;          // When first referenced
  eventSaid: SAID;              // Event that introduced it
}

/**
 * Counterparty tracking
 */
interface CounterpartyInfo {
  aid: AID;                     // Counterparty AID
  role: 'issuer' | 'backer' | 'endorser' | 'witness';
  firstInteractionAt: string;   // When they first appeared
  eventSaids: SAID[];           // Events they participated in
}

/**
 * TEL event summary (for history view)
 */
interface TELEventSummary {
  eventSaid: SAID;
  eventType: 'vcp' | 'iss' | 'rev' | 'ixn' | 'vrt';
  timestamp: string;
  sequenceNumber: number;
  actor?: AID;                  // Who performed the action
  summary: string;              // Human-readable description
}

/**
 * Registry-level index
 */
interface IndexedRegistry {
  registryId: SAID;
  issuerAid: AID;
  inceptionAt: string;
  backers: AID[];

  // Aggregated stats
  credentialCount: number;
  issuedCount: number;
  revokedCount: number;

  // Credentials in this registry
  credentials: IndexedACDC[];
}
```

### 3. TEL Indexer Implementation

```typescript
/**
 * TEL Indexer - Aggregates TEL chains to compute state
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
      inceptionAt: vcp.meta.dt || vcp.event.ingestedAt,
      backers: [], // Extract from vcp.meta (TODO: parse baks field)
      credentialCount: 0,
      issuedCount: 0,
      revokedCount: 0,
      credentials: [],
    };

    // Track credentials by SAID
    const credentialMap = new Map<SAID, IndexedACDC>();

    // Replay TEL events in order
    for (const telEvent of telEvents) {
      const { meta, event } = telEvent;

      if (meta.t === 'iss') {
        // Issuance event
        const credId = meta.acdcSaid!;

        // Get the ACDC itself
        const acdcEvent = await this.store.getEvent(credId);
        if (!acdcEvent) continue;

        const acdcData = JSON.parse(
          new TextDecoder().decode(acdcEvent.event.raw)
        );

        const indexed: IndexedACDC = {
          credentialId: credId,
          registryId,
          issuerAid: acdcData.i,
          holderAid: acdcData.a?.i, // Recipient from subject
          issuedAt: meta.dt || event.ingestedAt,
          issuanceEventSaid: event.said,
          schemas: [{
            schemaSaid: acdcData.s,
            firstUsedAt: meta.dt || event.ingestedAt,
            eventSaid: event.said,
          }],
          status: 'issued',
          latestData: acdcData.a || {}, // Subject attributes
          counterparties: this.extractCounterparties(acdcData, meta),
          telEvents: [{
            eventSaid: event.said,
            eventType: 'iss',
            timestamp: meta.dt || event.ingestedAt,
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid,
            summary: `Issued by ${meta.issuerAid?.substring(0, 12)}...`,
          }],
        };

        credentialMap.set(credId, indexed);
        registry.issuedCount++;
        registry.credentialCount++;

      } else if (meta.t === 'rev') {
        // Revocation event
        const credId = meta.acdcSaid!;
        const indexed = credentialMap.get(credId);

        if (indexed) {
          indexed.status = 'revoked';
          indexed.revokedAt = meta.dt || event.ingestedAt;
          indexed.revocationEventSaid = event.said;
          indexed.telEvents.push({
            eventSaid: event.said,
            eventType: 'rev',
            timestamp: meta.dt || event.ingestedAt,
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid,
            summary: `Revoked by ${meta.issuerAid?.substring(0, 12)}...`,
          });

          registry.revokedCount++;
        }

      } else if (meta.t === 'ixn') {
        // Interaction event (endorsement, attestation, etc.)
        const credId = meta.acdcSaid!;
        const indexed = credentialMap.get(credId);

        if (indexed) {
          indexed.telEvents.push({
            eventSaid: event.said,
            eventType: 'ixn',
            timestamp: meta.dt || event.ingestedAt,
            sequenceNumber: parseInt(meta.s || '0'),
            actor: meta.issuerAid,
            summary: `Interaction by ${meta.issuerAid?.substring(0, 12)}...`,
          });

          // Update counterparties if new actor
          this.addCounterparty(
            indexed,
            meta.issuerAid!,
            'endorser',
            meta.dt || event.ingestedAt,
            event.said
          );
        }
      }
    }

    // Convert map to array
    registry.credentials = Array.from(credentialMap.values());

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
   * Extract counterparties from ACDC and metadata
   */
  private extractCounterparties(
    acdcData: any,
    meta: any
  ): CounterpartyInfo[] {
    const parties: CounterpartyInfo[] = [];

    // Issuer
    if (acdcData.i) {
      parties.push({
        aid: acdcData.i,
        role: 'issuer',
        firstInteractionAt: meta.dt || '',
        eventSaids: [meta.d],
      });
    }

    // TODO: Extract backers, witnesses, etc. from registry inception

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
```

### 4. DSL Integration

Add indexer methods to existing DSL interfaces:

```typescript
// RegistryDSL additions
interface RegistryDSL {
  // ... existing methods ...

  /**
   * Get indexed view of this registry
   */
  index(): Promise<IndexedRegistry>;

  /**
   * List all credentials with their current state
   */
  listCredentials(): Promise<IndexedACDC[]>;
}

// ACDCDSL additions
interface ACDCDSL {
  // ... existing methods ...

  /**
   * Get indexed view of this credential
   */
  index(): Promise<IndexedACDC>;

  /**
   * Get latest credential data
   */
  getLatestData(): Promise<Record<string, any>>;

  /**
   * Get all schemas used by this credential
   */
  getSchemas(): Promise<SchemaUsage[]>;

  /**
   * Get all counterparties
   */
  getCounterparties(): Promise<CounterpartyInfo[]>;

  /**
   * Get full TEL history for this credential
   */
  getHistory(): Promise<TELEventSummary[]>;
}
```

### 5. Implementation in DSL Builders

```typescript
// src/app/dsl/builders/registry.ts
export function createRegistryDSL(
  registry: Registry,
  account: Account,
  store: KerStore
): RegistryDSL {
  const indexer = new TELIndexer(store);

  return {
    // ... existing methods ...

    async index(): Promise<IndexedRegistry> {
      return indexer.indexRegistry(registry.registryId);
    },

    async listCredentials(): Promise<IndexedACDC[]> {
      const indexed = await indexer.indexRegistry(registry.registryId);
      return indexed.credentials;
    },
  };
}

// src/app/dsl/builders/acdc.ts
export function createACDCDSL(
  acdc: ACDC,
  registry: Registry,
  store: KerStore
): ACDCDSL {
  const indexer = new TELIndexer(store);

  return {
    // ... existing methods ...

    async index(): Promise<IndexedACDC> {
      return indexer.indexACDC(acdc.credentialId, registry.registryId);
    },

    async getLatestData(): Promise<Record<string, any>> {
      const indexed = await this.index();
      return indexed.latestData;
    },

    async getSchemas(): Promise<SchemaUsage[]> {
      const indexed = await this.index();
      return indexed.schemas;
    },

    async getCounterparties(): Promise<CounterpartyInfo[]> {
      const indexed = await this.index();
      return indexed.counterparties;
    },

    async getHistory(): Promise<TELEventSummary[]> {
      const indexed = await this.index();
      return indexed.telEvents;
    },
  };
}
```

---

## CLI Integration

### Tree Navigation UI

```typescript
/**
 * Credential Explorer Menu
 *
 * Shows tree-like navigation:
 * Registry → Credentials → Schema → Fields
 */
async function exploreRegistry(registryAlias: string) {
  const registryDsl = await accountDsl.registry(registryAlias);
  const indexed = await registryDsl.index();

  p.intro(`Explore Registry: ${registryAlias}`);
  p.note(
    `Credentials: ${indexed.credentialCount}\n` +
    `Issued: ${indexed.issuedCount}\n` +
    `Revoked: ${indexed.revokedCount}`,
    'Registry Stats'
  );

  // Show credentials as tree
  const credOptions = indexed.credentials.map(cred => ({
    value: cred.credentialId,
    label: `${cred.credentialId.substring(0, 16)}... (${cred.status})`,
  }));

  const selected = await p.select({
    message: 'Select credential to explore:',
    options: credOptions,
  });

  if (!p.isCancel(selected)) {
    await exploreCredential(registryDsl, selected);
  }
}

async function exploreCredential(registryDsl: RegistryDSL, credentialId: SAID) {
  const acdcDsl = registryDsl.credential(credentialId);
  const indexed = await acdcDsl.index();

  p.intro(`Credential: ${credentialId.substring(0, 20)}...`);

  // Show overview
  p.note(
    `Status: ${indexed.status}\n` +
    `Issued: ${indexed.issuedAt}\n` +
    `Issuer: ${indexed.issuerAid}\n` +
    `Holder: ${indexed.holderAid || '(self)'}`,
    'Overview'
  );

  const action = await p.select({
    message: 'What would you like to view?',
    options: [
      { value: 'data', label: 'View Latest Data (Fields & Values)' },
      { value: 'schema', label: 'View Schemas' },
      { value: 'counterparties', label: 'View Counterparties' },
      { value: 'history', label: 'View TEL History' },
      { value: 'back', label: 'Back' },
    ],
  });

  if (p.isCancel(action) || action === 'back') return;

  switch (action) {
    case 'data':
      // Show credential data in tree format
      p.note(
        JSON.stringify(indexed.latestData, null, 2),
        'Credential Data'
      );
      break;

    case 'schema':
      // Show all schemas used
      const schemaLines = indexed.schemas.map(s =>
        `${s.schemaSaid}\n  First used: ${s.firstUsedAt}`
      ).join('\n\n');
      p.note(schemaLines, 'Schemas');
      break;

    case 'counterparties':
      // Show all counterparties
      const partyLines = indexed.counterparties.map(cp =>
        `${cp.aid} (${cp.role})\n  First interaction: ${cp.firstInteractionAt}\n  Events: ${cp.eventSaids.length}`
      ).join('\n\n');
      p.note(partyLines, 'Counterparties');
      break;

    case 'history':
      // Show TEL event history
      const historyLines = indexed.telEvents.map(evt =>
        `[${evt.sequenceNumber}] ${evt.eventType} - ${evt.timestamp}\n  ${evt.summary}`
      ).join('\n\n');
      p.note(historyLines, 'TEL History');
      break;
  }
}
```

---

## Implementation Plan

### Phase 1: Core Indexer (Week 1)
1. Create `src/app/indexer/types.ts` with all interfaces
2. Implement `TELIndexer` class with `indexRegistry()` and `indexACDC()`
3. Add unit tests for TEL chain replay logic

### Phase 2: DSL Integration (Week 1)
1. Add indexer methods to `RegistryDSL` and `ACDCDSL`
2. Update DSL builders to instantiate indexer
3. Add integration tests

### Phase 3: CLI Explorer (Week 2)
1. Create `menus/explorer.ts` with tree navigation
2. Add "Explore Registry" option to registries menu
3. Implement drill-down views (credential → schema → fields)

### Phase 4: Optimization (Future)
1. Add memoization/caching at DSL level if needed
2. Consider materialized index for large registries (1000+ credentials)
3. Add pagination for large result sets

---

## Performance Considerations

**Current Approach (Query-Time)**:
- TEL replay for 100 credentials: ~10-50ms (acceptable)
- TEL replay for 1000 credentials: ~100-500ms (acceptable)
- TEL replay for 10,000 credentials: ~1-5s (start considering cache)

**If Cache Needed**:
```typescript
class CachedTELIndexer extends TELIndexer {
  private cache = new Map<SAID, { data: IndexedRegistry; expiresAt: number }>();

  async indexRegistry(registryId: SAID): Promise<IndexedRegistry> {
    const cached = this.cache.get(registryId);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const indexed = await super.indexRegistry(registryId);

    // Cache for 5 minutes
    this.cache.set(registryId, {
      data: indexed,
      expiresAt: now + 5 * 60 * 1000,
    });

    return indexed;
  }
}
```

---

## Security Considerations

1. **Verification**: Indexer should verify SAID integrity during replay
2. **Access Control**: Ensure users can only index their own registries
3. **Resource Limits**: Prevent DOS by limiting max credentials indexed per call
4. **Privacy**: Don't log sensitive credential data during indexing

---

## Testing Strategy

1. **Unit Tests**: TEL replay with various event sequences
2. **Integration Tests**: Index real registries with multiple credentials
3. **Edge Cases**: Empty registry, revoked credentials, schema changes
4. **Performance Tests**: Benchmark indexing speed with varying credential counts

---

## Summary

**Recommended Approach**: Query-time indexing with TEL replay

**Key Benefits**:
- ✅ Simple, consistent, verifiable
- ✅ No storage overhead
- ✅ Always up-to-date
- ✅ Fits KERI philosophy

**Implementation**:
1. `TELIndexer` class for aggregation logic
2. New DSL methods: `index()`, `getLatestData()`, `getSchemas()`, `getCounterparties()`
3. CLI tree explorer for registry → credential → schema → fields navigation

**Timeline**: 1-2 weeks for full implementation + testing
