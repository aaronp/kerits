/**
 * Explorer - Hierarchical credential registry browser
 *
 * New design supporting nested registries:
 * - Left sidebar: Registry tree navigation
 * - Top: Breadcrumb navigation
 * - Main: Registry detail view with credentials
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getDSL } from '@/lib/dsl';
import { Button } from '../ui/button';
import type { KeritsDSL, AccountDSL } from '@/../src/app/dsl/types';
import { RegistryTreeNavigation } from './RegistryTreeNavigation';
import { RegistryBreadcrumbs } from './RegistryBreadcrumbs';
import { RegistryDetailView } from './RegistryDetailView';
import { CreateRegistryDialog } from './CreateRegistryDialog';

export function Explorer() {
  const { accountAlias: accountParam, '*': registryPathParam } = useParams<{
    accountAlias: string;
    '*': string;
  }>();

  // Default to 'default' account if none specified
  const accountAlias = accountParam || 'default';

  // Parse registry path from URL (can be nested: regId1/regId2/regId3)
  const registryPath = registryPathParam ? registryPathParam.split('/').filter(Boolean) : [];
  const selectedRegistryId = registryPath.length > 0 ? registryPath[registryPath.length - 1] : null;

  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [accountDsl, setAccountDsl] = useState<AccountDSL | null>(null);
  const [registryAliases, setRegistryAliases] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Initialize DSL
  useEffect(() => {
    async function init() {
      try {
        const dslInstance = await getDSL();
        setDsl(dslInstance);

        // Check if account exists
        let accountNames = await dslInstance.accountNames();

        // If no accounts exist, create default one
        if (accountNames.length === 0) {
          console.log('No accounts found, creating default account...');

          try {
            const seed = new Uint8Array(32);
            crypto.getRandomValues(seed);
            const mnemonic = dslInstance.newMnemonic(seed);
            await dslInstance.newAccount('default', mnemonic);
            console.log('Account created successfully');

            accountNames = await dslInstance.accountNames();
            console.log('Account names after creation:', accountNames);
          } catch (createError) {
            console.error('Failed to create default account:', createError);
            throw createError;
          }
        }

        // Get account DSL (prefer the one from URL param, fallback to first)
        const targetAccount = accountNames.includes(accountAlias) ? accountAlias : accountNames[0];
        const accountDslInstance = await dslInstance.account(targetAccount);
        setAccountDsl(accountDslInstance);

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize DSL:', error);
        setLoading(false);
      }
    }

    init();
  }, [accountAlias]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!accountDsl) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">No identity found.</p>
          <p className="text-sm">Please create an identity first to use the Explorer.</p>
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
