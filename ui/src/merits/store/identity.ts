/**
 * Identity Store
 *
 * Manages identity state using Zustand.
 * Provides React hooks for identity operations.
 */

import { create } from 'zustand';
import type { MeritsUser, IdentityProvider } from '../lib/identity/types';
import { identityManager } from '../lib/identity/simple-identity';

interface IdentityState {
  // State
  provider: IdentityProvider;
  currentUser: MeritsUser | null;
  allUsers: MeritsUser[];
  loading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  createUser: (username: string) => Promise<MeritsUser>;
  switchUser: (aid: string) => Promise<void>;
  logout: () => Promise<void>;
  removeUser: (aid: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export const useIdentity = create<IdentityState>((set, get) => ({
  // Initial state
  provider: identityManager,
  currentUser: null,
  allUsers: [],
  loading: false,
  error: null,

  // Initialize - load current user and all users
  initialize: async () => {
    set({ loading: true, error: null });

    try {
      const { provider } = get();

      const [currentUser, allUsers] = await Promise.all([
        provider.getCurrentUser(),
        provider.getAllUsers(),
      ]);

      set({
        currentUser,
        allUsers,
        loading: false,
      });

      console.log('[Identity Store] Initialized:', {
        currentUser: currentUser?.username,
        totalUsers: allUsers.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize identity';
      set({ error: message, loading: false });
      console.error('[Identity Store] Initialization failed:', error);
    }
  },

  // Create new user
  createUser: async (username: string) => {
    set({ loading: true, error: null });

    try {
      const { provider } = get();

      const user = await provider.createUser(username);

      // Refresh state
      const allUsers = await provider.getAllUsers();

      set({
        currentUser: user,
        allUsers,
        loading: false,
      });

      console.log('[Identity Store] Created user:', user.username);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Switch to different user
  switchUser: async (aid: string) => {
    set({ loading: true, error: null });

    try {
      const { provider } = get();

      const user = await provider.switchUser(aid);

      // Refresh all users to update lastLoginAt
      const allUsers = await provider.getAllUsers();

      set({
        currentUser: user,
        allUsers,
        loading: false,
      });

      console.log('[Identity Store] Switched to user:', user.username);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch user';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Logout (clear current user)
  logout: async () => {
    set({ loading: true, error: null });

    try {
      // Clear current user in provider (localStorage)
      localStorage.removeItem('current-user-aid');

      set({
        currentUser: null,
        loading: false,
      });

      console.log('[Identity Store] Logged out');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to logout';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Remove user
  removeUser: async (aid: string) => {
    set({ loading: true, error: null });

    try {
      const { provider, currentUser } = get();

      await provider.removeUser(aid);

      // Refresh users list
      const allUsers = await provider.getAllUsers();

      // If we deleted the current user, clear it
      const newCurrentUser = currentUser?.aid === aid ? null : currentUser;

      set({
        currentUser: newCurrentUser,
        allUsers,
        loading: false,
      });

      console.log('[Identity Store] Removed user:', aid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove user';
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Refresh users list
  refreshUsers: async () => {
    try {
      const { provider } = get();
      const allUsers = await provider.getAllUsers();
      set({ allUsers });
    } catch (error) {
      console.error('[Identity Store] Failed to refresh users:', error);
    }
  },
}));
