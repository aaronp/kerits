/**
 * ContactsDSL - Contact (witness) management
 *
 * Follows git-style remotes/ layout:
 * - remotes/{alias}/meta.json stores contact metadata
 * - KELs stored in shared kel/{AID}/ directory
 */

import type { KerStore } from '../../../storage/types';
import type { ContactsDSL, Contact } from '../types';

const REMOTES_PREFIX = 'remotes/';

/**
 * Create a ContactsDSL instance
 */
export function createContactsDSL(store: KerStore): ContactsDSL {
  return {
    async add(alias: string, aid: string, metadata?: Contact['metadata']): Promise<Contact> {
      // Check if alias already exists
      const metaKey = `${REMOTES_PREFIX}${alias}/meta.json`;
      const existing = await store.kv.get(metaKey);
      if (existing) {
        throw new Error(`Contact alias already exists: ${alias}`);
      }

      const contact: Contact = {
        alias,
        aid,
        metadata,
        addedAt: new Date().toISOString(),
      };

      // Store contact metadata in remotes/{alias}/meta.json
      const metaJson = JSON.stringify({
        name: metadata?.name || alias,
        aid,
        addedAt: contact.addedAt,
        ...metadata,
      }, null, 2);

      const metaBytes = new TextEncoder().encode(metaJson);
      await store.kv.put(metaKey, metaBytes);

      return contact;
    },

    async get(alias: string): Promise<Contact | null> {
      // Read from remotes/{alias}/meta.json
      const metaKey = `${REMOTES_PREFIX}${alias}/meta.json`;
      const raw = await store.kv.get(metaKey);

      if (!raw) {
        return null;
      }

      try {
        const json = new TextDecoder().decode(raw);
        const meta = JSON.parse(json);

        return {
          alias,
          aid: meta.aid,
          metadata: {
            name: meta.name,
            role: meta.role,
            endpoint: meta.endpoint,
          },
          addedAt: meta.addedAt,
        };
      } catch (error) {
        console.error(`Failed to parse contact metadata for ${alias}:`, error);
        return null;
      }
    },

    async remove(alias: string): Promise<void> {
      // Delete remotes/{alias}/meta.json
      const metaKey = `${REMOTES_PREFIX}${alias}/meta.json`;
      await store.kv.del(metaKey);

      // Note: KEL data in kel/{AID}/ is NOT deleted, as it may be referenced elsewhere
    },

    async list(): Promise<string[]> {
      // List all remotes/*/meta.json entries
      const results = await store.kv.list(REMOTES_PREFIX, { keysOnly: true });

      // Extract aliases from keys like "remotes/alice/meta.json"
      const aliases: string[] = [];
      for (const { key } of results) {
        const match = key.match(/^remotes\/([^/]+)\/meta\.json$/);
        if (match) {
          aliases.push(match[1]);
        }
      }

      return aliases;
    },

    async getAll(): Promise<Contact[]> {
      const aliases = await this.list();
      const contacts: Contact[] = [];

      for (const alias of aliases) {
        const contact = await this.get(alias);
        if (contact) {
          contacts.push(contact);
        }
      }

      return contacts;
    },

    async exportKEL(alias: string): Promise<Uint8Array> {
      const contact = await this.get(alias);
      if (!contact) {
        throw new Error(`Contact not found: ${alias}`);
      }

      // Get all KEL events for this AID
      const kelEvents = await store.listKel(contact.aid);

      if (kelEvents.length === 0) {
        throw new Error(`No KEL events found for contact: ${alias} (${contact.aid})`);
      }

      // Concatenate all raw CESR events
      const cesrParts: Uint8Array[] = [];
      for (const event of kelEvents) {
        cesrParts.push(event.raw);
      }

      // Concatenate all parts into single CESR stream
      const totalLength = cesrParts.reduce((sum, part) => sum + part.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const part of cesrParts) {
        result.set(part, offset);
        offset += part.length;
      }

      return result;
    },

    async importKEL(cesrData: Uint8Array, alias: string): Promise<Contact> {
      const { serializeEvent } = await import('../utils');

      // Parse CESR to extract events
      const events: any[] = [];
      let offset = 0;
      const cesrText = new TextDecoder().decode(cesrData);

      while (offset < cesrText.length) {
        // Skip non-JSON characters (version strings, whitespace)
        while (offset < cesrText.length && cesrText[offset] !== '{') {
          offset++;
        }

        if (offset >= cesrText.length) break;

        // Find balanced JSON object
        let braceCount = 0;
        let start = offset;

        for (let i = offset; i < cesrText.length; i++) {
          if (cesrText[i] === '{') {
            braceCount++;
          } else if (cesrText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              const jsonText = cesrText.slice(start, i + 1);
              try {
                const eventJson = JSON.parse(jsonText);
                events.push(eventJson);
              } catch (e) {
                console.error('Failed to parse event JSON:', e);
              }
              offset = i + 1;
              break;
            }
          }
        }

        if (braceCount !== 0) break; // Incomplete JSON
      }

      if (events.length === 0) {
        throw new Error('No events found in CESR data');
      }

      // Extract AID from first event (inception)
      const firstEvent = events[0];
      const aid = firstEvent.i || firstEvent.pre;
      if (!aid) {
        throw new Error('Could not find AID in first event');
      }

      // Check if contact already exists
      const metaKey = `${REMOTES_PREFIX}${alias}/meta.json`;
      const existing = await store.kv.get(metaKey);
      if (existing) {
        throw new Error(`Contact alias already exists: ${alias}`);
      }

      // Store each event in the shared KEL directory (kel/{AID}/)
      for (const event of events) {
        const rawEvent = serializeEvent(event);
        await store.putEvent(rawEvent);
      }

      const contact: Contact = {
        alias,
        aid,
        metadata: {},
        addedAt: new Date().toISOString(),
      };

      // Store contact metadata in remotes/{alias}/meta.json
      const metaJson = JSON.stringify({
        name: alias,
        aid,
        addedAt: contact.addedAt,
      }, null, 2);

      const metaBytes = new TextEncoder().encode(metaJson);
      await store.kv.put(metaKey, metaBytes);

      return contact;
    },
  };
}
