/**
 * Storage implementations and utilities
 */

import type { KeyValueStore, NamespacedStore, SAID, Bytes, ContentAddressedStore, Hasher } from './types';

/**
 * Memory store implementation (for testing and development)
 */
export function memoryStore(): KeyValueStore {
    const m = new Map<string, Bytes>();

    return {
        async get(id) {
            return m.get(id) ?? null;
        },
        async put(id, data) {
            m.set(id, data);
        },
        async del(id) {
            m.delete(id);
        },
        async has(id) {
            return m.has(id);
        },
        async listKeys(prefix = "") {
            return [...m.keys()].filter(k => k.startsWith(prefix)) as SAID[];
        },
    };
}

/**
 * Namespace a KeyValueStore with a prefix
 */
export function namespace(store: KeyValueStore, ns: string): NamespacedStore {
    const prefix = ns.endsWith(":") ? ns : ns + ":";
    const mapId = (id: SAID) => (id.startsWith(prefix) ? id : (prefix + id) as SAID);

    return {
        namespace: prefix,
        async get(id) {
            return store.get(mapId(id));
        },
        async put(id, data) {
            return store.put(mapId(id), data);
        },
        async del(id) {
            return store.del?.(mapId(id));
        },
        async has(id) {
            return store.has?.(mapId(id)) ?? !!(await this.get(id));
        },
        async listKeys(pfx) {
            const keys = await store.listKeys?.(prefix + (pfx ?? "")) ?? [];
            return keys.map(key => key.replace(prefix, '') as SAID);
        }
    };
}

/**
 * Content-addressed store wrapper
 * 
 * Automatically computes SAIDs and handles deduplication
 */
export function contentAddressed(store: KeyValueStore, hasher: Hasher): ContentAddressedStore {
    return {
        async putObject<T>(obj: T, encode: (o: T) => Bytes): Promise<SAID> {
            const bytes = encode(obj);
            const said = hasher.saidOf(bytes);
            await store.put(said, bytes);
            return said;
        },

        async getObject<T>(id: SAID, decode: (b: Bytes) => T): Promise<T | null> {
            const b = await store.get(id);
            if (!b) return null;
            return decode(b);
        }
    };
}

/**
 * JSON storage helpers
 */
export async function putJson(store: KeyValueStore, id: SAID, obj: any): Promise<void> {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    await store.put(id, data);
}

export async function getJson<T>(store: KeyValueStore, id: SAID): Promise<T | null> {
    const b = await store.get(id);
    if (!b) return null;
    return JSON.parse(new TextDecoder().decode(b)) as T;
}

/**
 * String-key JSON storage helpers (for non-SAID keys like rotation:${id})
 */
export async function putJsonString(store: KeyValueStore, key: string, obj: any): Promise<void> {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    await store.put(key as SAID, data);
}

export async function getJsonString<T>(store: KeyValueStore, key: string): Promise<T | null> {
    const b = await store.get(key as SAID);
    if (!b) return null;
    return JSON.parse(new TextDecoder().decode(b)) as T;
}

/**
 * OOBI resolver from store
 */
export function oobiFromStore(store: KeyValueStore): import('./types').OOBIResolver {
    return {
        async resolve(id) {
            return store.get(id as SAID);
        }
    };
}
