import { publicKeyHex } from './raw-public-key.js';
import type { EncryptedKeyEntry, KeyPersistence, RawPublicKey } from './types.js';

export namespace KeyPersistences {
  /** In-memory Map-backed persistence. For testing. Uses publicKeyHex() as map key. */
  export function inMemory(): KeyPersistence {
    const entries = new Map<string, EncryptedKeyEntry>();
    return {
      async store(entry: EncryptedKeyEntry) {
        entries.set(publicKeyHex(entry.publicKey), entry);
      },
      async storeMany(batch: readonly EncryptedKeyEntry[]) {
        for (const entry of batch) entries.set(publicKeyHex(entry.publicKey), entry);
      },
      async lookup(publicKey: RawPublicKey) {
        return entries.get(publicKeyHex(publicKey));
      },
      async lookupByDigest(digest: string) {
        for (const entry of entries.values()) {
          if (entry.publicKeyDigest === digest) return entry.publicKey;
        }
        return undefined;
      },
      async list() {
        return [...entries.values()];
      },
    };
  }
}
