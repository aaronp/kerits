/**
 * Create Group Modal
 *
 * Modal for creating new group chats with member selection.
 */

import { useState, useMemo } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useContacts } from '../store/contacts';
import { useGroups } from '../store/groups';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  preselectedContactIds?: string[]; // For multi-select flow
}

export function CreateGroupModal({ open, onClose, preselectedContactIds = [] }: CreateGroupModalProps) {
  const { contacts } = useContacts();
  const { createGroup } = useGroups();

  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set(preselectedContactIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.alias?.toLowerCase().includes(query) ||
        c.aid.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleToggleMember = (contactId: string) => {
    const newSelected = new Set(selectedMemberIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedMemberIds(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedMemberIds.size === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      const memberAids = Array.from(selectedMemberIds);
      await createGroup(groupName.trim(), memberAids);
      toast.success(`Group "${groupName}" created successfully`);
      handleClose();
    } catch (error) {
      console.error('[CreateGroupModal] Create error:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedMemberIds(new Set());
    setSearchQuery('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Create Group</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="text-sm font-medium block mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Members ({selectedMemberIds.size} selected)
            </label>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            />

            {/* Contact List */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <label
                    key={contact.aid}
                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.has(contact.aid)}
                      onChange={() => handleToggleMember(contact.aid)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {contact.alias || contact.aid.substring(0, 20)}
                      </div>
                      {contact.alias && (
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.aid.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedMemberIds.size === 0}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
