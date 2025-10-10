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
import { Plus, Download, FileText, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
import { Select } from '../ui/select';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  const [registryDsl, setRegistryDsl] = useState<RegistryDSL | null>(null);
  const [acdcs, setAcdcs] = useState<IndexedACDC[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddSubRegistryDialog, setShowAddSubRegistryDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueStep, setIssueStep] = useState(1); // Wizard step: 1, 2, or 3
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

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importAlias, setImportAlias] = useState('');
  const [importIpexData, setImportIpexData] = useState('');
  const [ipexValidation, setIpexValidation] = useState<{
    isValid: boolean;
    issuerName: string | null;
    issuerAid: string | null;
    credentialId: string | null;
    errors: string[];
    checks: {
      validJson: boolean;
      validStructure: boolean;
      validSaid: boolean;
      validSignature: boolean;
    };
    signatureInfo?: {
      signerAid: string;
      signatures: string[];
      publicKeys: string[];
    };
  } | null>(null);

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

  const resetIssueWizard = () => {
    setIssueStep(1);
    setSelectedSchema('');
    setSelectedHolder('');
    setCredentialAlias('');
    setCredentialDataFields({});
    setCredentialEdges({});
    setEdgeFilter('');
  };

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
      resetIssueWizard();

      console.log('Credential issuance complete');
    } catch (error) {
      console.error('Failed to issue credential:', error);
      // Show error to user
      alert(`Failed to issue credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  // Validate IPEX data when it changes
  useEffect(() => {
    async function validateIpex() {
      if (!importIpexData.trim() || !dsl) {
        setIpexValidation(null);
        return;
      }

      const checks = {
        validJson: false,
        validStructure: false,
        validSaid: false,
        validSignature: false,
      };
      const errors: string[] = [];
      let issuerAid: string | null = null;
      let issuerName: string | null = null;
      let credentialId: string | null = null;
      let signatureInfo: { signerAid: string; signatures: string[]; publicKeys: string[] } | undefined;

      try {
        // Parse JSON
        const ipexData = JSON.parse(importIpexData);
        checks.validJson = true;

        // Check IPEX structure
        if (ipexData.r === '/ipex/grant' && ipexData.e?.acdc && ipexData.e?.iss) {
          checks.validStructure = true;

          // Extract credential and issuer info
          const acdc = ipexData.e.acdc;
          credentialId = acdc.d;
          issuerAid = acdc.i;

          // Verify ACDC SAID
          if (credentialId && credentialId.length === 44 && credentialId.startsWith('E')) {
            checks.validSaid = true;
          } else {
            errors.push('Invalid credential SAID');
          }

          // Look up issuer name
          if (issuerAid) {
            // Check if issuer is current account
            const accountDsl = await dsl.account(accountAlias);
            if (accountDsl && accountDsl.account.aid === issuerAid) {
              issuerName = accountAlias;
            } else {
              // Check contacts
              const contactsDsl = dsl.contacts();
              const allContacts = await contactsDsl.getAll();
              const contact = allContacts.find(c => c.aid === issuerAid);
              if (contact) {
                issuerName = contact.alias;
              } else {
                issuerName = issuerAid.substring(0, 16) + '...';
              }
            }
          }

          // Extract signature info from ISS event
          const issEvent = ipexData.e.iss;
          if (issEvent) {
            // Extract signer AID (the issuer AID from the ACDC 'i' field)
            const signerAid = issuerAid || '';

            // Extract signatures (from 'sigs' array if present)
            const signatures = issEvent.sigs || [];

            // Extract public keys from the IPEX data itself (self-contained)
            // IPEX credentials should include keys in either the ISS event or anchoring event
            let publicKeys: string[] = [];

            // First, try to get keys from the ISS event (most reliable for re-exported credentials)
            if (issEvent.k && Array.isArray(issEvent.k)) {
              publicKeys = issEvent.k;
              console.log('[IPEX] Using keys from ISS event:', publicKeys);
            }
            // Fallback: try to get keys from the anchoring event (anc) if present
            else if (ipexData.e.anc && ipexData.e.anc.k && Array.isArray(ipexData.e.anc.k)) {
              publicKeys = ipexData.e.anc.k;
              console.log('[IPEX] Using keys from anchoring event:', publicKeys);
            }

            // If still no keys, log the IPEX structure for debugging
            if (publicKeys.length === 0) {
              console.log('[IPEX] No keys found in IPEX data. Structure:', {
                hasAnc: !!ipexData.e.anc,
                ancKeys: ipexData.e.anc?.k,
                issKeys: issEvent.k,
                ancType: ipexData.e.anc?.t,
                fullAnc: ipexData.e.anc,
              });
            }

            // Debug logging
            console.log('[IPEX Validation]', {
              signerAid,
              signaturesCount: signatures.length,
              publicKeysCount: publicKeys.length,
              publicKeys,
              anchorSeq: ipexData.e.anc?.s,
              anchorType: ipexData.e.anc?.t,
            });

            signatureInfo = {
              signerAid,
              signatures: Array.isArray(signatures) ? signatures : [],
              publicKeys: Array.isArray(publicKeys) ? publicKeys : [],
            };

            // Check if we have signature data
            if (signatures.length > 0 && publicKeys.length > 0) {
              checks.validSignature = true;
            } else {
              // Missing signatures or public keys
              checks.validSignature = false;
              if (signatures.length === 0) {
                errors.push('ISS event has no signatures');
              }
              if (publicKeys.length === 0) {
                errors.push('IPEX grant missing public keys (should be in ISS event or anchoring event)');
              }
            }
          } else {
            checks.validSignature = false;
            errors.push('Missing ISS event');
          }
        } else {
          errors.push('Not a valid IPEX grant message');
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          errors.push('Invalid JSON format');
        } else {
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }

      const isValid = checks.validJson && checks.validStructure && checks.validSaid && checks.validSignature;

      setIpexValidation({
        isValid,
        issuerName,
        issuerAid,
        credentialId,
        errors,
        checks,
        signatureInfo,
      });
    }

    validateIpex();
  }, [importIpexData, dsl, accountAlias]);

  const handleImport = () => {
    setShowImportDialog(true);
    setImportAlias('');
    setImportIpexData('');
    setIpexValidation(null);
  };

  const handleImportCredential = async () => {
    if (!registryDsl || !importAlias.trim() || !ipexValidation?.isValid) {
      return;
    }

    try {
      // Parse IPEX grant
      const ipexData = JSON.parse(importIpexData);
      const { parseExchangeMessage } = await import('@kerits/ipex');

      const grantMessage = parseExchangeMessage(importIpexData);

      if (!grantMessage.e?.acdc || !grantMessage.e?.iss) {
        throw new Error('Invalid IPEX grant structure');
      }

      // Import credential using registry accept method
      await registryDsl.accept({
        credential: grantMessage.e.acdc,
        issEvent: grantMessage.e.iss,
        alias: importAlias.trim(),
      });

      toast({
        title: 'Credential Imported',
        description: `Successfully imported credential "${importAlias}" from ${ipexValidation.issuerName}`,
      });

      // Reload credentials
      const acdcAliases = await registryDsl.listACDCs();
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

      setAcdcs(acdcList);

      // Close dialog
      setShowImportDialog(false);
      setImportAlias('');
      setImportIpexData('');
      setIpexValidation(null);
    } catch (error) {
      console.error('Failed to import credential:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import credential',
        variant: 'destructive',
      });
    }
  };

  const handleSchemaChange = (value: string) => {
    if (value === '__create__') {
      // Navigate to schema creation with return URL
      navigate(
        route(`/schemas/new?returnTo=/explorer/${accountAlias}/${registryId}`)
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
          <Button className="cursor-pointer" variant="outline" size="sm" onClick={handleImport}>
            <Download className="mr-2 h-4 w-4" />
            Import
          </Button>

          <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setShowIssueDialog(true)}>
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
                  onShare={async () => {
                    try {
                      if (!registryDsl) {
                        alert('Bug: registryDsl is not set');
                        return;
                      }

                      const alias = (acdc as any).alias
                      if (!alias) {
                        throw new Error("alias not set on ACDC")
                        return;
                      }

                      // Get the ACDC DSL
                      const acdcDsl = await registryDsl.acdc(alias);
                      if (!acdcDsl) {
                        throw new Error('Credential not found');
                      }

                      // Export as IPEX grant
                      const ipexGrant = await acdcDsl.exportIPEX();

                      // Copy to clipboard
                      await navigator.clipboard.writeText(ipexGrant);

                      // Show toast
                      toast({
                        title: 'Credential Shared',
                        description: `IPEX grant message copied to clipboard for ${acdc.credentialId || 'credential'}`,
                      });
                    } catch (error) {
                      console.error('Failed to share credential:', error);
                      toast({
                        title: 'Share Failed',
                        description: error instanceof Error ? error.message : 'Failed to share credential',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onRevoke={async () => {
                    try {
                      if (!registryDsl) {
                        toast({
                          title: 'Error',
                          description: 'Registry not loaded',
                          variant: 'destructive',
                        });
                        return;
                      }

                      const alias = (acdc as any).alias;
                      if (!alias) {
                        throw new Error('Credential alias not found');
                      }

                      // Get the ACDC DSL
                      const acdcDsl = await registryDsl.acdc(alias);
                      if (!acdcDsl) {
                        throw new Error('Credential not found');
                      }

                      // Revoke the credential
                      await acdcDsl.revoke();

                      // Show success toast
                      toast({
                        title: 'Credential Revoked',
                        description: `Successfully revoked credential "${alias}"`,
                      });

                      // Reload credentials list
                      const acdcAliases = await registryDsl.listACDCs();
                      const acdcList: IndexedACDC[] = [];

                      for (const acdcAlias of acdcAliases) {
                        const acdcDsl = await registryDsl.acdc(acdcAlias);
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
                    } catch (error) {
                      console.error('Failed to revoke credential:', error);
                      toast({
                        title: 'Revocation Failed',
                        description: error instanceof Error ? error.message : 'Failed to revoke credential',
                        variant: 'destructive',
                      });
                    }
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

      {/* Issue Credential Dialog - 3 Step Wizard */}
      <Dialog open={showIssueDialog} onOpenChange={(open) => {
        setShowIssueDialog(open);
        if (!open) resetIssueWizard();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Issue Credential</DialogTitle>
            <DialogDescription>
              Credential in the "{registryDsl.registry.alias}" registry
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-4 border-b">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  issueStep === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : issueStep > step
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}>
                  {issueStep > step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                <div className={cn(
                  "ml-2 text-sm transition-all",
                  issueStep === step
                    ? "text-foreground font-bold"
                    : issueStep > step
                      ? "text-muted-foreground font-normal"
                      : "text-muted-foreground font-light"
                )}>
                  {step === 1 ? "Details" : step === 2 ? "Schema" : "Links"}
                </div>
                {step < 3 && (
                  <ChevronRight className={cn(
                    "mx-2 h-4 w-4 transition-colors",
                    issueStep > step ? "text-green-500" : "text-muted-foreground"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Wizard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <div className="grid gap-4">
              {/* Step 1: Credential Details */}
              {issueStep === 1 && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="credentialAlias">Credential Alias *</Label>
                    <Input
                      id="credentialAlias"
                      value={credentialAlias}
                      onChange={(e) => setCredentialAlias(e.target.value)}
                      placeholder="e.g., employee-badge-001"
                    />
                  </div>

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
                </>
              )}

              {/* Step 2: Schema and Data Fields */}
              {issueStep === 2 && (
                <>
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
                </>
              )}

              {/* Step 3: Link to Other Credentials (Edges) */}
              {issueStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Link to Other Credentials (Optional)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Does this credential reference other credentials?
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
                          variant="destructive"
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
                      <Label>Name (just for clarity)</Label>
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
                            variant="link"
                            className="cursor-pointer"
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
                        onClick={() => setEdgeFilter('')}
                        className="w-full cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Link
                      </Button>
                    )}
                  </div>

                  {Object.keys(credentialEdges).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No edges added. You can skip this step if not needed.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Wizard Footer */}
          <DialogFooter className="flex-row justify-between border-t pt-4">
            <Button
              variant="link"
              className="cursor-pointer"
              onClick={() => {
                if (issueStep === 1) {
                  setShowIssueDialog(false);
                  resetIssueWizard();
                } else {
                  setIssueStep(issueStep - 1);
                }
              }}
            >
              {issueStep === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>

            {issueStep < 3 ? (
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setIssueStep(issueStep + 1)}
                disabled={
                  (issueStep === 1 && (!credentialAlias.trim() || !selectedHolder)) ||
                  (issueStep === 2 && (!selectedSchema || selectedSchema === '__create__'))
                }
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleIssueCredential}
                disabled={!selectedSchema || selectedSchema === '__create__' || !selectedHolder || !credentialAlias.trim()}
              >
                Issue Credential
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Credential Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Credential</DialogTitle>
            <DialogDescription>
              Import an IPEX credential into "{registryDsl.registry.alias}" registry
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Alias input */}
            <div className="grid gap-2">
              <Label htmlFor="importAlias">Credential Alias *</Label>
              <Input
                id="importAlias"
                value={importAlias}
                onChange={(e) => setImportAlias(e.target.value)}
                placeholder="e.g., imported-credential"
              />
            </div>

            {/* IPEX data textarea */}
            <div className="grid gap-2">
              <Label htmlFor="ipexData">IPEX Credential Data *</Label>
              <Textarea
                id="ipexData"
                value={importIpexData}
                onChange={(e) => setImportIpexData(e.target.value)}
                placeholder="Paste IPEX grant message JSON here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* Validation status */}
            {ipexValidation && (
              <div className="space-y-2 p-3 border rounded">
                <div className="flex items-center gap-2">
                  {ipexValidation.checks.validJson ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Valid JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  {ipexValidation.checks.validStructure ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Valid IPEX Grant Structure</span>
                </div>
                <div className="flex items-center gap-2">
                  {ipexValidation.checks.validSaid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Valid Credential SAID</span>
                </div>
                <div className="flex items-center gap-2">
                  {ipexValidation.checks.validSignature ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Valid Signature</span>
                </div>

                {ipexValidation.isValid && ipexValidation.issuerName && (
                  <div className="pt-2 mt-2 border-t space-y-2">
                    <p className="text-sm font-medium">
                      Import from {ipexValidation.issuerName}
                    </p>

                    {ipexValidation.signatureInfo && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Signer AID:</span>
                          <span className="font-mono break-all">{ipexValidation.signatureInfo.signerAid.substring(0, 24)}...</span>
                        </div>

                        {ipexValidation.signatureInfo.publicKeys.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Public Keys:</span>
                            <div className="flex-1">
                              {ipexValidation.signatureInfo.publicKeys.map((key, i) => (
                                <div key={i} className="font-mono break-all">
                                  {typeof key === 'string' ? key.substring(0, 32) + '...' : JSON.stringify(key).substring(0, 32) + '...'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ipexValidation.signatureInfo.signatures.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Signatures:</span>
                            <div className="flex-1">
                              {ipexValidation.signatureInfo.signatures.map((sig, i) => (
                                <div key={i} className="font-mono break-all">
                                  {typeof sig === 'string' ? sig.substring(0, 32) + '...' : JSON.stringify(sig).substring(0, 32) + '...'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ipexValidation.signatureInfo.signatures.length === 0 && ipexValidation.signatureInfo.publicKeys.length === 0 && (
                          <div className="text-muted-foreground italic">
                            Signature verification via SAID integrity
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {ipexValidation.errors.length > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    {ipexValidation.errors.map((error, i) => (
                      <p key={i} className="text-sm text-destructive">{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportCredential}
              disabled={!importAlias.trim() || !ipexValidation?.isValid}
            >
              Import Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
