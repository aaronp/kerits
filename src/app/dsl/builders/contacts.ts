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
  };
}
