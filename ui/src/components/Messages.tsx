/**
 * Messages Page - Standalone messaging interface
 *
 * This page provides a full messaging experience with:
 * - Contact/group list sidebar
 * - Message conversation view
 * - Connection status indicator
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { useUser } from '../lib/user-provider';
import { useAccount } from '../lib/account-provider';
import { KeritsMessageBusFactory, initializeStores } from '../lib/messaging-bridge';
import { MessagingView, ContactList } from '../merits';
import { useConnection } from '../merits/store/connection';
import { Loader2, AlertCircle } from 'lucide-react';

export function Messages() {
  const { currentUser } = useUser();
  const { currentAccountAlias, loading: accountLoading } = useAccount();
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize messaging when user and account are ready
  useEffect(() => {
    if (!currentUser || !currentAccountAlias || accountLoading) {
      setInitializing(false);
      return;
    }

    const init = async () => {
      setInitializing(true);
      setError(null);

      try {
        // 1. Initialize stores (contacts, messages, settings, groups)
        const aid = await initializeStores(currentUser.id, currentAccountAlias);
        console.log('[Messages Page] Stores initialized for AID:', aid.substring(0, 20) + '...');

        // 2. Create MessageBusFactory
        const factory = new KeritsMessageBusFactory(currentUser.id, currentAccountAlias);

        // 3. Connect to MessageBus via connection store
        await useConnection.getState().initializeWithFactory(factory);
        console.log('[Messages Page] MessageBus connected');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize messaging';
        console.error('[Messages Page] Initialization error:', err);
        setError(message);
      } finally {
        setInitializing(false);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      useConnection.getState().disconnect();
      console.log('[Messages Page] MessageBus disconnected');
    };
  }, [currentUser, currentAccountAlias, accountLoading]);

  // Loading state
  if (accountLoading || initializing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {accountLoading ? 'Loading account...' : 'Initializing messaging...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Initialize Messaging</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Make sure your account is unlocked and try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No account selected
  if (!currentAccountAlias) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No account selected</p>
            <p className="text-sm mt-2">Please create or select an account to use messaging</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main messaging UI
  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Sidebar - Contacts */}
      <Card className="w-80 overflow-hidden flex flex-col">
        <ContactList />
      </Card>

      {/* Main conversation area */}
      <Card className="flex-1 overflow-hidden">
        <MessagingView />
      </Card>
    </div>
  );
}
