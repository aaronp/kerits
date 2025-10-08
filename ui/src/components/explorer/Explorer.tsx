/**
 * Explorer - Hierarchical credential registry browser
 *
 * New design supporting nested registries:
 * - Left sidebar: Registry tree navigation
 * - Top: Breadcrumb navigation
 * - Main: Registry detail view with credentials
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getDSL } from '@/lib/dsl';
import { useAccount } from '@/lib/account-provider';
import { Button } from '../ui/button';
import type { KeritsDSL, AccountDSL } from '@kerits/app/dsl/types';
import { RegistryTreeNavigation } from './RegistryTreeNavigation';
import { RegistryBreadcrumbs } from './RegistryBreadcrumbs';
import { RegistryDetailView } from './RegistryDetailView';
import { CreateRegistryDialog } from './CreateRegistryDialog';
import { route } from '@/config';

export function Explorer() {
  const navigate = useNavigate();
  const { currentAccountAlias, loading: accountLoading } = useAccount();
  const { accountAlias: accountParam, '*': registryPathParam } = useParams<{
    accountAlias: string;
    '*': string;
  }>();

  // Use account from context if no param specified, otherwise use param
  const accountAlias = accountParam || currentAccountAlias;

  // Parse registry path from URL (can be nested: regId1/regId2/regId3)
  const registryPath = registryPathParam ? registryPathParam.split('/').filter(Boolean) : [];
  const selectedRegistryId = registryPath.length > 0 ? registryPath[registryPath.length - 1] : null;

  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [accountDsl, setAccountDsl] = useState<AccountDSL | null>(null);
  const [registryAliases, setRegistryAliases] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Track if we've already redirected to prevent loops
  const hasRedirectedRef = useRef(false);

  // Wait for account context to load before proceeding
  useEffect(() => {
    console.log('[Explorer] useEffect:', { accountLoading, accountAlias, currentAccountAlias, hasRedirected: hasRedirectedRef.current });

    if (accountLoading) {
      return; // Still loading account context
    }

    if (!accountAlias && !hasRedirectedRef.current) {
      // No account available - redirect to login (once)
      console.warn('No account available, redirecting to login');
      hasRedirectedRef.current = true;
      navigate(route('/'), { replace: true });
      return;
    }

    // Reset redirect flag if we now have an account
    if (accountAlias && hasRedirectedRef.current) {
      hasRedirectedRef.current = false;
    }
  }, [accountLoading, accountAlias, currentAccountAlias, navigate]);

  // Initialize DSL
  useEffect(() => {
    async function init() {
      // Don't initialize until we have an account alias
      if (accountLoading || !accountAlias) {
        return;
      }

      try {
        const dslInstance = await getDSL();
        setDsl(dslInstance);

        // Get account DSL
        const accountDslInstance = await dslInstance.account(accountAlias);

        if (!accountDslInstance) {
          console.error(`Account "${accountAlias}" not found`);
          setLoading(false);
          return;
        }

        setAccountDsl(accountDslInstance);
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize DSL:', error);
        setLoading(false);
      }
    }

    init();
  }, [accountAlias, accountLoading]);

  // Build registry alias map for breadcrumbs
  useEffect(() => {
    async function buildAliasMap() {
      if (!accountDsl) return;

      try {
        const aliases = await accountDsl.listRegistries();
        const aliasMap = new Map<string, string>();

        for (const alias of aliases) {
          const registryDsl = await accountDsl.registry(alias);
          if (registryDsl) {
            aliasMap.set(registryDsl.registry.registryId, alias);
          }
        }

        setRegistryAliases(aliasMap);
      } catch (error) {
        console.error('Failed to build alias map:', error);
      }
    }

    buildAliasMap();
  }, [accountDsl, refreshKey]);

  const handleRegistryCreated = () => {
    // Trigger refresh of navigation tree and alias map
    setRefreshKey(prev => prev + 1);
  };

  // Show loading while account context or DSL is loading
  if (accountLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If no account alias after loading completes, redirect will happen via useEffect
  if (!accountAlias) {
    return null;
  }

  if (!accountDsl) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">Account "{accountAlias}" not found.</p>
          <p className="text-sm">Please select a valid account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Registry Tree Navigation */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        <div className="px-4 py-3 border-b flex-shrink-0 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Registries</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateDialog(true)}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <RegistryTreeNavigation
            key={refreshKey}
            dsl={dsl}
            accountAlias={accountAlias}
            selectedRegistryId={selectedRegistryId}
            onRegistryCreated={handleRegistryCreated}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumbs */}
        {registryPath.length > 0 && (
          <RegistryBreadcrumbs
            accountAlias={accountAlias}
            registryPath={registryPath}
            registryAliases={registryAliases}
          />
        )}

        {/* Registry Detail View */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedRegistryId ? (
            <RegistryDetailView
              key={selectedRegistryId}
              dsl={dsl}
              accountAlias={accountAlias}
              registryId={selectedRegistryId}
              onRegistryCreated={handleRegistryCreated}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No registry selected</p>
                <p className="text-sm">Select a registry from the sidebar to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Registry Dialog */}
      <CreateRegistryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        accountDsl={accountDsl}
        onSuccess={handleRegistryCreated}
      />
    </div>
  );
}
