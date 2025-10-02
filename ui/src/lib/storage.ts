/**
 * Browser storage for demo purposes
 * Stores identities, credentials, and events in localStorage
 */

export interface StoredIdentity {
  alias: string;
  prefix: string;
  currentKeys: {
    public: string;
    seed: string;
  };
  nextKeys: {
    public: string;
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
  recipient?: string;
  schema: string;
  sad: any;
  tel?: any[]; // Transaction Event Log
  createdAt: string;
}

export interface StoredSchema {
  id: string;
  name: string;
  sad: any;
  createdAt: string;
}

const STORAGE_KEYS = {
  IDENTITIES: 'keri-demo-identities',
  CREDENTIALS: 'keri-demo-credentials',
  SCHEMAS: 'keri-demo-schemas',
};

// Identity Management
export function saveIdentity(identity: StoredIdentity): void {
  const identities = getIdentities();
  const index = identities.findIndex(i => i.alias === identity.alias);
  if (index >= 0) {
    identities[index] = identity;
  } else {
    identities.push(identity);
  }
  localStorage.setItem(STORAGE_KEYS.IDENTITIES, JSON.stringify(identities));
}

export function getIdentities(): StoredIdentity[] {
  const data = localStorage.getItem(STORAGE_KEYS.IDENTITIES);
  return data ? JSON.parse(data) : [];
}

export function getIdentity(alias: string): StoredIdentity | undefined {
  return getIdentities().find(i => i.alias === alias);
}

export function deleteIdentity(alias: string): void {
  const identities = getIdentities().filter(i => i.alias !== alias);
  localStorage.setItem(STORAGE_KEYS.IDENTITIES, JSON.stringify(identities));
}

// Credential Management
export function saveCredential(credential: StoredCredential): void {
  const credentials = getCredentials();
  const index = credentials.findIndex(c => c.id === credential.id);
  if (index >= 0) {
    credentials[index] = credential;
  } else {
    credentials.push(credential);
  }
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
}

export function getCredentials(): StoredCredential[] {
  const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
  return data ? JSON.parse(data) : [];
}

export function getCredential(id: string): StoredCredential | undefined {
  return getCredentials().find(c => c.id === id);
}

export function deleteCredential(id: string): void {
  const credentials = getCredentials().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
}

// Schema Management
export function saveSchema(schema: StoredSchema): void {
  const schemas = getSchemas();
  const index = schemas.findIndex(s => s.id === schema.id);
  if (index >= 0) {
    schemas[index] = schema;
  } else {
    schemas.push(schema);
  }
  localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(schemas));
}

export function getSchemas(): StoredSchema[] {
  const data = localStorage.getItem(STORAGE_KEYS.SCHEMAS);
  return data ? JSON.parse(data) : [];
}

export function getSchema(id: string): StoredSchema | undefined {
  return getSchemas().find(s => s.id === id);
}

export function deleteSchema(id: string): void {
  const schemas = getSchemas().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(schemas));
}

// Clear all data
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.IDENTITIES);
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
  localStorage.removeItem(STORAGE_KEYS.SCHEMAS);
}
