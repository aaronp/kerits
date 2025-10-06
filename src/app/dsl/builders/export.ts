/**
 * Export DSL for creating CESR bundles from KEL/TEL data
 */

import type { KerStore } from '../../storage/types';
import type { CESRBundle, ExportDSL, ExportOptions } from '../types/sync';
import type { IncrementalExportOptions } from '../types/contact-sync';

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
  ) {}

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
  const kelEvents = await store.listKel(aid);

  const bundle: CESRBundle = {
    type: 'kel',
    version: '1.0',
    events: kelEvents.map(e => ensureUint8Array(e.event.raw)),
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
  const telEvents = await store.listTel(registryId);

  const bundle: CESRBundle = {
    type: 'tel',
    version: '1.0',
    events: telEvents.map(e => ensureUint8Array(e.event.raw)),
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
  const credStored = await store.getEvent(credentialId);
  if (!credStored) {
    throw new Error(`Credential not found: ${credentialId}`);
  }

  // Get TEL events to find issuance
  const telEvents = await store.listTel(registryId);
  const issEvent = telEvents.find(e =>
    e.meta.t === 'iss' && e.meta.i === credentialId
  );

  const events: Uint8Array[] = [ensureUint8Array(credStored.event.raw)];
  if (issEvent) {
    events.push(ensureUint8Array(issEvent.event.raw));
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
  const allEvents = await store.listKel(aid);

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
    events: eventsToExport.map(e => ensureUint8Array(e.event.raw)),
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
  const allEvents = await store.listTel(registryId);

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
    events: eventsToExport.map(e => ensureUint8Array(e.event.raw)),
    metadata: {
      source: issuerAid,
      created: new Date().toISOString(),
      scope: { registryId },
    },
  };

  return new ExportDSLImpl(bundle);
}
