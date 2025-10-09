import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { ChevronDown, ChevronRight, Copy, Download, Upload, Trash2, CheckCircle2, ShieldCheck, Pencil } from 'lucide-react';
import { deleteCredential, saveCredential } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import { getDSL } from '@/lib/dsl';
import { credential as verifyCredential, issue } from '@/lib/keri';
import { CredentialSignModal } from './CredentialSignModal';
import { TELSelector } from './TELSelector';
import type { StoredCredential } from '@/lib/storage';

interface CredentialListProps {
  credentials: StoredCredential[];
  onDelete: () => void;
  onImport: () => void;
}

export function CredentialList({ credentials, onDelete, onImport }: CredentialListProps) {
  const { identities, triggerTELRefresh } = useStore();
  const { users, currentUser } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [selectedRegistryAID, setSelectedRegistryAID] = useState('');
  const [importing, setImporting] = useState(false);
  const [aidToUserName, setAidToUserName] = useState<Map<string, string>>(new Map());
  const [signModalCredential, setSignModalCredential] = useState<StoredCredential | null>(null);

  // Build AID to user name mapping from global database
  useEffect(() => {
    const buildAidMapping = async () => {
      const mapping = new Map<string, string>();

      for (const user of users) {
        try {
          const dsl = await getDSL(user.id);
          const accountNames = await dsl.accountNames();

          for (const alias of accountNames) {
            const account = await dsl.getAccount(alias);
            if (account) {
              mapping.set(account.aid, user.name);
            }
          }
        } catch (error) {
          console.error(`Failed to load identities for user ${user.name}:`, error);
        }
      }

      setAidToUserName(mapping);
    };

    if (users.length > 0) {
      buildAidMapping();
    }
  }, [users]);

  const handleCopy = async (text: string, itemName: string = 'Text') => {
    await navigator.clipboard.writeText(text);
    showToast(`${itemName} copied to clipboard`);
  };

  const handleVerify = (credential: StoredCredential) => {
    try {
      // Recreate the credential from the stored SAD
      const sad = credential.sad;

      // Extract the attributes from the SAD
      const data = sad.a || {};

      // Verify by recreating the credential and comparing SAIDs
      const recreated = verifyCredential({
        schema: credential.schema,
        issuer: credential.issuer,
        recipient: credential.recipient,
        data: data,
      });

      if (recreated.said === credential.id) {
        showToast('✓ Credential verified successfully');
      } else {
        showToast('✗ Credential verification failed: SAID mismatch');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast('✗ Credential verification failed');
    }
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
      showToast('Failed to delete credential');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      showToast('Please paste credential data');
      return;
    }

    if (!selectedRegistryAID || selectedRegistryAID === '__CREATE_NEW__') {
      showToast('Please select a credential registry');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(importData);

      // Use current user's identity as recipient
      const recipientIdentity = identities.find(i => i.alias.toLowerCase() === users.find(u => u.id === currentUser?.id)?.name.toLowerCase());
      if (!recipientIdentity) {
        throw new Error('Current user identity not found');
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
          registry: selectedRegistryAID,
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
          registry: selectedRegistryAID,
          createdAt: new Date().toISOString(),
        };
      } else {
        throw new Error('Invalid credential format. Expected either full export or ACDC SAD structure.');
      }

      // Note: For DSL-based import, we should use registry.accept() method
      // For now, still using old storage for compatibility
      // TODO: Migrate to DSL's registry.accept() method

      // Save the credential (old storage)
      await saveCredential(importedCredential);

      console.log('Credential imported successfully:', importedCredential.id);
      console.log('Imported to recipient:', recipientIdentity.alias, recipientIdentity.prefix);
      console.log('Assigned to registry:', selectedRegistryAID);
      console.log('Issuance event appended to TEL');

      setImportData('');
      setSelectedRegistryAID('');
      setShowImportDialog(false);

      // Trigger TEL refresh for NetworkGraph
      triggerTELRefresh();
      onImport();
    } catch (error) {
      console.error('Failed to import credential:', error);
      showToast(`Failed to import credential: ${error instanceof Error ? error.message : 'Please check the format.'}`);
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
                <Label htmlFor="registry-selector">Credential Registry</Label>
                <TELSelector
                  value={selectedRegistryAID}
                  onChange={(aid) => setSelectedRegistryAID(aid)}
                />
                <p className="text-xs text-muted-foreground">
                  Select or create a registry to store credential events
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
                <p className="text-xs text-muted-foreground">
                  Credential will be imported to your current identity
                </p>
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

  // Group credentials by recipient
  const groupedCredentials = credentials.reduce((groups, credential) => {
    const key = credential.recipient || 'No Recipient';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(credential);
    return groups;
  }, {} as Record<string, StoredCredential[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedCredentials).map(([recipientAid, creds]) => {
        const recipientAlias = creds[0]?.recipientAlias;


        return (
          <div key={recipientAid} className="space-y-3">

            {creds.map((credential) => {
              const isExpanded = expandedId === credential.id;

              // Format: "from -> to : schema name"
              // Try to resolve AIDs to user names from global database
              const issuerUserName = aidToUserName.get(credential.issuer);
              const recipientUserName = credential.recipient ? aidToUserName.get(credential.recipient) : undefined;

              const issuerLabel = credential.issuerAlias || issuerUserName || credential.issuer.substring(0, 8) + '...';
              const recipientLabel = credential.recipientAlias || recipientUserName || (credential.recipient ? credential.recipient.substring(0, 8) + '...' : 'None');
              const schemaLabel = credential.schemaName || 'Schema';
              const summary = `${issuerLabel} → ${recipientLabel} : ${schemaLabel}`;

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
                            className="p-0 h-auto cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 cursor-pointer" />
                            ) : (
                              <ChevronRight className="h-4 w-4 cursor-pointer" />
                            )}
                          </Button>
                          <div>
                            <CardTitle className="text-lg">{summary}</CardTitle>
                            <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                              <div className="font-mono text-xs">
                                {credential.id.substring(0, 44)}...
                              </div>
                              <div className="text-xs">
                                {new Date(credential.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSignModalCredential(credential)}
                          title="Sign credential"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(credential)}
                          title="Verify credential"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
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
          </div>
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
              <Label htmlFor="registry-selector-main">Credential Registry</Label>
              <TELSelector
                value={selectedRegistryAID}
                onChange={(aid) => setSelectedRegistryAID(aid)}
              />
              <p className="text-xs text-muted-foreground">
                Select or create a registry to store credential events
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
              <p className="text-xs text-muted-foreground">
                Credential will be imported to your current identity
              </p>
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

      {/* Sign Modal */}
      <CredentialSignModal
        credential={signModalCredential}
        isOpen={!!signModalCredential}
        onClose={() => setSignModalCredential(null)}
      />

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
