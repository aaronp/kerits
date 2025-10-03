/**
 * Browser storage using IndexedDB
 * Stores identities, credentials, schemas, and all KERI data
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface StoredIdentity {
  alias: string;
  prefix: string;
  mnemonic: string; // BIP39 mnemonic for key derivation
  currentKeys: {
    public: string;
    private: string;
    seed: string;
  };
  nextKeys: {
    public: string;
    private: string;
    seed: string;
  };
  inceptionEvent: any;
  kel: any[]; // Key Event Log
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
  tel?: any[]; // Transaction Event Log
  registry?: string;
  createdAt: string;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  required?: boolean;
}

export interface StoredSchema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  sad: any;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AppSettings {
  key: 'currentUser';
  value: string | null; // User ID
}

// IndexedDB Schema
interface KeriDB extends DBSchema {
  identities: {
    key: string;
    value: StoredIdentity;
    indexes: { 'by-prefix': string };
  };
  credentials: {
    key: string;
    value: StoredCredential;
    indexes: { 'by-issuer': string; 'by-recipient': string; 'by-schema': string };
  };
  schemas: {
    key: string;
    value: StoredSchema;
  };
  users: {
    key: string;
    value: User;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'keri-demo';
const DB_VERSION = 2; // Incremented for new stores

let dbPromise: Promise<IDBPDatabase<KeriDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<KeriDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KeriDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Identities store
        if (!db.objectStoreNames.contains('identities')) {
          const identityStore = db.createObjectStore('identities', { keyPath: 'alias' });
          identityStore.createIndex('by-prefix', 'prefix');
        }

        // Credentials store
        if (!db.objectStoreNames.contains('credentials')) {
          const credentialStore = db.createObjectStore('credentials', { keyPath: 'id' });
          credentialStore.createIndex('by-issuer', 'issuer');
          credentialStore.createIndex('by-recipient', 'recipient');
          credentialStore.createIndex('by-schema', 'schema');
        }

        // Schemas store
        if (!db.objectStoreNames.contains('schemas')) {
          db.createObjectStore('schemas', { keyPath: 'id' });
        }

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
  return dbPromise;
}

// Identity Management
export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const db = await getDB();
  await db.put('identities', identity);
}

export async function getIdentities(): Promise<StoredIdentity[]> {
  const db = await getDB();
  return db.getAll('identities');
}

export async function getIdentity(alias: string): Promise<StoredIdentity | undefined> {
  const db = await getDB();
  return db.get('identities', alias);
}

export async function getIdentityByPrefix(prefix: string): Promise<StoredIdentity | undefined> {
  const db = await getDB();
  return db.getFromIndex('identities', 'by-prefix', prefix);
}

export async function deleteIdentity(alias: string): Promise<void> {
  const db = await getDB();
  await db.delete('identities', alias);
}

// Credential Management
export async function saveCredential(credential: StoredCredential): Promise<void> {
  const db = await getDB();
  await db.put('credentials', credential);
}

export async function getCredentials(): Promise<StoredCredential[]> {
  const db = await getDB();
  return db.getAll('credentials');
}

export async function getCredential(id: string): Promise<StoredCredential | undefined> {
  const db = await getDB();
  return db.get('credentials', id);
}

export async function getCredentialsByIssuer(issuer: string): Promise<StoredCredential[]> {
  const db = await getDB();
  return db.getAllFromIndex('credentials', 'by-issuer', issuer);
}

export async function getCredentialsByRecipient(recipient: string): Promise<StoredCredential[]> {
  const db = await getDB();
  return db.getAllFromIndex('credentials', 'by-recipient', recipient);
}

export async function deleteCredential(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('credentials', id);
}

// Schema Management
export async function saveSchema(schema: StoredSchema): Promise<void> {
  const db = await getDB();
  await db.put('schemas', schema);
}

export async function getSchemas(): Promise<StoredSchema[]> {
  const db = await getDB();
  return db.getAll('schemas');
}

export async function getSchema(id: string): Promise<StoredSchema | undefined> {
  const db = await getDB();
  return db.get('schemas', id);
}

export async function deleteSchema(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('schemas', id);
}

// Export all data
export async function exportAllData(): Promise<{
  identities: StoredIdentity[];
  credentials: StoredCredential[];
  schemas: StoredSchema[];
}> {
  const [identities, credentials, schemas] = await Promise.all([
    getIdentities(),
    getCredentials(),
    getSchemas(),
  ]);

  return { identities, credentials, schemas };
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('identities'),
    db.clear('credentials'),
    db.clear('schemas'),
  ]);
}

// User Management
export async function saveUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function getUsers(): Promise<User[]> {
  const db = await getDB();
  return db.getAll('users');
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get('users', id);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('users', id);
}

export async function getCurrentUser(): Promise<User | null> {
  const db = await getDB();
  const settings = await db.get('settings', 'currentUser');
  if (!settings?.value) return null;
  return (await db.get('users', settings.value)) || null;
}

export async function setCurrentUser(userId: string | null): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'currentUser', value: userId });
}

export async function clearCurrentUser(): Promise<void> {
  await setCurrentUser(null);
}
