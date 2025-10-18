/**
 * KerStore - Modern storage layer using structured keys
 *
 * Key features:
 * - Raw CESR bytes stored separately from metadata
 * - Structured keys throughout (no string concatenation)
 * - HEAD tracking for latest events
 * - Content-addressable ACDC storage
 * - Clean alias API
 */

import type { Kv, StorageKey, EventMeta, SAID, AID, CesrEncoding, KerStore, StoreOptions, PutResult, KelEvent, TelEvent } from './types';
import { CesrHasher, DefaultJsonCesrParser } from './parser';

// Helper functions
function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function encodeJson(obj: unknown): Uint8Array {
  return utf8Encode(JSON.stringify(obj));
}

function decodeJson<T>(bytes: Uint8Array): T {
  return JSON.parse(utf8Decode(bytes)) as T;
}

/**
 * Create a new KerStore instance
 */
export function createKerStore(kv: Kv, opts?: StoreOptions): KerStore {
  const hasher = opts?.hasher ?? new CesrHasher();
  const parser = opts?.parser ?? new DefaultJsonCesrParser(hasher);
  const clock = opts?.clock ?? (() => new Date().toISOString());
  const defaultEncoding = opts?.defaultEncoding ?? 'binary';

  // Ensure KV supports structured keys
  if (!kv.putStructured || !kv.getStructured) {
    throw new Error('KV implementation must support structured keys (putStructured/getStructured)');
  }

  /**
   * Store an event (KEL or TEL)
   */
  async function putEvent(
    rawCesr: Uint8Array,
    encoding: CesrEncoding = defaultEncoding
  ): Promise<PutResult> {
    const parsed = parser.parse(rawCesr);
    const { meta } = parsed;

    if (!meta.t || !meta.d) {
      throw new Error('Parsed meta missing t or d');
    }

    const said = meta.d;
    const now = clock();

    // Determine if KEL or TEL event
    // Priority: check for ri (TEL) first, then i (KEL)
    const isTel = meta.ri !== undefined;
    const isKel = !isTel && meta.i !== undefined;

    // Build storage key for raw CESR
    let eventKey: StorageKey;
    if (isKel) {
      if (!meta.i) throw new Error('KEL event missing AID (i)');
      eventKey = {
        path: ['kel', meta.i, said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: encoding,
          immutable: true
        }
      };
    } else if (isTel) {
      if (!meta.ri) throw new Error('TEL event missing registry ID (ri)');
      eventKey = {
        path: ['tel', meta.ri, said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: encoding,
          immutable: true
        }
      };
    } else {
      // Unknown/generic event type - store in generic events directory
      eventKey = {
        path: ['events', said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: encoding,
          immutable: true
        }
      };
    }

    // Store raw CESR
    await kv.putStructured!(eventKey, rawCesr);

    // Store metadata separately (include encoding so we know how to retrieve the raw CESR)
    const metaKey: StorageKey = {
      path: ['meta', said],
      type: 'json',
      meta: { immutable: true }
    };
    await kv.putStructured!(metaKey, encodeJson({ ...meta, cesrEncoding: encoding, ingestedAt: now }));

    // Update HEAD pointer
    if (isKel && meta.i) {
      await setKelHead(meta.i, said);
    } else if (isTel && meta.ri) {
      await setTelHead(meta.ri, said);
    }

    // Update indexes
    if (meta.i && meta.s !== undefined) {
      const idxKey: StorageKey = {
        path: ['idx', 'kel', meta.i, String(meta.s)],
        type: 'text'
      };
      await kv.putStructured!(idxKey, utf8Encode(said));
    }

    if (meta.ri && isTel) {
      const idxKey: StorageKey = {
        path: ['idx', 'tel', meta.ri, said],
        type: 'text'
      };
      await kv.putStructured!(idxKey, utf8Encode(now));
    }

    if (meta.p) {
      const prevKey: StorageKey = {
        path: ['idx', 'prev', meta.p],
        type: 'text'
      };
      await kv.putStructured!(prevKey, utf8Encode(said));
    }

    return { said, meta };
  }

  /**
   * Get an event by SAID
   */
  async function getEvent(said: SAID): Promise<{ raw: Uint8Array; meta: EventMeta } | null> {
    // Get metadata first to determine path
    const metaKey: StorageKey = {
      path: ['meta', said],
      type: 'json'
    };

    const metaBytes = await kv.getStructured!(metaKey);
    if (!metaBytes) return null;

    const meta = decodeJson<EventMeta>(metaBytes);

    // Determine path based on event type
    // Priority: check for ri (TEL) first, then i (KEL)
    const isTel = meta.ri !== undefined;
    const isKel = !isTel && meta.i !== undefined;

    let eventKey: StorageKey;
    if (isKel && meta.i) {
      eventKey = {
        path: ['kel', meta.i, said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: meta.cesrEncoding || 'binary'  // Use encoding from metadata
        }
      };
    } else if (isTel && meta.ri) {
      eventKey = {
        path: ['tel', meta.ri, said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: meta.cesrEncoding || 'binary'
        }
      };
    } else {
      // Generic/unknown event type
      eventKey = {
        path: ['events', said],
        type: 'cesr',
        meta: {
          eventType: meta.t,
          cesrEncoding: meta.cesrEncoding || 'binary'
        }
      };
    }

    const raw = await kv.getStructured!(eventKey);
    if (!raw) return null;

    return { raw, meta };
  }

  /**
   * Store a KEL event
   */
  async function putKelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult> {
    const result = await putEvent(raw, encoding);

    // Verify it's actually a KEL event
    const isKel = ['icp', 'rot', 'ixn'].includes(result.meta.t);
    if (!isKel) {
      throw new Error(`Not a KEL event: ${result.meta.t}`);
    }

    return result;
  }

  /**
   * Store a TEL event
   */
  async function putTelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult> {
    const result = await putEvent(raw, encoding);

    // Verify it's actually a TEL event
    const isTel = ['vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'].includes(result.meta.t);
    if (!isTel) {
      throw new Error(`Not a TEL event: ${result.meta.t}`);
    }

    return result;
  }

  /**
   * List KEL events for an AID
   */
  async function listKel(aid: AID, fromS = 0, toS = Number.MAX_SAFE_INTEGER): Promise<KelEvent[]> {
    const prefix: StorageKey = {
      path: ['kel', aid]
    };

    const results = await kv.listStructured!(prefix);
    const events: KelEvent[] = [];

    for (const { key, value } of results) {
      if (!value) continue;

      const said = key.path[2] as SAID;
      const metaKey: StorageKey = {
        path: ['meta', said],
        type: 'json'
      };

      const metaBytes = await kv.getStructured!(metaKey);
      if (!metaBytes) continue;

      const meta = decodeJson<EventMeta>(metaBytes);
      const seq = parseInt(meta.s || '0', 16);  // Hex, not decimal!

      if (seq >= fromS && seq <= toS) {
        events.push({ said, raw: value, meta });
      }
    }

    // Sort by sequence number
    events.sort((a, b) => {
      const seqA = parseInt(a.meta.s || '0', 10);
      const seqB = parseInt(b.meta.s || '0', 10);
      return seqA - seqB;
    });

    return events;
  }

  /**
   * List TEL events for a registry
   */
  async function listTel(ri: SAID, fromS = 0): Promise<TelEvent[]> {
    const prefix: StorageKey = {
      path: ['tel', ri]
    };

    const results = await kv.listStructured!(prefix);
    const events: TelEvent[] = [];

    for (const { key, value } of results) {
      if (!value) continue;

      const said = key.path[2] as SAID;
      const metaKey: StorageKey = {
        path: ['meta', said],
        type: 'json'
      };

      const metaBytes = await kv.getStructured!(metaKey);
      if (!metaBytes) continue;

      const meta = decodeJson<EventMeta>(metaBytes);
      events.push({ said, raw: value, meta });
    }

    return events;
  }

  /**
   * Get HEAD of KEL chain
   */
  async function getKelHead(aid: AID): Promise<SAID | null> {
    const headKey: StorageKey = {
      path: ['head', 'kel', aid],
      type: 'text'
    };

    const bytes = await kv.getStructured!(headKey);
    if (!bytes) return null;

    return utf8Decode(bytes) as SAID;
  }

  /**
   * Set HEAD of KEL chain
   */
  async function setKelHead(aid: AID, said: SAID): Promise<void> {
    const headKey: StorageKey = {
      path: ['head', 'kel', aid],
      type: 'text'
    };

    await kv.putStructured!(headKey, utf8Encode(said));
  }

  /**
   * Get HEAD of TEL chain
   */
  async function getTelHead(ri: SAID): Promise<SAID | null> {
    const headKey: StorageKey = {
      path: ['head', 'tel', ri],
      type: 'text'
    };

    const bytes = await kv.getStructured!(headKey);
    if (!bytes) return null;

    return utf8Decode(bytes) as SAID;
  }

  /**
   * Set HEAD of TEL chain
   */
  async function setTelHead(ri: SAID, said: SAID): Promise<void> {
    const headKey: StorageKey = {
      path: ['head', 'tel', ri],
      type: 'text'
    };

    await kv.putStructured!(headKey, utf8Encode(said));
  }

  /**
   * Store an ACDC (content-addressable)
   */
  async function putACDC(acdc: any): Promise<SAID> {
    // Compute SAID if not present
    const said = acdc.d || hasher.computeSaid(encodeJson(acdc));

    const acdcKey: StorageKey = {
      path: ['acdc', said],
      type: 'json',
      meta: { immutable: true }
    };

    await kv.putStructured!(acdcKey, encodeJson(acdc));
    return said;
  }

  /**
   * Get an ACDC by SAID
   */
  async function getACDC(said: SAID): Promise<any | null> {
    const acdcKey: StorageKey = {
      path: ['acdc', said],
      type: 'json'
    };

    const bytes = await kv.getStructured!(acdcKey);
    if (!bytes) return null;

    return decodeJson(bytes);
  }

  /**
   * Store a schema (content-addressable)
   */
  async function putSchema(schema: any): Promise<SAID> {
    // Compute SAID if not present
    const said = schema.$id || hasher.computeSaid(encodeJson(schema));

    const schemaKey: StorageKey = {
      path: ['schema', said],
      type: 'json',
      meta: { immutable: true }
    };

    await kv.putStructured!(schemaKey, encodeJson(schema));
    return said;
  }

  /**
   * Get a schema by SAID
   */
  async function getSchema(said: SAID): Promise<any | null> {
    const schemaKey: StorageKey = {
      path: ['schema', said],
      type: 'json'
    };

    const bytes = await kv.getStructured!(schemaKey);
    if (!bytes) return null;

    return decodeJson(bytes);
  }

  /**
   * Store an alias
   */
  async function putAlias(
    scope: 'kel' | 'tel' | 'schema' | 'acdc',
    said: SAID,
    alias: string
  ): Promise<void> {
    // Store alias -> SAID mapping
    const aliasKey: StorageKey = {
      path: ['alias', scope, alias],
      type: 'text'
    };
    await kv.putStructured!(aliasKey, utf8Encode(said));

    // Store reverse SAID -> alias mapping
    const reverseKey: StorageKey = {
      path: ['alias', scope, '_reverse', said],
      type: 'text'
    };
    await kv.putStructured!(reverseKey, utf8Encode(alias));
  }

  /**
   * Get SAID for an alias
   */
  async function getAliasSaid(
    scope: 'kel' | 'tel' | 'schema' | 'acdc',
    alias: string
  ): Promise<SAID | null> {
    const aliasKey: StorageKey = {
      path: ['alias', scope, alias],
      type: 'text'
    };

    const bytes = await kv.getStructured!(aliasKey);
    if (!bytes) return null;

    return utf8Decode(bytes) as SAID;
  }

  /**
   * Get alias for a SAID
   */
  async function getSaidAlias(
    scope: 'kel' | 'tel' | 'schema' | 'acdc',
    said: SAID
  ): Promise<string | null> {
    const reverseKey: StorageKey = {
      path: ['alias', scope, '_reverse', said],
      type: 'text'
    };

    const bytes = await kv.getStructured!(reverseKey);
    if (!bytes) return null;

    return utf8Decode(bytes);
  }

  /**
   * List all aliases in a scope
   */
  async function listAliases(scope: 'kel' | 'tel' | 'schema' | 'acdc'): Promise<string[]> {
    const prefix: StorageKey = {
      path: ['alias', scope]
    };

    const results = await kv.listStructured!(prefix, { keysOnly: true });
    const aliases: string[] = [];

    for (const { key } of results) {
      const lastPart = key.path[key.path.length - 1];
      // Skip reverse mappings
      if (key.path.includes('_reverse')) continue;
      aliases.push(lastPart);
    }

    return aliases.sort();
  }

  /**
   * Delete an alias
   */
  async function delAlias(
    scope: 'kel' | 'tel' | 'schema' | 'acdc',
    alias: string
  ): Promise<void> {
    // Get SAID first for reverse mapping
    const said = await getAliasSaid(scope, alias);

    // Delete alias -> SAID mapping
    const aliasKey: StorageKey = {
      path: ['alias', scope, alias],
      type: 'text'
    };
    await kv.delStructured!(aliasKey);

    // Delete reverse mapping
    if (said) {
      const reverseKey: StorageKey = {
        path: ['alias', scope, '_reverse', said],
        type: 'text'
      };
      await kv.delStructured!(reverseKey);
    }
  }

  /**
   * Clear all data (for testing)
   */
  async function clear(): Promise<void> {
    if (kv.clear) {
      await kv.clear();
    } else {
      throw new Error('KV does not support clear operation');
    }
  }

  /**
   * Get events by prior SAID
   */
  async function getByPrior(priorSaid: SAID): Promise<Array<{ raw: Uint8Array; meta: EventMeta }>> {
    const prefix: StorageKey = {
      path: ['idx', 'prev', priorSaid],
      type: 'text'
    };

    const results = await kv.listStructured!(prefix);
    const events: Array<{ raw: Uint8Array; meta: EventMeta }> = [];

    for (const { value } of results) {
      if (!value) continue;
      const said = utf8Decode(value) as SAID;
      const event = await getEvent(said);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  // Backward-compatible alias methods
  async function aliasToId(scope: string, alias: string): Promise<string | null> {
    return getAliasSaid(scope as any, alias);
  }

  async function idToAlias(scope: string, id: string): Promise<string | null> {
    return getSaidAlias(scope as any, id as SAID);
  }

  return {
    kv,
    putEvent,
    getEvent,
    putKelEvent,
    listKel,
    getKelHead,
    setKelHead,
    putTelEvent,
    listTel,
    getTelHead,
    setTelHead,
    putACDC,
    getACDC,
    putSchema,
    getSchema,
    putAlias,
    getAliasSaid,
    getSaidAlias,
    listAliases,
    delAlias,
    getByPrior,
    clear,
    // Backward-compatible methods
    aliasToId,
    idToAlias
  };
}
