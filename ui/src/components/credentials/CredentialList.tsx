import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { ChevronDown, ChevronRight, Copy, Download, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { deleteCredential, saveCredential } from '@/lib/storage';
import type { StoredCredential } from '@/lib/storage';

interface CredentialListProps {
  credentials: StoredCredential[];
  onDelete: () => void;
  onImport: () => void;
}

export function CredentialList({ credentials, onDelete, onImport }: CredentialListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
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
    handleCopy(json);
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

    setImporting(true);
    try {
      const parsed = JSON.parse(importData);

      // Validate credential structure
      if (!parsed.id || !parsed.sad) {
        throw new Error('Invalid credential format');
      }

      const importedCredential: StoredCredential = {
        id: parsed.id,
        name: parsed.name || 'Imported Credential',
        issuer: parsed.issuer,
        issuerAlias: parsed.issuerAlias,
        recipient: parsed.recipient,
        recipientAlias: parsed.recipientAlias,
        schema: parsed.schema,
        schemaName: parsed.schemaName,
        sad: parsed.sad,
        tel: parsed.tel || [],
        registry: parsed.registry,
        createdAt: parsed.createdAt || new Date().toISOString(),
      };

      await saveCredential(importedCredential);
      console.log('Credential imported successfully:', importedCredential.id);

      setImportData('');
      setShowImportDialog(false);
      onImport();
    } catch (error) {
      console.error('Failed to import credential:', error);
      alert('Failed to import credential. Please check the format.');
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
                Paste a credential JSON exported from another user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder='{"id": "...", "sad": {...}, "tel": [...], ...}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
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
                      onClick={() => handleCopy(credential.issuer)}
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
                        onClick={() => handleCopy(credential.recipient!)}
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
                      onClick={() => handleCopy(credential.schema)}
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
                      onClick={() => handleCopy(JSON.stringify(credential.sad, null, 2))}
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
              Paste a credential JSON exported from another user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder='{"id": "...", "sad": {...}, "tel": [...], ...}'
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
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
    </div>
  );
}
