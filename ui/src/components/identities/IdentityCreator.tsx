import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { createMnemonic, deriveSeed, formatMnemonic } from '@/lib/mnemonic';
import { generateKeypairFromSeed, incept, diger } from '@/lib/keri';
import { saveIdentity } from '@/lib/storage';
import type { StoredIdentity } from '@/lib/storage';

interface IdentityCreatorProps {
  onCreated?: () => void;
}

export function IdentityCreator({ onCreated }: IdentityCreatorProps) {
  const { toast, showToast, hideToast } = useToast();
  const [alias, setAlias] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const generateNew = () => {
    const newMnemonic = createMnemonic();
    setMnemonic(newMnemonic);
    setShowMnemonic(true);
  };

  const copyMnemonic = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createIdentity = async () => {
    if (!alias || !mnemonic) return;

    setCreating(true);
    try {
      // Derive seeds from mnemonic
      const currentSeed = deriveSeed(mnemonic, 'current');
      const nextSeed = deriveSeed(mnemonic, 'next');

      // Generate keypairs
      const currentKeypair = await generateKeypairFromSeed(currentSeed, true);
      const nextKeypair = await generateKeypairFromSeed(nextSeed, true);

      // Compute digest of next key (using raw publicKey bytes)
      const nextKeyDigest = diger(nextKeypair.publicKey);

      // Create inception event (using verfer string)
      const inceptionEvent = incept({
        keys: [currentKeypair.verfer],
        ndigs: [nextKeyDigest],
      });

      // Save identity
      const identity: StoredIdentity = {
        alias,
        prefix: inceptionEvent.pre,
        mnemonic,
        currentKeys: {
          public: currentKeypair.verfer,
          private: Buffer.from(currentKeypair.privateKey).toString('hex'),
          seed: Buffer.from(currentSeed).toString('hex'),
        },
        nextKeys: {
          public: nextKeypair.verfer,
          private: Buffer.from(nextKeypair.privateKey).toString('hex'),
          seed: Buffer.from(nextSeed).toString('hex'),
        },
        inceptionEvent,
        kel: [inceptionEvent],
        createdAt: new Date().toISOString(),
      };

      await saveIdentity(identity);

      // Reset form
      setAlias('');
      setMnemonic('');
      setShowMnemonic(false);

      if (onCreated) onCreated();
    } catch (error) {
      console.error('Failed to create identity:', error);
      showToast('Failed to create identity. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Identity</CardTitle>
        <CardDescription>
          Generate a KERI Autonomous Identifier (AID) with mnemonic key backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alias Input */}
        <div className="space-y-2">
          <Label htmlFor="alias">Identity Alias</Label>
          <Input
            id="alias"
            placeholder="alice"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </div>

        {/* Mnemonic Section */}
        {!showMnemonic ? (
          <Button onClick={generateNew} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Mnemonic
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recovery Phrase (24 words)</Label>
              <Button variant="ghost" size="sm" onClick={copyMnemonic}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={formatMnemonic(mnemonic)}
              readOnly
              className="font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Save this recovery phrase securely. You'll need it to restore your identity.
            </p>
          </div>
        )}

        {/* Create Button */}
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={createIdentity}
            disabled={!alias || !mnemonic || creating}
            className="flex-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {creating ? 'Creating...' : 'Create Identity'}
          </Button>
          {showMnemonic && (
            <Button variant="outline" onClick={generateNew}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </Card>
  );
}
