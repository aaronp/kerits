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

    for (const eventBytes of bundle.events) {
      try {
        // Check if event already exists (if skipExisting is true)
        if (options.skipExisting) {
          // Extract SAID from event to check existence
          const eventText = new TextDecoder().decode(eventBytes);
          const jsonMatch = eventText.match(/\{.*\}/s);
          if (jsonMatch) {
            const eventData = JSON.parse(jsonMatch[0]);
            const said = eventData.d;

            if (said) {
              const existing = await this.store.getEvent(said);
              if (existing) {
                result.skipped++;
                continue;
              }
            }
          }
        }

        // Import the event
        await this.store.putEvent(eventBytes);
        result.imported++;

        // TODO: If verify option is true, verify signatures and SAIDs
        // This would require signature verification logic
      } catch (error) {
        result.failed++;
        result.errors.push(error instanceof Error ? error.message : String(error));
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
