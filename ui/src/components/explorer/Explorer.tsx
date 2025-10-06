/**
 * Explorer - Hierarchical credential registry browser
 *
 * Displays credential registries with expandable:
 * - Registries (TEL)
 * - ACDCs (credentials)
 * - Schemas (grouped by schema type)
 * - Recipients (grouped by holder)
 * - Data (individual credential attributes)
 *
 * Uses the kerits DSL for all operations.
 */

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, PlusCircle, Download, Upload, Share2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { useTheme } from '@/lib/theme-provider';
import { getDSL } from '@/lib/dsl';
import type { KeritsDSL, AccountDSL, RegistryDSL, ACDCDSL } from '@/../src/app/dsl/types';
import type { IndexedACDC } from '@/../src/app/indexer/types';

interface Registry {
  registryId: string;
  alias: string;
  issuerAid: string;
}

export function Explorer() {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  // State
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [accountDsl, setAccountDsl] = useState<AccountDSL | null>(null);
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [expandedRegistries, setExpandedRegistries] = useState<Set<string>>(new Set());
  const [hoveredRegistry, setHoveredRegistry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ACDC state
  const [acdcsByRegistry, setAcdcsByRegistry] = useState<Map<string, IndexedACDC[]>>(new Map());
  const [expandedACDCs, setExpandedACDCs] = useState<Set<string>>(new Set());
  const [hoveredACDC, setHoveredACDC] = useState<string | null>(null);

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRegistryName, setNewRegistryName] = useState('');

  // Initialize DSL
  useEffect(() => {
    async function init() {
      try {
        const dslInstance = await getDSL();
        setDsl(dslInstance);

        // For now, assume single identity (first account)
        // TODO: Add account selection
        let accountNames = await dslInstance.accountNames();

        // If no accounts exist, create a default one
        if (accountNames.length === 0) {
          console.log('No accounts found, creating default account...');

          // Generate a random seed for the mnemonic
          const seed = new Uint8Array(32);
          crypto.getRandomValues(seed);

          // Generate mnemonic from seed
          const mnemonic = dslInstance.newMnemonic(seed);

          // Create account with user's name or default alias
          const alias = 'default';
          await dslInstance.newAccount(alias, mnemonic);

          showToast('Created default KERI account');

          // Refresh account list
          accountNames = await dslInstance.accountNames();
        }

        if (accountNames.length > 0) {
          const accountDslInstance = await dslInstance.account(accountNames[0]);
          setAccountDsl(accountDslInstance);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize DSL:', error);
        showToast(`Failed to initialize: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    }

    init();
  }, []);

  // Load registries when account DSL is available
  useEffect(() => {
    if (!accountDsl) return;

    async function loadRegistries() {
      try {
        // Get all registry aliases
        const aliases = await accountDsl.listRegistries();

        // Get full Registry objects for each alias
        const registryObjects = await Promise.all(
          aliases.map(async (alias) => {
            const registryDsl = await accountDsl.registry(alias);
            return registryDsl?.registry;
          })
        );

        // Filter out nulls and set state
        const validRegistries = registryObjects.filter((r): r is NonNullable<typeof r> => r != null);
        setRegistries(validRegistries.map(r => ({
          registryId: r.registryId,
          alias: r.alias,
          issuerAid: r.issuerAid,
        })));
      } catch (error) {
        console.error('Failed to load registries:', error);
        showToast(`Failed to load registries: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    loadRegistries();
  }, [accountDsl]);

  // Load ACDCs for a registry when it's expanded
  const loadACDCsForRegistry = async (registryId: string) => {
    if (!accountDsl) return;

    try {
      const registryDsl = await accountDsl.registry(registryId);
      if (!registryDsl) return;

      const credentials = await registryDsl.listCredentials();
      setAcdcsByRegistry(prev => new Map(prev).set(registryId, credentials));
    } catch (error) {
      console.error(`Failed to load ACDCs for registry ${registryId}:`, error);
      showToast(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handlers
  const toggleRegistry = (registryId: string) => {
    setExpandedRegistries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(registryId)) {
        newSet.delete(registryId);
      } else {
        newSet.add(registryId);
        // Load ACDCs when expanding
        loadACDCsForRegistry(registryId);
      }
      return newSet;
    });
  };

  const toggleACDC = (credentialId: string) => {
    setExpandedACDCs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId);
      } else {
        newSet.add(credentialId);
      }
      return newSet;
    });
  };

  const handleAddRegistry = () => {
    setNewRegistryName('');
    setShowAddDialog(true);
  };

  const handleCreateRegistry = async () => {
    if (!newRegistryName.trim()) {
      showToast('Please enter a name for the registry');
      return;
    }

    if (!accountDsl) {
      showToast('No account available. Please create an identity first.');
      return;
    }

    try {
      // Create registry using DSL
      await accountDsl.createRegistry(newRegistryName.trim());

      // Reload registries using the proper pattern
      const aliases = await accountDsl.listRegistries();
      const registryObjects = await Promise.all(
        aliases.map(async (alias) => {
          const registryDsl = await accountDsl.registry(alias);
          return registryDsl?.registry;
        })
      );
      const validRegistries = registryObjects.filter((r): r is NonNullable<typeof r> => r != null);
      setRegistries(validRegistries.map(r => ({
        registryId: r.registryId,
        alias: r.alias,
        issuerAid: r.issuerAid,
      })));

      setShowAddDialog(false);
      setNewRegistryName('');
      showToast('Registry created successfully');
    } catch (error) {
      console.error('Failed to create registry:', error);
      showToast(`Failed to create registry: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRegistryExport = async (e: React.MouseEvent, registryId: string) => {
    e.stopPropagation();

    if (!accountDsl) return;

    try {
      const registryDsl = await accountDsl.registry(registryId);
      const exportDsl = await registryDsl.export();
      const cesr = await exportDsl.asCESR();

      // Copy to clipboard
      const text = new TextDecoder().decode(cesr);
      await navigator.clipboard.writeText(text);

      showToast('Registry exported to clipboard (CESR format)');
    } catch (error) {
      console.error('Failed to export registry:', error);
      showToast(`Failed to export: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRegistryImport = async (e: React.MouseEvent, registryId: string) => {
    e.stopPropagation();

    if (!accountDsl) return;

    try {
      // Read from clipboard
      const text = await navigator.clipboard.readText();
      const cesr = new TextEncoder().encode(text);

      // Import using DSL
      const importDsl = accountDsl.import();
      const result = await importDsl.fromCESR(cesr, {
        verify: true,
        skipExisting: true,
      });

      if (result.failed > 0) {
        showToast(`Import completed with errors: ${result.errors.join(', ')}`);
      } else {
        showToast(`Imported ${result.imported} events, skipped ${result.skipped}`);
      }

      // Reload registries
      const regs = await accountDsl.registries().list();
      setRegistries(regs.map(r => ({
        registryId: r.registryId,
        alias: r.alias,
        issuerAid: r.issuerAid,
      })));
    } catch (error) {
      console.error('Failed to import:', error);
      showToast(`Failed to import: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRegistryShare = async (e: React.MouseEvent, registryId: string) => {
    e.stopPropagation();
    // Same as export for now
    await handleRegistryExport(e, registryId);
    showToast('Registry CESR copied to clipboard - share it with others!');
  };

  const handleACDCExport = async (e: React.MouseEvent, registryId: string, credentialId: string) => {
    e.stopPropagation();
    if (!accountDsl) return;

    try {
      const registryDsl = await accountDsl.registry(registryId);
      if (!registryDsl) return;

      // Get all ACDC aliases to find the one matching this credentialId
      const aliases = await registryDsl.listACDCs();

      // We need to find which alias corresponds to this credentialId
      // For now, we'll try each one until we find a match
      for (const alias of aliases) {
        const acdcDsl = await registryDsl.acdc(alias);
        if (!acdcDsl) continue;

        const indexed = await acdcDsl.index();
        if (indexed.credentialId === credentialId) {
          const exportDsl = await acdcDsl.export();
          const cesr = await exportDsl.asCESR();

          const text = new TextDecoder().decode(cesr);
          await navigator.clipboard.writeText(text);

          showToast('Credential exported to clipboard (CESR format)');
          return;
        }
      }

      showToast('Credential not found');
    } catch (error) {
      console.error('Failed to export credential:', error);
      showToast(`Failed to export: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleACDCImport = async (e: React.MouseEvent, registryId: string) => {
    e.stopPropagation();
    if (!accountDsl) return;

    try {
      const text = await navigator.clipboard.readText();
      const cesr = new TextEncoder().encode(text);

      const importDsl = accountDsl.import();
      const result = await importDsl.fromCESR(cesr, {
        verify: true,
        skipExisting: true,
      });

      if (result.failed > 0) {
        showToast(`Import completed with errors: ${result.errors.join(', ')}`);
      } else {
        showToast(`Imported ${result.imported} events, skipped ${result.skipped}`);
      }

      // Reload ACDCs for this registry
      await loadACDCsForRegistry(registryId);
    } catch (error) {
      console.error('Failed to import credential:', error);
      showToast(`Failed to import: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleACDCAdd = (registryId: string) => {
    // TODO: Open dialog to issue a new credential
    showToast('Credential issuance UI coming soon - use CLI or import for now');
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
    <div className="space-y-6 -m-6 p-6 min-h-full" style={{ backgroundColor: theme === 'dark' ? 'rgb(2 6 23)' : 'rgb(248 250 252)' }}>
      <Card style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(255 255 255)' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credential Registries</CardTitle>
          <Button onClick={handleAddRegistry} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {registries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No credential registries found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {registries.map((registry) => (
                <div
                  key={registry.registryId}
                  className="border rounded-lg relative group"
                  style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}
                  onMouseEnter={() => setHoveredRegistry(registry.registryId)}
                  onMouseLeave={() => setHoveredRegistry(null)}
                >
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(51 65 85)' : 'rgb(226 232 240)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)'}
                    onClick={() => toggleRegistry(registry.registryId)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRegistry(registry.registryId);
                      }}
                    >
                      {expandedRegistries.has(registry.registryId) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="font-medium" title={registry.registryId}>
                        {registry.alias}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {registry.registryId.substring(0, 16)}...
                      </div>
                    </div>

                    {/* Button bar - fades in on hover */}
                    <div
                      className={`flex gap-1 transition-opacity duration-200 ${
                        hoveredRegistry === registry.registryId ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryImport(e, registry.registryId)}
                        title="Import from clipboard (CESR)"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryExport(e, registry.registryId)}
                        title="Export to clipboard (CESR)"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryShare(e, registry.registryId)}
                        title="Share (copy CESR)"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {expandedRegistries.has(registry.registryId) && (
                    <div className="border-t" style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(248 250 252)' }}>
                      {/* ACDC list */}
                      {acdcsByRegistry.get(registry.registryId)?.length === 0 ? (
                        <div className="p-2">
                          <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                            <p className="mb-3">No credentials in this registry</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleACDCAdd(registry.registryId);
                              }}
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Issue Credential
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Action buttons header */}
                          <div className="p-2 flex items-center justify-end gap-1 border-b" style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleACDCAdd(registry.registryId);
                              }}
                              title="Issue new credential"
                            >
                              <PlusCircle className="h-3 w-3 mr-1" />
                              Issue
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => handleACDCImport(e, registry.registryId)}
                              title="Import credential from clipboard"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Import
                            </Button>
                          </div>

                          {/* Credentials list */}
                          <div className="p-2 space-y-1">
                            {acdcsByRegistry.get(registry.registryId)?.map((acdc) => (
                              <div
                                key={acdc.credentialId}
                                className="border rounded relative group"
                                style={{ backgroundColor: theme === 'dark' ? 'rgb(51 65 85)' : 'rgb(226 232 240)' }}
                                onMouseEnter={() => setHoveredACDC(acdc.credentialId)}
                                onMouseLeave={() => setHoveredACDC(null)}
                              >
                                <div
                                  className="flex items-center gap-2 p-2 cursor-pointer"
                                  onClick={() => toggleACDC(acdc.credentialId)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleACDC(acdc.credentialId);
                                    }}
                                  >
                                    {expandedACDCs.has(acdc.credentialId) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate" title={acdc.credentialId}>
                                      {acdc.credentialId.substring(0, 12)}...
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        acdc.status === 'issued'
                                          ? theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                          : theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {acdc.status}
                                      </span>
                                      {acdc.holderAid && (
                                        <span>→ {acdc.holderAid.substring(0, 8)}...</span>
                                      )}
                                      <span>{new Date(acdc.issuedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  {/* ACDC action buttons */}
                                  <div
                                    className={`flex gap-1 transition-opacity duration-200 ${
                                      hoveredACDC === acdc.credentialId ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => handleACDCExport(e, registry.registryId, acdc.credentialId)}
                                      title="Export credential (CESR)"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded ACDC details */}
                                {expandedACDCs.has(acdc.credentialId) && (
                                  <div className="border-t p-3 space-y-2" style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}>
                                    {/* Schema info */}
                                    {acdc.schemas.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium mb-1">Schemas:</div>
                                        <div className="space-y-1">
                                          {acdc.schemas.map((schema, idx) => (
                                            <div key={idx} className="text-xs text-muted-foreground pl-2">
                                              {schema.schemaSaid.substring(0, 20)}...
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Credential data */}
                                    {Object.keys(acdc.latestData).length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium mb-1">Data:</div>
                                        <div className="space-y-1">
                                          {Object.entries(acdc.latestData).map(([key, value]) => (
                                            <div key={key} className="text-xs pl-2 flex gap-2">
                                              <span className="font-mono text-muted-foreground">{key}:</span>
                                              <span className="font-mono">{JSON.stringify(value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Counterparties */}
                                    {acdc.counterparties.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium mb-1">Counterparties:</div>
                                        <div className="space-y-1">
                                          {acdc.counterparties.map((party, idx) => (
                                            <div key={idx} className="text-xs text-muted-foreground pl-2">
                                              {party.role}: {party.aid.substring(0, 16)}...
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* TEL History */}
                                    {acdc.telEvents.length > 0 && (
                                      <div>
                                        <div className="text-xs font-medium mb-1">Event History:</div>
                                        <div className="space-y-1">
                                          {acdc.telEvents.map((event, idx) => (
                                            <div key={idx} className="text-xs text-muted-foreground pl-2">
                                              #{event.sequenceNumber} {event.eventType}: {event.summary}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Registry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Registry</DialogTitle>
            <DialogDescription>
              Enter a name for your new credential registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="registry-name">Registry Name</Label>
              <Input
                id="registry-name"
                placeholder="e.g., My Credentials"
                value={newRegistryName}
                onChange={(e) => setNewRegistryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRegistry();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRegistry}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
