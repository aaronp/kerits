/**
 * User Management Storage
 *
 * Global user authentication and session management.
 * Separate from KERI data which is stored in user-scoped DSL instances.
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// User & Settings Types
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
// Global Database Schema (Users & Settings Only)
// ============================================================================

interface GlobalKeriDB extends DBSchema {
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
const GLOBAL_DB_VERSION = 1;

let globalDbPromise: Promise<IDBPDatabase<GlobalKeriDB>> | null = null;

// Reset database connections (useful after clearing data)
export function resetDatabaseConnections(): void {
  globalDbPromise = null;
}

// Global DB for users and settings only
async function getGlobalDB(): Promise<IDBPDatabase<GlobalKeriDB>> {
  if (!globalDbPromise) {
    globalDbPromise = openDB<GlobalKeriDB>(GLOBAL_DB_NAME, GLOBAL_DB_VERSION, {
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
