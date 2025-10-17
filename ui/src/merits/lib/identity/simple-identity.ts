/**
 * Simple Identity Manager for MERITS
 *
 * Provides basic identity management with ED25519 key generation.
 * Uses IndexedDB for storage with support for multiple users.
 *
 * This will be replaced by KERI-backed identity when integrated with KERITS.
 */

import type { MeritsUser, IdentityProvider } from './types';

const DB_NAME = 'merits-identity';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const CURRENT_USER_KEY = 'current-user-aid';

export class SimpleIdentityManager implements IdentityProvider {
  name = 'SimpleIdentity';
  version = '1.0';

  private db: IDBDatabase | null = null;
  private currentUserAid: string | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        // Load current user from localStorage
        this.currentUserAid = localStorage.getItem(CURRENT_USER_KEY);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store if it doesn't exist
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const store = db.createObjectStore(USERS_STORE, { keyPath: 'aid' });
          store.createIndex('username', 'username', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastLoginAt', 'lastLoginAt', { unique: false });
        }
      };
    });
  }

  /**
   * Create new user with username
   * Generates ED25519 keypair and fake SAID
   */
  async createUser(username: string): Promise<MeritsUser> {
    await this.init();

    // Generate ED25519 keypair
    const { publicKey, privateKey } = await this.generateKeyPair();

    // Generate fake SAID (just base64url of public key for now)
    const aid = `did:key:${publicKey.substring(0, 44)}`;

    const now = Date.now();
    const user: MeritsUser = {
      aid,
      username,
      publicKey,
      privateKey, // TODO: Encrypt this in production
      createdAt: now,
      lastLoginAt: now,
    };

    // Store user
    await this.storeUser(user);

    // Set as current user
    this.currentUserAid = aid;
    localStorage.setItem(CURRENT_USER_KEY, aid);

    console.log(`[Identity] Created user: ${username} (${aid})`);
    return user;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<MeritsUser | null> {
    await this.init();

    if (!this.currentUserAid) {
      return null;
    }

    return await this.getUser(this.currentUserAid);
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<MeritsUser[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USERS_STORE], 'readonly');
      const store = tx.objectStore(USERS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Switch to different user
   */
  async switchUser(aid: string): Promise<MeritsUser> {
    await this.init();

    const user = await this.getUser(aid);
    if (!user) {
      throw new Error(`User not found: ${aid}`);
    }

    // Update last login time
    user.lastLoginAt = Date.now();
    await this.storeUser(user);

    // Set as current user
    this.currentUserAid = aid;
    localStorage.setItem(CURRENT_USER_KEY, aid);

    console.log(`[Identity] Switched to user: ${user.username} (${aid})`);
    return user;
  }

  /**
   * Remove user
   */
  async removeUser(aid: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = tx.objectStore(USERS_STORE);
      const request = store.delete(aid);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Clear current user if it was deleted
        if (this.currentUserAid === aid) {
          this.currentUserAid = null;
          localStorage.removeItem(CURRENT_USER_KEY);
        }
        console.log(`[Identity] Removed user: ${aid}`);
        resolve();
      };
    });
  }

  /**
   * Sign data with current user's private key
   */
  async sign(data: Uint8Array): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('No current user');
    }

    const privateKeyBytes = this.decodeBase64Url(user.privateKey);
    const signature = await this.ed25519Sign(data, privateKeyBytes);

    return this.encodeBase64Url(signature);
  }

  /**
   * Verify signature
   */
  async verify(signature: string, data: Uint8Array, publicKey: string): Promise<boolean> {
    const sigBytes = this.decodeBase64Url(signature);
    const pubBytes = this.decodeBase64Url(publicKey);

    return await this.ed25519Verify(sigBytes, data, pubBytes);
  }

  /**
   * Get public key for current user
   */
  async getPublicKey(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('No current user');
    }
    return user.publicKey;
  }

  // ========== Private Helper Methods ==========

  /**
   * Generate ED25519 keypair using Web Crypto API
   */
  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Generate keypair
    const keypair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      } as any,
      true, // extractable
      ['sign', 'verify']
    );

    // Export keys as raw bytes
    const publicKeyBytes = await crypto.subtle.exportKey('raw', keypair.publicKey);
    const privateKeyBytes = await crypto.subtle.exportKey('pkcs8', keypair.privateKey);

    // For ED25519, we need the raw 32-byte seed (not the PKCS8 wrapper)
    // For simplicity in this MVP, we'll use the raw public key and a simple approach
    // In production, use proper ED25519 library like @noble/ed25519

    const publicKey = this.encodeBase64Url(new Uint8Array(publicKeyBytes));

    // For MVP, we'll store the keypair reference (NOT SECURE - just for testing)
    // In production, use proper key derivation and encryption
    const privateKey = this.encodeBase64Url(new Uint8Array(privateKeyBytes));

    return { publicKey, privateKey };
  }

  /**
   * Sign data using ED25519 (Web Crypto API)
   */
  private async ed25519Sign(data: Uint8Array, privateKeyBytes: Uint8Array): Promise<Uint8Array> {
    // Import private key
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      } as any,
      false,
      ['sign']
    );

    // Sign data
    const signature = await crypto.subtle.sign(
      {
        name: 'Ed25519',
      } as any,
      key,
      data
    );

    return new Uint8Array(signature);
  }

  /**
   * Verify ED25519 signature (Web Crypto API)
   */
  private async ed25519Verify(
    signature: Uint8Array,
    data: Uint8Array,
    publicKeyBytes: Uint8Array
  ): Promise<boolean> {
    try {
      // Import public key
      const key = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519',
        } as any,
        false,
        ['verify']
      );

      // Verify signature
      return await crypto.subtle.verify(
        {
          name: 'Ed25519',
        } as any,
        key,
        signature,
        data
      );
    } catch (error) {
      console.error('[Identity] Verification failed:', error);
      return false;
    }
  }

  /**
   * Get user by AID
   */
  private async getUser(aid: string): Promise<MeritsUser | null> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USERS_STORE], 'readonly');
      const store = tx.objectStore(USERS_STORE);
      const request = store.get(aid);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Store/update user
   */
  private async storeUser(user: MeritsUser): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = tx.objectStore(USERS_STORE);
      const request = store.put(user);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Encode bytes to base64url
   */
  private encodeBase64Url(bytes: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Decode base64url to bytes
   */
  private decodeBase64Url(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const binary = atob(padded);
    return new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)));
  }
}

// Singleton instance
export const identityManager = new SimpleIdentityManager();
