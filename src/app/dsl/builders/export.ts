/**
 * Export DSL for creating CESR bundles from KEL/TEL data
 */

import type { KerStore } from '../../../storage/types';
import type { CESRBundle, ExportDSL, ExportOptions } from '../types/sync';
import type { IncrementalExportOptions } from '../types/contact-sync';
import { s } from '../../../types/keri';

// Helper to ensure Uint8Array from various storage formats
function ensureUint8Array(raw: any): Uint8Array {
  if (raw instanceof Uint8Array) {
    return raw;
  } else if (Array.isArray(raw)) {
    return new Uint8Array(raw);
  } else if (typeof raw === 'object' && raw !== null) {
    // Object like {0: 45, 1: 75, ...}
    return new Uint8Array(Object.values(raw));
  }
  throw new Error(`Cannot convert to Uint8Array: ${typeof raw}`);
}

export class ExportDSLImpl implements ExportDSL {
  constructor(
    private readonly bundle: CESRBundle
  ) { }

  asBundle(): CESRBundle {
    return this.bundle;
  }

  asRaw(): Uint8Array[] {
    return this.bundle.events;
  }

  toJSON(): string {
    // Convert Uint8Array events to base64 for JSON serialization
    return JSON.stringify({
      ...this.bundle,
      events: this.bundle.events.map(e =>
        btoa(String.fromCharCode(...Array.from(e)))
      ),
    }, null, 2);
  }

  toCESR(): Uint8Array {
    // Concatenate all raw CESR event bytes
    const totalLength = this.bundle.events.reduce((sum, e) => sum + e.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const event of this.bundle.events) {
      result.set(event, offset);
      offset += event.length;
    }
    return result;
  }

  async toFile(path: string, format: 'json' | 'cesr' = 'cesr'): Promise<void> {
    if (format === 'json') {
      const json = this.toJSON();
      await Bun.write(path, json);
    } else {
      const cesr = this.toCESR();
      await Bun.write(path, cesr);
    }
  }
}

/**
 * Create KEL export from account events
 */
export async function exportKel(
  store: KerStore,
  aid: string,
  options: ExportOptions = {}
): Promise<ExportDSL> {
  const kelEvents = await store.listKel(s(aid).asAID());

  const bundle: CESRBundle = {
    type: 'kel',
    version: '1.0',
    events: kelEvents.map(e => ensureUint8Array(e.raw)),
    metadata: {
      source: aid,
      created: new Date().toISOString(),
      scope: { aid },
    },
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Create TEL export from registry events
 */
export async function exportTel(
  store: KerStore,
  registryId: string,
  issuerAid?: string,
  options: ExportOptions = {}
): Promise<ExportDSL> {
  const telEvents = await store.listTel(s(registryId).asSAID());
  const events: Uint8Array[] = telEvents.map(e => ensureUint8Array(e.raw));

  // Optionally include referenced ACDC credentials
  if (options.includeACDCs) {
    // Find all credential IDs referenced in ISS events
    const credentialIds = new Set<string>();
    for (const event of telEvents) {
      if (event.meta.t === 'iss' && event.meta.i) {
        credentialIds.add(event.meta.i);
      }
    }

    // Fetch and include ACDC events
    for (const credId of credentialIds) {
      try {
        const credEvent = await store.getEvent(s(credId).asSAID());
        if (credEvent) {
          events.push(ensureUint8Array(credEvent.raw));
        }
      } catch (err) {
        // Skip if credential not found
        console.warn(`Could not find ACDC ${credId} for TEL export`);
      }
    }
  }

  const bundle: CESRBundle = {
    type: options.includeACDCs ? 'mixed' : 'tel',
    version: '1.0',
    events,
    metadata: {
      source: issuerAid,
      created: new Date().toISOString(),
      scope: { registryId },
    },
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Create ACDC export (credential + issuance event)
 */
export async function exportAcdc(
  store: KerStore,
  credentialId: string,
  registryId: string,
  issuerAid?: string,
  options: ExportOptions = {}
): Promise<ExportDSL> {
  // Get credential ACDC
  const credStored = await store.getEvent(s(credentialId).asSAID());
  if (!credStored) {
    throw new Error(`Credential not found: ${credentialId}`);
  }

  // Get TEL events to find issuance
  const telEvents = await store.listTel(s(registryId).asSAID());
  const issEvent = telEvents.find(e =>
    e.meta.t === 'iss' && e.meta.i === credentialId
  );

  const events: Uint8Array[] = [ensureUint8Array(credStored.raw)];
  if (issEvent) {
    events.push(ensureUint8Array(issEvent.raw));
  }

  const bundle: CESRBundle = {
    type: 'acdc',
    version: '1.0',
    events,
    metadata: {
      source: issuerAid,
      created: new Date().toISOString(),
      scope: { credentialId, registryId },
    },
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Create mixed export with multiple event types
 */
export async function exportMixed(
  events: Uint8Array[],
  metadata: CESRBundle['metadata']
): Promise<ExportDSL> {
  const bundle: CESRBundle = {
    type: 'mixed',
    version: '1.0',
    events,
    metadata,
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Create incremental KEL export (only new events after a pointer)
 */
export async function exportKelIncremental(
  store: KerStore,
  aid: string,
  options: IncrementalExportOptions = {}
): Promise<ExportDSL> {
  const allEvents = await store.listKel(s(aid).asAID());

  // Find starting point
  let startIndex = 0;
  if (options.afterSaid) {
    startIndex = allEvents.findIndex(e => e.meta.d === options.afterSaid) + 1;
  } else if (options.afterSeq) {
    startIndex = allEvents.findIndex(e => e.meta.s === options.afterSeq) + 1;
  }

  // Get new events
  const newEvents = allEvents.slice(startIndex);
  const limit = options.limit || newEvents.length;
  const eventsToExport = newEvents.slice(0, limit);

  const bundle: CESRBundle = {
    type: 'kel',
    version: '1.0',
    events: eventsToExport.map(e => ensureUint8Array(e.raw)),
    metadata: {
      source: aid,
      created: new Date().toISOString(),
      scope: { aid },
    },
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Create incremental TEL export (only new events after a pointer)
 */
export async function exportTelIncremental(
  store: KerStore,
  registryId: string,
  issuerAid?: string,
  options: IncrementalExportOptions = {}
): Promise<ExportDSL> {
  const allEvents = await store.listTel(s(registryId).asSAID());

  // Find starting point
  let startIndex = 0;
  if (options.afterSaid) {
    startIndex = allEvents.findIndex(e => e.meta.d === options.afterSaid) + 1;
  }

  // Get new events
  const newEvents = allEvents.slice(startIndex);
  const limit = options.limit || newEvents.length;
  const eventsToExport = newEvents.slice(0, limit);

  const bundle: CESRBundle = {
    type: 'tel',
    version: '1.0',
    events: eventsToExport.map(e => ensureUint8Array(e.raw)),
    metadata: {
      source: issuerAid,
      created: new Date().toISOString(),
      scope: { registryId },
    },
  };

  return new ExportDSLImpl(bundle);
}

/**
 * Import TEL data from CESR bundle or raw bytes
 *
 * TEL events are globally unique by their registry ID, so they can be safely
 * imported into the store alongside the user's own TELs.
 *
 * @param store - KerStore to import into
 * @param data - CESR bundle, raw bytes, or ExportDSL
 * @returns Number of events imported
 */
export async function importTel(
  store: KerStore,
  data: CESRBundle | Uint8Array | ExportDSL
): Promise<{ eventsImported: number; acdcsImported: number; registryId?: string }> {
  let events: Uint8Array[];
  let registryId: string | undefined;

  // Handle different input formats
  if (data instanceof Uint8Array) {
    // Raw CESR bytes - split into individual events
    // For now, treat as single concatenated stream
    events = [data];
  } else if ('asBundle' in data) {
    // ExportDSL
    const bundle = data.asBundle();
    events = bundle.events;
    registryId = bundle.metadata.scope?.registryId;
  } else {
    // CESRBundle
    events = data.events;
    registryId = data.metadata.scope?.registryId;
  }

  let eventsImported = 0;
  let acdcsImported = 0;

  // Import each event
  for (const eventBytes of events) {
    try {
      // Store the event (putEvent handles deduplication)
      await store.putEvent(ensureUint8Array(eventBytes));

      // Parse the event to count it
      const eventText = new TextDecoder().decode(eventBytes);

      // Find the JSON portion (after version string)
      // Format: -KERI10JSON<size>_{"t":"vcp",...}
      const jsonStart = eventText.indexOf('{');
      if (jsonStart >= 0) {
        // Find the closing brace for the JSON object
        let jsonEnd = jsonStart;
        let braceCount = 0;
        for (let i = jsonStart; i < eventText.length; i++) {
          if (eventText[i] === '{') braceCount++;
          if (eventText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }

        const jsonStr = eventText.substring(jsonStart, jsonEnd);
        const eventJson = JSON.parse(jsonStr);

        // ACDC events have no 't' field at top level, or t='acdc'
        // TEL events have t='vcp', 'iss', 'rev', 'bis', 'brv'
        if (!eventJson.t || eventJson.t === 'acdc') {
          acdcsImported++;

          // Also store in JSON format for quick retrieval
          const acdcKey = {
            path: ['acdc', eventJson.d],
            type: 'json' as const,
            meta: { immutable: true },
          };
          const encodeJson = (obj: any) => new TextEncoder().encode(JSON.stringify(obj));
          await store.kv.putStructured!(acdcKey, encodeJson(eventJson));
        } else {
          eventsImported++;
        }
      }
    } catch (err) {
      console.warn('Failed to import event:', err);
      // Continue with next event
    }
  }

  return { eventsImported, acdcsImported, registryId };
}
