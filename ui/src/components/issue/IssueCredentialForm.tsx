import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Combobox } from '../ui/combobox';
import { Toast, useToast } from '../ui/toast';
import { ArrowLeft, Award, Copy } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import { credential as createCredential, diger } from '@/lib/keri';
import { saveCredential, getIdentities, getContacts } from '@/lib/storage';
import { route } from '@/config';
import type { StoredSchema, StoredCredential, StoredIdentity, Contact } from '@/lib/storage';

export function IssueCredentialForm() {
  const { schemaId } = useParams<{ schemaId: string }>();
  const navigate = useNavigate();
  const { schemas, identities, init } = useStore();
  const { currentUser, users } = useUser();
  const { toast, showToast, hideToast } = useToast();

  const [schema, setSchema] = useState<StoredSchema | null>(null);
  const [recipientAID, setRecipientAID] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [issuing, setIssuing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [issuedCredential, setIssuedCredential] = useState<StoredCredential | null>(null);

  // Load schema
  useEffect(() => {
    const foundSchema = schemas.find(s => s.id === schemaId);
    if (foundSchema) {
      setSchema(foundSchema);
      // Initialize form data with empty strings
      const initialData: Record<string, string> = {};
      foundSchema.fields?.forEach(field => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
    }
  }, [schemaId, schemas]);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const loadedContacts = await getContacts();
        setContacts(loadedContacts);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      }
    };

    loadContacts();
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyCredential = async () => {
    if (!issuedCredential) return;

    const exportData = {
      id: issuedCredential.id,
      name: issuedCredential.name,
      issuer: issuedCredential.issuer,
      issuerAlias: issuedCredential.issuerAlias,
      recipient: issuedCredential.recipient,
      recipientAlias: issuedCredential.recipientAlias,
      schema: issuedCredential.schema,
      schemaName: issuedCredential.schemaName,
      sad: issuedCredential.sad,
      tel: issuedCredential.tel,
      registry: issuedCredential.registry,
      createdAt: issuedCredential.createdAt,
    };

    const json = JSON.stringify(exportData, null, 2);
    await navigator.clipboard.writeText(json);
    showToast('Credential copied to clipboard');
  };

  const handleIssue = async () => {
    if (!schema) return;

    // Validate recipient AID
    if (!recipientAID || recipientAID.trim() === '') {
      showToast('Please select or enter a recipient AID');
      return;
    }

    // Get issuer identity
    const issuerIdentity = identities.find(i => i.alias.toLowerCase() === currentUser?.name.toLowerCase());
    if (!issuerIdentity) {
      showToast('No identity found for current user');
      return;
    }

    // Validate required fields
    const requiredFields = schema.fields?.filter(f => f.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.name] || formData[field.name].trim() === '') {
        showToast(`Field "${field.name}" is required`);
        return;
      }
    }

    setIssuing(true);
    try {
      // Create credential
      const credentialData: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        // Convert to appropriate type based on schema
        const field = schema.fields?.find(f => f.name === key);
        if (field?.type === 'number') {
          credentialData[key] = Number(value);
        } else if (field?.type === 'boolean') {
          credentialData[key] = value.toLowerCase() === 'true';
        } else {
          credentialData[key] = value;
        }
      });

      const cred = createCredential({
        schema: schema.id,
        issuer: issuerIdentity.prefix,
        recipient: recipientAID,
        data: credentialData,
      });

      // Find recipient alias from contacts
      const recipientContact = contacts.find(c => c.prefix === recipientAID);

      // Save credential
      const storedCredential: StoredCredential = {
        id: cred.said,
        name: schema.name,
        issuer: issuerIdentity.prefix,
        issuerAlias: issuerIdentity.alias,
        recipient: recipientAID,
        recipientAlias: recipientContact?.name,
        schema: schema.id,
        schemaName: schema.name,
        sad: cred.sad,
        tel: [],
        createdAt: new Date().toISOString(),
      };

      await saveCredential(storedCredential);
      await init(); // Refresh store

      setIssuedCredential(storedCredential);
      showToast('Credential issued successfully');
    } catch (error) {
      console.error('Failed to issue credential:', error);
      showToast('Failed to issue credential. See console for details.');
    } finally {
      setIssuing(false);
    }
  };

  if (!schema) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Schema not found</p>
          <Button
            variant="outline"
            onClick={() => navigate(route('/dashboard/issue'))}
            className="mt-4"
          >
            Back to Schema List
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show success state if credential was issued
  if (issuedCredential) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Award className="h-5 w-5" />
              Credential Issued Successfully!
            </CardTitle>
            <CardDescription>
              The credential has been created and saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold">Credential ID</div>
              <div className="text-xs font-mono bg-muted p-3 rounded break-all">
                {issuedCredential.id}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold">Recipient</div>
              <div className="text-sm text-muted-foreground">
                {issuedCredential.recipientAlias || issuedCredential.recipient}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCopyCredential} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Credential
              </Button>
              <Button onClick={() => navigate(route('/dashboard/credentials'))}>
                View Credentials
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIssuedCredential(null);
                  setFormData({});
                  setRecipientAID('');
                }}
              >
                Issue Another
              </Button>
            </div>
          </CardContent>
        </Card>
        <Toast message={toast.message} show={toast.show} onClose={hideToast} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Issue Credential: {schema.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {schema.description || 'Fill in the credential details'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(route('/dashboard/issue'))}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recipient</CardTitle>
          <CardDescription>Select a contact or enter a custom AID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="recipient">Recipient AID</Label>
          <Combobox
            options={[
              // Add current user identity first
              ...(identities.find(i => i.alias.toLowerCase() === currentUser?.name.toLowerCase())
                ? [{
                    value: identities.find(i => i.alias.toLowerCase() === currentUser?.name.toLowerCase())!.prefix,
                    label: currentUser?.name + ' (me)',
                    description: identities.find(i => i.alias.toLowerCase() === currentUser?.name.toLowerCase())!.prefix.substring(0, 40) + '...',
                  }]
                : []),
              // Then add contacts
              ...contacts.map((contact) => ({
                value: contact.prefix,
                label: contact.name,
                description: contact.prefix.substring(0, 40) + '...',
              }))
            ]}
            value={recipientAID}
            onChange={setRecipientAID}
            placeholder="Select contact or enter AID..."
            emptyMessage={contacts.length === 0 ? "No contacts found. Enter AID manually." : "No matching contacts."}
            allowCustomValue={true}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Start typing to filter contacts or enter a custom AID directly
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credential Data</CardTitle>
          {schema.description && (
            <CardDescription>{schema.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {schema.fields?.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.name}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.name}
                type={
                  field.type === 'number' ? 'number' :
                  field.type === 'date' ? 'date' :
                  field.type === 'email' ? 'email' :
                  field.type === 'url' ? 'url' :
                  'text'
                }
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.description || `Enter ${field.name}...`}
                className={field.type === 'date' ? 'block' : ''}
              />
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleIssue} disabled={issuing} size="lg">
          <Award className="h-4 w-4 mr-2" />
          {issuing ? 'Issuing...' : 'Issue Credential'}
        </Button>
      </div>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
