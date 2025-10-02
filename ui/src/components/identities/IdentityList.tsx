import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Toast, useToast } from '../ui/toast';
import { Copy, Check, Trash2, Eye, EyeOff, RotateCw } from 'lucide-react';
import type { StoredIdentity } from '@/lib/storage';
import { deleteIdentity, saveIdentity } from '@/lib/storage';
import { formatMnemonic, deriveSeed } from '@/lib/mnemonic';
import { generateKeypairFromSeed, rotate, diger } from '@/lib/keri';

interface IdentityListProps {
  identities: StoredIdentity[];
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function IdentityList({ identities, onDelete, onUpdate }: IdentityListProps) {
  const { toast, showToast, hideToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState<Record<string, boolean>>({});
  const [rotating, setRotating] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, field: string, itemName?: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    if (itemName) {
      showToast(`${itemName} copied to clipboard`);
    }
  };

  const handleDelete = async (alias: string) => {
    if (confirm(`Are you sure you want to delete identity "${alias}"?`)) {
      await deleteIdentity(alias);
      if (onDelete) onDelete();
    }
  };

  const toggleMnemonic = (alias: string) => {
    setShowMnemonic(prev => ({ ...prev, [alias]: !prev[alias] }));
  };

  const handleRotateKeys = async (identity: StoredIdentity) => {
    if (!confirm(`Rotate keys for "${identity.alias}"? This will create a new rotation event.`)) {
      return;
    }

    setRotating(prev => ({ ...prev, [identity.alias]: true }));
    try {
      // Derive new next keypair from mnemonic with incremented path
      const nextRotationSeed = deriveSeed(identity.mnemonic, `next-${identity.kel.length}`);
      const newNextKeypair = await generateKeypairFromSeed(nextRotationSeed, true);

      // Compute digest of new next key
      const newNextKeyDigest = diger(newNextKeypair.publicKey);

      // Get the prefix from the inception event if not stored directly
      const prefix = identity.prefix || identity.inceptionEvent?.pre || identity.inceptionEvent?.ked?.i;

      if (!prefix) {
        throw new Error('Identity prefix not found. Please delete and recreate this identity.');
      }

      // Get the previous event digest
      const prevEvent = identity.kel[identity.kel.length - 1];
      const prevDigest = prevEvent.said || prevEvent.d || prevEvent.ked?.d;

      if (!prevDigest) {
        throw new Error('Previous event digest not found');
      }

      // Current "next" keys become "current" keys
      const rotationEvent = rotate({
        pre: prefix,
        keys: [identity.nextKeys.public],
        ndigs: [newNextKeyDigest],
        sn: identity.kel.length,
        dig: prevDigest,
      });

      // Update identity
      const updatedIdentity: StoredIdentity = {
        ...identity,
        prefix: prefix, // Ensure prefix is always set
        currentKeys: identity.nextKeys, // Next becomes current
        nextKeys: {
          public: newNextKeypair.verfer,
          private: Buffer.from(newNextKeypair.privateKey).toString('hex'),
          seed: Buffer.from(nextRotationSeed).toString('hex'),
        },
        kel: [...identity.kel, rotationEvent],
      };

      await saveIdentity(updatedIdentity);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      alert('Failed to rotate keys. See console for details.');
    } finally {
      setRotating(prev => ({ ...prev, [identity.alias]: false }));
    }
  };

  if (identities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No identities yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {identities.map((identity) => (
        <Card key={identity.alias}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{identity.alias}</CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  {identity.prefix}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === identity.alias ? null : identity.alias)}
                >
                  {expandedId === identity.alias ? 'Hide' : 'Details'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRotateKeys(identity)}
                  disabled={rotating[identity.alias]}
                  title="Rotate Keys"
                >
                  <RotateCw className={`h-4 w-4 ${rotating[identity.alias] ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(identity.alias)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedId === identity.alias && (
            <CardContent className="space-y-4 pt-0">
              {/* Mnemonic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Recovery Phrase</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMnemonic(identity.alias)}
                    >
                      {showMnemonic[identity.alias] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {showMnemonic[identity.alias] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(identity.mnemonic, `mnemonic-${identity.alias}`)}
                      >
                        {copiedField === `mnemonic-${identity.alias}` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {showMnemonic[identity.alias] && (
                  <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {formatMnemonic(identity.mnemonic)}
                  </pre>
                )}
              </div>

              {/* Current Public Key */}
              <CopyField
                label="Current Public Key"
                value={identity.currentKeys.public}
                fieldId={`current-${identity.alias}`}
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />

              {/* Next Public Key */}
              <CopyField
                label="Next Public Key"
                value={identity.nextKeys.public}
                fieldId={`next-${identity.alias}`}
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />

              {/* KEL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Key Event Log ({identity.kel.length} events)</Label>
                <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-x-auto max-h-48">
                  {JSON.stringify(identity.kel, null, 2)}
                </pre>
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(JSON.stringify(identity, null, 2), `export-${identity.alias}`)}
              >
                {copiedField === `export-${identity.alias}` ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Export Identity (JSON)
                  </>
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      ))}
      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

interface CopyFieldProps {
  label: string;
  value: string;
  fieldId: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

function CopyField({ label, value, fieldId, copiedField, onCopy }: CopyFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button variant="ghost" size="sm" onClick={() => onCopy(value, fieldId)}>
          {copiedField === fieldId ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-x-auto">
        {value}
      </pre>
    </div>
  );
}
