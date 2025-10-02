import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { ChevronDown, ChevronRight, Copy, Download, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { deleteCredential, saveCredential } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import type { StoredCredential } from '@/lib/storage';

interface CredentialListProps {
  credentials: StoredCredential[];
  onDelete: () => void;
  onImport: () => void;
}

export function CredentialList({ credentials, onDelete, onImport }: CredentialListProps) {
  const { identities } = useStore();
  const { toast, showToast, hideToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [importRecipientAlias, setImportRecipientAlias] = useState('');
  const [importing, setImporting] = useState(false);

  const handleCopy = async (text: string, itemName: string = 'Text') => {
    await navigator.clipboard.writeText(text);
    showToast(`${itemName} copied to clipboard`);
  };

  const handleExport = (credential: StoredCredential) => {
    const exportData = {
      id: credential.id,
      name: credential.name,
      issuer: credential.issuer,
      issuerAlias: credential.issuerAlias,
      recipient: credential.recipient,
      recipientAlias: credential.recipientAlias,
      schema: credential.schema,
      schemaName: credential.schemaName,
      sad: credential.sad,
      tel: credential.tel,
      registry: credential.registry,
      createdAt: credential.createdAt,
    };

    const json = JSON.stringify(exportData, null, 2);
    handleCopy(json, 'Credential');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      await deleteCredential(id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please paste credential data');
      return;
    }

    if (!importRecipientAlias) {
      alert('Please select which identity is receiving this credential');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(importData);

      // Find the selected recipient identity
      const recipientIdentity = identities.find(i => i.alias === importRecipientAlias);
      if (!recipientIdentity) {
        throw new Error('Selected identity not found');
      }

      let importedCredential: StoredCredential;

      // Check if this is the full export format (StoredCredential) or raw ACDC SAD
      if (parsed.id && parsed.sad) {
        // Full export format - StoredCredential structure
        console.log('Importing from full credential export format');
        importedCredential = {
          id: parsed.id,
          name: parsed.name || 'Imported Credential',
          issuer: parsed.issuer,
          issuerAlias: parsed.issuerAlias,
          recipient: recipientIdentity.prefix,
          recipientAlias: recipientIdentity.alias,
          schema: parsed.schema,
          schemaName: parsed.schemaName,
          sad: parsed.sad,
          tel: parsed.tel || [],
          registry: parsed.registry,
          createdAt: parsed.createdAt || new Date().toISOString(),
        };
      } else if (parsed.v && parsed.d && parsed.i && parsed.s) {
        // Raw ACDC SAD format (v, d, i, s, a fields)
        console.log('Importing from raw ACDC SAD format');
        importedCredential = {
          id: parsed.d, // SAID is the credential ID
          name: 'Imported Credential',
          issuer: parsed.i, // Issuer AID
          issuerAlias: undefined,
          recipient: recipientIdentity.prefix,
          recipientAlias: recipientIdentity.alias,
          schema: parsed.s, // Schema SAID
          schemaName: undefined,
          sad: parsed, // The entire object is the SAD
          tel: [], // No TEL data in raw format
          registry: undefined,
          createdAt: new Date().toISOString(),
        };
      } else {
        throw new Error('Invalid credential format. Expected either full export or ACDC SAD structure.');
      }

      await saveCredential(importedCredential);
      console.log('Credential imported successfully:', importedCredential.id);
      console.log('Imported to recipient:', recipientIdentity.alias, recipientIdentity.prefix);

      setImportData('');
      setImportRecipientAlias('');
      setShowImportDialog(false);
      onImport();
    } catch (error) {
      console.error('Failed to import credential:', error);
      alert(`Failed to import credential: ${error instanceof Error ? error.message : 'Please check the format.'}`);
    } finally {
      setImporting(false);
    }
  };

  if (credentials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No credentials yet</p>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Credential
            </Button>
          </div>
        </CardContent>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Credential</DialogTitle>
              <DialogDescription>
                Paste a credential - supports full export format or raw ACDC SAD
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-recipient">Import to Identity *</Label>
                <Select
                  id="import-recipient"
                  value={importRecipientAlias}
                  onChange={(e) => setImportRecipientAlias(e.target.value)}
                >
                  <option value="">Select identity...</option>
                  {identities.map(identity => (
                    <option key={identity.alias} value={identity.alias}>
                      {identity.alias} ({identity.prefix.substring(0, 20)}...)
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select which of your identities is receiving this credential
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-data">Credential JSON</Label>
                <Textarea
                  id="import-data"
                  placeholder='{"id": "...", "sad": {...}, "tel": [...], ...}'
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={importing} className="flex-1">
                  {importing ? 'Importing...' : 'Import Credential'}
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import Credential
        </Button>
      </div>

      {credentials.map((credential) => {
        const isExpanded = expandedId === credential.id;

        return (
          <Card key={credential.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : credential.id)}
                      className="p-0 h-auto"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{credential.name}</CardTitle>
                      <CardDescription className="mt-1">
                        SAID: {credential.id.substring(0, 30)}...
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(credential)}
                    title="Export credential (copies to clipboard)"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(credential.id)}
                    title="Delete credential"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4 pt-0">
                {/* Issuer Info */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Issuer</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-2 rounded flex-1 overflow-hidden text-ellipsis">
                      {credential.issuerAlias ? `${credential.issuerAlias} (${credential.issuer})` : credential.issuer}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(credential.issuer, 'Issuer AID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Recipient Info */}
                {credential.recipient && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Recipient</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded flex-1 overflow-hidden text-ellipsis">
                        {credential.recipientAlias ? `${credential.recipientAlias} (${credential.recipient})` : credential.recipient}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(credential.recipient!, 'Recipient AID')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Schema Info */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Schema</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-2 rounded flex-1 overflow-hidden text-ellipsis">
                      {credential.schemaName ? `${credential.schemaName} (${credential.schema})` : credential.schema}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(credential.schema, 'Schema SAID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Credential Data */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Credential Data</div>
                  <div className="bg-muted p-3 rounded space-y-2">
                    {Object.entries(credential.sad.a || {}).map(([key, value]) => {
                      if (key === 'd' || key === 'dt' || key === 'i') return null;
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TEL Status */}
                {credential.tel && credential.tel.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Status</div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Issued ({credential.tel.length} TEL events)</span>
                    </div>
                  </div>
                )}

                {/* Full Credential JSON */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Full Credential (SAD)</div>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                      {JSON.stringify(credential.sad, null, 2)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(JSON.stringify(credential.sad, null, 2), 'Credential SAD')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Created Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Created: {new Date(credential.createdAt).toLocaleString()}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Credential</DialogTitle>
            <DialogDescription>
              Paste a credential - supports full export format or raw ACDC SAD
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-recipient-main">Import to Identity *</Label>
              <Select
                id="import-recipient-main"
                value={importRecipientAlias}
                onChange={(e) => setImportRecipientAlias(e.target.value)}
              >
                <option value="">Select identity...</option>
                {identities.map(identity => (
                  <option key={identity.alias} value={identity.alias}>
                    {identity.alias} ({identity.prefix.substring(0, 20)}...)
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which of your identities is receiving this credential
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-data-main">Credential JSON</Label>
              <Textarea
                id="import-data-main"
                placeholder='{"id": "...", "sad": {...}, "tel": [...], ...}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing} className="flex-1">
                {importing ? 'Importing...' : 'Import Credential'}
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
