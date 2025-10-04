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
  description?: string; // User-provided description
  fields?: Array<{ name: string; type: string; required?: boolean; description?: string }>; // Field metadata for UI
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
// Identity Metadata (Private Keys and Mnemonic)
// ============================================================================

export interface IdentityMetadata {
  aid: string; // Autonomic Identifier (key)
  mnemonic: string;
  currentKeys: { public: string; private: string; seed: string };
  nextKeys: { public: string; private: string; seed: string };
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

  // Identity metadata (private keys and mnemonics)
  identityMetadata: {
    key: string; // AID
    value: IdentityMetadata;
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
const GLOBAL_DB_VERSION = 1; // Global DB only has users and settings
const USER_DB_VERSION = 2; // User DB version incremented to add identityMetadata store

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
    globalDbPromise = openDB<NormalizedKeriDB>(GLOBAL_DB_NAME, GLOBAL_DB_VERSION, {
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
    const dbPromise = openDB<NormalizedKeriDB>(`keri-demo-user-v2-${userId}`, USER_DB_VERSION, {
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

        // Identity metadata - private keys and mnemonics
        if (!db.objectStoreNames.contains('identityMetadata')) {
          db.createObjectStore('identityMetadata', { keyPath: 'aid' });
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

export async function saveSchemaData(schema: Schema, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('schemas', schema);
}

export async function getSchemaData(said: string, userId?: string): Promise<Schema | undefined> {
  const db = await getDB(userId);
  return db.get('schemas', said);
}

export async function getAllSchemas(userId?: string): Promise<Schema[]> {
  const db = await getDB(userId);
  return db.getAll('schemas');
}

export async function deleteSchemaData(said: string, userId?: string): Promise<void> {
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
    db.clear('identityMetadata'),
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

// ============================================================================
// Component Compatibility Layer (simple wrappers)
// ============================================================================

export interface StoredIdentity {
  alias: string;
  prefix: string;
  mnemonic: string;
  currentKeys: { public: string; private: string; seed: string };
  nextKeys: { public: string; private: string; seed: string };
  inceptionEvent: any;
  kel: any[];
  createdAt: string;
}

export interface StoredCredential {
  id: string;
  name: string;
  issuer: string;
  issuerAlias?: string;
  recipient?: string;
  recipientAlias?: string;
  schema: string;
  schemaName?: string;
  sad: any;
  tel?: any[];
  registry?: string;
  createdAt: string;
}

export interface StoredSchema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  sad: any;
  createdAt: string;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  required?: boolean;
  description?: string;
}

export interface Contact {
  id: string;
  name: string;
  kel: any[];
  prefix: string;
  createdAt: string;
}

export interface TELRegistry {
  id: string;
  alias: string;
  registryAID: string;
  issuerAID: string;
  inceptionEvent: any;
  tel: any[];
  createdAt: string;
}

export async function saveIdentity(identity: StoredIdentity, userId?: string): Promise<void> {
  const db = await getDB(userId);

  // Save KEL events
  await saveKEL({
    aid: identity.prefix,
    inceptionEvent: identity.inceptionEvent,
    events: identity.kel,
    createdAt: identity.createdAt,
  }, userId);

  // Save identity metadata (mnemonic and keys)
  await db.put('identityMetadata', {
    aid: identity.prefix,
    mnemonic: identity.mnemonic,
    currentKeys: identity.currentKeys,
    nextKeys: identity.nextKeys,
  });

  // Save or update alias
  const existingAlias = await getAliasByName(identity.alias, userId);
  if (existingAlias) {
    // Update existing alias mapping
    await saveAlias({
      id: existingAlias.id,
      alias: identity.alias,
      said: identity.prefix,
      type: 'kel',
      createdAt: existingAlias.createdAt,
    }, userId);
  } else {
    // Create new alias mapping
    await saveAlias({
      id: crypto.randomUUID(),
      alias: identity.alias,
      said: identity.prefix,
      type: 'kel',
      createdAt: identity.createdAt,
    }, userId);
  }
}

export async function getIdentities(userId?: string): Promise<StoredIdentity[]> {
  const db = await getDB(userId);
  const kels = await getAllKELs(userId);
  const aliases = await getAllAliases(userId);
  const identityMetadata = await db.getAll('identityMetadata');

  // Only return KELs that have identity metadata (user identities, not contacts)
  const identityAIDs = new Set(identityMetadata.map(m => m.aid));

  return Promise.all(
    kels
      .filter(kel => identityAIDs.has(kel.aid)) // Only include user identities
      .map(async (kel) => {
        const aliasMapping = aliases.find(a => a.said === kel.aid && a.type === 'kel');
        const metadata = await db.get('identityMetadata', kel.aid);

        return {
          alias: aliasMapping?.alias || kel.aid.substring(0, 8),
          prefix: kel.aid,
          mnemonic: metadata?.mnemonic || '',
          currentKeys: metadata?.currentKeys || { public: '', private: '', seed: '' },
          nextKeys: metadata?.nextKeys || { public: '', private: '', seed: '' },
          inceptionEvent: kel.inceptionEvent,
          kel: kel.events,
          createdAt: kel.createdAt,
        };
      })
  );
}

export async function deleteIdentity(alias: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  const aid = await getSAIDByAlias(alias, userId);
  if (aid) {
    await deleteKEL(aid, userId);
    await db.delete('identityMetadata', aid);
    const aliasMapping = await getAliasByName(alias, userId);
    if (aliasMapping) await deleteAlias(aliasMapping.id, userId);
  }
}

export async function saveCredential(credential: StoredCredential, userId?: string): Promise<void> {
  await saveACDC({
    said: credential.id,
    sad: credential.sad,
    schema: credential.schema,
    issuer: credential.issuer,
    recipient: credential.recipient,
    registry: credential.registry,
    createdAt: credential.createdAt,
  }, userId);
}

export async function getCredentials(userId?: string): Promise<StoredCredential[]> {
  const acdcs = await getAllACDCs(userId);
  const aliases = await getAllAliases(userId);

  return acdcs.map(acdc => {
    const issuerAlias = aliases.find(a => a.said === acdc.issuer && a.type === 'kel');
    const recipientAlias = acdc.recipient ? aliases.find(a => a.said === acdc.recipient && a.type === 'kel') : undefined;
    const schemaAlias = aliases.find(a => a.said === acdc.schema && a.type === 'schema');

    return {
      id: acdc.said,
      name: acdc.sad.a?.name || 'Unnamed Credential',
      issuer: acdc.issuer,
      issuerAlias: issuerAlias?.alias,
      recipient: acdc.recipient,
      recipientAlias: recipientAlias?.alias,
      schema: acdc.schema,
      schemaName: schemaAlias?.alias,
      sad: acdc.sad,
      tel: [],
      registry: acdc.registry,
      createdAt: acdc.createdAt,
    };
  });
}

export async function deleteCredential(id: string, userId?: string): Promise<void> {
  await deleteACDC(id, userId);
}

export async function saveSchema(schema: StoredSchema, userId?: string): Promise<void> {
  await saveSchemaData({
    said: schema.id,
    sad: schema.sad,
    description: schema.description,
    fields: schema.fields,
    createdAt: schema.createdAt,
  }, userId);

  // Save or update alias
  const existingAlias = await getAliasByName(schema.name, userId);
  if (existingAlias) {
    // Update existing alias mapping
    await saveAlias({
      id: existingAlias.id,
      alias: schema.name,
      said: schema.id,
      type: 'schema',
      createdAt: existingAlias.createdAt,
    }, userId);
  } else {
    // Create new alias mapping
    await saveAlias({
      id: crypto.randomUUID(),
      alias: schema.name,
      said: schema.id,
      type: 'schema',
      createdAt: schema.createdAt,
    }, userId);
  }
}

export async function getSchemas(userId?: string): Promise<StoredSchema[]> {
  const schemas = await getAllSchemas(userId);
  const aliases = await getAllAliases(userId);

  return schemas.map(s => {
    const aliasMapping = aliases.find(a => a.said === s.said && a.type === 'schema');

    // Prefer stored fields metadata if available, otherwise reconstruct from SAD
    let fields = s.fields;
    let description = s.description;

    if (!fields || fields.length === 0) {
      // Fallback: reconstruct from SAD structure
      const sadData = s.sad.sad || s.sad;
      fields = sadData.properties ? Object.entries(sadData.properties).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type || 'string',
        required: sadData.required?.includes(name),
        description: prop.description,
      })) : [];
      description = description || sadData.description;
    }

    return {
      id: s.said,
      name: aliasMapping?.alias || (s.sad.sad || s.sad).title || 'Unnamed Schema',
      description,
      fields,
      sad: s.sad,
      createdAt: s.createdAt,
    };
  });
}

export async function deleteSchema(id: string, userId?: string): Promise<void> {
  await deleteSchemaData(id, userId);
  const aliasMapping = await getAliasBySAID(id, userId);
  if (aliasMapping) await deleteAlias(aliasMapping.id, userId);
}

export async function saveContact(contact: Contact, userId?: string): Promise<void> {
  await saveKEL({
    aid: contact.prefix,
    inceptionEvent: contact.kel[0],
    events: contact.kel.slice(1),
    createdAt: contact.createdAt,
  }, userId);

  await saveAlias({
    id: contact.id,
    alias: contact.name,
    said: contact.prefix,
    type: 'kel',
    createdAt: contact.createdAt,
  }, userId);
}

export async function getContacts(userId?: string): Promise<Contact[]> {
  const db = await getDB(userId);
  const kels = await getAllKELs(userId);
  const aliases = await getAllAliases(userId);
  const identityMetadata = await db.getAll('identityMetadata');

  // Filter out KELs that have identity metadata (those are user identities, not contacts)
  const identityAIDs = new Set(identityMetadata.map(m => m.aid));

  return kels
    .filter(kel => !identityAIDs.has(kel.aid)) // Exclude user identities
    .map(kel => {
      const aliasMapping = aliases.find(a => a.said === kel.aid && a.type === 'kel');
      return {
        id: aliasMapping?.id || crypto.randomUUID(),
        name: aliasMapping?.alias || kel.aid.substring(0, 8),
        kel: [kel.inceptionEvent, ...kel.events],
        prefix: kel.aid,
        createdAt: kel.createdAt,
      };
    });
}

export async function getContactByPrefix(prefix: string, userId?: string): Promise<Contact | undefined> {
  const kel = await getKEL(prefix, userId);
  if (!kel) return undefined;

  const aliasMapping = await getAliasBySAID(prefix, userId);

  return {
    id: aliasMapping?.id || crypto.randomUUID(),
    name: aliasMapping?.alias || prefix.substring(0, 8),
    kel: [kel.inceptionEvent, ...kel.events],
    prefix: kel.aid,
    createdAt: kel.createdAt,
  };
}

export async function getContactByName(name: string, userId?: string): Promise<Contact | undefined> {
  const aliasMapping = await getAliasByName(name, userId);
  if (!aliasMapping) return undefined;

  const kel = await getKEL(aliasMapping.said, userId);
  if (!kel) return undefined;

  return {
    id: aliasMapping.id,
    name: aliasMapping.alias,
    kel: [kel.inceptionEvent, ...kel.events],
    prefix: kel.aid,
    createdAt: kel.createdAt,
  };
}

export async function deleteContact(id: string, userId?: string): Promise<void> {
  const aliasMapping = await getAliasByName(id, userId);
  if (aliasMapping) {
    await deleteKEL(aliasMapping.said, userId);
    await deleteAlias(aliasMapping.id, userId);
  }
}

export async function getTELRegistries(userId?: string): Promise<TELRegistry[]> {
  const tels = await getAllTELs(userId);
  const aliases = await getAllAliases(userId);

  return tels.map(tel => {
    const aliasMapping = aliases.find(a => a.said === tel.registryAID && a.type === 'tel');
    return {
      id: tel.registryAID,
      alias: aliasMapping?.alias || tel.registryAID.substring(0, 8),
      registryAID: tel.registryAID,
      issuerAID: tel.issuerAID,
      inceptionEvent: tel.inceptionEvent,
      tel: tel.events,
      createdAt: tel.createdAt,
    };
  });
}

export async function saveTELRegistry(registry: TELRegistry, userId?: string): Promise<void> {
  await saveTEL({
    registryAID: registry.registryAID,
    issuerAID: registry.issuerAID,
    inceptionEvent: registry.inceptionEvent,
    events: registry.tel || [],
    createdAt: registry.createdAt,
  }, userId);

  // Save or update alias
  const existingAlias = await getAliasByName(registry.alias, userId);
  if (existingAlias) {
    // Update existing alias mapping
    await saveAlias({
      id: existingAlias.id,
      alias: registry.alias,
      said: registry.registryAID,
      type: 'tel',
      createdAt: existingAlias.createdAt,
    }, userId);
  } else {
    // Create new alias mapping
    await saveAlias({
      id: crypto.randomUUID(),
      alias: registry.alias,
      said: registry.registryAID,
      type: 'tel',
      createdAt: registry.createdAt,
    }, userId);
  }
}

export async function getTELRegistryByAID(registryAID: string, userId?: string): Promise<TELRegistry | undefined> {
  const tel = await getTEL(registryAID, userId);
  if (!tel) return undefined;

  const aliasMapping = await getAliasBySAID(registryAID, userId);

  return {
    id: tel.registryAID,
    alias: aliasMapping?.alias || tel.registryAID.substring(0, 8),
    registryAID: tel.registryAID,
    issuerAID: tel.issuerAID,
    inceptionEvent: tel.inceptionEvent,
    tel: tel.events,
    createdAt: tel.createdAt,
  };
}

export async function getTELRegistryByAlias(alias: string, userId?: string): Promise<TELRegistry | undefined> {
  const registryAID = await getSAIDByAlias(alias, userId);
  if (!registryAID) return undefined;
  return getTELRegistryByAID(registryAID, userId);
}

export async function getTELRegistriesByIssuer(issuerAID: string, userId?: string): Promise<TELRegistry[]> {
  const tels = await getTELsByIssuer(issuerAID, userId);
  const aliases = await getAllAliases(userId);

  return tels.map(tel => {
    const aliasMapping = aliases.find(a => a.said === tel.registryAID && a.type === 'tel');
    return {
      id: tel.registryAID,
      alias: aliasMapping?.alias || tel.registryAID.substring(0, 8),
      registryAID: tel.registryAID,
      issuerAID: tel.issuerAID,
      inceptionEvent: tel.inceptionEvent,
      tel: tel.events,
      createdAt: tel.createdAt,
    };
  });
}

export async function deleteTELRegistry(id: string, userId?: string): Promise<void> {
  await deleteTEL(id, userId);
  const aliasMapping = await getAliasBySAID(id, userId);
  if (aliasMapping) await deleteAlias(aliasMapping.id, userId);
}
