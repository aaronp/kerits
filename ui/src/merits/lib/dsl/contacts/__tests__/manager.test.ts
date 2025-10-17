/**
 * ContactManager Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContactManager } from '../manager';
import { MemoryKv } from '../../../storage';
import type { Contact } from '../types';

describe('ContactManager', () => {
  let manager: ContactManager;
  let kv: MemoryKv;

  beforeEach(() => {
    kv = new MemoryKv();
    manager = new ContactManager(kv);
  });

  describe('addContact', () => {
    it('should add contact without alias', async () => {
      const contact = await manager.addContact('test-aid-123');

      expect(contact.aid).toBe('test-aid-123');
      expect(contact.alias).toBeUndefined();
      expect(contact.isUnknown).toBe(false);
      expect(contact.addedAt).toBeGreaterThan(0);
    });

    it('should add contact with alias', async () => {
      const contact = await manager.addContact('test-aid-123', 'Alice');

      expect(contact.aid).toBe('test-aid-123');
      expect(contact.alias).toBe('Alice');
      expect(contact.isUnknown).toBe(false);
    });

    it('should throw if contact already exists', async () => {
      await manager.addContact('test-aid-123');

      await expect(manager.addContact('test-aid-123')).rejects.toThrow(
        'Contact already added'
      );
    });

    it('should throw with alias info if contact with alias already exists', async () => {
      await manager.addContact('test-aid-456', 'Bob');

      await expect(manager.addContact('test-aid-456')).rejects.toThrow(
        'Contact already added as "Bob"'
      );
    });

    it('should throw if alias is not unique', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      await expect(manager.addContact('test-aid-2', 'Alice')).rejects.toThrow(
        'Alias already in use: Alice'
      );
    });
  });

  describe('createUnknownContact', () => {
    it('should create unknown contact without alias', async () => {
      const contact = await manager.createUnknownContact('stranger-aid-456');

      expect(contact.aid).toBe('stranger-aid-456');
      expect(contact.alias).toBeUndefined();
      expect(contact.isUnknown).toBe(true);
      expect(contact.addedAt).toBeGreaterThan(0);
    });

    it('should return existing contact if already present', async () => {
      const first = await manager.createUnknownContact('stranger-aid-456');
      const second = await manager.createUnknownContact('stranger-aid-456');

      expect(second).toEqual(first);
    });

    it('should return existing known contact without modification', async () => {
      const known = await manager.addContact('test-aid-123', 'Alice');
      const result = await manager.createUnknownContact('test-aid-123');

      expect(result).toEqual(known);
      expect(result.isUnknown).toBe(false);
      expect(result.alias).toBe('Alice');
    });
  });

  describe('isAliasUnique', () => {
    it('should return true for unique alias', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      expect(await manager.isAliasUnique('Bob')).toBe(true);
    });

    it('should return false for duplicate alias (exact match)', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      expect(await manager.isAliasUnique('Alice')).toBe(false);
    });

    it('should return false for duplicate alias (case-insensitive)', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      expect(await manager.isAliasUnique('alice')).toBe(false);
      expect(await manager.isAliasUnique('ALICE')).toBe(false);
      expect(await manager.isAliasUnique('aLiCe')).toBe(false);
    });

    it('should ignore whitespace differences', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      expect(await manager.isAliasUnique(' Alice ')).toBe(false);
      expect(await manager.isAliasUnique('  alice  ')).toBe(false);
    });

    it('should exclude specified AID when checking uniqueness', async () => {
      await manager.addContact('test-aid-1', 'Alice');

      // Should allow same alias when updating the same contact
      expect(await manager.isAliasUnique('Alice', 'test-aid-1')).toBe(true);
      expect(await manager.isAliasUnique('alice', 'test-aid-1')).toBe(true);

      // Should still reject for other contacts
      expect(await manager.isAliasUnique('Alice', 'test-aid-2')).toBe(false);
    });

    it('should return true when no contacts exist', async () => {
      expect(await manager.isAliasUnique('Alice')).toBe(true);
    });
  });

  describe('promoteUnknownToContact', () => {
    it('should promote unknown contact to known with alias', async () => {
      const unknown = await manager.createUnknownContact('stranger-aid-456');
      const promoted = await manager.promoteUnknownToContact('stranger-aid-456', 'Bob');

      expect(promoted.aid).toBe('stranger-aid-456');
      expect(promoted.alias).toBe('Bob');
      expect(promoted.isUnknown).toBe(false);
      expect(promoted.addedAt).toBe(unknown.addedAt);
    });

    it('should throw if contact not found', async () => {
      await expect(manager.promoteUnknownToContact('nonexistent', 'Bob')).rejects.toThrow(
        'Contact not found: nonexistent'
      );
    });

    it('should throw if contact is not unknown', async () => {
      await manager.addContact('test-aid-123', 'Alice');

      await expect(manager.promoteUnknownToContact('test-aid-123', 'Alice2')).rejects.toThrow(
        'Contact is not unknown: test-aid-123'
      );
    });

    it('should throw if alias is not unique', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.createUnknownContact('stranger-aid-456');

      await expect(manager.promoteUnknownToContact('stranger-aid-456', 'Alice')).rejects.toThrow(
        'Alias already in use: Alice'
      );
    });

    it('should persist promotion', async () => {
      await manager.createUnknownContact('stranger-aid-456');
      await manager.promoteUnknownToContact('stranger-aid-456', 'Bob');

      const contact = await manager.getContact('stranger-aid-456');
      expect(contact?.isUnknown).toBe(false);
      expect(contact?.alias).toBe('Bob');
    });
  });

  describe('renameContact', () => {
    it('should rename contact with new alias', async () => {
      await manager.addContact('test-aid-123', 'Alice');
      const renamed = await manager.renameContact('test-aid-123', 'Alice Smith');

      expect(renamed.alias).toBe('Alice Smith');
      expect(renamed.aid).toBe('test-aid-123');
      expect(renamed.isUnknown).toBe(false);
    });

    it('should throw if contact not found', async () => {
      await expect(manager.renameContact('nonexistent', 'Bob')).rejects.toThrow(
        'Contact not found: nonexistent'
      );
    });

    it('should throw if contact is unknown', async () => {
      await manager.createUnknownContact('stranger-aid-456');

      await expect(manager.renameContact('stranger-aid-456', 'Bob')).rejects.toThrow(
        'Cannot rename unknown contact. Use promoteUnknownToContact instead.'
      );
    });

    it('should throw if new alias is not unique', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.addContact('test-aid-2', 'Bob');

      await expect(manager.renameContact('test-aid-2', 'Alice')).rejects.toThrow(
        'Alias already in use: Alice'
      );
    });

    it('should allow renaming to same alias (case-insensitive)', async () => {
      await manager.addContact('test-aid-123', 'Alice');

      // Should not throw - same contact being renamed
      const renamed = await manager.renameContact('test-aid-123', 'alice');
      expect(renamed.alias).toBe('alice');
    });

    it('should persist rename', async () => {
      await manager.addContact('test-aid-123', 'Alice');
      await manager.renameContact('test-aid-123', 'Alice Smith');

      const contact = await manager.getContact('test-aid-123');
      expect(contact?.alias).toBe('Alice Smith');
    });
  });

  describe('getUnknownContacts', () => {
    it('should return empty array when no unknown contacts exist', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.addContact('test-aid-2', 'Bob');

      const unknowns = await manager.getUnknownContacts();
      expect(unknowns).toEqual([]);
    });

    it('should return all unknown contacts', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.createUnknownContact('stranger-1');
      await manager.createUnknownContact('stranger-2');
      await manager.addContact('test-aid-2', 'Bob');

      const unknowns = await manager.getUnknownContacts();
      expect(unknowns).toHaveLength(2);
      expect(unknowns.every(c => c.isUnknown)).toBe(true);
      expect(unknowns.map(c => c.aid)).toContain('stranger-1');
      expect(unknowns.map(c => c.aid)).toContain('stranger-2');
    });

    it('should not return promoted contacts', async () => {
      await manager.createUnknownContact('stranger-1');
      await manager.createUnknownContact('stranger-2');
      await manager.promoteUnknownToContact('stranger-1', 'Charlie');

      const unknowns = await manager.getUnknownContacts();
      expect(unknowns).toHaveLength(1);
      expect(unknowns[0].aid).toBe('stranger-2');
    });
  });

  describe('getContact', () => {
    it('should return contact by AID', async () => {
      await manager.addContact('test-aid-123', 'Alice');

      const contact = await manager.getContact('test-aid-123');
      expect(contact?.aid).toBe('test-aid-123');
      expect(contact?.alias).toBe('Alice');
    });

    it('should return null for nonexistent contact', async () => {
      const contact = await manager.getContact('nonexistent');
      expect(contact).toBeNull();
    });
  });

  describe('updateContact', () => {
    it('should update contact properties', async () => {
      await manager.addContact('test-aid-123', 'Alice');

      const updated = await manager.updateContact('test-aid-123', {
        alias: 'Alice Updated',
      });

      expect(updated.alias).toBe('Alice Updated');
      expect(updated.aid).toBe('test-aid-123');
    });

    it('should throw if contact not found', async () => {
      await expect(manager.updateContact('nonexistent', { alias: 'New' })).rejects.toThrow(
        'Contact not found: nonexistent'
      );
    });
  });

  describe('removeContact', () => {
    it('should remove contact', async () => {
      await manager.addContact('test-aid-123', 'Alice');
      await manager.removeContact('test-aid-123');

      const contact = await manager.getContact('test-aid-123');
      expect(contact).toBeNull();
    });

    it('should throw if contact not found', async () => {
      await expect(manager.removeContact('nonexistent')).rejects.toThrow(
        'Contact not found: nonexistent'
      );
    });
  });

  describe('listContacts', () => {
    it('should return empty array when no contacts exist', async () => {
      const contacts = await manager.listContacts();
      expect(contacts).toEqual([]);
    });

    it('should return all contacts', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.addContact('test-aid-2', 'Bob');
      await manager.createUnknownContact('stranger-1');

      const contacts = await manager.listContacts();
      expect(contacts).toHaveLength(3);
    });

    it('should sort by alias ascending', async () => {
      await manager.addContact('test-aid-1', 'Charlie');
      await manager.addContact('test-aid-2', 'Alice');
      await manager.addContact('test-aid-3', 'Bob');

      const contacts = await manager.listContacts({ sortBy: 'alias', sortDir: 'asc' });
      expect(contacts.map(c => c.alias)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort by alias descending', async () => {
      await manager.addContact('test-aid-1', 'Charlie');
      await manager.addContact('test-aid-2', 'Alice');
      await manager.addContact('test-aid-3', 'Bob');

      const contacts = await manager.listContacts({ sortBy: 'alias', sortDir: 'desc' });
      expect(contacts.map(c => c.alias)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('should sort by addedAt', async () => {
      const first = await manager.addContact('test-aid-1', 'Alice');
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      const second = await manager.addContact('test-aid-2', 'Bob');

      const contacts = await manager.listContacts({ sortBy: 'addedAt', sortDir: 'asc' });
      expect(contacts[0].aid).toBe(first.aid);
      expect(contacts[1].aid).toBe(second.aid);
    });
  });

  describe('hasContact', () => {
    it('should return true if contact exists', async () => {
      await manager.addContact('test-aid-123', 'Alice');

      expect(await manager.hasContact('test-aid-123')).toBe(true);
    });

    it('should return false if contact does not exist', async () => {
      expect(await manager.hasContact('nonexistent')).toBe(false);
    });
  });

  describe('getContactCount', () => {
    it('should return 0 when no contacts exist', async () => {
      expect(await manager.getContactCount()).toBe(0);
    });

    it('should return total contact count', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.addContact('test-aid-2', 'Bob');
      await manager.createUnknownContact('stranger-1');

      expect(await manager.getContactCount()).toBe(3);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full unknown sender flow', async () => {
      // 1. Auto-create unknown contact
      const unknown = await manager.createUnknownContact('stranger-aid-456');
      expect(unknown.isUnknown).toBe(true);
      expect(unknown.alias).toBeUndefined();

      // 2. Verify in unknown list
      let unknowns = await manager.getUnknownContacts();
      expect(unknowns).toHaveLength(1);

      // 3. Promote to known contact
      const promoted = await manager.promoteUnknownToContact('stranger-aid-456', 'Charlie');
      expect(promoted.isUnknown).toBe(false);
      expect(promoted.alias).toBe('Charlie');

      // 4. Verify no longer in unknown list
      unknowns = await manager.getUnknownContacts();
      expect(unknowns).toHaveLength(0);

      // 5. Rename contact
      const renamed = await manager.renameContact('stranger-aid-456', 'Charlie Brown');
      expect(renamed.alias).toBe('Charlie Brown');
    });

    it('should prevent alias collisions across multiple contacts', async () => {
      await manager.addContact('test-aid-1', 'Alice');
      await manager.addContact('test-aid-2', 'Bob');
      await manager.createUnknownContact('stranger-1');

      // Cannot add with existing alias
      await expect(manager.addContact('test-aid-3', 'alice')).rejects.toThrow();

      // Cannot promote with existing alias
      await expect(manager.promoteUnknownToContact('stranger-1', 'BOB')).rejects.toThrow();

      // Cannot rename to existing alias
      await expect(manager.renameContact('test-aid-2', 'ALICE')).rejects.toThrow();
    });
  });
});
