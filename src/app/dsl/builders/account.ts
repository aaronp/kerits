/**
 * AccountDSL - Account-specific operations
 */

import type { KerStore } from '../../../storage/types';
import type { AccountDSL, Account, Mnemonic, KelEvent, GraphOptions, RegistryOptions, ExportDSL, ContactsDSL } from '../types';
import type { RegistryDSL } from '../types';
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
        parentRegistryId: opts?.parentRegistryId,
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

      // Check if this registry has a parent by reading the e.parent edge in VCP
      let parentRegistryId: string | undefined;

      try {
        // Get the VCP event for this registry
        const vcpEvent = await store.getEvent(registryId);
        if (vcpEvent) {
          // Parse the event to extract parent edge
          const text = new TextDecoder().decode(vcpEvent.raw);
          const jsonStart = text.indexOf('{');
          if (jsonStart >= 0) {
            const json = text.substring(jsonStart);
            const event = JSON.parse(json);

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

      return createRegistryDSL(registry, account, store);
    },

    async listRegistries(): Promise<string[]> {
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
              // Parse the CESR-framed event
              const text = new TextDecoder().decode(rawEvent.raw);
              const jsonStart = text.indexOf('{');
              if (jsonStart >= 0) {
                const json = text.substring(jsonStart);
                const event = JSON.parse(json);

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

      // Convert registry IDs to aliases
      const aliases: string[] = [];
      for (const registryId of registryIds) {
        const alias = await store.idToAlias('tel', registryId);
        if (alias) {
          aliases.push(alias);
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

        // Try to parse signatures and event JSON from raw CESR
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
          // Event might not have signatures or be malformed (backward compatibility)
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
