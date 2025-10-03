import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useUser } from '../lib/user-provider';
import { useStore } from '../store/useStore';
import { UserCircle, RotateCw, Shield, Eye, EyeOff, Key } from 'lucide-react';
import { saveIdentity } from '../lib/storage';
import { deriveSeed, formatMnemonic } from '../lib/mnemonic';
import { generateKeypairFromSeed, rotate, diger } from '../lib/keri';
import type { StoredIdentity } from '../lib/storage';

export function Profile() {
  const { currentUser } = useUser();
  const { identities, init } = useStore();
  const [rotating, setRotating] = useState<Record<string, boolean>>({});
  const [showMnemonic, setShowMnemonic] = useState<Record<string, boolean>>({});

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
      await init(); // Refresh identities
      alert(`Keys rotated successfully for "${identity.alias}"`);
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      alert('Failed to rotate keys. See console for details.');
    } finally {
      setRotating(prev => ({ ...prev, [identity.alias]: false }));
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <UserCircle className="h-8 w-8" />
            User Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <div className="text-lg font-medium">{currentUser.name}</div>
          </div>
          <div className="space-y-2">
            <Label>User ID</Label>
            <div className="text-sm font-mono text-muted-foreground">{currentUser.id}</div>
          </div>
          <div className="space-y-2">
            <Label>Created</Label>
            <div className="text-sm text-muted-foreground">
              {new Date(currentUser.createdAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identities</CardTitle>
          <CardDescription>KERI identities associated with this profile</CardDescription>
        </CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No identities created yet
            </div>
          ) : (
            <div className="space-y-4">
              {identities.map((identity) => (
                <Card key={identity.alias} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{identity.alias}</h3>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {identity.prefix}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(identity.createdAt).toLocaleDateString()}</span>
                          <span>KEL Events: {identity.kel.length}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotateKeys(identity)}
                        disabled={rotating[identity.alias]}
                      >
                        <RotateCw className={`h-4 w-4 mr-2 ${rotating[identity.alias] ? 'animate-spin' : ''}`} />
                        {rotating[identity.alias] ? 'Rotating...' : 'Rotate Keys'}
                      </Button>
                    </div>

                    {/* Keys */}
                    <div className="space-y-3 pt-2 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <Label className="text-sm">Current Public Key</Label>
                        </div>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          {identity.currentKeys.public}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <Label className="text-sm">Next Public Key</Label>
                        </div>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          {identity.nextKeys.public}
                        </div>
                      </div>
                    </div>

                    {/* Mnemonic */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Recovery Phrase (24 words)</Label>
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
                      </div>
                      {showMnemonic[identity.alias] && (
                        <Textarea
                          value={formatMnemonic(identity.mnemonic)}
                          readOnly
                          className="font-mono text-xs resize-none"
                          rows={6}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
