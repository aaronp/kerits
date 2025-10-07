/**
 * IndexedDB KV adapter for browser environments
 *
 * Uses a simple key-value store design:
 * - Single object store 'kv' with string keys and Uint8Array values
 * - Supports prefix-based listing via IDBKeyRange
 * - Batch operations via transactions
 */

import type { Kv, StorageKey } from '../types';

const DB_NAME = 'kerits-kv';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

/**
 * IndexedDB-backed key-value store implementing the Kv interface
 */
export class IndexedDBKv implements Kv {
  private dbPromise: Promise<IDBDatabase>;

  constructor(dbName: string = DB_NAME) {
    this.dbPromise = this.openDB(dbName);
  }

  private async openDB(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get(key: string): Promise<Uint8Array | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const value = request.result;
        // IndexedDB may return undefined for missing keys
        resolve(value instanceof Uint8Array ? value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async del(key: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async list(
    prefix: string,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: string; value?: Uint8Array }>> {
    const db = await this.dbPromise;
    const limit = opts?.limit ?? Infinity;
    const keysOnly = opts?.keysOnly ?? false;

    return new Promise((resolve, reject) => {
      const results: Array<{ key: string; value?: Uint8Array }> = [];
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      // Create key range for prefix scan
      // Example: prefix "ev/" matches "ev/..." to "ev/\uffff"
      const range = IDBKeyRange.bound(
        prefix,
        prefix + '\uffff',
        false, // include lower bound
        false  // include upper bound
      );

      const request = store.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && results.length < limit) {
          const key = cursor.key as string;

          if (keysOnly) {
            results.push({ key });
          } else {
            const value = cursor.value as Uint8Array;
            results.push({ key, value });
          }

          cursor.continue();
        } else {
          // No more entries or limit reached
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async batch(
    ops: Array<{ type: "put" | "del"; key: string; value?: Uint8Array }>
  ): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Execute all operations in the transaction
      for (const op of ops) {
        if (op.type === 'put' && op.value) {
          store.put(op.value, op.key);
        } else if (op.type === 'del') {
          store.delete(op.key);
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Clear all data from the store (useful for testing)
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get the number of entries in the store (useful for testing)
   */
  async size(): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    const db = await this.dbPromise;
    db.close();
  }

  // Structured key methods (required by KerStore)

  /**
   * Convert StorageKey to string key
   */
  private keyToString(key: StorageKey): string {
    return key.path.join('/');
  }

  /**
   * Convert string key back to StorageKey
   */
  private stringToKey(s: string): StorageKey {
    return { path: s.split('/') };
  }

  async getStructured(key: StorageKey): Promise<Uint8Array | null> {
    return this.get(this.keyToString(key));
  }

  async putStructured(key: StorageKey, value: Uint8Array): Promise<void> {
    return this.put(this.keyToString(key), value);
  }

  async delStructured(key: StorageKey): Promise<void> {
    return this.del(this.keyToString(key));
  }

  async listStructured(
    keyPrefix: StorageKey,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: StorageKey; value?: Uint8Array }>> {
    const prefix = this.keyToString(keyPrefix);
    const results = await this.list(prefix, opts);

    return results.map(r => ({
      key: this.stringToKey(r.key),
      value: r.value,
    }));
  }
}
