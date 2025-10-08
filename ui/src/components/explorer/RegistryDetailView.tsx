/**
 * RegistryDetailView - Main content panel showing registry details
 *
 * Displays:
 * - Registry information and metadata
 * - Action buttons (Add Sub-Registry, Issue Credential, Export, Import)
 * - List of credentials (ACDCs) in this registry
 * - Credential details with expand/collapse
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download, Upload, FolderPlus, FileText, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
import { Combobox } from '../ui/combobox';
import { route } from '@/config';
import { CreateRegistryDialog } from './CreateRegistryDialog';
import { VisualId } from '../ui/visual-id';
import { ACDCRecord } from './ACDCRecord';
import type { KeritsDSL, RegistryDSL } from '@kerits/app/dsl/types';
import type { IndexedACDC } from '@kerits/app/indexer/types';
import type { JSONSchema7Property } from '@kerits/app/dsl/types';

interface RegistryDetailViewProps {
  dsl: KeritsDSL | null;
  accountAlias: string;
  registryId: string;
  onRegistryCreated?: () => void;
}

export function RegistryDetailView({
  dsl,
  accountAlias,
  registryId,
  onRegistryCreated,
}: RegistryDetailViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('selected');
  const [registryDsl, setRegistryDsl] = useState<RegistryDSL | null>(null);
  const [acdcs, setAcdcs] = useState<IndexedACDC[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddSubRegistryDialog, setShowAddSubRegistryDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [selectedHolder, setSelectedHolder] = useState('');
  const [credentialAlias, setCredentialAlias] = useState('');
  const [credentialDataFields, setCredentialDataFields] = useState<Record<string, any>>({});
  const [availableContacts, setAvailableContacts] = useState<Array<{ value: string; label: string }>>([]);
  const [currentAccountAid, setCurrentAccountAid] = useState<string>('');
  const [schemaProperties, setSchemaProperties] = useState<Record<string, JSONSchema7Property> | null>(null);
  const [schemaRequired, setSchemaRequired] = useState<string[]>([]);
  const [credentialEdges, setCredentialEdges] = useState<Record<string, { n: string; s?: string }>>({});
  const [edgeFilter, setEdgeFilter] = useState('');
  const [availableCredentials, setAvailableCredentials] = useState<Array<{ value: string; label: string; schemaId?: string }>>([]);
  const [edgeCredentialSearch, setEdgeCredentialSearch] = useState('');

  // Load registry data
  useEffect(() => {
    async function loadRegistry() {
      if (!dsl) return;

      try {
        setLoading(true);
        // Clear previous registry data when switching registries
        setRegistryDsl(null);
        setAcdcs([]);

        // Get account DSL
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) {
          console.error('Account not found:', accountAlias);
          return;
        }

        // Get all registries and find the one with matching ID
        const registryAliases = await accountDsl.listRegistries();
        let foundRegistryDsl: RegistryDSL | null = null;

        for (const alias of registryAliases) {
          const regDsl = await accountDsl.registry(alias);
          if (regDsl && regDsl.registry.registryId === registryId) {
            foundRegistryDsl = regDsl;
            break;
          }
        }

        if (!foundRegistryDsl) {
          console.error('Registry not found:', registryId);
          return;
        }

        setRegistryDsl(foundRegistryDsl);

        // Load ACDCs for this registry
        const acdcAliases = await foundRegistryDsl.listACDCs();
        const acdcList: IndexedACDC[] = [];

        for (const alias of acdcAliases) {
          const acdcDsl = await foundRegistryDsl.acdc(alias);
          if (acdcDsl) {
            const status = await acdcDsl.status();
            acdcList.push({
              credentialId: acdcDsl.acdc.credentialId,
              alias: acdcDsl.acdc.alias,
              registryId: acdcDsl.acdc.registryId,
              issuerAid: acdcDsl.acdc.issuerAid,
              holderAid: acdcDsl.acdc.holderAid,
              schemaId: acdcDsl.acdc.schemaId,
              issuedAt: acdcDsl.acdc.issuedAt,
              status: status.status,
              revoked: status.revoked,
              data: {},
            });
          }
        }

        setAcdcs(acdcList);

        // Load available schemas (with "Create new..." option)
        const schemaAliases = await dsl.listSchemas();
        const schemas = [
          { value: '__create__', label: '+ Create New Schema' },
          ...schemaAliases.map(alias => ({
            value: alias,
            label: alias,
          }))
        ];
        setAvailableSchemas(schemas);

        // Load contacts
        const contactsDsl = dsl.contacts();
        const allContacts = await contactsDsl.getAll();

        const contacts = [
          { value: accountDsl.account.aid, label: `${accountAlias} (current account)` },
          ...allContacts.map(contact => ({
            value: contact.aid,
            label: `${contact.alias} - ${contact.aid.substring(0, 16)}...`,
          }))
        ];
        setAvailableContacts(contacts);
        setCurrentAccountAid(accountDsl.account.aid);
      } catch (error) {
        console.error('Failed to load registry:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRegistry();
  }, [dsl, accountAlias, registryId]);


  // Initialize credential data fields when schema changes
  useEffect(() => {
    async function loadSchemaFields() {
      if (!dsl || !selectedSchema || selectedSchema === '__create__') {
        setCredentialDataFields({});
        setSchemaProperties(null);
        setSchemaRequired([]);
        return;
      }

      try {
        const schemaDsl = await dsl.schema(selectedSchema);
        if (schemaDsl) {
          const schema = schemaDsl.getSchema();
          const initialData: Record<string, any> = {};

          // Store schema properties and required fields
          setSchemaProperties(schema.properties || null);
          setSchemaRequired(schema.required || []);

          // Initialize fields from schema properties
          if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
              initialData[key] = '';
            });
          }

          setCredentialDataFields(initialData);
        }
      } catch (error) {
        console.error('Failed to load schema fields:', error);
      }
    }

    loadSchemaFields();
  }, [dsl, selectedSchema]);

  // Load available credentials for edge selection using listAllACDCs
  useEffect(() => {
    async function loadAvailableCredentials() {
      if (!showIssueDialog || !dsl) {
        return;
      }

      try {
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) return;

        // Use listAllACDCs with optional filter
        const allCreds = await accountDsl.listAllACDCs(edgeCredentialSearch);

        const credentials: Array<{ value: string; label: string; schemaId?: string }> = allCreds.map(cred => ({
          value: cred.credentialId,
          label: `${cred.alias || cred.credentialId.substring(0, 12)}...`,
          schemaId: cred.schemaId,
        }));

        setAvailableCredentials(credentials);
      } catch (error) {
        console.error('Failed to load available credentials:', error);
      }
    }

    loadAvailableCredentials();
  }, [showIssueDialog, dsl, accountAlias, edgeCredentialSearch]);

  const handleIssueCredential = async () => {
    if (!selectedSchema || !selectedHolder || !credentialAlias.trim() || !registryDsl) {
      console.warn('Missing required fields for credential issuance:', {
        selectedSchema,
        selectedHolder,
        credentialAlias,
        hasRegistryDsl: !!registryDsl,
      });
      return;
    }

    try {
      console.log('Issuing credential:', {
        schema: selectedSchema,
        holder: selectedHolder,
        alias: credentialAlias.trim(),
        data: credentialDataFields,
        registryId: registryDsl.registry.registryId,
      });

      // Issue credential with structured field data and edges
      await registryDsl.issue({
        schema: selectedSchema,
        holder: selectedHolder,
        data: credentialDataFields,
        alias: credentialAlias.trim(),
        edges: Object.keys(credentialEdges).length > 0 ? credentialEdges : undefined,
      });

      console.log('Credential issued successfully, reloading ACDCs...');

      // Reload registry data BEFORE closing dialog
      const acdcAliases = await registryDsl.listACDCs();
      console.log('Found ACDC aliases after issuance:', acdcAliases);

      const acdcList: IndexedACDC[] = [];

      for (const alias of acdcAliases) {
        const acdcDsl = await registryDsl.acdc(alias);
        if (acdcDsl) {
          const status = await acdcDsl.status();
          acdcList.push({
            credentialId: acdcDsl.acdc.credentialId,
            alias: acdcDsl.acdc.alias,
            registryId: acdcDsl.acdc.registryId,
            issuerAid: acdcDsl.acdc.issuerAid,
            holderAid: acdcDsl.acdc.holderAid,
            schemaId: acdcDsl.acdc.schemaId,
            issuedAt: acdcDsl.acdc.issuedAt,
            status: status.status,
            revoked: status.revoked,
            data: {},
          });
        }
      }

      console.log('Loaded ACDCs:', acdcList);
      setAcdcs(acdcList);

      // Close dialog and reset form
      setShowIssueDialog(false);
      setSelectedSchema('');
      setSelectedHolder('');
      setCredentialAlias('');
      setCredentialDataFields({});
      setCredentialEdges({});
      setEdgeFilter('');

      console.log('Credential issuance complete');
    } catch (error) {
      console.error('Failed to issue credential:', error);
      // Show error to user
      alert(`Failed to issue credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExport = () => {
    // TODO: Implement export
    console.log('Export registry:', registryId);
  };

  const handleImport = () => {
    // TODO: Implement import
    console.log('Import to registry:', registryId);
  };

  const handleSchemaChange = (value: string) => {
    if (value === '__create__') {
      // Navigate to schema creation with return URL
      navigate(
        route(`/dashboard/schemas/new?returnTo=/dashboard/explorer/${accountAlias}/${registryId}`)
      );
    } else {
      setSelectedSchema(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading registry...</p>
      </div>
    );
  }

  if (!registryDsl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Registry not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <VisualId
            variant='marble'
            label={registryDsl.registry.alias}
            value={registryDsl.registry.registryId}
            size={48}
            maxCharacters={16}
            bold={true}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button size="sm" onClick={() => setShowIssueDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Credential
          </Button>
        </div>
      </div>

      {/* Credentials list */}
      <Card>
        <CardHeader>
          <CardTitle>Credentials ({acdcs.length})</CardTitle>
          <CardDescription>
            ACDCs issued in this registry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acdcs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No credentials issued yet</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setShowIssueDialog(true)}
              >
                Issue your first credential
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {acdcs.map(acdc => (
                <ACDCRecord
                  key={acdc.credentialId}
                  acdc={acdc}
                  autoExpand={selectedId === acdc.credentialId}
                  onRevoke={async () => {
                    // TODO: Implement revocation
                    console.log('Revoke credential:', acdc.credentialId);
                    // Reload credentials after revocation
                    const updatedAcdcs = await registryDsl!.listACDCs();
                    // ... refresh logic
                  }}
                  onExpand={async () => {
                    // Load full ACDC data when expanded
                    if (!dsl || !registryDsl) return {};

                    const acdcDsl = await registryDsl.acdc(acdc.alias);
                    if (!acdcDsl) return {};

                    // Resolve issuer alias (check if it's the current account)
                    let issuerLabel = acdc.issuerAid;
                    const accountDsl = await dsl.account(accountAlias);
                    if (accountDsl && accountDsl.account.aid === acdc.issuerAid) {
                      issuerLabel = accountAlias;
                    }

                    // Resolve holder alias (check contacts and current account)
                    let holderLabel = acdc.holderAid;
                    if (accountDsl && accountDsl.account.aid === acdc.holderAid) {
                      holderLabel = accountAlias;
                    } else {
                      // Check contacts
                      const contactsDsl = dsl.contacts();
                      const allContacts = await contactsDsl.getAll();
                      const contact = allContacts.find(c => c.aid === acdc.holderAid);
                      if (contact) {
                        holderLabel = contact.alias;
                      }
                    }

                    // Filter out 'd' and 'i' fields from data
                    const filteredData = Object.entries(acdcDsl.acdc.data)
                      .filter(([key]) => key !== 'd' && key !== 'i')
                      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

                    // Get ACDC details using the core utility
                    const { extractACDCDetails } = await import('@kerits/app/dsl/utils/acdc-details');
                    const exportDsl = await acdcDsl.export();
                    const details = await extractACDCDetails(exportDsl);

                    // Resolve linked credential aliases
                    let linkedCredentialsWithAliases: Record<string, { n: string; s?: string; alias?: string }> | undefined;
                    if (details.acdcEvent?.e && accountDsl) {
                      linkedCredentialsWithAliases = {};
                      const allCreds = await accountDsl.listAllACDCs();

                      for (const [edgeName, edgeData] of Object.entries(details.acdcEvent.e)) {
                        const credSaid = (edgeData as any)?.n;
                        if (credSaid) {
                          const linkedCred = allCreds.find(c => c.credentialId === credSaid);
                          linkedCredentialsWithAliases[edgeName] = {
                            ...(edgeData as any),
                            alias: linkedCred?.alias,
                          };
                        }
                      }
                    }

                    return {
                      'Credential ID': acdc.credentialId,
                      'Alias': acdc.alias,
                      'Registry ID': acdc.registryId,
                      'Issuer': issuerLabel,
                      'Holder': holderLabel,
                      'Schema ID': acdc.schemaId,
                      'Issued At': acdc.issuedAt,
                      'Data': filteredData,
                      'JSON': details.json,
                      'CESR': details.cesr,
                      [details.publicKeys.length === 1 ? 'Public Key' : 'Public Keys']: details.publicKeys,
                      [details.signatures.length === 1 ? 'Signature' : 'Signatures']: details.signatures,
                      ...(linkedCredentialsWithAliases && { 'Linked Credentials': linkedCredentialsWithAliases }),
                    };
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Sub-Registry Dialog */}
      <CreateRegistryDialog
        open={showAddSubRegistryDialog}
        onOpenChange={setShowAddSubRegistryDialog}
        parentRegistryDsl={registryDsl}
        onSuccess={onRegistryCreated}
      />

      {/* Issue Credential Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Credential</DialogTitle>
            <DialogDescription>
              Issue a new ACDC in the "{registryDsl.registry.alias}" registry
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-2">
            {/* Credential Alias */}
            <div className="grid gap-2">
              <Label htmlFor="credentialAlias">Credential Alias *</Label>
              <Input
                id="credentialAlias"
                value={credentialAlias}
                onChange={(e) => setCredentialAlias(e.target.value)}
                placeholder="e.g., employee-badge-001"
              />
            </div>

            {/* Schema Selection */}
            <div className="grid gap-2">
              <Label>Schema *</Label>
              <Combobox
                options={availableSchemas}
                value={selectedSchema}
                onChange={handleSchemaChange}
                placeholder="Select schema..."
                emptyMessage="No schemas found."
              />
            </div>

            {/* Holder Selection */}
            <div className="grid gap-2">
              <Label>Holder *</Label>
              <Combobox
                options={availableContacts}
                value={selectedHolder}
                onChange={setSelectedHolder}
                placeholder="Select holder..."
                emptyMessage="No contacts found."
              />
            </div>

            {/* Credential Data Fields */}
            {schemaProperties && Object.keys(schemaProperties).length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Credential Data</Label>
                {Object.entries(schemaProperties).map(([fieldName, prop]) => {
                  const isRequired = schemaRequired.includes(fieldName);

                  return (
                    <div key={fieldName} className="space-y-2 px-1">
                      <Label htmlFor={fieldName}>
                        {fieldName} {isRequired && '*'}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({prop.type || 'string'})
                        </span>
                      </Label>

                      {prop.type === 'boolean' ? (
                        <Select
                          id={fieldName}
                          value={credentialDataFields[fieldName]?.toString() || ''}
                          onChange={(e) => setCredentialDataFields({
                            ...credentialDataFields,
                            [fieldName]: e.target.value === 'true',
                          })}
                        >
                          <option value="">Select...</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </Select>
                      ) : (
                        <Input
                          id={fieldName}
                          type={
                            prop.type === 'number' || prop.type === 'integer'
                              ? 'number'
                              : prop.format === 'date' || prop.format === 'date-time'
                                ? 'date'
                                : 'text'
                          }
                          placeholder={`Enter ${fieldName}`}
                          value={credentialDataFields[fieldName] || ''}
                          onChange={(e) => setCredentialDataFields({
                            ...credentialDataFields,
                            [fieldName]: prop.type === 'number' || prop.type === 'integer'
                              ? Number(e.target.value)
                              : e.target.value,
                          })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Link to Other Credentials (Edges) */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base font-semibold">Link to Other Credentials (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Create edges linking this credential to existing credentials in this registry
                </p>
              </div>

              {/* Display existing edges */}
              {Object.entries(credentialEdges).map(([edgeName, edge]) => {
                const linkedCred = availableCredentials.find(c => c.value === edge.n);
                return (
                  <div key={edgeName} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{edgeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {linkedCred?.label || edge.n.substring(0, 20) + '...'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newEdges = { ...credentialEdges };
                        delete newEdges[edgeName];
                        setCredentialEdges(newEdges);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}

              {/* Add new edge */}
              <div className="space-y-3 p-3 border rounded">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., evidence, parent, prerequisite"
                    value={edgeFilter}
                    onChange={(e) => setEdgeFilter(e.target.value)}
                  />
                </div>

                {edgeFilter && (
                  <div className="grid gap-2">
                    <Label>Credential</Label>
                    {availableCredentials.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No credentials available. Issue a credential first.
                      </p>
                    ) : (
                      <Combobox
                        options={availableCredentials}
                        value=""
                        onChange={(selectedCredId) => {
                          if (selectedCredId && edgeFilter.trim()) {
                            setCredentialEdges({
                              ...credentialEdges,
                              [edgeFilter.trim()]: { n: selectedCredId },
                            });
                            setEdgeFilter('');
                          }
                        }}
                        placeholder="Search credentials..."
                        emptyMessage="No credentials found. Try adjusting your search."
                      />
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Or paste credential SAID directly"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value && edgeFilter.trim()) {
                            setCredentialEdges({
                              ...credentialEdges,
                              [edgeFilter.trim()]: { n: e.currentTarget.value },
                            });
                            setEdgeFilter('');
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEdgeFilter('')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!edgeFilter && availableCredentials.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEdgeFilter('edge_')}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Edge Link
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueCredential}
              disabled={!selectedSchema || selectedSchema === '__create__' || !selectedHolder || !credentialAlias.trim()}
            >
              Issue Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
