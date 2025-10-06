/**
 * Import DSL for loading CESR bundles into storage
 */

import type { KerStore } from '../../storage/types';
import type { CESRBundle, ImportDSL, ImportOptions, ImportResult } from '../types/sync';

export class ImportDSLImpl implements ImportDSL {
  constructor(private readonly store: KerStore) {}

  async fromBundle(bundle: CESRBundle, options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // Add metadata IDs to result
    if (bundle.metadata.scope?.aid) {
      result.aid = bundle.metadata.scope.aid;
    }
    if (bundle.metadata.scope?.registryId) {
      result.registryId = bundle.metadata.scope.registryId;
    }
    if (bundle.metadata.scope?.credentialId) {
      result.credentialId = bundle.metadata.scope.credentialId;
    }

    for (const eventBytes of bundle.events) {
      try {
        // Extract event data for processing
        const eventText = new TextDecoder().decode(eventBytes);
        const jsonMatch = eventText.match(/\{.*\}/s);
        if (!jsonMatch) {
          result.failed++;
          result.errors.push('Invalid event format: no JSON found');
          continue;
        }

        const eventData = JSON.parse(jsonMatch[0]);
        const said = eventData.d;

        // Verify SAID if requested
        if (options.verify && said) {
          const { saidify } = await import('../../../saidify');
          try {
            let eventForVerification: any;

            // Check if version string includes size (has '_' terminator)
            const hasVersionSize = eventData.v && eventData.v.includes('_');

            if (hasVersionSize && (eventData.t === 'vcp' || eventData.t === 'iss' || eventData.t === 'rev' || eventData.t === 'bis' || eventData.t === 'brv' || eventData.t === 'vrt')) {
              // TEL events with version strings require special handling
              const { versify, Protocol, VERSION_1_0, Kind } = await import('../../../versify');

              // Set d (and i for vcp) to placeholders for size calculation
              eventForVerification = { ...eventData, d: '#'.repeat(44) };
              if (eventData.t === 'vcp' && eventData.i === said) {
                eventForVerification.i = '#'.repeat(44);
              }

              // Compute size with placeholders
              const serialized = JSON.stringify(eventForVerification);
              const size = serialized.length;

              // Update version string with correct size
              eventForVerification.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

              // Keep d and i as placeholders for saidify (it will replace d internally)
              // This matches the creation process in tel.ts:227
            } else if (eventData.t === 'acdc') {
              // ACDC - SAID is computed without the 't' field
              const { t, ...withoutT } = eventData;
              eventForVerification = { ...withoutT, d: '' };
            } else {
              // KEL events - simple case, set d to empty
              eventForVerification = { ...eventData, d: '' };
            }

            const verified = saidify(eventForVerification, { label: 'd' });
            if (verified.d !== said) {
              result.failed++;
              result.errors.push(`SAID verification failed for event ${said}: expected ${said}, got ${verified.d}`);
              continue;
            }
          } catch (error) {
            result.failed++;
            result.errors.push(`SAID verification error: ${error instanceof Error ? error.message : String(error)}`);
            continue;
          }
        }

        // Check if event already exists (if skipExisting is true)
        if (options.skipExisting && said) {
          const existing = await this.store.getEvent(said);
          if (existing) {
            result.skipped++;
            continue;
          }
        }

        // Import the event
        await this.store.putEvent(eventBytes);
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    // Create alias if provided and applicable
    if (options.alias && bundle.metadata.scope) {
      try {
        if (bundle.type === 'tel' && result.registryId) {
          await this.store.putAlias('tel', result.registryId, options.alias);
        } else if (bundle.type === 'acdc' && result.credentialId) {
          await this.store.putAlias('acdc', result.credentialId, options.alias);
        }
      } catch (error) {
        result.errors.push(`Failed to create alias: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  async fromRaw(events: Uint8Array[], options: ImportOptions = {}): Promise<ImportResult> {
    // Create a minimal bundle and import
    const bundle: CESRBundle = {
      type: 'mixed',
      version: '1.0',
      events,
      metadata: {
        created: new Date().toISOString(),
      },
    };

    return this.fromBundle(bundle, options);
  }

  async fromJSON(json: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(json);

      // Convert base64 events back to Uint8Array
      const bundle: CESRBundle = {
        ...parsed,
        events: parsed.events.map((b64: string) =>
          Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        ),
      };

      return this.fromBundle(bundle, options);
    } catch (error) {
      return {
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  async fromCESR(cesr: Uint8Array, options: ImportOptions = {}): Promise<ImportResult> {
    // Parse CESR stream into individual events
    // CESR events are self-framing - each event contains its own length
    const events: Uint8Array[] = [];
    let offset = 0;

    while (offset < cesr.length) {
      // Find the end of current event by looking for the next event start
      // CESR events are separated by looking for JSON start '{' or CESR version string
      let eventEnd = offset + 1;
      let foundStart = false;

      // Look for next event starting with '-' (version string) or finding balanced JSON
      const decoder = new TextDecoder();
      const text = decoder.decode(cesr.slice(offset));

      // Find JSON object boundaries
      let braceCount = 0;
      let inJson = false;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          braceCount++;
          inJson = true;
        } else if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0 && inJson) {
            // Found end of JSON, continue to find attachments
            let j = i + 1;
            // Skip whitespace
            while (j < text.length && /\s/.test(text[j])) j++;
            // Check if next char is start of new event (-)
            if (j >= text.length || text[j] === '-') {
              eventEnd = offset + j;
              foundStart = true;
              break;
            }
          }
        }
      }

      if (!foundStart) {
        // Last event in stream
        eventEnd = cesr.length;
      }

      const eventBytes = cesr.slice(offset, eventEnd);
      events.push(eventBytes);
      offset = eventEnd;
    }

    return this.fromRaw(events, options);
  }

  async fromFile(path: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const file = Bun.file(path);
      const content = await file.arrayBuffer();
      const bytes = new Uint8Array(content);

      // Try to detect if it's JSON or raw CESR
      const text = new TextDecoder().decode(bytes.slice(0, 100)); // Check first 100 bytes

      if (text.trim().startsWith('{')) {
        // JSON format
        return this.fromJSON(new TextDecoder().decode(bytes), options);
      } else {
        // Raw CESR format
        return this.fromCESR(bytes, options);
      }
    } catch (error) {
      return {
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

/**
 * Create an ImportDSL for a store
 */
export function createImportDSL(store: KerStore): ImportDSL {
  return new ImportDSLImpl(store);
}
