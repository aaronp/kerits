import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Toast, useToast } from '../ui/toast';
import { ArrowLeft, Upload, FileJson, Users } from 'lucide-react';
import { credential, registryIncept, issue } from '@/lib/keri';
import { saveCredential, getIdentities } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import type { StoredCredential, StoredSchema, StoredIdentity, SchemaField } from '@/lib/storage';
import { route } from '@/config';
import { useUser } from '@/lib/user-provider';

interface UserIdentity extends StoredIdentity {
  userId: string;
  userName: string;
}

export function CredentialIssuer() {
  const navigate = useNavigate();
  const { currentUser, users } = useUser();
  const { identities, schemas, refreshCredentials } = useStore();
  const { toast, showToast, hideToast } = useToast();

  // Get current user's identity (first identity for this user)
  const currentUserIdentity = identities.length > 0 ? identities[0] : null;
  const [allUserIdentities, setAllUserIdentities] = useState<UserIdentity[]>([]);
  const [recipientType, setRecipientType] = useState<'existing' | 'external'>('existing');
  const [recipientAlias, setRecipientAlias] = useState('');
  const [externalRecipient, setExternalRecipient] = useState('');
  const [schemaType, setSchemaType] = useState<'existing' | 'external'>('existing');
  const [schemaId, setSchemaId] = useState('');
  const [externalSchema, setExternalSchema] = useState('');
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [issuing, setIssuing] = useState(false);
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);

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

  // Load all users' identities for recipient selection
  useEffect(() => {
    const loadAllIdentities = async () => {
      const allIdentities: UserIdentity[] = [];

      for (const user of users) {
        try {
          const userIdentities = await getIdentities(user.id);
          // Add the first identity for each user (typically their main identity)
          if (userIdentities.length > 0) {
            userIdentities.forEach(identity => {
              allIdentities.push({
                ...identity,
                userId: user.id,
                userName: user.name,
              });
            });
          }
        } catch (error) {
          console.error(`Failed to load identities for user ${user.name}:`, error);
        }
      }

      setAllUserIdentities(allIdentities);
    };

    if (users.length > 0) {
      loadAllIdentities();
    }
  }, [users]);

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
    if (!currentUserIdentity) {
      showToast('No identity found. Please create an identity first.');
      return;
    }

    if (!activeSchema) {
      showToast('Please select a schema');
      return;
    }

    // Validate required fields
    const missingFields = activeSchema.fields
      .filter(f => f.required && !credentialData[f.name])
      .map(f => f.name);

    if (missingFields.length > 0) {
      showToast(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIssuing(true);
    try {
      // Get recipient AID
      let recipientAid: string | undefined;
      let recipientAliasValue: string | undefined;

      if (recipientType === 'existing' && recipientAlias) {
        const recipient = allUserIdentities.find(i => i.alias === recipientAlias);
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

      // Validate recipient is selected
      if (!recipientAid) {
        showToast('Please select a recipient');
        return;
      }

      console.log('Creating credential with data:', credentialData);

      // Create credential
      const cred = credential({
        schema: activeSchema.id,
        issuer: currentUserIdentity.prefix,
        recipient: recipientAid,
        data: credentialData,
      });

      console.log('Credential created:', cred.said);

      // Create registry for this credential
      const registry = registryIncept({
        issuer: currentUserIdentity.prefix,
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
        issuer: currentUserIdentity.prefix,
        issuerAlias: currentUserIdentity.alias,
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
      console.log('Credentials refreshed, navigating to /dashboard/credentials');
      navigate(route('/dashboard/credentials'));
    } catch (error) {
      console.error('Failed to issue credential:', error);
      showToast('Failed to issue credential. See console for details.');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(route('/dashboard/credentials'))}>
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
            <Label>Recipient *</Label>
            <div className="space-y-2">
              <Select
                value={recipientAlias}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '__manual__') {
                    setRecipientType('external');
                    setRecipientAlias('');
                  } else {
                    setRecipientType('existing');
                    setRecipientAlias(value);
                    setExternalRecipient('');
                  }
                }}
              >
                <option value="">Select recipient...</option>
                {allUserIdentities
                  .filter(identity => identity.userId !== currentUser?.id)
                  .map(identity => (
                    <option key={`${identity.userId}-${identity.alias}`} value={identity.alias}>
                      {identity.alias} ({identity.userName}) - {identity.prefix.substring(0, 16)}...
                    </option>
                  ))}
                <option value="__manual__">Manual AID Entry...</option>
              </Select>

              {recipientType === 'external' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter recipient AID or paste KEL/identity JSON"
                    value={externalRecipient}
                    onChange={(e) => setExternalRecipient(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter an AID prefix (e.g., EKS1234...) or paste a full KEL/identity JSON
                  </p>
                </div>
              )}
            </div>
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
            <Button variant="outline" onClick={() => navigate(route('/dashboard/credentials'))}>
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

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
