import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ArrowLeft, Upload, FileJson, Users } from 'lucide-react';
import { credential, registryIncept, issue } from '@/lib/keri';
import { saveCredential } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import type { StoredCredential, StoredSchema, StoredIdentity, SchemaField } from '@/lib/storage';

export function CredentialIssuer() {
  const navigate = useNavigate();
  const { identities, schemas, refreshCredentials } = useStore();

  const [issuerAlias, setIssuerAlias] = useState('');
  const [recipientType, setRecipientType] = useState<'existing' | 'external'>('existing');
  const [recipientAlias, setRecipientAlias] = useState('');
  const [externalRecipient, setExternalRecipient] = useState('');
  const [schemaType, setSchemaType] = useState<'existing' | 'external'>('existing');
  const [schemaId, setSchemaId] = useState('');
  const [externalSchema, setExternalSchema] = useState('');
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [issuing, setIssuing] = useState(false);
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);

  // Get selected schema
  const selectedSchema: StoredSchema | null = schemaType === 'existing'
    ? schemas.find(s => s.id === schemaId) || null
    : null;

  // Get parsed external schema
  const parsedExternalSchema: StoredSchema | null = (() => {
    if (schemaType === 'external' && externalSchema) {
      try {
        const parsed = JSON.parse(externalSchema);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  })();

  const activeSchema = selectedSchema || parsedExternalSchema;

  // Initialize credential data when schema changes
  useEffect(() => {
    if (activeSchema) {
      const initialData: Record<string, any> = {};
      activeSchema.fields.forEach(field => {
        initialData[field.name] = '';
      });
      setCredentialData(initialData);
    }
  }, [activeSchema]);

  const handleIssue = async () => {
    if (!issuerAlias || !activeSchema) {
      alert('Please select issuer and schema');
      return;
    }

    const issuer = identities.find(i => i.alias === issuerAlias);
    if (!issuer) {
      alert('Issuer not found');
      return;
    }

    // Validate required fields
    const missingFields = activeSchema.fields
      .filter(f => f.required && !credentialData[f.name])
      .map(f => f.name);

    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIssuing(true);
    try {
      // Get recipient AID
      let recipientAid: string | undefined;
      let recipientAliasValue: string | undefined;

      if (recipientType === 'existing' && recipientAlias) {
        const recipient = identities.find(i => i.alias === recipientAlias);
        if (recipient) {
          recipientAid = recipient.prefix;
          recipientAliasValue = recipient.alias;
        }
      } else if (recipientType === 'external' && externalRecipient) {
        try {
          const parsed = JSON.parse(externalRecipient);
          // Try to extract AID from KEL
          if (parsed.prefix) {
            recipientAid = parsed.prefix;
          } else if (parsed.inceptionEvent?.pre) {
            recipientAid = parsed.inceptionEvent.pre;
          } else if (Array.isArray(parsed) && parsed[0]?.pre) {
            recipientAid = parsed[0].pre;
          }
        } catch {
          recipientAid = externalRecipient.trim();
        }
      }

      console.log('Creating credential with data:', credentialData);

      // Create credential
      const cred = credential({
        schema: activeSchema.id,
        issuer: issuer.prefix,
        recipient: recipientAid,
        data: credentialData,
      });

      console.log('Credential created:', cred.said);

      // Create registry for this credential
      const registry = registryIncept({
        issuer: issuer.prefix,
      });

      console.log('Registry created:', registry.regk);

      // Issue credential (create TEL issuance event)
      const issuance = issue({
        vcdig: cred.said,
        regk: registry.regk,
      });

      console.log('Issuance event created:', issuance.said);

      // Save credential with TEL
      const storedCredential: StoredCredential = {
        id: cred.said,
        name: activeSchema.name,
        issuer: issuer.prefix,
        issuerAlias: issuer.alias,
        recipient: recipientAid,
        recipientAlias: recipientAliasValue,
        schema: activeSchema.id,
        schemaName: activeSchema.name,
        sad: cred.sad,
        tel: [registry.sad, issuance.sad],
        registry: registry.regk,
        createdAt: new Date().toISOString(),
      };

      console.log('Saving credential to IndexedDB:', storedCredential);
      await saveCredential(storedCredential);
      console.log('Credential saved successfully');

      await refreshCredentials();
      console.log('Credentials refreshed, navigating to /credentials');
      navigate('/credentials');
    } catch (error) {
      console.error('Failed to issue credential:', error);
      alert('Failed to issue credential. See console for details.');
    } finally {
      setIssuing(false);
    }
  };

  const handlePasteSchema = () => {
    setShowSchemaDialog(true);
  };

  const handleSchemaDialogConfirm = () => {
    setSchemaType('external');
    setShowSchemaDialog(false);
  };

  const handlePasteRecipient = () => {
    setShowRecipientDialog(true);
  };

  const handleRecipientDialogConfirm = () => {
    setRecipientType('external');
    setShowRecipientDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/credentials')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue New Credential</CardTitle>
          <CardDescription>
            Create and issue a verifiable credential to a recipient
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Issuer Selection */}
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer (Your Identity) *</Label>
            <Select
              id="issuer"
              value={issuerAlias}
              onChange={(e) => setIssuerAlias(e.target.value)}
            >
              <option value="">Select issuer...</option>
              {identities.map(identity => (
                <option key={identity.alias} value={identity.alias}>
                  {identity.alias} ({identity.prefix.substring(0, 20)}...)
                </option>
              ))}
            </Select>
          </div>

          {/* Schema Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schema *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteSchema}
              >
                <Upload className="h-4 w-4 mr-2" />
                Paste External Schema
              </Button>
            </div>

            {schemaType === 'existing' ? (
              <Select
                value={schemaId}
                onChange={(e) => setSchemaId(e.target.value)}
              >
                <option value="">Select schema...</option>
                {schemas.map(schema => (
                  <option key={schema.id} value={schema.id}>
                    {schema.name} ({schema.fields.length} fields)
                  </option>
                ))}
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded border text-sm">
                <FileJson className="inline h-4 w-4 mr-2" />
                Using external schema: {parsedExternalSchema?.name || 'Invalid schema'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    setSchemaType('existing');
                    setExternalSchema('');
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Recipient Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recipient (Optional)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteRecipient}
              >
                <Upload className="h-4 w-4 mr-2" />
                Paste External KEL
              </Button>
            </div>

            {recipientType === 'existing' ? (
              <Select
                value={recipientAlias}
                onChange={(e) => setRecipientAlias(e.target.value)}
              >
                <option value="">Select recipient...</option>
                {identities.filter(i => i.alias !== issuerAlias).map(identity => (
                  <option key={identity.alias} value={identity.alias}>
                    {identity.alias} ({identity.prefix.substring(0, 20)}...)
                  </option>
                ))}
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded border text-sm">
                <Users className="inline h-4 w-4 mr-2" />
                Using external recipient AID
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    setRecipientType('existing');
                    setExternalRecipient('');
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Credential Data Fields */}
          {activeSchema && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">Credential Data</Label>
              {activeSchema.fields.map((field: SchemaField) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.name} {field.required && '*'}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({field.type})
                    </span>
                  </Label>
                  {field.type === 'boolean' ? (
                    <Select
                      id={field.name}
                      value={credentialData[field.name]?.toString() || ''}
                      onChange={(e) => setCredentialData({
                        ...credentialData,
                        [field.name]: e.target.value === 'true',
                      })}
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      placeholder={`Enter ${field.name}`}
                      value={credentialData[field.name] || ''}
                      onChange={(e) => setCredentialData({
                        ...credentialData,
                        [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                      })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleIssue} disabled={issuing || !activeSchema} className="flex-1">
              {issuing ? 'Issuing...' : 'Issue Credential'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/credentials')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema Paste Dialog */}
      <Dialog open={showSchemaDialog} onOpenChange={setShowSchemaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste External Schema</DialogTitle>
            <DialogDescription>
              Paste a schema JSON exported from another instance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder='{"id": "...", "name": "...", "fields": [...], ...}'
              value={externalSchema}
              onChange={(e) => setExternalSchema(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleSchemaDialogConfirm} className="flex-1">
                Use Schema
              </Button>
              <Button variant="outline" onClick={() => setShowSchemaDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipient Paste Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste External KEL</DialogTitle>
            <DialogDescription>
              Paste a KEL (Key Event Log) or AID from another user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder='{"prefix": "...", "kel": [...], ...} or just AID string'
              value={externalRecipient}
              onChange={(e) => setExternalRecipient(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleRecipientDialogConfirm} className="flex-1">
                Use Recipient
              </Button>
              <Button variant="outline" onClick={() => setShowRecipientDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
