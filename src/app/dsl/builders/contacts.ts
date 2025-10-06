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

      // Parse contact metadata from stored event
      // In production, properly deserialize the event
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
