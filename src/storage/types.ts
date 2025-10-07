/**
 * Core types for KERI storage system
 */

export type QB64 = string;
export type AID = string;
export type SAID = string;

export type EventType =
  | "icp" | "rot" | "ixn"              // KEL
  | "vcp" | "iss" | "rev" | "upg" | "vtc" | "nrx"; // TEL

export interface StoredEvent {
  said: SAID;             // event SAID (d)
  raw: Uint8Array;        // exact CESR-framed bytes (event + attachments)
  kind: string;           // e.g., "KERI10JSON"
  size: number;
  ingestedAt: string;     // ISO timestamp when stored
}

export interface EventMeta {
  // SAD fields (subset; extend as needed)
  v?: string;
  t: EventType;
  d: SAID;
  i?: AID;                // controller AID (KEL) or issuer AID (TEL:iss)
  s?: string;             // sequence number as string
  p?: SAID;               // prior SAID
  dt?: string;            // ISO timestamp
  // TEL
  ri?: SAID;              // registry SAID (for TEL events)
  // ACDC refs (from TEL iss/rev payloads)
  acdcSaid?: SAID;        // ACDC SAID (if referenced)
  issuerAid?: AID;
  holderAid?: AID;
}

export type AttachmentType = "AAB" | "FAB" | "VRC" | "SEAL" | "OTHER";

export interface Attachment {
  eventSaid: SAID;
  type: AttachmentType;
  signerIndex?: number;   // for indexed signatures (AAB)
  signerAid?: AID;        // optional if known
  qb64: QB64;             // attached payload (signature/receipt/seal)
  rawSegment: Uint8Array; // the exact CESR segment bytes
}

/**
 * CESR encoding format
 * - binary: Raw binary CESR bytes (.bin.cesr)
 * - text: CESR encoded as text (.text.cesr)
 */
export type CesrEncoding = 'binary' | 'text';

/**
 * Structured storage key for KV implementations
 * Enables proper file extensions, SQL table routing, and IndexedDB stores
 */
export interface StorageKey {
  /** Path segments (e.g., ['kel', 'EAID123', 'ESAID456']) */
  path: string[];

  /** Type hint for file extensions and serialization */
  type?: 'cesr' | 'json' | 'text';

  /** Optional metadata for KV optimization */
  meta?: {
    /** Event type for CESR files (icp, rot, ixn, vcp, iss, rev) */
    eventType?: EventType;
    /** CESR encoding format (binary or text) */
    cesrEncoding?: CesrEncoding;
    /** Whether this is immutable content-addressed data */
    immutable?: boolean;
    /** Suggested index keys for query optimization */
    indexes?: string[];
  };
}

export interface ParsedEvent {
  stored: Omit<StoredEvent, "said" | "size" | "ingestedAt"> & { kind: string };
  meta: EventMeta;
  attachments: Attachment[];
}

/**
 * KV Adapter - pluggable storage backend
 */
export interface Kv {
  // String-based methods (backward compatible)
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix: string, opts?: { keysOnly?: boolean; limit?: number }): Promise<Array<{ key: string; value?: Uint8Array }>>;
  batch?(ops: Array<{ type: "put" | "del"; key: string; value?: Uint8Array }>): Promise<void>;

  // Structured key methods (optional, for advanced implementations)
  getStructured?(key: StorageKey): Promise<Uint8Array | null>;
  putStructured?(key: StorageKey, value: Uint8Array): Promise<void>;
  delStructured?(key: StorageKey): Promise<void>;
  listStructured?(keyPrefix: StorageKey, opts?: { keysOnly?: boolean; limit?: number }): Promise<Array<{ key: StorageKey; value?: Uint8Array }>>;
}

/**
 * Parser/Hasher injection points
 */
export interface Parser {
  // Parse CESR-framed bytes into SAD meta + attachments
  parse(raw: Uint8Array): ParsedEvent;
}

export interface Hasher {
  // Compute SAID (qb64) from canonical SAD bytes
  computeSaid(sadBytes: Uint8Array): SAID;
}

/**
 * Store options
 */
export interface StoreOptions {
  parser?: Parser;
  hasher?: Hasher;
  clock?: () => string; // ISO time source
}

/**
 * Store API results
 */
export interface PutResult {
  said: SAID;
  meta: EventMeta;
}

export interface StoredWithMeta {
  event: StoredEvent;
  meta: EventMeta;
  attachments: Attachment[];
}

/**
 * Graph types
 */
export interface GraphNode {
  id: string;                // SAID/AID
  label?: string;
  kind: "AID" | "KEL_EVT" | "TEL_REGISTRY" | "TEL_EVT" | "ACDC" | "SCHEMA";
  meta?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind: "ANCHOR" | "PRIOR" | "ISSUES" | "REVOKES" | "WITNESS" | "REFS" | "USES_SCHEMA";
  meta?: Record<string, any>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * KerStore - main storage API
 */
export interface KerStore {
  // Write path
  putEvent(rawCesr: Uint8Array): Promise<PutResult>;
  putAlias(scope: string, id: string, alias: string): Promise<void>;
  delAlias(scope: string, idOrAlias: string, byAlias?: boolean): Promise<void>;

  // Read path
  getEvent(said: SAID): Promise<StoredWithMeta | null>;
  listKel(aid: AID, fromS?: number, toS?: number): Promise<StoredWithMeta[]>;
  listTel(ri: SAID, fromS?: number, toS?: number): Promise<StoredWithMeta[]>;
  getByPrior(p: SAID): Promise<StoredWithMeta[]>;

  // Alias lookup
  aliasToId(scope: string, alias: string): Promise<string | null>;
  idToAlias(scope: string, id: string): Promise<string | null>;

  // Graph DSL
  buildGraph(opts?: { limit?: number; scopeAliases?: string[] }): Promise<Graph>;

  // List aliases in a scope
  listAliases(scope: string): Promise<string[]>;

  // Expose KV for advanced usage
  kv: Kv;
}
