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
import { useNavigate } from 'react-router-dom';
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
import { Select } from '../ui/select';
import { Combobox } from '../ui/combobox';
import { route } from '@/config';
import { CreateRegistryDialog } from './CreateRegistryDialog';
import { VisualId } from '../ui/visual-id';
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
        console.log('[RegistryDetailView] Loaded contacts:', allContacts.length, allContacts);

        const contacts = [
          { value: accountDsl.account.aid, label: `${accountAlias} (current account)` },
          ...allContacts.map(contact => ({
            value: contact.aid,
            label: `${contact.alias} - ${contact.aid.substring(0, 16)}...`,
          }))
        ];
        console.log('[RegistryDetailView] Available contacts for dropdown:', contacts);
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

      // Issue credential with structured field data
      await registryDsl.issue({
        schema: selectedSchema,
        holder: selectedHolder,
        data: credentialDataFields,
        alias: credentialAlias.trim(),
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
                <div
                  key={acdc.credentialId}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{acdc.alias}</h4>
                      <p className="text-sm text-muted-foreground">
                        {acdc.credentialId.substring(0, 24)}...
                      </p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${acdc.revoked ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                          {acdc.status}
                        </span>
                        <span className="text-muted-foreground">
                          Issued: {acdc.issuedAt ? new Date(acdc.issuedAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
              <Select
                value={selectedSchema}
                onChange={(e) => handleSchemaChange(e.target.value)}
              >
                <option value="">Select schema...</option>
                {availableSchemas.map(schema => (
                  <option key={schema.value} value={schema.value}>
                    {schema.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Holder Selection */}
            <div className="grid gap-2">
              <Label>Holder *</Label>
              <Select
                value={selectedHolder}
                onChange={(e) => setSelectedHolder(e.target.value)}
              >
                <option value="">Select holder...</option>
                {availableContacts.map(contact => (
                  <option key={contact.value} value={contact.value}>
                    {contact.label}
                  </option>
                ))}
              </Select>
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
