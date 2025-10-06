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

  async fromFile(path: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const file = Bun.file(path);
      const json = await file.text();
      return this.fromJSON(json, options);
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
