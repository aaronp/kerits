import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Toast, useToast } from '../ui/toast';
import { Copy, Check, RefreshCw, ArrowLeft } from 'lucide-react';
import { createMnemonic, deriveSeed, formatMnemonic } from '../../lib/mnemonic';
import { generateKeypairFromSeed, incept, diger } from '../../lib/keri';
import { saveUser, saveIdentity, type User, type StoredIdentity } from '../../lib/storage';
import { useUser } from '../../lib/user-provider';
import { route } from '../../config';

export function UserCreation() {
  const [step, setStep] = useState<'name' | 'identity'>('name');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const { setCurrentUser, refreshUsers } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

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

  const handleCreateUser = async () => {
    if (!name.trim() || !alias.trim() || !mnemonic) return;

    setCreating(true);
    try {
      // Create user profile
      const user: User = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      // Derive seeds from mnemonic
      const currentSeed = deriveSeed(mnemonic, 'current');
      const nextSeed = deriveSeed(mnemonic, 'next');

      // Generate keypairs
      const currentKeypair = await generateKeypairFromSeed(currentSeed, true);
      const nextKeypair = await generateKeypairFromSeed(nextSeed, true);

      // Compute digest of next key
      const nextKeyDigest = diger(nextKeypair.publicKey);

      // Create inception event
      const inceptionEvent = incept({
        keys: [currentKeypair.verfer],
        ndigs: [nextKeyDigest],
      });

      // Save identity
      const identity: StoredIdentity = {
        alias: alias.trim(),
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

      await saveUser(user);
      await saveIdentity(identity, user.id);
      await refreshUsers();
      await setCurrentUser(user);
      navigate(route('/dashboard'));
    } catch (error) {
      console.error('Failed to create user:', error);
      showToast('Failed to create user. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  const handleContinueToIdentity = () => {
    if (!name.trim()) return;
    setAlias(name.trim().toLowerCase().replace(/\s+/g, '-'));
    setStep('identity');
  };

  const handleBack = () => {
    setStep('name');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === 'name' ? (
          <>
            <CardHeader>
              <CardTitle>Create User Profile</CardTitle>
              <CardDescription>Enter your name to get started with KERI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleContinueToIdentity()}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(route('/'))}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinueToIdentity}
                  disabled={!name.trim()}
                  className="flex-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Create Identity</CardTitle>
              <CardDescription>
                Generate a KERI Autonomous Identifier (AID) for {name}
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={creating}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateUser}
                  disabled={!alias || !mnemonic || creating}
                  className="flex-1 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
                {showMnemonic && (
                  <Button variant="outline" onClick={generateNew} disabled={creating}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
