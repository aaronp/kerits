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

export interface Contact {
  id: string; // UUID for the contact
  name: string; // Contact alias/name
  kel: any[]; // Key Event Log
  prefix: string; // SAID/AID from KEL
  createdAt: string;
}

export interface TELRegistry {
  id: string; // UUID for the registry
  alias: string; // Human-readable name
  registryAID: string; // The registry's AID (regk from inception)
  issuerAID: string; // The issuer's AID who owns this registry
  inceptionEvent: any; // The vcp inception event
  tel: any[]; // Transaction Event Log - all events in this registry
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
  contacts: {
    key: string;
    value: Contact;
    indexes: { 'by-prefix': string; 'by-name': string };
  };
  telRegistries: {
    key: string;
    value: TELRegistry;
    indexes: { 'by-alias': string; 'by-registry-aid': string; 'by-issuer-aid': string };
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

const GLOBAL_DB_NAME = 'keri-demo-global';
const DB_VERSION = 5; // Incremented for TEL registry structure updates

let globalDbPromise: Promise<IDBPDatabase<KeriDB>> | null = null;
let userDbPromises: Map<string, Promise<IDBPDatabase<KeriDB>>> = new Map();

// Reset database connections (useful after clearing data)
export function resetDatabaseConnections(): void {
  globalDbPromise = null;
  userDbPromises.clear();
}

// Global DB for users and settings only
async function getGlobalDB(): Promise<IDBPDatabase<KeriDB>> {
  if (!globalDbPromise) {
    globalDbPromise = openDB<KeriDB>(GLOBAL_DB_NAME, DB_VERSION, {
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

// User-specific DB for identities, credentials, schemas, and contacts
async function getUserDB(userId: string): Promise<IDBPDatabase<KeriDB>> {
  if (!userDbPromises.has(userId)) {
    const dbPromise = openDB<KeriDB>(`keri-demo-user-${userId}`, DB_VERSION, {
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

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('by-prefix', 'prefix');
          contactStore.createIndex('by-name', 'name');
        }

        // TEL Registries store
        if (!db.objectStoreNames.contains('telRegistries')) {
          const telStore = db.createObjectStore('telRegistries', { keyPath: 'id' });
          telStore.createIndex('by-alias', 'alias', { unique: true });
          telStore.createIndex('by-registry-aid', 'registryAID', { unique: true });
          telStore.createIndex('by-issuer-aid', 'issuerAID', { unique: false });
        }
      },
    });
    userDbPromises.set(userId, dbPromise);
  }
  return userDbPromises.get(userId)!;
}

// Get current user's DB
async function getDB(userId?: string): Promise<IDBPDatabase<KeriDB>> {
  if (userId) {
    return getUserDB(userId);
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No user logged in');
  }
  return getUserDB(user.id);
}

// Identity Management
export async function saveIdentity(identity: StoredIdentity, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('identities', identity);
}

export async function getIdentities(userId?: string): Promise<StoredIdentity[]> {
  const db = await getDB(userId);
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
    db.clear('contacts'),
    db.clear('telRegistries'),
  ]);
}

// User Management
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

// Contact Management
export async function saveContact(contact: Contact): Promise<void> {
  const db = await getDB();
  await db.put('contacts', contact);
}

export async function getContacts(): Promise<Contact[]> {
  const db = await getDB();
  return db.getAll('contacts');
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const db = await getDB();
  return db.get('contacts', id);
}

export async function getContactByPrefix(prefix: string): Promise<Contact | undefined> {
  const db = await getDB();
  return db.getFromIndex('contacts', 'by-prefix', prefix);
}

export async function getContactByName(name: string): Promise<Contact | undefined> {
  const db = await getDB();
  return db.getFromIndex('contacts', 'by-name', name);
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('contacts', id);
}

// TEL Registry Management
export async function saveTELRegistry(registry: TELRegistry): Promise<void> {
  const db = await getDB();
  await db.put('telRegistries', registry);
}

export async function getTELRegistries(): Promise<TELRegistry[]> {
  const db = await getDB();
  return db.getAll('telRegistries');
}

export async function getTELRegistry(id: string): Promise<TELRegistry | undefined> {
  const db = await getDB();
  return db.get('telRegistries', id);
}

export async function getTELRegistryByAlias(alias: string): Promise<TELRegistry | undefined> {
  const db = await getDB();
  return db.getFromIndex('telRegistries', 'by-alias', alias);
}

export async function getTELRegistryByAID(registryAID: string): Promise<TELRegistry | undefined> {
  const db = await getDB();
  return db.getFromIndex('telRegistries', 'by-registry-aid', registryAID);
}

export async function getTELRegistriesByIssuer(issuerAID: string): Promise<TELRegistry[]> {
  const db = await getDB();
  return db.getAllFromIndex('telRegistries', 'by-issuer-aid', issuerAID);
}

export async function deleteTELRegistry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('telRegistries', id);
}
