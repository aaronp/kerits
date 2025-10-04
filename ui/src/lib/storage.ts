/**
 * Normalized Browser Storage using IndexedDB
 *
 * Architecture:
 * - KELs (Key Event Logs) are stored by AID as the canonical source
 * - TELs (Transaction Event Logs) are stored by registry AID
 * - ACDCs (credentials) are stored by SAID
 * - Aliases are separate bidirectional mappings to SAIDs/AIDs
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// Core Data Types (Canonical Storage)
// ============================================================================

/**
 * KEL - Key Event Log
 * Canonical storage for identity event logs, keyed by AID
 */
export interface KEL {
  aid: string; // Autonomic Identifier (key)
  inceptionEvent: any; // icp event
  events: any[]; // Rotation events (rot)
  createdAt: string;
}

/**
 * TEL - Transaction Event Log (Registry)
 * Canonical storage for credential registry event logs, keyed by registry AID
 */
export interface TEL {
  registryAID: string; // Registry identifier (key)
  issuerAID: string; // Who owns this registry
  inceptionEvent: any; // vcp (registry inception) event
  events: any[]; // iss, rev, bis, brv events
  createdAt: string;
}

/**
 * ACDC - Authentic Chained Data Container (Credential)
 * Canonical storage for credentials, keyed by SAID
 */
export interface ACDC {
  said: string; // Self-Addressing Identifier (key)
  sad: any; // Self-Addressing Data (the actual credential)
  schema: string; // Schema SAID
  issuer: string; // Issuer AID
  recipient?: string; // Recipient AID
  registry?: string; // Registry AID where this was issued
  createdAt: string;
}

/**
 * Schema - Credential Schema
 * Keyed by schema SAID
 */
export interface Schema {
  said: string; // Schema SAID (key)
  sad: any; // Self-Addressing Data (the schema definition)
  createdAt: string;
}

// ============================================================================
// Alias Mappings (Bidirectional lookups)
// ============================================================================

/**
 * Alias mapping - bidirectional lookup between aliases and SAIDs/AIDs
 */
export interface AliasMapping {
  id: string; // UUID (key)
  alias: string; // Human-readable name
  said: string; // SAID or AID this alias points to
  type: 'kel' | 'tel' | 'acdc' | 'schema'; // What kind of thing this is
  createdAt: string;
}

// ============================================================================
// User & Settings
// ============================================================================

export interface User {
  id: string; // UUID (key)
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AppSettings {
  key: 'currentUser';
  value: string | null; // User ID
}

// ============================================================================
// IndexedDB Schema
// ============================================================================

interface NormalizedKeriDB extends DBSchema {
  // Canonical storage - event logs
  kels: {
    key: string; // AID
    value: KEL;
  };
  tels: {
    key: string; // Registry AID
    value: TEL;
    indexes: { 'by-issuer': string };
  };
  acdcs: {
    key: string; // Credential SAID
    value: ACDC;
    indexes: { 'by-issuer': string; 'by-recipient': string; 'by-schema': string; 'by-registry': string };
  };
  schemas: {
    key: string; // Schema SAID
    value: Schema;
  };

  // Alias mappings
  aliases: {
    key: string; // UUID
    value: AliasMapping;
    indexes: { 'by-alias': string; 'by-said': string; 'by-type': string };
  };

  // User management (global DB only)
  users: {
    key: string;
    value: User;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const GLOBAL_DB_NAME = 'keri-demo-global-v2';
const DB_VERSION = 1;

let globalDbPromise: Promise<IDBPDatabase<NormalizedKeriDB>> | null = null;
let userDbPromises: Map<string, Promise<IDBPDatabase<NormalizedKeriDB>>> = new Map();

// Reset database connections (useful after clearing data)
export function resetDatabaseConnections(): void {
  globalDbPromise = null;
  userDbPromises.clear();
}

// Global DB for users and settings only
async function getGlobalDB(): Promise<IDBPDatabase<NormalizedKeriDB>> {
  if (!globalDbPromise) {
    globalDbPromise = openDB<NormalizedKeriDB>(GLOBAL_DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return globalDbPromise;
}

// User-specific DB for KELs, TELs, ACDCs, schemas, and aliases
async function getUserDB(userId: string): Promise<IDBPDatabase<NormalizedKeriDB>> {
  if (!userDbPromises.has(userId)) {
    const dbPromise = openDB<NormalizedKeriDB>(`keri-demo-user-v2-${userId}`, DB_VERSION, {
      upgrade(db) {
        // KEL store - canonical identity event logs
        if (!db.objectStoreNames.contains('kels')) {
          db.createObjectStore('kels', { keyPath: 'aid' });
        }

        // TEL store - canonical registry event logs
        if (!db.objectStoreNames.contains('tels')) {
          const telStore = db.createObjectStore('tels', { keyPath: 'registryAID' });
          telStore.createIndex('by-issuer', 'issuerAID', { unique: false });
        }

        // ACDC store - canonical credential storage
        if (!db.objectStoreNames.contains('acdcs')) {
          const acdcStore = db.createObjectStore('acdcs', { keyPath: 'said' });
          acdcStore.createIndex('by-issuer', 'issuer', { unique: false });
          acdcStore.createIndex('by-recipient', 'recipient', { unique: false });
          acdcStore.createIndex('by-schema', 'schema', { unique: false });
          acdcStore.createIndex('by-registry', 'registry', { unique: false });
        }

        // Schema store
        if (!db.objectStoreNames.contains('schemas')) {
          db.createObjectStore('schemas', { keyPath: 'said' });
        }

        // Alias mappings - bidirectional lookups
        if (!db.objectStoreNames.contains('aliases')) {
          const aliasStore = db.createObjectStore('aliases', { keyPath: 'id' });
          aliasStore.createIndex('by-alias', 'alias', { unique: true });
          aliasStore.createIndex('by-said', 'said', { unique: false });
          aliasStore.createIndex('by-type', 'type', { unique: false });
        }
      },
    });
    userDbPromises.set(userId, dbPromise);
  }
  return userDbPromises.get(userId)!;
}

// Get current user's DB
async function getDB(userId?: string): Promise<IDBPDatabase<NormalizedKeriDB>> {
  if (userId) {
    return getUserDB(userId);
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No user logged in');
  }
  return getUserDB(user.id);
}

// ============================================================================
// KEL Management
// ============================================================================

export async function saveKEL(kel: KEL, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('kels', kel);
}

export async function getKEL(aid: string, userId?: string): Promise<KEL | undefined> {
  const db = await getDB(userId);
  return db.get('kels', aid);
}

export async function getAllKELs(userId?: string): Promise<KEL[]> {
  const db = await getDB(userId);
  return db.getAll('kels');
}

export async function deleteKEL(aid: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('kels', aid);
}

// ============================================================================
// TEL Management
// ============================================================================

export async function saveTEL(tel: TEL, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('tels', tel);
}

export async function getTEL(registryAID: string, userId?: string): Promise<TEL | undefined> {
  const db = await getDB(userId);
  return db.get('tels', registryAID);
}

export async function getAllTELs(userId?: string): Promise<TEL[]> {
  const db = await getDB(userId);
  return db.getAll('tels');
}

export async function getTELsByIssuer(issuerAID: string, userId?: string): Promise<TEL[]> {
  const db = await getDB(userId);
  return db.getAllFromIndex('tels', 'by-issuer', issuerAID);
}

export async function deleteTEL(registryAID: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('tels', registryAID);
}

// ============================================================================
// ACDC Management
// ============================================================================

export async function saveACDC(acdc: ACDC, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('acdcs', acdc);
}

export async function getACDC(said: string, userId?: string): Promise<ACDC | undefined> {
  const db = await getDB(userId);
  return db.get('acdcs', said);
}

export async function getAllACDCs(userId?: string): Promise<ACDC[]> {
  const db = await getDB(userId);
  return db.getAll('acdcs');
}

export async function getACDCsByIssuer(issuerAID: string, userId?: string): Promise<ACDC[]> {
  const db = await getDB(userId);
  return db.getAllFromIndex('acdcs', 'by-issuer', issuerAID);
}

export async function getACDCsByRecipient(recipientAID: string, userId?: string): Promise<ACDC[]> {
  const db = await getDB(userId);
  return db.getAllFromIndex('acdcs', 'by-recipient', recipientAID);
}

export async function getACDCsBySchema(schemaSAID: string, userId?: string): Promise<ACDC[]> {
  const db = await getDB(userId);
  return db.getAllFromIndex('acdcs', 'by-schema', schemaSAID);
}

export async function getACDCsByRegistry(registryAID: string, userId?: string): Promise<ACDC[]> {
  const db = await getDB(userId);
  return db.getAllFromIndex('acdcs', 'by-registry', registryAID);
}

export async function deleteACDC(said: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('acdcs', said);
}

// ============================================================================
// Schema Management
// ============================================================================

export async function saveSchema(schema: Schema, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('schemas', schema);
}

export async function getSchema(said: string, userId?: string): Promise<Schema | undefined> {
  const db = await getDB(userId);
  return db.get('schemas', said);
}

export async function getAllSchemas(userId?: string): Promise<Schema[]> {
  const db = await getDB(userId);
  return db.getAll('schemas');
}

export async function deleteSchema(said: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('schemas', said);
}

// ============================================================================
// Alias Management
// ============================================================================

export async function saveAlias(alias: AliasMapping, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('aliases', alias);
}

export async function getAliasBySAID(said: string, userId?: string): Promise<AliasMapping | undefined> {
  const db = await getDB(userId);
  return db.getFromIndex('aliases', 'by-said', said);
}

export async function getAliasByName(alias: string, userId?: string): Promise<AliasMapping | undefined> {
  const db = await getDB(userId);
  return db.getFromIndex('aliases', 'by-alias', alias);
}

export async function getSAIDByAlias(alias: string, userId?: string): Promise<string | undefined> {
  const mapping = await getAliasByName(alias, userId);
  return mapping?.said;
}

export async function getAllAliases(userId?: string): Promise<AliasMapping[]> {
  const db = await getDB(userId);
  return db.getAll('aliases');
}

export async function deleteAlias(id: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('aliases', id);
}

// ============================================================================
// User Management
// ============================================================================

export async function saveUser(user: User): Promise<void> {
  const db = await getGlobalDB();
  await db.put('users', user);
}

export async function getUsers(): Promise<User[]> {
  const db = await getGlobalDB();
  return db.getAll('users');
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getGlobalDB();
  return db.get('users', id);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getGlobalDB();
  await db.delete('users', id);
}

export async function getCurrentUser(): Promise<User | null> {
  const db = await getGlobalDB();
  const settings = await db.get('settings', 'currentUser');
  if (!settings?.value) return null;
  return (await db.get('users', settings.value)) || null;
}

export async function setCurrentUser(userId: string | null): Promise<void> {
  const db = await getGlobalDB();
  await db.put('settings', { key: 'currentUser', value: userId });
}

export async function clearCurrentUser(): Promise<void> {
  await setCurrentUser(null);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all user data
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('kels'),
    db.clear('tels'),
    db.clear('acdcs'),
    db.clear('schemas'),
    db.clear('aliases'),
  ]);
}

/**
 * Helper: Resolve alias to SAID/AID
 */
export async function resolveAlias(aliasOrSaid: string, userId?: string): Promise<string> {
  // If it looks like a SAID/AID (starts with capital letter), return as-is
  if (/^[A-Z]/.test(aliasOrSaid)) {
    return aliasOrSaid;
  }
  // Otherwise try to resolve as alias
  const said = await getSAIDByAlias(aliasOrSaid, userId);
  return said || aliasOrSaid;
}

/**
 * Helper: Get display name for a SAID/AID (alias if exists, otherwise truncated SAID)
 */
export async function getDisplayName(said: string, userId?: string): Promise<string> {
  const alias = await getAliasBySAID(said, userId);
  return alias?.alias || `${said.substring(0, 12)}...`;
}
