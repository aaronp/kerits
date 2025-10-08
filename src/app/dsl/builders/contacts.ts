/**
 * ContactsDSL - Contact (witness) management
 */

import type { KerStore } from '../../../storage/types';
import type { ContactsDSL, Contact } from '../types';
import { serializeEvent } from '../utils';

/**
 * Create a ContactsDSL instance
 */
export function createContactsDSL(store: KerStore): ContactsDSL {
  return {
    async add(alias: string, aid: string, metadata?: Contact['metadata']): Promise<Contact> {
      // Check if alias already exists
      const existing = await store.aliasToId('contact', alias);
      if (existing) {
        throw new Error(`Contact alias already exists: ${alias}`);
      }

      const contact: Contact = {
        alias,
        aid,
        metadata,
        addedAt: new Date().toISOString(),
      };

      // Store contact metadata as pseudo-event
      const contactEvent = {
        v: 'KERI10JSON',
        t: 'contact',
        d: aid, // Use AID as SAID for contacts
        alias,
        aid,
        metadata,
        addedAt: contact.addedAt,
      };

      const rawContact = serializeEvent(contactEvent);
      await store.putEvent(rawContact);

      // Store alias mapping
      await store.putAlias('contact', aid, alias);

      return contact;
    },

    async get(alias: string): Promise<Contact | null> {
      const aid = await store.aliasToId('contact', alias);
      if (!aid) {
        return null;
      }

      // Get contact from storage
      const stored = await store.getEvent(aid);
      if (!stored) {
        return null;
      }

      // Parse the raw event to extract metadata
      // The raw bytes contain the full CESR-framed event
      // Convert to Uint8Array if it's a regular array or object (from JSON deserialization)
      let rawBytes: Uint8Array;
      if (stored.raw instanceof Uint8Array) {
        rawBytes = stored.raw;
      } else if (Array.isArray(stored.raw)) {
        rawBytes = new Uint8Array(stored.raw);
      } else {
        // It's an object like {0: 45, 1: 75, ...}, convert to array
        rawBytes = new Uint8Array(Object.values(stored.raw as any));
      }

      const rawText = new TextDecoder().decode(rawBytes);

      // Extract JSON portion (after version string)
      const jsonMatch = rawText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const eventData = JSON.parse(jsonMatch[0]);
          return {
            alias,
            aid,
            metadata: eventData.metadata || {},
            addedAt: eventData.addedAt || stored.meta.dt || new Date().toISOString(),
          };
        } catch (e) {
          // Fall back to basic contact if parse fails
          console.warn(`Failed to parse contact metadata for ${alias}:`, e);
        }
      }

      return {
        alias,
        aid,
        metadata: {},
        addedAt: stored.meta.dt || new Date().toISOString(),
      };
    },

    async remove(alias: string): Promise<void> {
      await store.delAlias('contact', alias, true);
    },

    async list(): Promise<string[]> {
      return store.listAliases('contact');
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
      const { parseCesrStream } = await import('../../signing');

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
      const existing = await store.aliasToId('contact', alias);
      if (existing) {
        throw new Error(`Contact alias already exists: ${alias}`);
      }

      // Store each event in the KEL
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

      // Store contact metadata as pseudo-event
      const contactEvent = {
        v: 'KERI10JSON',
        t: 'contact',
        d: aid, // Use AID as SAID for contacts
        alias,
        aid,
        metadata: contact.metadata,
        addedAt: contact.addedAt,
      };

      const rawContact = serializeEvent(contactEvent);
      await store.putEvent(rawContact);

      // Create alias mapping: contact alias -> AID
      await store.putAlias('contact', aid, alias);

      // Also create KEL alias mapping if it doesn't exist
      const kelAlias = await store.aliasToId('kel', alias);
      if (!kelAlias) {
        await store.putAlias('kel', aid, alias);
      }

      return contact;
    },
  };
}
