/**
 * AccountDSL - Account-specific operations
 */

import type { KerStore } from '../../../storage/types';
import type { AccountDSL, Account, Mnemonic, KelEvent, GraphOptions, RegistryOptions, ExportDSL, ContactsDSL } from '../types';
import type { RegistryDSL } from '../types';
import type { KeyManager } from '../../keymanager';
import { generateKeypairFromSeed } from '../../../signer';
import { rotate } from '../../../rotate';
import { diger } from '../../../diger';
import { mnemonicToSeed } from '../utils';
import { serializeEvent } from '../utils';
import { createRegistryDSL } from './registry';
import { createContactsDSL } from './contacts';
import { exportKel } from './export';

/**
 * Create an AccountDSL for a specific account
 */
export function createAccountDSL(account: Account, store: KerStore, keyManager?: KeyManager): AccountDSL {
  return {
    account,

    async rotateKeys(newMnemonic: Mnemonic): Promise<Account> {
      // Ensure account is unlocked if keyManager is available
      if (keyManager && !keyManager.isUnlocked(account.aid)) {
        const unlocked = await keyManager.unlockFromStore(account.aid);
        if (!unlocked) {
          throw new Error(`Account ${account.aid} is locked. Call keyManager.unlock() first or provide current mnemonic.`);
        }
      }

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

      // Serialize rotation event
      const rawRot = serializeEvent(rot.ked);

      // Sign if keyManager provided
      let finalBytes = rawRot;
      if (keyManager) {
        const { signKelEvent } = await import('../../signing');
        const signer = keyManager.getSigner(account.aid);
        if (!signer) {
          throw new Error(`Account not unlocked: ${account.aid}`);
        }

        const signed = await signKelEvent(rawRot, signer);
        finalBytes = signed.combined;
      }

      // Store signed rotation event
      await store.putEvent(finalBytes);

      // Update KeyManager with new mnemonic for future operations
      if (keyManager) {
        await keyManager.unlock(account.aid, newMnemonic);
      }

      // Update account object with new key
      const updatedAccount: Account = {
        ...account,
        verfer: newKp.verfer,
      };

      return updatedAccount;
    },

    async createRegistry(alias: string, opts?: RegistryOptions): Promise<RegistryDSL> {
      const { createRegistry } = await import('../../helpers');

      console.log(`Creating registry "${alias}" for account ${account.aid}`);

      // Check if alias already exists
      const existingRegistryId = await store.getAliasSaid('tel', alias);
      if (existingRegistryId) {
        throw new Error(`Registry alias "${alias}" already exists`);
      }

      try {
        // Ensure account is unlocked if keyManager is available
        if (keyManager && !keyManager.isUnlocked(account.aid)) {
          // Try to unlock from KV store
          const unlocked = await keyManager.unlockFromStore(account.aid);
          if (!unlocked) {
            throw new Error(`Account ${account.aid} is locked. Call keyManager.unlock() first or provide mnemonic.`);
          }
        }

        const { registryId } = await createRegistry(store, {
          alias,
          issuerAid: account.aid,
          backers: opts?.backers || [],
          parentRegistryId: opts?.parentRegistryId,
        }, keyManager);

        console.log(`Registry created with ID: ${registryId}`);

        const registry = {
          alias,
          registryId,
          issuerAid: account.aid,
          createdAt: new Date().toISOString(),
        };

        return createRegistryDSL(registry, account, store, keyManager);
      } catch (error) {
        console.error(`Failed to create registry "${alias}":`, error);
        throw error;
      }
    },

    async registry(alias: string): Promise<RegistryDSL | null> {
      const { parseCesrStream } = await import('../../signing');

      const registryId = await store.aliasToId('tel', alias);
      if (!registryId) {
        return null;
      }

      // Check if this registry has a parent by reading the e.parent edge in VCP
      let parentRegistryId: string | undefined;

      try {
        // Get the VCP event for this registry
        const vcpEvent = await store.getEvent(registryId);
        if (vcpEvent) {
          // Parse CESR stream to extract just the event (without signatures)
          const { event: eventBytes } = parseCesrStream(vcpEvent.raw);

          // Decode the event bytes
          const text = new TextDecoder().decode(eventBytes);
          const jsonStart = text.indexOf('{');
          if (jsonStart >= 0) {
            const jsonText = text.substring(jsonStart);
            const event = JSON.parse(jsonText);

            // Check for e.parent.n field
            if (event.e?.parent?.n) {
              parentRegistryId = event.e.parent.n;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to determine parent registry:', error);
      }

      const registry = {
        alias,
        registryId,
        issuerAid: account.aid,
        createdAt: '', // Would need to fetch from storage
        parentRegistryId,
      };

      return createRegistryDSL(registry, account, store, keyManager);
    },

    async listRegistries(): Promise<string[]> {
      const { parseCesrStream } = await import('../../signing');

      // Get registries from KEL seals
      const kelEvents = await store.listKel(account.aid);
      const registryIds = new Set<string>();

      // Walk KEL and extract registry seals from IXN events
      for (const kelEvent of kelEvents) {
        if (kelEvent.meta.t === 'ixn') {
          // Check for seals in event
          const rawEvent = await store.getEvent(kelEvent.meta.d);
          if (rawEvent) {
            try {
              // Parse CESR stream to extract just the event (without signatures)
              const { event: eventBytes } = parseCesrStream(rawEvent.raw);

              // Decode the event bytes
              const text = new TextDecoder().decode(eventBytes);
              const jsonStart = text.indexOf('{');
              if (jsonStart >= 0) {
                const jsonText = text.substring(jsonStart);
                const event = JSON.parse(jsonText);

                // Extract seals
                if (event.a && Array.isArray(event.a)) {
                  for (const seal of event.a) {
                    if (seal.i) {
                      // This is a registry seal (identifier in 'i' field)
                      registryIds.add(seal.i);
                    }
                  }
                }
              }
            } catch (e) {
              // Skip malformed events
              console.warn('Failed to parse KEL event for seals:', e);
            }
          }
        }
      }

      // Convert registry IDs to aliases using getSaidAlias (correct direction)
      const aliases: string[] = [];
      const seenAliases = new Set<string>();

      for (const registryId of registryIds) {
        const alias = await store.getSaidAlias('tel', registryId);

        if (alias && !seenAliases.has(alias)) {
          aliases.push(alias);
          seenAliases.add(alias);
        }
      }

      return aliases;
    },

    async getKel(): Promise<KelEvent[]> {
      const { parseCesrStream, parseIndexedSignatures } = await import('../../signing');

      const events = await store.listKel(account.aid);

      // Parse each event to extract signatures and full event data
      return events.map(e => {
        let signatures: Array<{index: number; signature: string}> | undefined;
        let eventData: any = {};

        // Parse signatures and event JSON from raw CESR
        try {
          const parsed = parseCesrStream(e.raw);

          // Parse signatures
          if (parsed.signatures) {
            signatures = parseIndexedSignatures(parsed.signatures);
          }

          // Parse event JSON to get all fields (k, n, kt, nt, etc.)
          const eventText = new TextDecoder().decode(parsed.event);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            eventData = JSON.parse(eventText.substring(jsonStart));
          }
        } catch (err) {
          console.error(`Failed to parse KEL event ${e.meta.d}:`, err);
          throw err;
        }

        return {
          ...eventData,  // Full event fields (k, n, kt, nt, etc.)
          t: e.meta.t,
          d: e.meta.d,
          i: e.meta.i,
          s: e.meta.s,
          signatures,
          raw: e.raw,
        };
      });
    },

    async export(): Promise<ExportDSL> {
      return exportKel(store, account.aid);
    },

    contacts(): ContactsDSL {
      return createContactsDSL(store);
    },
  };
}
