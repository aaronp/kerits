import type { PayloadFormat, RemoteCodec, RemoteStore, ResolveRemotePath, TypedRemote } from './types.js';

/**
 * Compose a RemoteStore + RemoteCodec + path resolver into a TypedRemote.
 *
 * TypedRemote handles single-key-to-single-value operations.
 * Multi-artifact orchestration belongs in domain remotes (e.g. KELRemote).
 */
export function createTypedRemote<K, T>(
  store: RemoteStore,
  codec: RemoteCodec<T>,
  resolvePath: ResolveRemotePath<K>,
): TypedRemote<K, T> {
  return {
    async publish(key, value) {
      const payloadFormat: PayloadFormat = codec.payloadFormat ?? 'json';
      return store.publish(resolvePath(key), codec.encode(value), { payloadFormat });
    },
    async fetch(key) {
      const data = await store.fetch(resolvePath(key));
      return data === undefined ? undefined : codec.decode(data);
    },
  };
}
