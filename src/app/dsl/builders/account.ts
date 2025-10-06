/**
 * AccountDSL - Account-specific operations
 */

import type { KerStore } from '../../../storage/types';
import type { AccountDSL, Account, Mnemonic, KelEvent, GraphOptions, RegistryOptions } from '../types';
import type { RegistryDSL } from '../types';
import { generateKeypairFromSeed } from '../../../signer';
import { rotate } from '../../../rotate';
import { diger } from '../../../diger';
import { mnemonicToSeed } from '../utils';
import { serializeEvent } from '../utils';
import { createRegistryDSL } from './registry';

/**
 * Create an AccountDSL for a specific account
 */
export function createAccountDSL(account: Account, store: KerStore): AccountDSL {
  return {
    account,

    async rotateKeys(newMnemonic: Mnemonic): Promise<Account> {
      // Convert mnemonic to seed
      const seed = mnemonicToSeed(newMnemonic);

      // Generate new keypair
      const newKp = await generateKeypairFromSeed(seed);

      // Get current KEL
      const kelEvents = await store.listKel(account.aid);
      if (kelEvents.length === 0) {
        throw new Error(`No KEL found for account: ${account.aid}`);
      }

      // Get the last event
      const lastEvent = kelEvents[kelEvents.length - 1];
      const sn = kelEvents.length; // Next sequence number
      const priorSaid = lastEvent.meta.d;

      // Compute next key digest
      const nextKeyDigest = diger(newKp.verfer);

      // Create rotation event
      const rot = rotate({
        pre: account.aid,
        keys: [newKp.verfer],
        dig: priorSaid,
        sn,
        ndigs: [nextKeyDigest],
      });

      // Store rotation event
      const rawRot = serializeEvent(rot.ked);
      await store.putEvent(rawRot);

      // Update account object with new key
      const updatedAccount: Account = {
        ...account,
        verfer: newKp.verfer,
      };

      return updatedAccount;
    },

    async createRegistry(alias: string, opts?: RegistryOptions): Promise<RegistryDSL> {
      const { createRegistry } = await import('../../helpers');

      const { registryId } = await createRegistry(store, {
        alias,
        issuerAid: account.aid,
        backers: opts?.backers || [],
      });

      const registry = {
        alias,
        registryId,
        issuerAid: account.aid,
        createdAt: new Date().toISOString(),
      };

      return createRegistryDSL(registry, account, store);
    },

    async registry(alias: string): Promise<RegistryDSL | null> {
      const registryId = await store.aliasToId('tel', alias);
      if (!registryId) {
        return null;
      }

      const registry = {
        alias,
        registryId,
        issuerAid: account.aid,
        createdAt: '', // Would need to fetch from storage
      };

      return createRegistryDSL(registry, account, store);
    },

    async listRegistries(): Promise<string[]> {
      // Get all TEL aliases
      const allAliases = await store.listAliases('tel');

      // Filter to only registries owned by this account
      const ownedRegistries: string[] = [];
      for (const alias of allAliases) {
        const registryId = await store.aliasToId('tel', alias);
        if (registryId) {
          const telEvents = await store.listTel(registryId);
          // VCP (registry inception) has issuerAid field
          if (telEvents.length > 0 && telEvents[0].meta.issuerAid === account.aid) {
            ownedRegistries.push(alias);
          }
        }
      }

      return ownedRegistries;
    },

    async getKel(): Promise<KelEvent[]> {
      const events = await store.listKel(account.aid);
      // Return the metadata which contains the event type and fields
      return events.map(e => ({
        t: e.meta.t,
        d: e.meta.d,
        i: e.meta.i,
        s: e.meta.s,
        p: e.meta.p,
        ...e.meta,
      }));
    },

    async graph(opts?: GraphOptions): Promise<any> {
      // For now, return global graph
      // TODO: Filter to only this account's events
      return store.buildGraph(opts);
    },
  };
}
