/**
 * Global state management using Zustand
 */

import { create } from 'zustand';
import type { StoredIdentity, StoredCredential, StoredSchema } from '../lib/storage';
import { getIdentities, getCredentials, getSchemas } from '../lib/storage';

interface AppState {
  identities: StoredIdentity[];
  credentials: StoredCredential[];
  schemas: StoredSchema[];
  selectedIdentity: string | null;
  loading: boolean;
  telRefreshTrigger: number;

  // Actions
  refreshIdentities: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
  refreshSchemas: () => Promise<void>;
  setSelectedIdentity: (alias: string | null) => void;
  refreshAll: () => Promise<void>;
  init: () => Promise<void>;
  triggerTELRefresh: () => void;
}

export const useStore = create<AppState>((set) => ({
  identities: [],
  credentials: [],
  schemas: [],
  selectedIdentity: null,
  loading: true,
  telRefreshTrigger: 0,

  refreshIdentities: async () => {
    const identities = await getIdentities();
    set({ identities });
  },

  refreshCredentials: async () => {
    const credentials = await getCredentials();
    set({ credentials });
  },

  refreshSchemas: async () => {
    const schemas = await getSchemas();
    set({ schemas });
  },

  setSelectedIdentity: (alias) => set({ selectedIdentity: alias }),

  triggerTELRefresh: () => set((state) => ({ telRefreshTrigger: state.telRefreshTrigger + 1 })),

  refreshAll: async () => {
    set({ loading: true });
    try {
      const [identities, credentials, schemas] = await Promise.all([
        getIdentities(),
        getCredentials(),
        getSchemas(),
      ]);
      set({ identities, credentials, schemas, loading: false });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      set({ loading: false });
    }
  },

  init: async () => {
    try {
      const [identities, credentials, schemas] = await Promise.all([
        getIdentities(),
        getCredentials(),
        getSchemas(),
      ]);
      set({ identities, credentials, schemas, loading: false });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ loading: false });
    }
  },
}));
