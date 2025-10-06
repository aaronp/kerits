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
import { ChevronRight, ChevronDown, PlusCircle, Download, Upload, Share2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { route } from '@/config';
import { VisualId } from '../ui/visual-id';
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
import { Combobox } from '../ui/combobox';
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
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [selectedSchemaAlias, setSelectedSchemaAlias] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [selectedHolder, setSelectedHolder] = useState('');
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [availableSchemas, setAvailableSchemas] = useState<Array<{ alias: string; schema: any }>>([]);
  const [contacts, setContacts] = useState<Array<{ alias: string; aid: string }>>([]);

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
        // Load ACDCs first to check if there are any
        loadACDCsForRegistry(registryId).then(() => {
          const acdcs = acdcsByRegistry.get(registryId);
          if (acdcs && acdcs.length > 0) {
            setExpandedRegistries(prev => new Set(prev).add(registryId));
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

  const handleACDCAdd = async (registryId: string) => {
    setSelectedRegistryId(registryId);
    setSelectedSchemaAlias('');
    setSelectedSchema(null);
    setSelectedHolder('');
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

        // Load contacts
        const contactsDsl = dsl.contacts();
        const contactAliases = await contactsDsl.list();
        const contactsData = await Promise.all(
          contactAliases.map(async (alias) => {
            const contact = await contactsDsl.get(alias);
            return contact ? { alias, aid: contact.aid } : null;
          })
        );
        setContacts(contactsData.filter((c): c is NonNullable<typeof c> => c !== null));
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
      });

      // Reload ACDCs for this registry
      await loadACDCsForRegistry(selectedRegistryId);

      setShowAddACDCDialog(false);
      setSelectedSchemaAlias('');
      setSelectedSchema(null);
      setSelectedHolder('');
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
                    {acdcsByRegistry.get(registry.registryId) && acdcsByRegistry.get(registry.registryId)!.length > 0 ? (
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
                      className={`flex gap-1 transition-opacity duration-200 ${
                        hoveredRegistry === registry.registryId ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleACDCAdd(registry.registryId);
                        }}
                        title="Issue new credential"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
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

                  {expandedRegistries.has(registry.registryId) &&
                   acdcsByRegistry.get(registry.registryId) &&
                   acdcsByRegistry.get(registry.registryId)!.length > 0 && (
                    <div className="border-t" style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(248 250 252)' }}>
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

            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Recipient (Holder) *</Label>
              <Combobox
                options={contacts.map(c => ({
                  value: c.alias,
                  label: c.alias,
                  description: c.aid.substring(0, 40) + '...',
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
                  <div key={fieldName} className="space-y-2">
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
            >
              Issue Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
