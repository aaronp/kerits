/**
 * KeritsDSL - Top-level DSL for KERI operations
 */

import type { KerStore } from '../../../storage/types';
import type { KeritsDSL, Account, Mnemonic, AccountDSL, SchemaDSL, ContactsDSL, GraphOptions, ImportDSL, ContactSyncDSL } from '../types';
import { generateKeypairFromSeed } from '../../../signer';
import { createIdentity, createSchema as createSchemaHelper } from '../../helpers';
import { seedToMnemonic, mnemonicToSeed, serializeEvent } from '../utils';
import { createAccountDSL } from './account';
import { createSchemaDSL } from './schema';
import { createContactsDSL } from './contacts';
import { createImportDSL } from './import';
import { createContactSyncDSL } from './contact-sync';

/**
 * Create a new KeritsDSL instance
 * @param store - KerStore for persistence
 * @returns KeritsDSL instance
 */
export function createKeritsDSL(store: KerStore): KeritsDSL {
  // In-memory cache of accounts
  const accountCache = new Map<string, Account>();

  return {
    newMnemonic(seed: Uint8Array): Mnemonic {
      return seedToMnemonic(seed);
    },

    async newAccount(alias: string, mnemonic: Mnemonic): Promise<Account> {
      // Check if alias already exists
      const existing = await store.aliasToId('kel', alias);
      if (existing) {
        throw new Error(`Account alias already exists: ${alias}`);
      }

      // Convert mnemonic to seed
      const seed = mnemonicToSeed(mnemonic);

      // Generate keypair from seed
      const kp = await generateKeypairFromSeed(seed);

      // Create KERI identity
      const { aid } = await createIdentity(store, {
        alias,
        keys: [kp.verfer],
        nextKeys: [kp.verfer],
      });

      // Create account object
      const account: Account = {
        alias,
        aid,
        verfer: kp.verfer,
        createdAt: new Date().toISOString(),
      };

      // Store account metadata
      await store.putEvent(
        serializeEvent({
          v: 'KERI10JSON',
          t: 'account',
          d: aid,
          alias,
          aid,
          verfer: kp.verfer,
          createdAt: account.createdAt,
        })
      );

      // Cache it
      accountCache.set(alias, account);
      accountCache.set(aid, account);

      return account;
    },

    async getAccount(alias: string): Promise<Account | null> {
      // Check cache first
      if (accountCache.has(alias)) {
        return accountCache.get(alias)!;
      }

      // Lookup AID by alias
      const aid = await store.aliasToId('kel', alias);
      if (!aid) {
        return null;
      }

      // Get KEL events
      const kelEvents = await store.listKel(aid);
      if (kelEvents.length === 0) {
        return null;
      }

      // Extract account info from inception event
      const icp = kelEvents[0];
      const account: Account = {
        alias,
        aid,
        verfer: icp.meta.keys?.[0] || '',
        createdAt: icp.meta.dt || new Date().toISOString(),
      };

      // Cache it
      accountCache.set(alias, account);
      accountCache.set(aid, account);

      return account;
    },

    async getAccountByAid(aid: string): Promise<Account | null> {
      // Check cache first
      if (accountCache.has(aid)) {
        return accountCache.get(aid)!;
      }

      // Get KEL events
      const kelEvents = await store.listKel(aid);
      if (kelEvents.length === 0) {
        return null;
      }

      // Try to find alias by reverse lookup
      const aliases = await this.accountNames();
      for (const alias of aliases) {
        const resolvedAid = await store.aliasToId('kel', alias);
        if (resolvedAid === aid) {
          return this.getAccount(alias);
        }
      }

      // No alias found, create account without alias
      const icp = kelEvents[0];
      const account: Account = {
        alias: '', // No alias
        aid,
        verfer: icp.meta.keys?.[0] || '',
        createdAt: icp.meta.dt || new Date().toISOString(),
      };

      accountCache.set(aid, account);
      return account;
    },

    async accountNames(): Promise<string[]> {
      return store.listAliases('kel');
    },

    async account(alias: string): Promise<AccountDSL | null> {
      const acc = await this.getAccount(alias);
      if (!acc) {
        return null;
      }
      return createAccountDSL(acc, store);
    },

    async accountByAid(aid: string): Promise<AccountDSL | null> {
      const acc = await this.getAccountByAid(aid);
      if (!acc) {
        return null;
      }
      return createAccountDSL(acc, store);
    },

    async createSchema(alias: string, schema: any): Promise<SchemaDSL> {
      const { schemaId, schema: saidified } = await createSchemaHelper(store, {
        alias,
        schema,
      });

      const schemaObj = {
        alias,
        schemaId,
        schema: saidified,
      };

      return createSchemaDSL(schemaObj, store);
    },

    async importSchema(schemaData: SchemaExport): Promise<SchemaDSL> {
      // Validate SAID matches
      if (schemaData.sed.$id !== schemaData.said) {
        throw new Error('SAID mismatch: sed.$id does not match said field');
      }

      // Validate required fields
      if (!schemaData.sed.title || !schemaData.sed.properties) {
        throw new Error('Invalid schema: must have title and properties');
      }

      // Convert KERI SAD format ($id) to internal format (d)
      // Remove $id and $schema fields, keep rest of the schema
      const { $id, $schema, ...schemaContent } = schemaData.sed;

      // Create schema - this will re-SAIDify with 'd' field
      const { schemaId, schema: saidified } = await createSchemaHelper(store, {
        alias: schemaData.alias,
        schema: schemaContent,
      });

      // Verify the SAID matches what we imported
      if (schemaId !== schemaData.said) {
        throw new Error(`SAID verification failed: expected ${schemaData.said}, got ${schemaId}`);
      }

      const schemaObj = {
        alias: schemaData.alias,
        schemaId,
        schema: saidified,
      };

      return createSchemaDSL(schemaObj, store);
    },

    async deleteSchema(alias: string): Promise<void> {
      // Delete the schema by deleting its alias mapping
      await store.delAlias('schema', alias, true);
    },

    async schema(alias: string): Promise<SchemaDSL | null> {
      const schemaId = await store.aliasToId('schema', alias);
      if (!schemaId) {
        return null;
      }

      // Get schema from storage
      const stored = await store.getEvent(schemaId);
      if (!stored) {
        return null;
      }

      // Deserialize the schema from the stored event
      const rawBytes = stored.event.raw instanceof Uint8Array
        ? stored.event.raw
        : new Uint8Array(Object.values(stored.event.raw as any));

      const eventText = new TextDecoder().decode(rawBytes);
      const jsonMatch = eventText.match(/\{.*\}/s);
      if (!jsonMatch) {
        return null;
      }

      const eventData = JSON.parse(jsonMatch[0]);

      // Extract schema fields (everything except KERI metadata)
      const { v, t, d, ...schemaFields } = eventData;

      const schemaObj = {
        alias,
        schemaId,
        schema: schemaFields,
      };

      return createSchemaDSL(schemaObj, store);
    },

    async listSchemas(): Promise<string[]> {
      return store.listAliases('schema');
    },

    contacts(): ContactsDSL {
      return createContactsDSL(store);
    },

    async graph(opts?: GraphOptions): Promise<any> {
      return store.buildGraph(opts);
    },

    import(): ImportDSL {
      return createImportDSL(store);
    },

    sync(): ContactSyncDSL {
      return createContactSyncDSL(store);
    },
  };
}
