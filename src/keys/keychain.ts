// packages/core/src/keys/keychain.ts

import type { Result } from '../result.js';
import { err } from '../result.js';
import { publicKeyHex } from './raw-public-key.js';
import type { SignPurpose } from './sign-purpose.js';
import type { Algo, KeyGenerator, KeyScope, KeyStore, RawPublicKey, ResolveKeyError } from './types.js';

/**
 * Store ids (`KeyStore.id`) are not a durable reference: an external key's store is found only by asking live
 * registered stores. Intended fix: a typed `StoreRef` resolved by the wallet, matching `UnlockRef`
 * (see docs/superpowers/specs/2026-11-04-unlock-ref-design.md).
 */
export type Keychain = {
  register(store: KeyStore, generator?: KeyGenerator): void;
  getStore(id: string): KeyStore | undefined;
  getGeneratorFor(algo: Algo): KeyGenerator | undefined;
  getGenerator(id: string): KeyGenerator | undefined;
  listGeneratorIds(): readonly string[];
  hasKey(publicKey: RawPublicKey): Promise<boolean>;
  /** Store id that holds this public key, if any. No unlock. */
  findStoreId(publicKey: RawPublicKey): Promise<string | undefined>;
  resolve(publicKey: RawPublicKey, purpose: SignPurpose): Promise<Result<KeyScope, ResolveKeyError>>;
};

export namespace Keychains {
  export function create(): Keychain {
    const stores = new Map<string, KeyStore>();
    const generators = new Map<string, KeyGenerator>();
    // Index: hex(publicKey) → store id for O(1) repeat lookups
    const keyIndex = new Map<string, string>();

    return {
      register(store: KeyStore, generator?: KeyGenerator): void {
        stores.set(store.id, store);
        if (generator) generators.set(generator.id, generator);
      },

      getStore(id: string): KeyStore | undefined {
        return stores.get(id);
      },

      getGeneratorFor(algo: Algo): KeyGenerator | undefined {
        return [...generators.values()].find((g) => g.supports().has(algo));
      },

      getGenerator(id: string): KeyGenerator | undefined {
        return generators.get(id);
      },

      listGeneratorIds(): readonly string[] {
        return [...generators.keys()];
      },

      async hasKey(publicKey: RawPublicKey): Promise<boolean> {
        for (const store of stores.values()) {
          if (await store.hasKey(publicKey)) return true;
        }
        return false;
      },

      async findStoreId(publicKey: RawPublicKey): Promise<string | undefined> {
        const hex = publicKeyHex(publicKey);
        const indexedId = keyIndex.get(hex);
        if (indexedId && stores.has(indexedId)) {
          const store = stores.get(indexedId)!;
          if (await store.hasKey(publicKey)) return indexedId;
        }
        for (const [id, store] of stores) {
          if (await store.hasKey(publicKey)) {
            keyIndex.set(hex, id);
            return id;
          }
        }
        return undefined;
      },

      async resolve(publicKey: RawPublicKey, purpose: SignPurpose): Promise<Result<KeyScope, ResolveKeyError>> {
        const hex = publicKeyHex(publicKey);

        // Fast path: check index
        const indexedId = keyIndex.get(hex);
        if (indexedId) {
          const store = stores.get(indexedId);
          if (store) return store.resolve(publicKey, purpose);
        }

        // Slow path: iterate all stores
        for (const [id, store] of stores) {
          if (await store.hasKey(publicKey)) {
            keyIndex.set(hex, id);
            return store.resolve(publicKey, purpose);
          }
        }

        return err({ kind: 'key-not-found', publicKey });
      },
    };
  }
}
