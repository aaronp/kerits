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

  // Actions
  refreshIdentities: () => void;
  refreshCredentials: () => void;
  refreshSchemas: () => void;
  setSelectedIdentity: (alias: string | null) => void;
  refreshAll: () => void;
}

export const useStore = create<AppState>((set) => ({
  identities: getIdentities(),
  credentials: getCredentials(),
  schemas: getSchemas(),
  selectedIdentity: null,

  refreshIdentities: () => set({ identities: getIdentities() }),
  refreshCredentials: () => set({ credentials: getCredentials() }),
  refreshSchemas: () => set({ schemas: getSchemas() }),
  setSelectedIdentity: (alias) => set({ selectedIdentity: alias }),

  refreshAll: () => set({
    identities: getIdentities(),
    credentials: getCredentials(),
    schemas: getSchemas(),
  }),
}));
