import * as React from 'react';
import { getCurrentUser, setCurrentUser as saveCurrentUser, clearCurrentUser, getUsers, type User } from './storage';

interface UserContextValue {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  setCurrentUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = React.useState<User | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadUser = React.useCallback(async () => {
    try {
      const [user, allUsers] = await Promise.all([getCurrentUser(), getUsers()]);
      setCurrentUserState(user);
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  const setCurrentUser = React.useCallback(async (user: User | null) => {
    try {
      await saveCurrentUser(user?.id || null);
      setCurrentUserState(user);
    } catch (error) {
      console.error('Failed to set current user:', error);
      throw error;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await clearCurrentUser();
      setCurrentUserState(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, []);

  const refreshUsers = React.useCallback(async () => {
    try {
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to refresh users:', error);
      throw error;
    }
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, users, loading, setCurrentUser, logout, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
