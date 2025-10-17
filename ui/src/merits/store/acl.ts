/**
 * ACL Store
 *
 * Wraps ACLManager with Zustand for reactive UI updates
 */

import { create } from 'zustand';
import { ACLManager } from '../lib/dsl/acl/manager';
import { IndexedDBKv } from '../lib/storage/indexeddb-kv';
import type { ACLEntry } from '../lib/dsl/acl/types';
import { useIdentity } from './identity';

interface ACLState {
  manager: ACLManager | null;
  entries: Map<string, ACLEntry>;
  loading: boolean;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  getACL: (contactAid: string) => Promise<ACLEntry>;
  setBlock: (contactAid: string, blocked: boolean) => Promise<void>;
  setMute: (contactAid: string, muted: boolean) => Promise<void>;
  setHide: (contactAid: string, hidden: boolean) => Promise<void>;
  clearACL: (contactAid: string) => Promise<void>;
}

export const useACL = create<ACLState>((set, get) => ({
  manager: null,
  entries: new Map(),
  loading: false,

  initialize: async (userAid: string) => {
    const kv = new IndexedDBKv({ namespace: userAid });
    await kv.init();

    const manager = new ACLManager(kv);
    set({ manager, loading: false });
  },

  getACL: async (contactAid: string) => {
    const { manager, entries } = get();
    if (!manager) throw new Error('ACL manager not initialized');

    // Check cache first
    const cached = entries.get(contactAid);
    if (cached) return cached;

    // Fetch from manager
    const entry = await manager.getACL(contactAid);
    set((state) => ({
      entries: new Map(state.entries).set(contactAid, entry),
    }));

    return entry;
  },

  setBlock: async (contactAid: string, blocked: boolean) => {
    const { manager } = get();
    if (!manager) throw new Error('ACL manager not initialized');

    const updated = await manager.setACL(contactAid, { blocked });
    set((state) => ({
      entries: new Map(state.entries).set(contactAid, updated),
    }));
  },

  setMute: async (contactAid: string, muted: boolean) => {
    const { manager } = get();
    if (!manager) throw new Error('ACL manager not initialized');

    const updated = await manager.setACL(contactAid, { muted });
    set((state) => ({
      entries: new Map(state.entries).set(contactAid, updated),
    }));
  },

  setHide: async (contactAid: string, hidden: boolean) => {
    const { manager } = get();
    if (!manager) throw new Error('ACL manager not initialized');

    const updated = await manager.setACL(contactAid, { hidden });
    set((state) => ({
      entries: new Map(state.entries).set(contactAid, updated),
    }));
  },

  clearACL: async (contactAid: string) => {
    const { manager } = get();
    if (!manager) throw new Error('ACL manager not initialized');

    await manager.clearACL(contactAid);
    set((state) => {
      const entries = new Map(state.entries);
      entries.delete(contactAid);
      return { entries };
    });
  },
}));

// Initialize ACL when identity changes
useIdentity.subscribe((state) => {
  if (state.currentUser) {
    useACL.getState().initialize(state.currentUser.aid);
  }
});
