/**
 * Contact Manager DSL
 *
 * Business logic for managing contacts.
 * Storage is user-scoped (namespace = user's AID).
 */

import type { Kv } from '../../storage';
import type { Contact, ContactListOptions } from './types';

export class ContactManager {
  private kv: Kv;
  private prefix = 'contact';

  constructor(kv: Kv) {
    this.kv = kv;
  }

  /**
   * Add contact by SAID
   *
   * Invalid SAIDs are allowed - MERITS backend will reject messages.
   */
  async addContact(aid: string, alias?: string): Promise<Contact> {
    // Check if already exists
    const existing = await this.getContact(aid);
    if (existing) {
      const aliasInfo = existing.alias ? ` as "${existing.alias}"` : '';
      throw new Error(`Contact already added${aliasInfo}`);
    }

    // Check alias uniqueness if provided
    if (alias && !(await this.isAliasUnique(alias))) {
      throw new Error(`Alias already in use: ${alias}`);
    }

    const contact: Contact = {
      aid,
      alias,
      isUnknown: false,
      addedAt: Date.now(),
    };

    await this.kv.set(`${this.prefix}:${aid}`, contact);
    return contact;
  }

  /**
   * Create unknown contact (auto-created from unknown sender)
   */
  async createUnknownContact(aid: string): Promise<Contact> {
    // Check if already exists
    const existing = await this.getContact(aid);
    if (existing) {
      return existing; // Already have this contact
    }

    const contact: Contact = {
      aid,
      alias: undefined, // No alias for unknown
      isUnknown: true,
      addedAt: Date.now(),
    };

    await this.kv.set(`${this.prefix}:${aid}`, contact);
    console.log(`[ContactManager] Created unknown contact: ${aid.substring(0, 16)}...`);
    return contact;
  }

  /**
   * Check if alias is unique (case-insensitive)
   */
  async isAliasUnique(alias: string, excludeAid?: string): Promise<boolean> {
    const contacts = await this.listContacts();
    const normalizedAlias = alias.toLowerCase().trim();

    for (const contact of contacts) {
      // Skip the contact being updated
      if (excludeAid && contact.aid === excludeAid) {
        continue;
      }

      if (contact.alias && contact.alias.toLowerCase().trim() === normalizedAlias) {
        return false; // Alias already in use
      }
    }

    return true; // Alias is unique
  }

  /**
   * Promote unknown contact to known contact with alias
   * Auto-unblocks and unmutes the contact
   */
  async promoteUnknownToContact(aid: string, alias: string): Promise<Contact> {
    const contact = await this.getContact(aid);
    if (!contact) {
      throw new Error(`Contact not found: ${aid}`);
    }

    if (!contact.isUnknown) {
      throw new Error(`Contact is not unknown: ${aid}`);
    }

    // Check alias uniqueness
    if (!(await this.isAliasUnique(alias, aid))) {
      throw new Error(`Alias already in use: ${alias}`);
    }

    // Update contact
    const updated: Contact = {
      ...contact,
      alias,
      isUnknown: false,
    };

    await this.kv.set(`${this.prefix}:${aid}`, updated);
    console.log(`[ContactManager] Promoted unknown contact: ${aid.substring(0, 16)}... → ${alias}`);

    return updated;
  }

  /**
   * Rename contact (change alias)
   */
  async renameContact(aid: string, newAlias: string): Promise<Contact> {
    const contact = await this.getContact(aid);
    if (!contact) {
      throw new Error(`Contact not found: ${aid}`);
    }

    if (contact.isUnknown) {
      throw new Error(`Cannot rename unknown contact. Use promoteUnknownToContact instead.`);
    }

    // Check alias uniqueness
    if (!(await this.isAliasUnique(newAlias, aid))) {
      throw new Error(`Alias already in use: ${newAlias}`);
    }

    const updated: Contact = {
      ...contact,
      alias: newAlias,
    };

    await this.kv.set(`${this.prefix}:${aid}`, updated);
    console.log(`[ContactManager] Renamed contact: ${aid.substring(0, 16)}... → ${newAlias}`);

    return updated;
  }

  /**
   * Get all unknown contacts
   */
  async getUnknownContacts(): Promise<Contact[]> {
    const contacts = await this.listContacts();
    return contacts.filter(c => c.isUnknown);
  }

  /**
   * Get contact by AID
   */
  async getContact(aid: string): Promise<Contact | null> {
    return await this.kv.get<Contact>(`${this.prefix}:${aid}`);
  }

  /**
   * Update contact
   */
  async updateContact(
    aid: string,
    updates: Partial<Omit<Contact, 'aid' | 'addedAt'>>
  ): Promise<Contact> {
    const contact = await this.getContact(aid);
    if (!contact) {
      throw new Error(`Contact not found: ${aid}`);
    }

    const updated = { ...contact, ...updates };
    await this.kv.set(`${this.prefix}:${aid}`, updated);
    return updated;
  }

  /**
   * Remove contact
   */
  async removeContact(aid: string): Promise<void> {
    const contact = await this.getContact(aid);
    if (!contact) {
      throw new Error(`Contact not found: ${aid}`);
    }

    await this.kv.delete(`${this.prefix}:${aid}`);
  }

  /**
   * List all contacts
   */
  async listContacts(options: ContactListOptions = {}): Promise<Contact[]> {
    const keys = await this.kv.list(this.prefix);
    const contacts: Contact[] = [];

    for (const key of keys) {
      const contact = await this.kv.get<Contact>(key);
      if (contact) {
        contacts.push(contact);
      }
    }

    // Sort if requested
    if (options.sortBy) {
      this.sortContacts(contacts, options.sortBy, options.sortDir);
    }

    return contacts;
  }

  /**
   * Check if contact exists
   */
  async hasContact(aid: string): Promise<boolean> {
    return await this.kv.has(`${this.prefix}:${aid}`);
  }

  /**
   * Get contact count
   */
  async getContactCount(): Promise<number> {
    const keys = await this.kv.list(this.prefix);
    return keys.length;
  }

  /**
   * Sort contacts by field
   */
  private sortContacts(
    contacts: Contact[],
    sortBy: 'alias' | 'addedAt' | 'lastMessageAt',
    sortDir: 'asc' | 'desc' = 'asc'
  ): void {
    contacts.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortBy === 'alias') {
        aVal = a.alias || '';
        bVal = b.alias || '';
      } else if (sortBy === 'addedAt') {
        aVal = a.addedAt;
        bVal = b.addedAt;
      } else if (sortBy === 'lastMessageAt') {
        aVal = a.lastMessageAt || 0;
        bVal = b.lastMessageAt || 0;
      }

      const dir = sortDir === 'desc' ? -1 : 1;
      if (aVal < bVal) return -dir;
      if (aVal > bVal) return dir;
      return 0;
    });
  }
}
