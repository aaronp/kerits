/**
 * Add to Contacts Dialog
 *
 * Promotes an unknown contact to a known contact by providing an alias.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useContacts } from '../store/contacts';
import type { Contact } from '../lib/dsl/contacts/types';

interface AddToContactsDialogProps {
  contact: Contact;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToContactsDialog({ contact, onClose, onSuccess }: AddToContactsDialogProps) {
  const { promoteUnknownToContact } = useContacts();
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      setError('Alias is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Promote unknown contact to known contact with alias
      await promoteUnknownToContact(contact.aid, alias.trim());
      toast.success(`Added ${alias.trim()} to contacts`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      toast.error(err instanceof Error ? err.message : 'Failed to add contact');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] bg-card border rounded-lg shadow-xl">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Add to Contacts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Give this contact a name
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Enter a name..."
              className="w-full px-3 py-2 border rounded-lg bg-background"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <span className="font-mono">{contact.aid.substring(0, 40)}...</span>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
