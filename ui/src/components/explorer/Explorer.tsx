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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, PlusCircle, Download, Upload, Share2, FileText, Copy, MoreVertical, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { route } from '@/config';
import { VisualId } from '../ui/visual-id';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { Combobox } from '../ui/combobox';
import { useTheme } from '@/lib/theme-provider';
import { getDSL } from '@/lib/dsl';
import { getContacts } from '@/lib/storage';
import type { KeritsDSL, AccountDSL, RegistryDSL, ACDCDSL } from '@/../src/app/dsl/types';
import type { IndexedACDC } from '@/../src/app/indexer/types';
import type { Contact } from '@/lib/storage';

interface Registry {
  registryId: string;
  alias: string;
  issuerAid: string;
}

export function Explorer() {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [showAddACDCDialog, setShowAddACDCDialog] = useState(false);
  const [showImportACDCDialog, setShowImportACDCDialog] = useState(false);
  const [importRegistryAlias, setImportRegistryAlias] = useState<string | null>(null);
  const [importCredentialData, setImportCredentialData] = useState('');
  const [importCredentialAlias, setImportCredentialAlias] = useState('');
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [selectedSchemaAlias, setSelectedSchemaAlias] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [selectedHolder, setSelectedHolder] = useState('');
  const [credentialAlias, setCredentialAlias] = useState('');
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [availableSchemas, setAvailableSchemas] = useState<Array<{ alias: string; schema: any }>>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Alias resolution maps
  const [schemaAliasMap, setSchemaAliasMap] = useState<Map<string, string>>(new Map()); // SAID -> alias
  const [contactAliasMap, setContactAliasMap] = useState<Map<string, string>>(new Map()); // AID -> name

  // Build alias resolution maps
  useEffect(() => {
    async function buildAliasMaps() {
      if (!dsl) return;

      try {
        // Build schema SAID -> alias map
        const schemaAliases = await dsl.listSchemas();
        const schemaMap = new Map<string, string>();
        for (const alias of schemaAliases) {
          const schemaDsl = await dsl.schema(alias);
          if (schemaDsl) {
            schemaMap.set(schemaDsl.schema.schemaId, alias);
          }
        }
        setSchemaAliasMap(schemaMap);

        // Build contact AID -> name map from old storage
        const contactsData = await getContacts();
        const contactMap = new Map<string, string>();
        for (const contact of contactsData) {
          contactMap.set(contact.prefix, contact.name);
        }
        setContactAliasMap(contactMap);
      } catch (error) {
        console.error('Failed to build alias maps:', error);
      }
    }

    buildAliasMaps();
  }, [dsl]);

  // Handle return from schema creation
  useEffect(() => {
    const returnFromSchema = searchParams.get('returnFromSchema');
    const newSchemaAlias = searchParams.get('schemaAlias');
    const registryId = searchParams.get('registryId');

    if (returnFromSchema === 'true' && newSchemaAlias && registryId && dsl) {
      // Reload schemas and re-open the issue dialog
      (async () => {
        try {
          // Reload schemas
          const schemaAliases = await dsl.listSchemas();
          const schemasWithData = await Promise.all(
            schemaAliases.map(async (alias) => {
              const schemaDsl = await dsl.schema(alias);
              return schemaDsl ? { alias, schema: schemaDsl.schema } : null;
            })
          );
          const schemas = schemasWithData.filter((s): s is NonNullable<typeof s> => s !== null);
          setAvailableSchemas(schemas);

          // Find and select the new schema
          const newSchema = schemas.find(s => s.alias === newSchemaAlias);
          if (newSchema) {
            setSelectedRegistryId(registryId);
            setSelectedSchemaAlias(newSchemaAlias);
            setSelectedSchema(newSchema);

            // Initialize form data
            if (newSchema.schema?.schema?.properties) {
              const initialData: Record<string, any> = {};
              Object.keys(newSchema.schema.schema.properties).forEach(key => {
                initialData[key] = '';
              });
              setCredentialData(initialData);
            }

            // Re-open the dialog
            setShowAddACDCDialog(true);
          }
        } catch (error) {
          console.error('Failed to reload schemas:', error);
        }

        // Clear the query params
        navigate(route('/dashboard'), { replace: true });
      })();
    }
  }, [searchParams, navigate, dsl]);

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

        // Proactively load ACDCs for all registries to enable expand buttons
        for (const registry of validRegistries) {
          await loadACDCsForRegistry(registry.alias);
        }
      } catch (error) {
        console.error('Failed to load registries:', error);
        showToast(`Failed to load registries: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    loadRegistries();
  }, [accountDsl]);

  // Load ACDCs for a registry when it's expanded
  const loadACDCsForRegistry = async (registryAlias: string) => {
    if (!accountDsl) return;

    try {
      const registryDsl = await accountDsl.registry(registryAlias);
      if (!registryDsl) return;

      const credentials = await registryDsl.listCredentials();
      setAcdcsByRegistry(prev => new Map(prev).set(registryAlias, credentials));
    } catch (error) {
      console.error(`Failed to load ACDCs for registry ${registryAlias}:`, error);
      showToast(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handlers
  const toggleRegistry = (registryAlias: string) => {
    setExpandedRegistries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(registryAlias)) {
        newSet.delete(registryAlias);
      } else {
        // Load ACDCs first to check if there are any
        loadACDCsForRegistry(registryAlias).then(() => {
          const acdcs = acdcsByRegistry.get(registryAlias);
          if (acdcs && acdcs.length > 0) {
            setExpandedRegistries(prev => new Set(prev).add(registryAlias));
          }
        });
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

  const handleRegistryExport = async (e: React.MouseEvent, registryAlias: string) => {
    e.stopPropagation();

    if (!accountDsl) return;

    try {
      const registryDsl = await accountDsl.registry(registryAlias);
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

  const handleRegistryShare = async (e: React.MouseEvent, registryAlias: string) => {
    e.stopPropagation();
    // Same as export for now
    await handleRegistryExport(e, registryAlias);
    showToast('Registry CESR copied to clipboard - share it with others!');
  };

  const handleACDCCopy = async (e: React.MouseEvent, credentialId: string) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(credentialId);
      showToast('Credential SAID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy credential SAID:', error);
      showToast(`Failed to copy: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleACDCRevoke = async (e: React.MouseEvent, registryAlias: string, credentialId: string) => {
    e.stopPropagation();
    if (!accountDsl) return;

    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }

    try {
      const registryDsl = await accountDsl.registry(registryAlias);
      if (!registryDsl) {
        showToast('Registry not found');
        return;
      }

      // Revoke the credential
      await registryDsl.revoke(credentialId);

      // Reload credentials to show updated status
      await loadACDCsForRegistry(registryAlias);

      showToast('Credential revoked successfully');
    } catch (error) {
      console.error('Failed to revoke credential:', error);
      showToast(`Failed to revoke: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleACDCImportOpen = async (e: React.MouseEvent, registryAlias: string) => {
    e.stopPropagation();
    setImportRegistryAlias(registryAlias);
    setImportCredentialData('');
    setImportCredentialAlias('');
    setShowImportACDCDialog(true);
  };

  const handleACDCImportSubmit = async () => {
    if (!accountDsl || !importRegistryAlias) return;

    try {
      // Parse the credential data (could be JSON or CESR)
      let credentialSaid: string;
      try {
        const parsed = JSON.parse(importCredentialData);
        credentialSaid = parsed.d || parsed.SAID || parsed.credentialId;
      } catch {
        // Assume it's a SAID directly
        credentialSaid = importCredentialData.trim();
      }

      if (!credentialSaid) {
        showToast('Could not determine credential SAID from input');
        return;
      }

      const registryDsl = await accountDsl.registry(importRegistryAlias);
      if (!registryDsl) {
        showToast('Registry not found');
        return;
      }

      // TODO: Implement accept/anchor method on registry DSL
      // This should:
      // 1. Verify the credential
      // 2. Create an ACP (accept) event
      // 3. Anchor it in the TEL
      // await registryDsl.accept({
      //   credentialSaid,
      //   alias: importCredentialAlias || undefined,
      // });

      showToast('Accept/anchor functionality not yet implemented in DSL');

      // When implemented, reload credentials:
      // await loadACDCsForRegistry(importRegistryAlias);
      // setShowImportACDCDialog(false);

    } catch (error) {
      console.error('Failed to import credential:', error);
      showToast(`Failed to import: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleACDCAdd = async (registryAlias: string) => {
    setSelectedRegistryId(registryAlias);
    setSelectedSchemaAlias('');
    setSelectedSchema(null);
    setSelectedHolder('');
    setCredentialAlias('');
    setCredentialData({});

    // Load available schemas and contacts
    if (dsl) {
      try {
        // Load schemas with full schema objects
        const schemaAliases = await dsl.listSchemas();
        const schemasWithData = await Promise.all(
          schemaAliases.map(async (alias) => {
            const schemaDsl = await dsl.schema(alias);
            return schemaDsl ? { alias, schema: schemaDsl.schema } : null;
          })
        );
        setAvailableSchemas(schemasWithData.filter((s): s is NonNullable<typeof s> => s !== null));

        // Load contacts from old storage system
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (error) {
        console.error('Failed to load schemas/contacts:', error);
      }
    }

    setShowAddACDCDialog(true);
  };

  const handleCreateACDC = async () => {
    if (!accountDsl || !selectedRegistryId || !selectedSchemaAlias || !selectedHolder) {
      showToast('Please select schema and recipient');
      return;
    }

    // Validate required fields if schema has them
    if (selectedSchema?.schema?.required) {
      const required = selectedSchema.schema.required as string[];
      for (const field of required) {
        if (!credentialData[field] || String(credentialData[field]).trim() === '') {
          showToast(`Field "${field}" is required`);
          return;
        }
      }
    }

    try {
      const registryDsl = await accountDsl.registry(selectedRegistryId);
      if (!registryDsl) {
        showToast('Registry not found');
        return;
      }

      // Issue credential with selected schema and holder
      await registryDsl.issue({
        schema: selectedSchemaAlias,
        holder: selectedHolder,
        data: credentialData,
        ...(credentialAlias && { alias: credentialAlias }),
      });

      // Reload ACDCs for this registry
      await loadACDCsForRegistry(selectedRegistryId);

      setShowAddACDCDialog(false);
      setSelectedSchemaAlias('');
      setSelectedSchema(null);
      setSelectedHolder('');
      setCredentialAlias('');
      setCredentialData({});
      setSelectedRegistryId(null);
      showToast('Credential issued successfully');
    } catch (error) {
      console.error('Failed to issue credential:', error);
      showToast(`Failed to issue: ${error instanceof Error ? error.message : String(error)}`);
    }
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
                    className="flex items-center gap-2 p-3 transition-colors"
                    style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(51 65 85)' : 'rgb(226 232 240)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)'}
                  >
                    {acdcsByRegistry.get(registry.alias) && acdcsByRegistry.get(registry.alias)!.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRegistry(registry.alias);
                        }}
                      >
                        {expandedRegistries.has(registry.alias) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="h-6 w-6" />
                    )}
                    <div className="flex-1">
                      <VisualId
                        label={registry.alias}
                        value={registry.registryId}
                        showCopy={false}
                        bold={true}
                        size={32}
                        maxCharacters={24}
                      />
                    </div>

                    {/* Button bar - fades in on hover */}
                    <div
                      className={`flex gap-1 transition-opacity duration-200 ${hoveredRegistry === registry.registryId ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleACDCAdd(registry.alias);
                        }}
                        title="Issue new credential"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => e.stopPropagation()}
                            title="More actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleACDCImportOpen(e, registry.alias)}>
                            <Download className="h-4 w-4 mr-2" />
                            Import Credential
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleRegistryExport(e, registry.alias)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Registry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expandedRegistries.has(registry.alias) &&
                    acdcsByRegistry.get(registry.alias) &&
                    acdcsByRegistry.get(registry.alias)!.length > 0 && (
                      <div className="border-t" style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(248 250 252)' }}>
                        {/* Credentials list */}
                        <div className="p-2 space-y-1">
                          {acdcsByRegistry.get(registry.alias)?.map((acdc) => (
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
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium truncate" title={acdc.credentialId}>
                                      {acdc.credentialId.substring(0, 12)}...
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${acdc.status === 'issued'
                                      ? theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                      : theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                                      }`}>
                                      {acdc.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(acdc.issuedAt).toLocaleDateString()}</span>
                                  </div>
                                  {acdc.holderAid && (
                                    <div className="text-xs text-muted-foreground">
                                      Holder: {contactAliasMap.get(acdc.holderAid) || acdc.holderAid.substring(0, 12) + '...'}
                                    </div>
                                  )}
                                </div>

                                {/* ACDC action buttons */}
                                <div
                                  className={`flex gap-1 transition-opacity duration-200 ${hoveredACDC === acdc.credentialId ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => handleACDCCopy(e, acdc.credentialId)}
                                    title="Share (copy SAID)"
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                  {acdc.status === 'issued' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => handleACDCRevoke(e, registry.alias, acdc.credentialId)}
                                      title="Revoke credential"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Expanded ACDC details */}
                              {expandedACDCs.has(acdc.credentialId) && (
                                <div className="border-t p-3 space-y-3" style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}>
                                  {/* Issuer and Holder */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs font-medium mb-1">Issuer:</div>
                                      <VisualId
                                        label={contactAliasMap.get(acdc.issuerAid) || 'Me'}
                                        value={acdc.issuerAid}
                                        showCopy={false}
                                        small={true}
                                        maxCharacters={16}
                                      />
                                    </div>
                                    {acdc.holderAid && (
                                      <div>
                                        <div className="text-xs font-medium mb-1">Holder:</div>
                                        <VisualId
                                          label={contactAliasMap.get(acdc.holderAid) || acdc.holderAid.substring(0, 8) + '...'}
                                          value={acdc.holderAid}
                                          showCopy={false}
                                          small={true}
                                          maxCharacters={16}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Schema info */}
                                  {acdc.schemas.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium mb-1">Schema:</div>
                                      <div className="space-y-2">
                                        {acdc.schemas.map((schema, idx) => (
                                          <VisualId
                                            key={idx}
                                            label={schemaAliasMap.get(schema.schemaSaid) || 'Unknown Schema'}
                                            value={schema.schemaSaid}
                                            showCopy={false}
                                            small={true}
                                            maxCharacters={20}
                                          />
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

      {/* Add ACDC Dialog */}
      <Dialog open={showAddACDCDialog} onOpenChange={setShowAddACDCDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Credential</DialogTitle>
            <DialogDescription>
              Select schema and recipient, then fill in the credential data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Schema Selection */}
            <div className="space-y-2">
              <Label>Schema *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSchemaAlias}
                onChange={(e) => {
                  const value = e.target.value;

                  // Handle "Create New Schema" option
                  if (value === '__create_new__') {
                    // Store the registry ID in localStorage to restore dialog state
                    if (selectedRegistryId) {
                      localStorage.setItem('kerits-pending-credential-registry', selectedRegistryId);
                    }
                    // Navigate to schema creation with return params
                    navigate(route(`/dashboard/schemas/new?returnTo=explorer&registryId=${selectedRegistryId}`));
                    setShowAddACDCDialog(false);
                    return;
                  }

                  setSelectedSchemaAlias(value);
                  const schema = availableSchemas.find(s => s.alias === value);
                  setSelectedSchema(schema || null);
                  // Initialize form data based on schema properties
                  if (schema?.schema?.schema?.properties) {
                    const initialData: Record<string, any> = {};
                    Object.keys(schema.schema.schema.properties).forEach(key => {
                      initialData[key] = '';
                    });
                    setCredentialData(initialData);
                  } else {
                    setCredentialData({});
                  }
                }}
              >
                <option value="">Select a schema...</option>
                {availableSchemas.map((s) => (
                  <option key={s.alias} value={s.alias}>
                    {s.schema.schema?.title || s.alias}
                  </option>
                ))}
                <option value="__create_new__">+ Create New Schema</option>
              </select>
              {selectedSchema?.schema?.schema?.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedSchema.schema.schema.description}
                </p>
              )}
            </div>

            {/* Credential Alias (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="credentialAlias">Credential Alias (Optional)</Label>
              <Input
                id="credentialAlias"
                type="text"
                placeholder="my-credential"
                value={credentialAlias}
                onChange={(e) => setCredentialAlias(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional friendly name to reference this credential
              </p>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Recipient (Holder) *</Label>
              <Combobox
                options={contacts.map(c => ({
                  value: c.prefix,
                  label: c.name,
                  description: c.prefix.substring(0, 40) + '...',
                }))}
                value={selectedHolder}
                onChange={setSelectedHolder}
                placeholder="Select contact or enter AID..."
                emptyMessage="No contacts found. Enter AID manually."
                allowCustomValue={true}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Select from contacts or enter a custom AID directly
              </p>
            </div>

            {/* Schema-based Form Fields */}
            {selectedSchema && selectedSchema.schema?.schema?.properties && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Credential Data</Label>
                {Object.entries(selectedSchema.schema.schema.properties).map(([fieldName, fieldSchema]: [string, any]) => (
                  <div key={fieldName} className="space-y-2 px-2">
                    <Label htmlFor={`field-${fieldName}`}>
                      {fieldName}
                      {selectedSchema.schema.schema.required?.includes(fieldName) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {fieldSchema.type === 'boolean' ? (
                      <select
                        id={`field-${fieldName}`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={credentialData[fieldName] || ''}
                        onChange={(e) => setCredentialData(prev => ({
                          ...prev,
                          [fieldName]: e.target.value === 'true'
                        }))}
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : fieldSchema.type === 'number' || fieldSchema.type === 'integer' ? (
                      <Input
                        id={`field-${fieldName}`}
                        type="number"
                        placeholder={fieldSchema.description || `Enter ${fieldName}`}
                        value={credentialData[fieldName] || ''}
                        onChange={(e) => setCredentialData(prev => ({
                          ...prev,
                          [fieldName]: fieldSchema.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
                        }))}
                      />
                    ) : (
                      <Input
                        id={`field-${fieldName}`}
                        type="text"
                        placeholder={fieldSchema.description || `Enter ${fieldName}`}
                        value={credentialData[fieldName] || ''}
                        onChange={(e) => setCredentialData(prev => ({
                          ...prev,
                          [fieldName]: e.target.value
                        }))}
                      />
                    )}
                    {fieldSchema.description && (
                      <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddACDCDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateACDC}
              disabled={!selectedSchemaAlias || !selectedHolder}
              className="border-2"
            >
              Issue Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import ACDC Dialog */}
      <Dialog open={showImportACDCDialog} onOpenChange={setShowImportACDCDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Credential</DialogTitle>
            <DialogDescription>
              Paste the credential data (JSON or SAID) and optionally provide an alias to anchor it in your registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Credential Data Input */}
            <div className="space-y-2">
              <Label>Credential Data (JSON or SAID) *</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[200px]"
                placeholder='{"d":"EBWNHdSXCJnFJL5OuQPyM5K0neuniccMBdXt3gIXOf2B",...} or just SAID'
                value={importCredentialData}
                onChange={(e) => setImportCredentialData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste the full credential JSON or just the SAID/credentialId
              </p>
            </div>

            {/* Alias Input */}
            <div className="space-y-2">
              <Label>Credential Alias (Optional)</Label>
              <Input
                type="text"
                placeholder="my-credential"
                value={importCredentialAlias}
                onChange={(e) => setImportCredentialAlias(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: provide a human-readable alias for this credential
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportACDCDialog(false);
                setImportCredentialData('');
                setImportCredentialAlias('');
                setImportRegistryAlias(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleACDCImportSubmit}
              disabled={!importCredentialData.trim()}
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
