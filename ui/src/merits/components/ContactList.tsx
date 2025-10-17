/**
 * Contact List
 *
 * Shows all contacts from ContactManager (no more mock data).
 */

import { useState, useEffect, useMemo } from 'react';
import { User, MoreVertical, Trash2, MessageCircle, Ban, BellOff, EyeOff, Check, UserCheck, HelpCircle, Edit3, X } from 'lucide-react';
import { useContacts } from '../store/contacts';
import { useACL } from '../store/acl';
import { Combobox } from '../../components/ui/combobox';
import type { Contact } from '../lib/dsl/contacts/types';
import type { ACLEntry } from '../lib/dsl/acl/types';

export function ContactList() {
  const { contacts, loading, selectedContactAid, selectContact, removeContact, addContact } = useContacts();
  const { getACL, entries } = useACL();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');

  // Load ACL for all contacts
  useEffect(() => {
    contacts.forEach((contact) => {
      getACL(contact.aid).catch((err) => {
        // Ignore ACL errors during initialization
        console.warn('[ContactList] ACL not ready for', contact.aid.substring(0, 20), ':', err.message);
      });
    });
  }, [contacts, getACL]);

  // Auto-select contact when filter value is set to a specific AID
  useEffect(() => {
    if (filterValue) {
      // Check if it's a valid AID (starts with typical KERI prefixes)
      const isValidAid = /^[A-Z][A-Za-z0-9_-]{43}/.test(filterValue);
      if (isValidAid && filterValue !== selectedContactAid) {
        selectContact(filterValue);
      }
    }
  }, [filterValue, selectedContactAid, selectContact]);

  // Handle Enter key to create new contact from AID
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filterValue.trim()) {
      // Check if it's a valid AID
      const isValidAid = /^[A-Z][A-Za-z0-9_-]{43}/.test(filterValue);
      if (!isValidAid) return;

      // Check if contact already exists
      const existingContact = contacts.find((c) => c.aid === filterValue);
      if (existingContact) {
        // Already exists, just select it
        selectContact(filterValue);
        return;
      }

      // Create new contact without alias
      try {
        await addContact(filterValue);
        selectContact(filterValue);
      } catch (error) {
        console.error('[ContactList] Failed to create contact:', error);
      }
    }
  };

  // Build combobox options from contacts
  const contactOptions = useMemo(() => {
    return contacts
      .filter((contact) => {
        const acl = entries.get(contact.aid);
        return !acl?.hidden; // Don't show hidden contacts in dropdown
      })
      .map((contact) => ({
        value: contact.aid,
        label: contact.alias || contact.aid.substring(0, 20) + '...',
        description: contact.alias ? contact.aid.substring(0, 40) + '...' : undefined,
      }));
  }, [contacts, entries]);

  // Filter contacts based on filter value
  const filteredContacts = useMemo(() => {
    if (!filterValue) {
      // Show all non-hidden contacts when no filter
      return contacts.filter((contact) => {
        const acl = entries.get(contact.aid);
        return !acl?.hidden;
      });
    }

    // Check if filter value matches any contact
    const matchedContact = contacts.find((contact) => contact.aid === filterValue);
    if (matchedContact) {
      return [matchedContact];
    }

    // Filter by partial match on alias or AID
    return contacts.filter((contact) => {
      const searchLower = filterValue.toLowerCase();
      const aliasMatch = contact.alias?.toLowerCase().includes(searchLower);
      const aidMatch = contact.aid.toLowerCase().includes(searchLower);
      return aliasMatch || aidMatch;
    });
  }, [contacts, entries, filterValue]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading contacts...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Contact Filter */}
      <div className="p-3 border-b flex-shrink-0 bg-card/30">
        <div className="flex gap-2">
          <Combobox
            options={contactOptions}
            value={filterValue}
            onValueChange={setFilterValue}
            placeholder="Search contacts or enter AID..."
            emptyMessage="No contacts found. Type an AID to message anyone."
            allowCustomValue={true}
            className="flex-1"
            onKeyDown={handleKeyDown}
          />
          {filterValue && (
            <button
              onClick={() => setFilterValue('')}
              className="px-2 hover:bg-muted rounded-lg transition-colors"
              title="Clear filter"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Contacts */}
      {contacts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-1">No contacts yet</p>
            <p className="text-xs text-muted-foreground">
              Add a contact to start messaging
            </p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-sm text-muted-foreground">
            No contacts in this category
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <ContactItem
              key={contact.aid}
              contact={contact}
              selected={selectedContactAid === contact.aid}
              menuOpen={menuOpen === contact.aid}
              onSelect={() => selectContact(contact.aid)}
              onMenuToggle={() => setMenuOpen(menuOpen === contact.aid ? null : contact.aid)}
              onRemove={() => {
                removeContact(contact.aid);
                setMenuOpen(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContactItemProps {
  contact: Contact;
  selected: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onRemove: () => void;
}

function ContactItem({
  contact,
  selected,
  menuOpen,
  onSelect,
  onMenuToggle,
  onRemove,
}: ContactItemProps) {
  const { getACL, setBlock, setMute, setHide } = useACL();
  const { refreshContacts } = useContacts();
  const [acl, setAcl] = useState<ACLEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  useEffect(() => {
    getACL(contact.aid).then(setAcl).catch((err) => {
      // Ignore ACL errors during initialization
      console.warn('[ContactItem] ACL not ready:', err.message);
    });
  }, [contact.aid, getACL]);

  const displayName = contact.alias || contact.aid.substring(0, 20);
  const lastMessageDate = contact.lastMessageAt
    ? new Date(contact.lastMessageAt).toLocaleDateString()
    : null;

  const handleToggleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acl) {
      await setBlock(contact.aid, !acl.blocked);
      const updated = await getACL(contact.aid);
      setAcl(updated);
    }
  };

  const handleToggleMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acl) {
      await setMute(contact.aid, !acl.muted);
      const updated = await getACL(contact.aid);
      setAcl(updated);
    }
  };

  const handleToggleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acl) {
      await setHide(contact.aid, !acl.hidden);
      const updated = await getACL(contact.aid);
      setAcl(updated);
    }
  };

  const handleAddToContacts = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddDialog(true);
    onMenuToggle();
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRenameDialog(true);
    onMenuToggle();
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-3 hover:bg-muted/50 cursor-pointer border-b relative ${
        selected ? 'bg-primary/10' : ''
      }`}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
      }`}>
        <User className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">
            {displayName}
          </div>
          {/* Unknown Badge */}
          {contact.isUnknown && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <HelpCircle className="w-3 h-3" />
              Unknown
            </span>
          )}
          {/* ACL Badges */}
          {acl?.blocked && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-destructive/20 text-destructive">
              <Ban className="w-3 h-3" />
            </span>
          )}
          {acl?.muted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted">
              <BellOff className="w-3 h-3" />
            </span>
          )}
          {acl?.hidden && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted">
              <EyeOff className="w-3 h-3" />
            </span>
          )}
        </div>
        {contact.alias && (
          <div className="text-xs text-muted-foreground font-mono truncate">
            {contact.aid.substring(0, 30)}...
          </div>
        )}
        {lastMessageDate && (
          <div className="text-xs text-muted-foreground">
            {lastMessageDate}
          </div>
        )}
      </div>

      {/* Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle();
        }}
        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && acl && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
          />
          <div className="absolute right-2 top-12 bg-card border rounded-lg shadow-lg z-20 min-w-[180px] overflow-hidden">
            {/* Add to Contacts (for unknown contacts) */}
            {contact.isUnknown && (
              <>
                <button
                  onClick={handleAddToContacts}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-primary font-medium"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Add to Contacts</span>
                </button>
                <div className="border-t" />
              </>
            )}

            {/* Rename (for known contacts) */}
            {!contact.isUnknown && (
              <>
                <button
                  onClick={handleRename}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <div className="border-t" />
              </>
            )}

            <button
              onClick={handleToggleBlock}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4" />
                <span>Block</span>
              </div>
              {acl.blocked && <Check className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={handleToggleMute}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4" />
                <span>Mute</span>
              </div>
              {acl.muted && <Check className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={handleToggleHide}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                <span>Hide</span>
              </div>
              {acl.hidden && <Check className="w-4 h-4 text-primary" />}
            </button>

            <div className="border-t" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute right-2 top-2">
          <MessageCircle className="w-4 h-4 text-primary" />
        </div>
      )}

      {/* Add to Contacts Dialog */}
      {showAddDialog && (
        <AddToContactsDialog
          contact={contact}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            refreshContacts();
            setShowAddDialog(false);
          }}
        />
      )}

      {/* Rename Dialog */}
      {showRenameDialog && (
        <RenameContactDialog
          contact={contact}
          onClose={() => setShowRenameDialog(false)}
          onSuccess={() => {
            refreshContacts();
            setShowRenameDialog(false);
          }}
        />
      )}
    </div>
  );
}

interface AddToContactsDialogProps {
  contact: Contact;
  onClose: () => void;
  onSuccess: () => void;
}

function AddToContactsDialog({ contact, onClose, onSuccess }: AddToContactsDialogProps) {
  const { contactManager } = useContacts();
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
      if (!contactManager) {
        throw new Error('Contact manager not initialized');
      }

      // Promote unknown contact to known contact with alias
      await contactManager.promoteUnknownToContact(contact.aid, alias.trim());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
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

interface RenameContactDialogProps {
  contact: Contact;
  onClose: () => void;
  onSuccess: () => void;
}

function RenameContactDialog({ contact, onClose, onSuccess }: RenameContactDialogProps) {
  const { contactManager } = useContacts();
  const [alias, setAlias] = useState(contact.alias || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!contactManager) {
        throw new Error('Contact manager not initialized');
      }

      // Rename contact
      await contactManager.renameContact(contact.aid, alias.trim());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename contact');
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
          <h3 className="font-semibold">Rename Contact</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Change the display name for this contact
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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
