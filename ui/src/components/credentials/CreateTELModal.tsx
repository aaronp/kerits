import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { saveTELRegistry, getTELRegistryByAlias } from '@/lib/storage';
import { registryIncept } from '@/lib/keri';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import type { TELRegistry } from '@/lib/storage';

interface CreateTELModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (registry: TELRegistry) => void;
}

export function CreateTELModal({ isOpen, onClose, onCreated }: CreateTELModalProps) {
  const [alias, setAlias] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { identities } = useStore();
  const { currentUser } = useUser();

  const handleCreate = async () => {
    if (!alias.trim()) {
      showToast('Please enter a name for the credential registry');
      return;
    }

    // Get current user's identity as issuer
    const issuerIdentity = identities.find(
      i => i.alias.toLowerCase() === currentUser?.name.toLowerCase()
    );
    if (!issuerIdentity) {
      showToast('Current user identity not found');
      return;
    }

    setCreating(true);
    try {
      // Check if alias already exists
      const existing = await getTELRegistryByAlias(alias);
      if (existing) {
        showToast('A registry with this name already exists');
        setCreating(false);
        return;
      }

      // Create registry inception event using KERI
      const inception = registryIncept({
        issuer: issuerIdentity.prefix,
        // nonce and toad will be auto-generated
        // baks defaults to empty array (backerless registry)
      });

      console.log('Registry inception:', inception);
      console.log('Registry AID:', inception.regk);

      const newRegistry: TELRegistry = {
        id: crypto.randomUUID(),
        alias: alias.trim(),
        registryAID: inception.regk, // Use the registry identifier from inception
        issuerAID: issuerIdentity.prefix, // Track the issuer
        inceptionEvent: inception, // Store the full vcp inception event
        tel: [], // Initialize empty TEL - will be populated as credentials are issued
        createdAt: new Date().toISOString(),
      };

      await saveTELRegistry(newRegistry);
      showToast(`Credential registry "${alias}" created successfully`);

      // Reset form
      setAlias('');

      // Notify parent
      onCreated(newRegistry);
      onClose();
    } catch (error) {
      console.error('Failed to create TEL registry:', error);
      showToast('Failed to create credential registry');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setAlias('');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Credential Registry</DialogTitle>
            <DialogDescription>
              Create a new TEL (Transaction Event Log) registry for storing credential events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registry-name">Registry Name</Label>
              <Input
                id="registry-name"
                placeholder="e.g., My Credentials Registry"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this registry
              </p>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              The registry will be created using your current identity as the issuer.
              A unique registry identifier (AID) will be generated automatically.
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? 'Creating...' : 'Create Registry'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </>
  );
}
