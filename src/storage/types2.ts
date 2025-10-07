/**
 * New storage types for KerStore2
 * Clean, structured key-based storage layer
 */

import type { SAID, AID, EventType, EventMeta, Graph, GraphOptions, CesrEncoding } from './types';

/**
 * Result from storing an event
 */
export interface PutResult {
  said: SAID;
  meta: EventMeta;
}

/**
 * KEL event with raw CESR and metadata
 */
export interface KelEvent {
  said: SAID;
  raw: Uint8Array;
  meta: EventMeta;
}

/**
 * TEL event with raw CESR and metadata
 */
export interface TelEvent {
  said: SAID;
  raw: Uint8Array;
  meta: EventMeta;
}

/**
 * Modern KerStore interface using structured keys exclusively
 * No backward compatibility with string-based keys
 */
export interface KerStore2 {
  // Event storage (raw CESR + metadata)
  putEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  getEvent(said: SAID): Promise<{ raw: Uint8Array; meta: EventMeta } | null>;

  // KEL operations
  putKelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  listKel(aid: AID, fromS?: number, toS?: number): Promise<KelEvent[]>;
  getKelHead(aid: AID): Promise<SAID | null>;
  setKelHead(aid: AID, said: SAID): Promise<void>;

  // TEL operations
  putTelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  listTel(ri: SAID, fromS?: number): Promise<TelEvent[]>;
  getTelHead(ri: SAID): Promise<SAID | null>;
  setTelHead(ri: SAID, said: SAID): Promise<void>;

  // ACDC operations (content-addressable)
  putACDC(acdc: any): Promise<SAID>;
  getACDC(said: SAID): Promise<any | null>;

  // Schema operations
  putSchema(schema: any): Promise<SAID>;
  getSchema(said: SAID): Promise<any | null>;

  // Alias operations
  putAlias(scope: 'kel' | 'tel' | 'schema' | 'acdc', said: SAID, alias: string): Promise<void>;
  getAliasSaid(scope: 'kel' | 'tel' | 'schema' | 'acdc', alias: string): Promise<SAID | null>;
  getSaidAlias(scope: 'kel' | 'tel' | 'schema' | 'acdc', said: SAID): Promise<string | null>;
  listAliases(scope: 'kel' | 'tel' | 'schema' | 'acdc'): Promise<string[]>;
  delAlias(scope: 'kel' | 'tel' | 'schema' | 'acdc', alias: string): Promise<void>;

  // Graph building (unchanged)
  buildGraph(opts?: GraphOptions): Promise<Graph>;

  // Utility
  clear?(): Promise<void>;
}

/**
 * Options for creating KerStore2
 */
export interface StoreOptions2 {
  /** Default CESR encoding to use */
  defaultEncoding?: CesrEncoding;
  /** Custom parser (optional) */
  parser?: any;
  /** Custom hasher (optional) */
  hasher?: any;
  /** Clock for timestamps */
  clock?: () => string;
}
