import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Toast, useToast } from './ui/toast';
import { Checkbox } from './ui/checkbox';
import { useUser } from '../lib/user-provider';
import { useStore } from '../store/useStore';
import { UserCircle, RotateCw, Shield, Copy, Share, Trash2, Palette, Key } from 'lucide-react';
import { getDSL, resetDSL } from '../lib/dsl';
import { MnemonicPromptModal } from './MnemonicPromptModal';

export function Profile() {
  const { currentUser } = useUser();
  const { identities, init } = useStore();
  const { toast, showToast, hideToast } = useToast();
  const [rotating, setRotating] = useState<Record<string, boolean>>({});
  const [bannerColor, setBannerColor] = useState<string>('#3b82f6');
  const [kelEventCounts, setKelEventCounts] = useState<Record<string, number>>({});  // Map alias -> KEL event count
  const [showMnemonicPrompt, setShowMnemonicPrompt] = useState(false);
  const [rotatingAlias, setRotatingAlias] = useState<string | null>(null);
  const [skipMnemonicPrompt, setSkipMnemonicPrompt] = useState(false);
  const [identityKeys, setIdentityKeys] = useState<Record<string, { currentKeys: string[]; nextKeys: string[] }>>({});

  useEffect(() => {
    if (currentUser) {
      const savedColor = localStorage.getItem(`kerits-banner-color-${currentUser.id}`);
      if (savedColor) {
        setBannerColor(savedColor);
      }
    }
  }, [currentUser]);

  // Load skip mnemonic prompt preference
  useEffect(() => {
    async function loadMnemonicPref() {
      if (!currentUser) return;

      try {
        const dsl = await getDSL(currentUser.id);
        const appData = dsl.appData();
        const pref = await appData.get<boolean>('skipMnemonicPrompt');
        setSkipMnemonicPrompt(pref === true);
      } catch (error) {
        console.error('Failed to load mnemonic preference:', error);
      }
    }

    loadMnemonicPref();
  }, [currentUser]);

  // Load KEL event counts and keys from DSL
  useEffect(() => {
    async function loadKelData() {
      if (identities.length === 0 || !currentUser) return;

      try {
        const dsl = await getDSL(currentUser.id);
        const counts: Record<string, number> = {};
        const keys: Record<string, { currentKeys: string[]; nextKeys: string[] }> = {};

        for (const identity of identities) {
          const accountDsl = await dsl.account(identity.alias);
          if (accountDsl) {
            const kel = await accountDsl.getKel();
            counts[identity.alias] = kel.length;

            // Get current and next keys from the latest KEL event
            if (kel.length > 0) {
              const latestEvent = kel[kel.length - 1];
              keys[identity.alias] = {
                currentKeys: latestEvent.k || [],
                nextKeys: latestEvent.n || [],
              };
            }
          }
        }

        setKelEventCounts(counts);
        setIdentityKeys(keys);
      } catch (error) {
        console.error('Failed to load KEL data:', error);
      }
    }

    loadKelData();
  }, [identities, currentUser]);

  const handleColorChange = (color: string) => {
    if (!currentUser) return;

    setBannerColor(color);
    localStorage.setItem(`kerits-banner-color-${currentUser.id}`, color);
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent('kerits-color-changed', { detail: { userId: currentUser.id, color } }));
    showToast('Banner color updated!');
  };

  const handleCopyAID = async (aid: string) => {
    await navigator.clipboard.writeText(aid);
    showToast('AID copied to clipboard');
  };

  const handleShareKEL = async (alias: string) => {
    try {
      if (!currentUser) return;

      const dsl = await getDSL(currentUser.id);
      const accountDsl = await dsl.account(alias);

      if (!accountDsl) {
        throw new Error(`Account "${alias}" not found`);
      }

      // Use DSL to export in CESR format
      const exportDsl = await accountDsl.export();
      const cesr = exportDsl.toCESR();
      const text = new TextDecoder().decode(cesr);
      await navigator.clipboard.writeText(text);
      showToast('KEL copied to clipboard (CESR format)');
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
      // Clear data via DSL
      if (currentUser) {
        await resetDSL(currentUser.id, true); // true = clearData
      }
      // Reload the page to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      showToast('Failed to clear data. See console for details.');
    }
  };

  const handleRotateKeys = async (alias: string) => {
    if (!currentUser) return;

    // Check if we should skip the prompt and use stored mnemonic
    if (skipMnemonicPrompt) {
      try {
        const dsl = await getDSL(currentUser.id);
        const appData = dsl.appData();
        const storedMnemonic = await appData.get<string>('storedMnemonic');

        if (storedMnemonic) {
          await performKeyRotation(alias, storedMnemonic);
          return;
        } else {
          // No stored mnemonic, fall through to prompt
          showToast('No stored mnemonic found. Please enter it manually.');
        }
      } catch (error) {
        console.error('Failed to load stored mnemonic:', error);
        showToast('Failed to load stored mnemonic. Please enter it manually.');
      }
    }

    // Show prompt to get mnemonic
    setRotatingAlias(alias);
    setShowMnemonicPrompt(true);
  };

  const handleMnemonicSubmit = async (mnemonic: string, dontPromptAgain: boolean) => {
    setShowMnemonicPrompt(false);

    if (!rotatingAlias || !currentUser) return;

    // Save preference if requested
    if (dontPromptAgain) {
      try {
        const dsl = await getDSL(currentUser.id);
        const appData = dsl.appData();
        await appData.set('skipMnemonicPrompt', true);
        await appData.set('storedMnemonic', mnemonic);
        setSkipMnemonicPrompt(true);
      } catch (error) {
        console.error('Failed to save mnemonic preference:', error);
        showToast('Warning: Failed to save preference');
      }
    }

    await performKeyRotation(rotatingAlias, mnemonic);
    setRotatingAlias(null);
  };

  const performKeyRotation = async (alias: string, mnemonic: string) => {
    setRotating(prev => ({ ...prev, [alias]: true }));
    try {
      if (!currentUser) return;
      const dsl = await getDSL(currentUser.id);
      const accountDsl = await dsl.account(alias);
      if (!accountDsl) throw new Error(`Account "${alias}" not found`);

      await accountDsl.rotateKeys(mnemonic);
      await init();

      // Reload KEL event counts and keys
      const kel = await accountDsl.getKel();
      setKelEventCounts(prev => ({ ...prev, [alias]: kel.length }));

      // Update keys from latest event
      if (kel.length > 0) {
        const latestEvent = kel[kel.length - 1];
        setIdentityKeys(prev => ({
          ...prev,
          [alias]: {
            currentKeys: latestEvent.k || [],
            nextKeys: latestEvent.n || [],
          },
        }));
      }

      showToast(`Keys rotated successfully for "${alias}"`);
    } catch (error) {
      console.error('Failed to rotate keys:', error);
      showToast(`Failed to rotate keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRotating(prev => ({ ...prev, [alias]: false }));
    }
  };

  const handleToggleSkipMnemonicPrompt = async (checked: boolean) => {
    if (!currentUser) return;

    try {
      const dsl = await getDSL(currentUser.id);
      const appData = dsl.appData();

      await appData.set('skipMnemonicPrompt', checked);
      setSkipMnemonicPrompt(checked);

      if (!checked) {
        // If disabling, also remove stored mnemonic
        await appData.delete('storedMnemonic');
        showToast('Mnemonic prompt re-enabled and stored mnemonic cleared');
      } else {
        showToast('Mnemonic prompt disabled');
      }
    } catch (error) {
      console.error('Failed to update mnemonic preference:', error);
      showToast('Failed to update preference');
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
                  onClick={() => handleShareKEL(identities[0].alias)}
                  className="cursor-pointer"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share KEL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotateKeys(identities[0].alias)}
                  disabled={rotating[identities[0].alias]}
                  className="cursor-pointer"
                >
                  <RotateCw className={`h-4 w-4 mr-2 ${rotating[identities[0].alias] ? 'animate-spin' : ''}`} />
                  Rotate Keys
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
                className="cursor-pointer"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4 mt-4">
            <div className="flex items-center gap-2">
              <RotateCw className="h-5 w-5" />
              <Label>Key Rotation Preferences</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-mnemonic"
                checked={skipMnemonicPrompt}
                onCheckedChange={(checked) => handleToggleSkipMnemonicPrompt(checked === true)}
              />
              <label
                htmlFor="skip-mnemonic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Don't prompt for mnemonic during key rotation
              </label>
            </div>
            {skipMnemonicPrompt && (
              <div className="text-xs text-muted-foreground pl-6">
                Your recovery phrase is stored in preferences for automatic key rotation.
              </div>
            )}
          </div>

          {/* <div className="border-t pt-4 mt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearData}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div> */}

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
                        <div className="text-xs font-mono text-muted-foreground break-all">
                          {identity.aid}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAID(identity.aid)}
                          className="h-6 w-6 p-0 flex-shrink-0 cursor-pointer"
                          title="Copy AID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(identity.createdAt).toLocaleDateString()}</span>
                        {kelEventCounts[identity.alias] !== undefined && (
                          <span>KEL Events: {kelEventCounts[identity.alias]}</span>
                        )}
                      </div>
                    </div>

                    {/* Keys */}
                    <div className="space-y-3 pt-2 border-t">
                      {identityKeys[identity.alias]?.currentKeys && identityKeys[identity.alias].currentKeys.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <Label className="text-sm">Current Public Key{identityKeys[identity.alias].currentKeys.length > 1 ? 's' : ''}</Label>
                          </div>
                          {identityKeys[identity.alias].currentKeys.map((key, idx) => (
                            <div key={idx} className="text-xs font-mono bg-muted p-2 rounded break-all">
                              {key}
                            </div>
                          ))}
                        </div>
                      )}

                      {identityKeys[identity.alias]?.nextKeys && identityKeys[identity.alias].nextKeys.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <Label className="text-sm">Next Key Digest{identityKeys[identity.alias].nextKeys.length > 1 ? 's' : ''}</Label>
                          </div>
                          {identityKeys[identity.alias].nextKeys.map((key, idx) => (
                            <div key={idx} className="text-xs font-mono bg-muted p-2 rounded break-all">
                              {key}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MnemonicPromptModal
        isOpen={showMnemonicPrompt}
        onClose={() => {
          setShowMnemonicPrompt(false);
          setRotatingAlias(null);
        }}
        onSubmit={handleMnemonicSubmit}
        title="Authorize Key Rotation"
        description="Please enter your 24-word recovery phrase to rotate keys for this identity."
      />

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
