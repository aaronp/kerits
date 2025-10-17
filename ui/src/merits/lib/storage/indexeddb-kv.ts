/**
 * IndexedDB KV Adapter
 *
 * Browser-compatible storage implementation.
 * Implements the same Kv interface as MemoryKv.
 */

// Import types from merits backend
export interface Kv {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  has(key: string): Promise<boolean>;
  clear?(): Promise<void>;
}

export interface KvOptions {
  namespace?: string;
}

const DB_NAME = 'merits-storage';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export class IndexedDBKv implements Kv {
  private db: IDBDatabase | null = null;
  private namespace: string;

  constructor(options: KvOptions = {}) {
    this.namespace = options.namespace || '';
  }

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Create full key with namespace prefix
   */
  private key(k: string): string {
    return this.namespace ? `${this.namespace}:${k}` : k;
  }

  /**
   * Remove namespace prefix from key
   */
  private unkey(k: string): string {
    if (!this.namespace) return k;
    const prefix = `${this.namespace}:`;
    return k.startsWith(prefix) ? k.substring(prefix.length) : k;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(this.key(key));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, this.key(key));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(this.key(key));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async list(prefix?: string): Promise<string[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const searchKey = prefix ? this.key(prefix) : (this.namespace ? `${this.namespace}:` : '');
        const keys = (request.result as string[])
          .filter((k) => !searchKey || k.startsWith(searchKey))
          .map((k) => this.unkey(k));
        resolve(keys);
      };
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    await this.init();

    if (this.namespace) {
      // Clear only namespaced keys
      const keys = await this.list();
      for (const k of keys) {
        await this.delete(k);
      }
    } else {
      // Clear everything
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }
}
