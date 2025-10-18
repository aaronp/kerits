/**
 * KERI Storage - Pluggable storage API for KEL/TEL/ACDC data
 *
 * Public exports
 */

// Core types
export type {
  QB64,
  AID,
  SAID,
  EventType,
  StoredEvent,
  AttachmentType,
  Attachment,
  ParsedEvent,
  Kv,
  Parser,
  Hasher,
  StoreOptions,
  PutResult,
  StoredWithMeta,
  KerStore,
} from './types';

// Core factory
export { createKerStore } from './core';

// Parsers and hashers
export { DefaultJsonCesrParser, CesrHasher, NonCryptoHasher } from './parser';

// Adapters
export { MemoryKv } from './adapters/memory';
export { DiskKv } from './adapters/disk';
export type { DiskKvOptions } from './adapters/disk';
export { IndexedDBKv } from './adapters/indexeddb';
