/**
 * KeritsDSL - Top-level DSL for KERI operations
 */

import type { KerStore } from '../../../storage/types';
import type { KeritsDSL, Account, Mnemonic, AccountDSL, SchemaDSL, ContactsDSL, ContactSyncDSL, AppDataDSL, SchemaExport } from '../types';
import { CESR } from '../../../model/cesr/cesr';
import { createIdentity, createSchema as createSchemaHelper } from '../../helpers';
import { seedToMnemonic, mnemonicToSeed, serializeEvent } from '../utils';
import { saidify } from '../../../saidify';
import { s } from '../../../types/keri';
import { createAccountDSL } from './account';
import { createSchemaDSL } from './schema';
import { createContactsDSL } from './contacts';
import { createContactSyncDSL } from './contact-sync';
import { createAppDataDSL } from './appdata';
import { KeyManager } from '../../keymanager';

/**
 * Create a new KeritsDSL instance
 * @param store - KerStore for persistence
 * @returns KeritsDSL instance
 */
export function createKeritsDSL(store: KerStore): KeritsDSL {
  // In-memory cache of accounts
  const accountCache = new Map<string, Account>();

  // KeyManager for signing operations with KV storage
  const keyManager = new KeyManager({
    store: store.kv,
    debug: false,
  });

  return {
    keyManager,

    newMnemonic(seed: Uint8Array): Mnemonic {
      return seedToMnemonic(seed);
    },

    async newAccount(alias: string, mnemonic: Mnemonic): Promise<Account> {
      // Check if alias already exists
      const existing = await store.getAliasSaid('kel', alias);
      if (existing) {
        throw new Error(`Account alias already exists: ${alias}`);
      }

      // Convert mnemonic to seed
      const seed = mnemonicToSeed(mnemonic);

      // Generate keypair from seed
      const kp = await CESR.generateKeypairFromSeed(seed);

      // Unlock account in KeyManager BEFORE creating identity
      // This ensures signing keys are available for inception event
      // Note: We use a temporary AID derived from the verfer
      const tempAid = kp.verfer; // Use verfer as temporary identifier
      await keyManager.unlock(tempAid, mnemonic);

      // Create KERI identity (now with signing via KeyManager)
      const { aid } = await createIdentity(store, {
        alias,
        keys: [kp.verfer],
        nextKeys: [kp.verfer],
      }, keyManager);

      // Lock the temporary AID and unlock with actual AID
      keyManager.lock(tempAid);
      await keyManager.unlock(aid, mnemonic);

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
        const account = accountCache.get(alias)!;

        // Try to unlock from KV store if not already unlocked
        if (!keyManager.isUnlocked(account.aid)) {
          await keyManager.unlockFromStore(account.aid);
        }

        return account;
      }

      // Lookup AID by alias
      const aid = await store.getAliasSaid('kel', alias);
      if (!aid) {
        return null;
      }

      // Get KEL events
      const kelEvents = await store.listKel(s(aid).asAID());
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

      // Try to unlock from KV store
      await keyManager.unlockFromStore(aid);

      // Cache it
      accountCache.set(alias, account);
      accountCache.set(aid, account);

      return account;
    },

    async getAccountByAid(aid: string): Promise<Account | null> {
      // Check cache first
      if (accountCache.has(aid)) {
        const account = accountCache.get(aid)!;

        // Try to unlock from KV store if not already unlocked
        if (!keyManager.isUnlocked(account.aid)) {
          await keyManager.unlockFromStore(account.aid);
        }

        return account;
      }

      // Get KEL events
      const kelEvents = await store.listKel(s(aid).asAID());
      if (kelEvents.length === 0) {
        return null;
      }

      // Try to find alias by reverse lookup
      const aliases = await this.accountNames();
      for (const alias of aliases) {
        const resolvedAid = await store.getAliasSaid('kel', alias);
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

      // Try to unlock from KV store
      await keyManager.unlockFromStore(aid);

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
      return createAccountDSL(acc, store, keyManager);
    },

    async accountByAid(aid: string): Promise<AccountDSL | null> {
      const acc = await this.getAccountByAid(aid);
      if (!acc) {
        return null;
      }
      return createAccountDSL(acc, store, keyManager);
    },

    async createSchema(alias: string, schema: any): Promise<SchemaDSL> {
      const { schemaId, schema: saidified } = await createSchemaHelper(store, {
        alias,
        schema,
      });

      const schemaObj = {
        alias,
        schemaId,
        schemaSaid: schemaId, // Set both for API consistency
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

      // Verify the SAID by recomputing it from the sed with $id
      const { $id, ...sedContent } = schemaData.sed;
      const schemaWithEmptyId = { $id: '', ...sedContent }; // $id must be first to preserve field order
      const recomputed = saidify(schemaWithEmptyId, { label: '$id' });

      if (recomputed.$id !== schemaData.said) {
        throw new Error(`SAID verification failed: expected ${schemaData.said}, got ${recomputed.$id}`);
      }

      // Now that verification passed, store the schema with its original SAID
      // We store the complete sed (with $id and $schema) to preserve the SAID
      const schemaId = schemaData.said;

      // Store schema as a special event
      const schemaEvent = {
        v: 'KERI10JSON',
        t: 'schema',
        d: schemaId,
        ...schemaData.sed,
      };

      const rawSchema = serializeEvent(schemaEvent);
      await store.putEvent(rawSchema);

      // Also store schema in schema storage for direct retrieval
      await store.putSchema(schemaData.sed);

      // Store alias mapping
      await store.putAlias('schema', s(schemaId).asSAID(), schemaData.alias);

      const schemaObj = {
        alias: schemaData.alias,
        schemaId,
        schemaSaid: schemaId,
        schema: schemaData.sed,
      };

      return createSchemaDSL(schemaObj, store);
    },

    async deleteSchema(alias: string): Promise<void> {
      // Delete the schema by deleting its alias mapping
      await store.delAlias('schema', alias);
    },

    async schema(alias: string): Promise<SchemaDSL | null> {
      const schemaId = await store.getAliasSaid('schema', alias);
      if (!schemaId) {
        return null;
      }

      // Get schema from storage
      const stored = await store.getEvent(s(schemaId).asSAID());
      if (!stored) {
        return null;
      }

      // Deserialize the schema from the stored event
      const rawBytes = stored.raw instanceof Uint8Array
        ? stored.raw
        : new Uint8Array(Object.values(stored.raw as any));

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
        schemaSaid: schemaId,
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

    sync(): ContactSyncDSL {
      return createContactSyncDSL(store);
    },

    appData(): AppDataDSL {
      return createAppDataDSL(store.kv);
    },

    getStore(): KerStore {
      return store;
    },
  };
}
