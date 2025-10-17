/**
 * UserSwitcher Component
 *
 * Clean, reusable component for switching between users and logout.
 * Can be easily embedded in KERITS when integrated.
 */

import { useState } from 'react';
import { User, LogOut, UserPlus, Trash2, ChevronDown } from 'lucide-react';
import { useIdentity } from '../store/identity';
import type { MeritsUser } from '../lib/identity/types';

export function UserSwitcher() {
  const { currentUser, allUsers, switchUser, logout, removeUser } = useIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (!currentUser) {
    return null;
  }

  const otherUsers = allUsers.filter((u) => u.aid !== currentUser.aid);

  async function handleSwitchUser(aid: string) {
    try {
      await switchUser(aid);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch user:', error);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  async function handleRemoveUser(aid: string) {
    try {
      await removeUser(aid);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  }

  return (
    <div className="relative">
      {/* Current User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors w-full"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate">{currentUser.username}</div>
          <div className="text-xs text-muted-foreground truncate font-mono">
            {currentUser.aid.substring(0, 20)}...
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Other Users */}
            {otherUsers.length > 0 && (
              <div className="border-b">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  Switch User
                </div>
                {otherUsers.map((user) => (
                  <UserItem
                    key={user.aid}
                    user={user}
                    onSwitch={() => handleSwitchUser(user.aid)}
                    onDelete={() => setShowDeleteConfirm(user.aid)}
                    showDeleteConfirm={showDeleteConfirm === user.aid}
                    onConfirmDelete={() => handleRemoveUser(user.aid)}
                    onCancelDelete={() => setShowDeleteConfirm(null)}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="p-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded transition-colors text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface UserItemProps {
  user: MeritsUser;
  onSwitch: () => void;
  onDelete: () => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function UserItem({
  user,
  onSwitch,
  onDelete,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: UserItemProps) {
  if (showDeleteConfirm) {
    return (
      <div className="px-3 py-2 bg-destructive/10 border-l-2 border-destructive">
        <div className="text-sm mb-2">Delete {user.username}?</div>
        <div className="flex gap-2">
          <button
            onClick={onConfirmDelete}
            className="flex-1 px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="flex-1 px-3 py-1 text-xs border rounded hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center hover:bg-muted/50 group">
      <button
        onClick={onSwitch}
        className="flex-1 flex items-center gap-3 px-3 py-2 text-sm"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium truncate">{user.username}</div>
          <div className="text-xs text-muted-foreground truncate font-mono">
            {user.aid.substring(0, 20)}...
          </div>
        </div>
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
