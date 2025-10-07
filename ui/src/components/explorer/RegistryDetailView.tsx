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
import { Combobox } from '../ui/combobox';
import { route } from '@/config';
import { ACDCRow } from './ACDCRow';
import type { KeritsDSL, RegistryDSL } from '@/../src/app/dsl/types';
import type { IndexedACDC } from '@/../src/app/indexer/types';

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
  const [subRegistryName, setSubRegistryName] = useState('');
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [selectedHolder, setSelectedHolder] = useState('');
  const [credentialAlias, setCredentialAlias] = useState('');
  const [credentialData, setCredentialData] = useState('{}');

  // Load registry data
  useEffect(() => {
    async function loadRegistry() {
      if (!dsl) return;

      try {
        setLoading(true);

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

        // Load available schemas
        const schemaAliases = await dsl.listSchemas();
        const schemas = schemaAliases.map(alias => ({
          value: alias,
          label: alias,
        }));
        setAvailableSchemas(schemas);
      } catch (error) {
        console.error('Failed to load registry:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRegistry();
  }, [dsl, accountAlias, registryId]);

  const handleCreateSubRegistry = async () => {
    if (!subRegistryName.trim() || !registryDsl) return;

    try {
      // Create nested registry
      await registryDsl.createRegistry(subRegistryName.trim());

      // Close dialog and notify parent
      setShowAddSubRegistryDialog(false);
      setSubRegistryName('');

      if (onRegistryCreated) {
        onRegistryCreated();
      }
    } catch (error) {
      console.error('Failed to create sub-registry:', error);
    }
  };

  const handleIssueCredential = async () => {
    if (!selectedSchema || !selectedHolder || !credentialAlias.trim() || !registryDsl) return;

    try {
      // Parse credential data
      const data = JSON.parse(credentialData);

      // Issue credential
      await registryDsl.issue({
        schema: selectedSchema,
        holder: selectedHolder,
        data,
        alias: credentialAlias.trim(),
      });

      // Close dialog and reload ACDCs
      setShowIssueDialog(false);
      setSelectedSchema('');
      setSelectedHolder('');
      setCredentialAlias('');
      setCredentialData('{}');

      // Reload registry data
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
    } catch (error) {
      console.error('Failed to issue credential:', error);
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

  const handleCreateSchema = () => {
    // Navigate to schema creation with return URL
    navigate(
      route(`/dashboard/schemas/new?returnTo=/dashboard/explorer/${accountAlias}/${registryId}`)
    );
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
        <div>
          <h2 className="text-2xl font-bold">{registryDsl.registry.alias}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Registry ID: {registryDsl.registry.registryId.substring(0, 24)}...
          </p>
          {registryDsl.registry.parentRegistryId && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Nested registry (parent: {registryDsl.registry.parentRegistryId.substring(0, 24)}...)
            </p>
          )}
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
          <Button variant="outline" size="sm" onClick={() => setShowAddSubRegistryDialog(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Sub-Registry
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
                          Issued: {new Date(acdc.issuedAt).toLocaleDateString()}
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
      <Dialog open={showAddSubRegistryDialog} onOpenChange={setShowAddSubRegistryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Nested Registry</DialogTitle>
            <DialogDescription>
              Create a sub-registry under "{registryDsl.registry.alias}". This will be anchored in the parent registry's TEL.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subRegistryName">Registry Name</Label>
              <Input
                id="subRegistryName"
                value={subRegistryName}
                onChange={(e) => setSubRegistryName(e.target.value)}
                placeholder="e.g., Public, Internal, Archived"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subRegistryName.trim()) {
                    handleCreateSubRegistry();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubRegistryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubRegistry} disabled={!subRegistryName.trim()}>
              Create Sub-Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Credential Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Credential</DialogTitle>
            <DialogDescription>
              Issue a new ACDC in the "{registryDsl.registry.alias}" registry
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="credentialAlias">Credential Alias</Label>
              <Input
                id="credentialAlias"
                value={credentialAlias}
                onChange={(e) => setCredentialAlias(e.target.value)}
                placeholder="e.g., employee-badge-001"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Schema</Label>
                {availableSchemas.length === 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={handleCreateSchema}
                  >
                    Create Schema
                  </Button>
                )}
              </div>
              <Combobox
                options={availableSchemas}
                value={selectedSchema}
                onChange={setSelectedSchema}
                placeholder="Select schema..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="holder">Holder AID</Label>
              <Input
                id="holder"
                value={selectedHolder}
                onChange={(e) => setSelectedHolder(e.target.value)}
                placeholder="AID of credential holder"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credentialData">Credential Data (JSON)</Label>
              <textarea
                id="credentialData"
                value={credentialData}
                onChange={(e) => setCredentialData(e.target.value)}
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder='{"name": "John Doe", "role": "Engineer"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueCredential}
              disabled={!selectedSchema || !selectedHolder || !credentialAlias.trim()}
            >
              Issue Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
