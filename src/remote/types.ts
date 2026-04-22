/**
 * Remote publishing contracts.
 *
 * These are foundational types for publish/fetch operations against
 * remote stores. Domain remotes (KELRemote, etc.) compose these
 * with codecs and path resolvers to provide typed domain facades.
 */

/** Logical path segments for a remote resource. Stores map these to their own addressing. */
export type RemotePath = readonly string[];

/** Result of a publish operation. */
export type PublishResult = {
  readonly status: 'published' | 'updated' | 'rejected';
  readonly path: RemotePath;
};

/** Byte-level publish/fetch against a remote store. */
export interface RemoteStore {
  publish(path: RemotePath, payload: Uint8Array): Promise<PublishResult>;
  fetch(path: RemotePath): Promise<Uint8Array | undefined>;
}

/** Encode/decode a typed value to/from bytes. Decode throws on invalid data. */
export type RemoteCodec<T> = {
  readonly encode: (value: T) => Uint8Array;
  readonly decode: (data: Uint8Array) => T;
};

/** Map a domain key to a RemotePath. */
export type ResolveRemotePath<K> = (key: K) => RemotePath;

/** Typed publish/fetch composed from store + codec + path resolver. */
export interface TypedRemote<K, T> {
  publish(key: K, value: T): Promise<PublishResult>;
  fetch(key: K): Promise<T | undefined>;
}
