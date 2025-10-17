/**
 * Conversation Item Component
 *
 * Unified item for both DMs and groups with pinning and unread tracking.
 */

import { User, Users, MoreVertical, Trash2, Ban, BellOff, EyeOff, Check, UserPlus } from 'lucide-react';
import { UnreadBadge } from './UnreadBadge';
import { PinButton } from './PinButton';
import type { ACLEntry } from '../lib/dsl/acl/types';

type ConversationType = 'dm' | 'group';

interface ConversationItemProps {
  id: string;
  type: ConversationType;
  displayName: string;
  lastMessagePreview?: string;
  lastMessageTime?: number;
  unreadCount: number;
  isPinned: boolean;
  selected: boolean;
  menuOpen: boolean;
  acl?: ACLEntry | null;
  memberCount?: number; // For groups
  isUnknown?: boolean; // For unknown contacts

  // Handlers
  onSelect: () => void;
  onTogglePin: () => void;
  onMenuToggle: () => void;
  onRemove: () => void;
  onToggleBlock?: () => void;
  onToggleMute?: () => void;
  onToggleHide?: () => void;
  onAddToContacts?: () => void;

  // Drag & Drop
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function ConversationItem({
  type,
  displayName,
  lastMessagePreview,
  lastMessageTime,
  unreadCount,
  isPinned,
  selected,
  menuOpen,
  acl,
  memberCount,
  isUnknown,
  onSelect,
  onTogglePin,
  onMenuToggle,
  onRemove,
  onToggleBlock,
  onToggleMute,
  onToggleHide,
  onAddToContacts,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ConversationItemProps) {
  const Icon = type === 'group' ? Users : User;

  const formattedTime = lastMessageTime
    ? formatTime(lastMessageTime)
    : null;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-3 hover:bg-muted/50 cursor-pointer border-b relative ${
        selected ? 'bg-primary/10' : ''
      }`}
      onClick={onSelect}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
      }`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {displayName}
            {type === 'group' && memberCount && (
              <span className="text-muted-foreground ml-1">({memberCount})</span>
            )}
          </span>

          {/* ACL Badges */}
          {acl?.blocked && (
            <span title="Blocked">
              <Ban className="w-3 h-3 text-red-500 flex-shrink-0" />
            </span>
          )}
          {acl?.muted && (
            <span title="Muted">
              <BellOff className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            </span>
          )}
          {acl?.hidden && (
            <span title="Hidden">
              <EyeOff className="w-3 h-3 text-gray-500 flex-shrink-0" />
            </span>
          )}
          {isUnknown && (
            <div className="text-xs text-muted-foreground flex-shrink-0">Unknown</div>
          )}
        </div>

        {/* Last Message Preview */}
        {lastMessagePreview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMessagePreview}
          </p>
        )}
      </div>

      {/* Time and Pin/Menu Controls */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {formattedTime && (
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        )}

        <div className="flex items-center gap-1">
          {/* Pin Button (shows on hover) */}
          <PinButton
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />

          {/* Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1 hover:bg-muted/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Unread Badge */}
      <UnreadBadge count={unreadCount} />

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-2 top-14 bg-card border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
          {/* Add to Contacts (for unknown contacts) */}
          {isUnknown && onAddToContacts && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToContacts();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm text-primary"
              >
                <UserPlus className="w-4 h-4" />
                Add to Contacts
              </button>
              <div className="border-t my-1" />
            </>
          )}

          {onToggleBlock && (
            <button
              onClick={onToggleBlock}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm"
            >
              {acl?.blocked ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              {acl?.blocked ? 'Unblock' : 'Block'}
            </button>
          )}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm"
            >
              {acl?.muted ? <Check className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {acl?.muted ? 'Unmute' : 'Mute'}
            </button>
          )}
          {onToggleHide && (
            <button
              onClick={onToggleHide}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm"
            >
              {acl?.hidden ? <Check className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {acl?.hidden ? 'Unhide' : 'Hide'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
