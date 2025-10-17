/**
 * Add Contact Dialog
 *
 * Clean, reusable component for adding contacts by SAID.
 */

import { useState } from 'react';
import { UserPlus, Loader2, X } from 'lucide-react';
import { useContacts } from '../store/contacts';

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddContactDialog({ open, onClose }: AddContactDialogProps) {
  const [aid, setAid] = useState('');
  const [alias, setAlias] = useState('');
  const { addContact, loading, error } = useContacts();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!aid.trim()) return;

    try {
      await addContact(aid.trim(), alias.trim() || undefined);

      // Reset and close
      setAid('');
      setAlias('');
      onClose();
    } catch (error) {
      console.error('Failed to add contact:', error);
      // Error is handled by store
    }
  }

  function handleClose() {
    if (loading) return; // Don't close while loading
    setAid('');
    setAlias('');
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div className="bg-card border rounded-lg shadow-xl w-full max-w-md p-6 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Contact
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="aid" className="block text-sm font-medium mb-2">
                Contact SAID *
              </label>
              <input
                id="aid"
                type="text"
                value={aid}
                onChange={(e) => setAid(e.target.value)}
                placeholder="did:key:z6Mk..."
                disabled={loading}
                autoFocus
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The contact's Self-Addressing Identifier
              </p>
            </div>

            <div>
              <label htmlFor="alias" className="block text-sm font-medium mb-2">
                Nickname (optional)
              </label>
              <input
                id="alias"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Alice"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name for this contact
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!aid.trim() || loading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Contact
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
