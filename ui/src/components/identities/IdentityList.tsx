import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import type { StoredIdentity } from '@/lib/storage';
import { deleteIdentity } from '@/lib/storage';
import { formatMnemonic } from '@/lib/mnemonic';

interface IdentityListProps {
  identities: StoredIdentity[];
  onDelete?: () => void;
}

export function IdentityList({ identities, onDelete }: IdentityListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
