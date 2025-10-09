/**
 * Global state management using Zustand
 *
 * Now using DSL for all KERI data operations
 */

import { create } from 'zustand';
import { getDSL } from '../lib/dsl';

// Simplified types - no longer needed from old storage
interface Identity {
  alias: string;
  aid: string;
  verfer: string;
  createdAt: string;
}

interface Credential {
  id: string;
  alias?: string;
  registryId: string;
  schemaId: string;
  issuerAid: string;
  holderAid: string;
  data: Record<string, any>;
  issuedAt: string;
}

interface Schema {
  alias: string;
  schemaId: string;
  schema: any;
}

interface AppState {
  identities: Identity[];
  credentials: Credential[];
  schemas: Schema[];
  selectedIdentity: string | null;
  loading: boolean;
  telRefreshTrigger: number;
  userId: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  refreshIdentities: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
  refreshSchemas: () => Promise<void>;
  setSelectedIdentity: (alias: string | null) => void;
  refreshAll: () => Promise<void>;
  init: () => Promise<void>;
  triggerTELRefresh: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  identities: [],
  credentials: [],
  schemas: [],
  selectedIdentity: null,
  loading: true,
  telRefreshTrigger: 0,
  userId: null,

  setUserId: (userId) => set({ userId }),

  refreshIdentities: async () => {
    const { userId } = get();
    if (!userId) {
      set({ identities: [] });
      return;
    }

    try {
      const dsl = await getDSL(userId);
      const accountNames = await dsl.accountNames();

      const identities: Identity[] = [];
      for (const alias of accountNames) {
        const account = await dsl.getAccount(alias);
        if (account) {
          identities.push(account);
        }
      }

      set({ identities });
    } catch (error) {
      console.error('Failed to refresh identities:', error);
      set({ identities: [] });
    }
  },

  refreshCredentials: async () => {
    const { userId } = get();
    if (!userId) {
      set({ credentials: [] });
      return;
    }

    try {
      const dsl = await getDSL(userId);
      const accountNames = await dsl.accountNames();

      const allCredentials: Credential[] = [];

      // Iterate through all accounts and their registries
      for (const accountAlias of accountNames) {
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) continue;

        const registryAliases = await accountDsl.listRegistries();

        for (const registryAlias of registryAliases) {
          const registryDsl = await accountDsl.registry(registryAlias);
          if (!registryDsl) continue;

          const credentials = await registryDsl.listCredentials();

          for (const cred of credentials) {
            allCredentials.push({
              id: cred.credentialId,
              alias: cred.alias,
              registryId: cred.registryId,
              schemaId: cred.schemaId,
              issuerAid: cred.issuerAid,
              holderAid: cred.holderAid,
              data: cred.data,
              issuedAt: cred.issuedAt,
            });
          }
        }
      }

      set({ credentials: allCredentials });
    } catch (error) {
      console.error('Failed to refresh credentials:', error);
      set({ credentials: [] });
    }
  },

  refreshSchemas: async () => {
    const { userId } = get();
    if (!userId) {
      set({ schemas: [] });
      return;
    }

    try {
      const dsl = await getDSL(userId);
      const schemaAliases = await dsl.listSchemas();

      const schemas: Schema[] = [];
      for (const alias of schemaAliases) {
        const schemaDsl = await dsl.schema(alias);
        if (schemaDsl) {
          schemas.push(schemaDsl.schema);
        }
      }

      set({ schemas });
    } catch (error) {
      console.error('Failed to refresh schemas:', error);
      set({ schemas: [] });
    }
  },

  setSelectedIdentity: (alias) => set({ selectedIdentity: alias }),

  triggerTELRefresh: () => set((state) => ({ telRefreshTrigger: state.telRefreshTrigger + 1 })),

  refreshAll: async () => {
    set({ loading: true });
    try {
      await Promise.all([
        get().refreshIdentities(),
        get().refreshCredentials(),
        get().refreshSchemas(),
      ]);
      set({ loading: false });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      set({ loading: false });
    }
  },

  init: async () => {
    try {
      await Promise.all([
        get().refreshIdentities(),
        get().refreshCredentials(),
        get().refreshSchemas(),
      ]);
      set({ loading: false });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ loading: false });
    }
  },
}));
