import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Toast, useToast } from './ui/toast';
import { useUser } from '../lib/user-provider';
import { useStore } from '../store/useStore';
import { UserCircle, RotateCw, Shield, Eye, EyeOff, Key, Copy, Share, Trash2, Palette } from 'lucide-react';
import { saveIdentity, clearAllData } from '../lib/storage';
import { deriveSeed, formatMnemonic } from '../lib/mnemonic';
import { generateKeypairFromSeed, rotate, diger } from '../lib/keri';
import { getDSL } from '../lib/dsl';
import type { StoredIdentity } from '../lib/storage';

export function Profile() {
  const { currentUser } = useUser();
  const { identities, init } = useStore();
  const { toast, showToast, hideToast } = useToast();
  const [rotating, setRotating] = useState<Record<string, boolean>>({});
  const [showMnemonic, setShowMnemonic] = useState<Record<string, boolean>>({});
  const [bannerColor, setBannerColor] = useState<string>('#3b82f6');

  useEffect(() => {
    if (currentUser) {
      const savedColor = localStorage.getItem(`kerits-banner-color-${currentUser.id}`);
      if (savedColor) {
        setBannerColor(savedColor);
      }
    }
  }, [currentUser]);

  const handleColorChange = (color: string) => {
    if (!currentUser) return;

    setBannerColor(color);
    localStorage.setItem(`kerits-banner-color-${currentUser.id}`, color);
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent('kerits-color-changed', { detail: { userId: currentUser.id, color } }));
    showToast('Banner color updated!');
  };

  const toggleMnemonic = (alias: string) => {
    setShowMnemonic(prev => ({ ...prev, [alias]: !prev[alias] }));
  };

  const handleCopyAID = async (aid: string) => {
    await navigator.clipboard.writeText(aid);
    showToast('User\'s AID copied to clipboard');
  };

  const handleShareKEL = async (identity: StoredIdentity) => {
    try {
      const dsl = await getDSL();
      const accountNames = await dsl.listAccounts();

      // Find the account matching this identity's AID
      let accountDsl = null;
      for (const accountName of accountNames) {
        const acc = await dsl.account(accountName);
        if (acc && acc.account.aid === identity.aid) {
          accountDsl = acc;
          break;
        }
      }

      if (accountDsl) {
        // Use DSL to export in CESR format
        const exportDsl = await accountDsl.export();
        const cesr = exportDsl.toCESR();
        const text = new TextDecoder().decode(cesr);
        await navigator.clipboard.writeText(text);
        showToast('KEL copied to clipboard (CESR format)');
      } else {
        // Fallback to JSON if no DSL account found
        const kelString = JSON.stringify(identity.kel, null, 2);
        await navigator.clipboard.writeText(kelString);
        showToast('KEL copied to clipboard (JSON format)');
      }
    } catch (error) {
      console.error('Failed to share KEL:', error);
      showToast(`Failed to share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearData = async () => {
    if (!confirm('WARNING: This will permanently delete ALL local data including identities, credentials, schemas, and contacts. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('Are you absolutely sure? All your data will be lost forever!')) {
      return;
    }

    try {
      await clearAllData();
      // Reload the page to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      showToast('Failed to clear data. See console for details.');
    }
  };

  const handleRotateKeys = async (identity: StoredIdentity) => {
    if (!confirm(`Rotate keys for "${identity.alias}"? This will create a new rotation event.`)) {
      return;
    }

    setRotating(prev => ({ ...prev, [identity.alias]: true }));
    try {
      const dsl = await getDSL();

      // Get or create account in DSL
      let accountDsl = await dsl.account(identity.alias);
      if (!accountDsl) {
        // Migrate old account to DSL
        console.log(`Migrating account "${identity.alias}" to DSL...`);
        await dsl.newAccount(identity.alias, identity.mnemonic);
        accountDsl = await dsl.account(identity.alias);

        if (!accountDsl) {
          throw new Error(`Failed to migrate account: ${identity.alias}`);
        }
      }

      // Generate new mnemonic for rotation
      const nextRotationSeed = deriveSeed(identity.mnemonic, `next-${identity.kel.length}`);
      const newMnemonic = dsl.newMnemonic(nextRotationSeed);

      // Rotate keys using DSL
      await accountDsl.rotateKeys(newMnemonic);

      // Update old storage system to keep in sync
      const newNextKeypair = await generateKeypairFromSeed(nextRotationSeed, true);
      const newNextKeyDigest = diger(newNextKeypair.publicKey);

      const prefix = identity.prefix || identity.inceptionEvent?.pre || identity.inceptionEvent?.ked?.i;
      if (!prefix) {
        throw new Error('Identity prefix not found. Please delete and recreate this identity.');
      }

      const prevEvent = identity.kel[identity.kel.length - 1];
      const prevDigest = prevEvent.said || prevEvent.d || prevEvent.ked?.d;
      if (!prevDigest) {
        throw new Error('Previous event digest not found');
      }

      const rotationEvent = rotate({
        pre: prefix,
        keys: [identity.nextKeys.public],
        ndigs: [newNextKeyDigest],
        sn: identity.kel.length,
        dig: prevDigest,
      });

      const updatedIdentity: StoredIdentity = {
        ...identity,
        prefix: prefix,
        currentKeys: identity.nextKeys,
        nextKeys: {
          public: newNextKeypair.verfer,
          private: Buffer.from(newNextKeypair.privateKey).toString('hex'),
          seed: Buffer.from(nextRotationSeed).toString('hex'),
        },
        kel: [...identity.kel, rotationEvent],
      };

      await saveIdentity(updatedIdentity);
      await init();
      showToast(`Keys rotated successfully for "${identity.alias}"`);
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      showToast('Failed to rotate keys. See console for details.');
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <UserCircle className="h-8 w-8" />
                User Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            {identities.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareKEL(identities[0])}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotateKeys(identities[0])}
                  disabled={rotating[identities[0].alias]}
                >
                  <RotateCw className={`h-4 w-4 mr-2 ${rotating[identities[0].alias] ? 'animate-spin' : ''}`} />
                  {rotating[identities[0].alias] ? 'Rotating...' : 'Rotate Keys'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <div className="text-lg font-medium">{currentUser.name}</div>
          </div>
          <div className="space-y-2">
            <Label>Created</Label>
            <div className="text-sm text-muted-foreground">
              {new Date(currentUser.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4 mt-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <Label>Banner Color</Label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={bannerColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-20 rounded cursor-pointer border-2 border-border"
              />
              <div className="text-sm text-muted-foreground font-mono">
                {bannerColor}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleColorChange('#3b82f6')}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>

          {identities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-t mt-4 pt-4">
              No identities created yet
            </div>
          ) : (
            <div className="space-y-4 border-t mt-4 pt-4">
              {identities.map((identity) => (
                <Card key={identity.alias} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{identity.alias}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-mono text-muted-foreground">
                          {identity.prefix}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAID(identity.prefix)}
                          className="h-6 w-6 p-0"
                          title="Copy AID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(identity.createdAt).toLocaleDateString()}</span>
                        <span>KEL Events: {identity.kel.length}</span>
                      </div>
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

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
