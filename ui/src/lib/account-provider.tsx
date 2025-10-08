/**
 * Account Context Provider
 *
 * Provides the current account context for the authenticated user.
 * Maps from the authenticated user to their default/current KERI account.
 */

import * as React from 'react';
import { useUser } from './user-provider';
import { getDSL } from './dsl';

interface AccountContextValue {
  /** Current account alias (from DSL) */
  currentAccountAlias: string | null;
  /** Loading state */
  loading: boolean;
  /** Set the current account */
  setCurrentAccount: (alias: string) => Promise<void>;
  /** Refresh account list */
  refreshAccount: () => Promise<void>;
}

const AccountContext = React.createContext<AccountContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'kerits-current-account-';

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const [currentAccountAlias, setCurrentAccountAlias] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadCurrentAccount = React.useCallback(async () => {
    if (!currentUser) {
      setCurrentAccountAlias(null);
      setLoading(false);
      return;
    }

    try {
      // Try to load saved account preference for this user
      const storageKey = `${STORAGE_KEY_PREFIX}${currentUser.id}`;
      const savedAlias = localStorage.getItem(storageKey);

      const dsl = await getDSL();
      let accountNames = await dsl.accountNames();

      // If no accounts exist, create a default one for this user
      if (accountNames.length === 0) {
        console.log('No accounts found, creating account for user:', currentUser.name);

        try {
          // Use user name as account alias (sanitize it)
          const accountAlias = currentUser.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

          const seed = new Uint8Array(32);
          crypto.getRandomValues(seed);
          const mnemonic = dsl.newMnemonic(seed);
          await dsl.newAccount(accountAlias, mnemonic);
          console.log('Account created successfully:', accountAlias);

          accountNames = await dsl.accountNames();
        } catch (createError) {
          console.error('Failed to create account:', createError);
          setCurrentAccountAlias(null);
          setLoading(false);
          return;
        }
      }

      // If saved alias exists and is valid, use it
      if (savedAlias && accountNames.includes(savedAlias)) {
        setCurrentAccountAlias(savedAlias);
      } else {
        // Otherwise use the first account
        const firstAccount = accountNames[0];
        setCurrentAccountAlias(firstAccount);
        // Save this as the default
        localStorage.setItem(storageKey, firstAccount);
      }
    } catch (error) {
      console.error('Failed to load current account:', error);
      setCurrentAccountAlias(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    loadCurrentAccount();
  }, [loadCurrentAccount]);

  const setCurrentAccount = React.useCallback(async (alias: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Verify the account exists
      const dsl = await getDSL();
      const accountDsl = await dsl.account(alias);

      if (!accountDsl) {
        throw new Error(`Account "${alias}" not found`);
      }

      // Save preference
      const storageKey = `${STORAGE_KEY_PREFIX}${currentUser.id}`;
      localStorage.setItem(storageKey, alias);

      setCurrentAccountAlias(alias);
    } catch (error) {
      console.error('Failed to set current account:', error);
      throw error;
    }
  }, [currentUser]);

  const refreshAccount = React.useCallback(async () => {
    await loadCurrentAccount();
  }, [loadCurrentAccount]);

  return (
    <AccountContext.Provider value={{ currentAccountAlias, loading, setCurrentAccount, refreshAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = React.useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}
