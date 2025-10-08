/**
 * CreateRegistryDialog - Reusable dialog for creating registries
 *
 * Can be used to create:
 * - Top-level registries (from account)
 * - Nested sub-registries (from parent registry)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import type { AccountDSL, RegistryDSL } from '@kerits/app/dsl/types';

interface CreateRegistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountDsl?: AccountDSL;
  parentRegistryDsl?: RegistryDSL;
  onSuccess?: () => void;
}

export function CreateRegistryDialog({
  open,
  onOpenChange,
  accountDsl,
  parentRegistryDsl,
  onSuccess,
}: CreateRegistryDialogProps) {
  const [registryName, setRegistryName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubRegistry = !!parentRegistryDsl;

  const handleCreate = async () => {
    if (!registryName.trim()) {
      setError('Registry name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      if (isSubRegistry && parentRegistryDsl) {
        // Create nested sub-registry
        await parentRegistryDsl.createRegistry(registryName.trim());
      } else if (accountDsl) {
        // Create top-level registry
        await accountDsl.createRegistry(registryName.trim());
      } else {
        throw new Error('No account or parent registry provided');
      }

      console.log('Registry creation successful, closing dialog');

      // Reset and close
      setRegistryName('');
      onOpenChange(false);

      // Notify parent
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create registry:', err);
      setError(err instanceof Error ? err.message : 'Failed to create registry');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSubRegistry ? 'Create Nested Registry' : 'Create Registry'}
          </DialogTitle>
          <DialogDescription>
            {isSubRegistry
              ? `Create a sub-registry under "${parentRegistryDsl?.registry.alias}". This will be anchored in the parent registry's TEL.`
              : 'Create a new top-level credential registry for issuing ACDCs.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="registryName">Registry Name</Label>
            <Input
              id="registryName"
              value={registryName}
              onChange={(e) => setRegistryName(e.target.value)}
              placeholder={isSubRegistry ? "e.g., Public, Internal, Archived" : "e.g., Credentials, Licenses"}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && registryName.trim() && !creating) {
                  handleCreate();
                }
              }}
              disabled={creating}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setRegistryName('');
              setError(null);
              onOpenChange(false);
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!registryName.trim() || creating}>
            {creating ? 'Creating...' : 'Create Registry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
