/**
 * WelcomeScreen Component
 *
 * Allows users to create new identity or switch to existing user.
 */

import { useState, useEffect } from 'react';
import { UserPlus, Loader2, User, LogIn, ChevronRight } from 'lucide-react';
import { useIdentity } from '../store/identity';

export function WelcomeScreen() {
  const [username, setUsername] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createUser, switchUser, allUsers, loading, refreshUsers } = useIdentity();

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      return;
    }

    try {
      await createUser(username.trim());
      // Navigation handled by parent (App.tsx)
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  }

  async function handleSwitchUser(aid: string) {
    try {
      await switchUser(aid);
      // Navigation handled by parent (App.tsx)
    } catch (error) {
      console.error('Failed to switch user:', error);
    }
  }

  const hasExistingUsers = allUsers.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
      <div className="w-full max-w-md p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to MERITS</h1>
          <p className="text-muted-foreground">
            Secure messaging with KERI identity
          </p>
        </div>

        <div className="bg-card border rounded-lg shadow-lg p-6">
          {/* Existing Users List */}
          {hasExistingUsers && !showCreateForm && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-3">Select User</h2>
                <div className="space-y-2">
                  {allUsers.map((user) => (
                    <button
                      key={user.aid}
                      onClick={() => handleSwitchUser(user.aid)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {user.aid.substring(0, 24)}...
                        </div>
                      </div>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-2 px-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Create New Identity
              </button>
            </div>
          )}

          {/* Create User Form */}
          {(!hasExistingUsers || showCreateForm) && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-2"
                >
                  Choose your username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., Alice"
                  disabled={loading}
                  autoFocus
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This will generate a secure ED25519 keypair for you
                </p>
              </div>

              <button
                type="submit"
                disabled={!username.trim() || loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating identity...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Identity
                  </>
                )}
              </button>

              {showCreateForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to user list
                </button>
              )}
            </form>
          )}

          {/* Info Cards */}
          {!showCreateForm && !hasExistingUsers && (
            <div className="mt-6 space-y-3">
              <div className="text-xs bg-muted/50 rounded-lg p-3">
                <div className="font-medium mb-1">🔐 Secure by Design</div>
                <div className="text-muted-foreground">
                  Your keys are stored locally and never leave your device
                </div>
              </div>

              <div className="text-xs bg-muted/50 rounded-lg p-3">
                <div className="font-medium mb-1">🔄 KERI Compatible</div>
                <div className="text-muted-foreground">
                  Later, you can import a full KERI identity from KERITS
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>
            By creating an identity, you can send secure messages,
            <br />
            manage contacts, and participate in broadcasts
          </p>
        </div>
      </div>
    </div>
  );
}
