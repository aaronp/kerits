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
}

const DB_NAME = 'keri-demo';
const DB_VERSION = 1;

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
