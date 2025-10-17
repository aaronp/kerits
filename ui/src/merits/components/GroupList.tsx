/**
 * Group List Component
 *
 * Unified conversation list showing DMs and groups with pinning and unread tracking.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Users, MoreVertical, Filter, ChevronRight } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { AddContactDialog } from './AddContactDialog';
import { AddToContactsDialog } from './AddToContactsDialog';
import { CreateGroupModal } from './CreateGroupModal';
import { useContacts } from '../store/contacts';
import { useACL } from '../store/acl';
import { usePreferences } from '../store/preferences';
import { useGroups } from '../store/groups';
import type { Contact } from '../lib/dsl/contacts/types';
import type { Group } from '../lib/dsl/groups/types';
import type { ACLEntry } from '../lib/dsl/acl/types';

type FilterTab = 'all' | 'blocked' | 'muted' | 'hidden';
type ConversationTypeFilter = 'all' | 'dms' | 'groups';

interface ConversationData {
  id: string;
  type: 'dm' | 'group';
  displayName: string;
  lastMessageTime?: number;
  lastMessagePreview?: string;
  unreadCount: number;
  isPinned: boolean;
  pinIndex: number | null;
  contact?: Contact;
  group?: Group;
  memberCount?: number;
  acl?: ACLEntry | null;
}

export function GroupList() {
  const { contacts, loading: contactsLoading, selectedContactAid, selectContact, removeContact } = useContacts();
  const { groups, loading: groupsLoading, selectedGroupId, selectGroup, getCanonicalMessages } = useGroups();
  const { getACL, entries, setBlock, setMute, setHide } = useACL();
  const {
    pinnedConversations,
    isPinned,
    getPinIndex,
    pinConversation,
    unpinConversation,
    movePinToIndex,
  } = usePreferences();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [promoteDialogContact, setPromoteDialogContact] = useState<Contact | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterButtonRect, setFilterButtonRect] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<ConversationTypeFilter>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const loading = contactsLoading || groupsLoading;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cache for group last messages
  const [groupLastMessages, setGroupLastMessages] = useState<Map<string, { time: number; preview: string }>>(new Map());

  // Load ACL for all contacts
  useEffect(() => {
    contacts.forEach((contact) => {
      getACL(contact.aid);
    });
  }, [contacts, getACL]);

  // Load last canonical message for each group
  useEffect(() => {
    const loadGroupMessages = async () => {
      const updates = new Map<string, { time: number; preview: string }>();

      for (const group of groups) {
        try {
          const messages = await getCanonicalMessages(group.groupId);
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) {
              updates.set(group.groupId, {
                time: lastMsg.timestamp,
                preview: lastMsg.content.substring(0, 50), // First 50 chars
              });
            }
          }
        } catch (error) {
          console.error(`[GroupList] Failed to load messages for group ${group.groupId}:`, error);
        }
      }

      setGroupLastMessages(updates);
    };

    if (groups.length > 0) {
      loadGroupMessages();
    }
  }, [groups, getCanonicalMessages]);

  // Build conversation list from contacts and groups
  const conversations: ConversationData[] = useMemo(() => {
    const dmConversations = contacts.map((contact) => {
      const acl = entries.get(contact.aid);
      const pinned = isPinned(contact.aid);
      const pinIndex = getPinIndex(contact.aid);

      return {
        id: contact.aid,
        type: 'dm' as const,
        displayName: contact.alias || contact.aid.substring(0, 20),
        lastMessageTime: contact.lastMessageAt,
        lastMessagePreview: undefined, // TODO: integrate with messages store
        unreadCount: 0, // TODO: use calculateUnreadCount(messages, contact.lastReadMessageId, myAid)
        isPinned: pinned,
        pinIndex,
        contact,
        acl,
      };
    });

    const groupConversations = groups.map((group) => {
      const pinned = isPinned(group.groupId);
      const pinIndex = getPinIndex(group.groupId);
      const lastMessage = groupLastMessages.get(group.groupId);

      return {
        id: group.groupId,
        type: 'group' as const,
        displayName: group.name,
        lastMessageTime: lastMessage?.time || group.createdAt,
        lastMessagePreview: lastMessage?.preview,
        unreadCount: 0, // TODO: use calculateUnreadCount(canonicalMessages, group.lastReadMessageId, myAid)
        isPinned: pinned,
        pinIndex,
        group,
        memberCount: group.members.length,
        acl: null,
      };
    });

    return [...dmConversations, ...groupConversations];
  }, [contacts, groups, entries, pinnedConversations, isPinned, getPinIndex, groupLastMessages]);

  // Filter conversations based on active tab and type filter
  const filteredConversations = conversations.filter((conv) => {
    // Apply type filter (DMs/Groups/All)
    if (typeFilter === 'dms' && conv.type !== 'dm') return false;
    if (typeFilter === 'groups' && conv.type !== 'group') return false;

    // Apply ACL filter (only for DMs, groups don't have ACL)
    const acl = conv.acl;
    if (conv.type === 'group') return activeTab === 'all'; // Groups only show in 'all'

    if (!acl) return activeTab === 'all';

    switch (activeTab) {
      case 'blocked':
        return acl.blocked;
      case 'muted':
        return acl.muted;
      case 'hidden':
        return acl.hidden;
      case 'all':
      default:
        return !acl.hidden; // Don't show hidden in "all"
    }
  });

  // Sort conversations: pinned first (by index), then unpinned (by last message time)
  const sortedConversations = useMemo(() => {
    const pinned = filteredConversations
      .filter((c) => c.isPinned)
      .sort((a, b) => (a.pinIndex ?? 0) - (b.pinIndex ?? 0));

    const unpinned = filteredConversations
      .filter((c) => !c.isPinned)
      .sort((a, b) => {
        const timeA = a.lastMessageTime ?? 0;
        const timeB = b.lastMessageTime ?? 0;
        return timeB - timeA; // Most recent first
      });

    return [...pinned, ...unpinned];
  }, [filteredConversations]);

  // Drag and drop handlers
  const handleDragStart = (conversationId: string) => (e: React.DragEvent) => {
    setDraggedId(conversationId);
    if (e.dataTransfer) {
      (e.dataTransfer as any).setData('text/plain', conversationId);
      (e.dataTransfer as any).effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (conversationId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    (e.dataTransfer as any).dropEffect = 'move';
  };

  const handleDrop = (targetId: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedConv = sortedConversations.find((c) => c.id === draggedId);
    const targetConv = sortedConversations.find((c) => c.id === targetId);

    if (!draggedConv || !targetConv) return;

    try {
      // Case 1: Dragging pinned to pinned (reorder)
      if (draggedConv.isPinned && targetConv.isPinned) {
        const targetIndex = targetConv.pinIndex!;
        await movePinToIndex(draggedId, targetIndex);
      }
      // Case 2: Dragging pinned to unpinned (unpin)
      else if (draggedConv.isPinned && !targetConv.isPinned) {
        await unpinConversation(draggedId);
      }
      // Case 3: Dragging unpinned to pinned (pin at that position)
      else if (!draggedConv.isPinned && targetConv.isPinned) {
        const targetIndex = targetConv.pinIndex!;
        await pinConversation(draggedId, draggedConv.type, targetIndex);
      }
      // Case 4: Dragging unpinned to unpinned (auto-pin the dragged item)
      else if (!draggedConv.isPinned && !targetConv.isPinned) {
        await pinConversation(draggedId, draggedConv.type);
      }
    } catch (error) {
      console.error('[GroupList] Drag & drop error:', error);
    }

    setDraggedId(null);
  };

  // Toggle pin handler
  const handleTogglePin = (conversationId: string, type: 'dm' | 'group') => async () => {
    try {
      if (isPinned(conversationId)) {
        await unpinConversation(conversationId);
      } else {
        await pinConversation(conversationId, type);
      }
    } catch (error) {
      console.error('[GroupList] Pin toggle error:', error);
    }
  };

  // Selection handler
  const handleSelect = (conv: ConversationData) => () => {
    if (conv.type === 'dm') {
      selectContact(conv.id);
      selectGroup(null);
    } else {
      selectGroup(conv.id);
      selectContact(null);
    }
  };

  // Remove handler
  const handleRemove = (conv: ConversationData) => () => {
    if (conv.type === 'dm') {
      removeContact(conv.id);
    }
    // TODO: Add group removal
    setMenuOpen(null);
  };

  // ACL handlers (only for DMs)
  const handleToggleBlock = (aid: string) => async () => {
    const acl = entries.get(aid);
    if (acl) {
      await setBlock(aid, !acl.blocked);
    }
  };

  const handleToggleMute = (aid: string) => async () => {
    const acl = entries.get(aid);
    if (acl) {
      await setMute(aid, !acl.muted);
    }
  };

  const handleToggleHide = (aid: string) => async () => {
    const acl = entries.get(aid);
    if (acl) {
      await setHide(aid, !acl.hidden);
    }
  };

  const handleAddToContacts = (conv: ConversationData) => () => {
    if (conv.type === 'dm' && conv.contact) {
      setPromoteDialogContact(conv.contact);
      setMenuOpen(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading conversations...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Type Filter Tabs (DMs/Groups/All) with Menu */}
      <div className="p-2 border-b flex-shrink-0 bg-card/20" ref={dropdownRef}>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              typeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('dms')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              typeFilter === 'dms'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            DMs
          </button>
          <button
            onClick={() => setTypeFilter('groups')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              typeFilter === 'groups'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Groups
          </button>

          {/* Dropdown Menu Button */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                {/* Add Contact */}
                <button
                  onClick={() => {
                    setAddDialogOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Contact
                </button>

                {/* Create Group */}
                <button
                  onClick={() => {
                    setCreateGroupOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm"
                >
                  <Users className="w-4 h-4" />
                  Create Group
                </button>

                <div className="border-t my-1" />

                {/* Filter Submenu */}
                <div className="relative">
                  <button
                    ref={filterButtonRef}
                    onClick={() => {
                      const rect = filterButtonRef.current?.getBoundingClientRect();
                      setFilterButtonRect(rect || null);
                      setFilterMenuOpen(!filterMenuOpen);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Filter Submenu Dropdown - Using Portal */}
                  {filterMenuOpen && filterButtonRect && createPortal(
                    <div
                      className="fixed bg-card border rounded-lg shadow-lg py-1 z-[9999] min-w-[140px]"
                      style={{
                        left: `${filterButtonRect.right + 4}px`,
                        top: `${filterButtonRect.top}px`
                      }}
                    >
                      <button
                        onClick={() => {
                          setActiveTab('all');
                          setDropdownOpen(false);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${
                          activeTab === 'all' ? 'bg-primary/10 font-medium' : ''
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('blocked');
                          setDropdownOpen(false);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${
                          activeTab === 'blocked' ? 'bg-primary/10 font-medium' : ''
                        }`}
                      >
                        Blocked
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('muted');
                          setDropdownOpen(false);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${
                          activeTab === 'muted' ? 'bg-primary/10 font-medium' : ''
                        }`}
                      >
                        Muted
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('hidden');
                          setDropdownOpen(false);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${
                          activeTab === 'hidden' ? 'bg-primary/10 font-medium' : ''
                        }`}
                      >
                        Hidden
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground">
              Add a contact to start messaging
            </p>
          </div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-sm text-muted-foreground">
            No conversations in this category
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sortedConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              id={conv.id}
              type={conv.type}
              displayName={conv.displayName}
              lastMessagePreview={conv.lastMessagePreview}
              lastMessageTime={conv.lastMessageTime}
              unreadCount={conv.unreadCount}
              isPinned={conv.isPinned}
              selected={
                (conv.type === 'dm' && selectedContactAid === conv.id) ||
                (conv.type === 'group' && selectedGroupId === conv.id)
              }
              menuOpen={menuOpen === conv.id}
              acl={conv.acl}
              memberCount={conv.memberCount}
              isUnknown={conv.contact?.isUnknown}
              onSelect={handleSelect(conv)}
              onTogglePin={handleTogglePin(conv.id, conv.type)}
              onMenuToggle={() => setMenuOpen(menuOpen === conv.id ? null : conv.id)}
              onRemove={handleRemove(conv)}
              onToggleBlock={conv.type === 'dm' ? handleToggleBlock(conv.id) : undefined}
              onToggleMute={conv.type === 'dm' ? handleToggleMute(conv.id) : undefined}
              onToggleHide={conv.type === 'dm' ? handleToggleHide(conv.id) : undefined}
              onAddToContacts={conv.type === 'dm' && conv.contact?.isUnknown ? handleAddToContacts(conv) : undefined}
              onDragStart={handleDragStart(conv.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(conv.id)}
              onDrop={handleDrop(conv.id)}
            />
          ))}
        </div>
      )}

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        preselectedContactIds={[]}
      />

      {/* Add to Contacts Dialog */}
      {promoteDialogContact && (
        <AddToContactsDialog
          contact={promoteDialogContact}
          onClose={() => setPromoteDialogContact(null)}
          onSuccess={() => {
            setPromoteDialogContact(null);
            // Refresh contacts list
            // The store will auto-refresh via zustand
          }}
        />
      )}
    </div>
  );
}
