/**
 * MessagingView Component
 *
 * Self-contained messaging interface that can be integrated into any app.
 * Includes chat header, messages list, and input - decoupled from app skeleton.
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Copy, Check, CheckCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useContacts } from '../store/contacts';
import { useMessages } from '../store/messages';
import { useGroups } from '../store/groups';
import { useIdentity } from '../store/identity';
import { getDisplayStatus } from '../lib/dsl/messages/types';
import type { DetailedMessageStatus } from '../lib/dsl/messages/types';
import { toast } from 'sonner';

interface MessagingViewProps {
  /** Optional className for styling */
  className?: string;

  /** Optional custom header component */
  headerSlot?: React.ReactNode;

  /** Optional custom empty state */
  emptyState?: React.ReactNode;
}

export function MessagingView({ className, headerSlot, emptyState }: MessagingViewProps) {
  const { selectedContactAid, contacts } = useContacts();
  const { selectedGroupId, groups } = useGroups();
  const selectedContact = contacts.find((c) => c.aid === selectedContactAid);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)}>
      {headerSlot || <ChatHeader />}
      <ChatMessages emptyState={emptyState} />
      <ChatInput />
    </div>
  );
}

function ChatHeader() {
  const { selectedContactAid, contacts } = useContacts();
  const { selectedGroupId, groups } = useGroups();
  const selectedContact = contacts.find((c) => c.aid === selectedContactAid);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const [copied, setCopied] = useState(false);

  if (!selectedContact && !selectedGroup) {
    return (
      <div className="h-16 border-b bg-card px-4 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Select a contact or group to start messaging
        </div>
      </div>
    );
  }

  const displayName = selectedGroup
    ? selectedGroup.name
    : (selectedContact?.alias || selectedContact?.aid.substring(0, 20) || '');
  const initial = displayName.charAt(0).toUpperCase();

  const handleCopySaid = async () => {
    if (!selectedContact) return;
    try {
      await navigator.clipboard.writeText(selectedContact.aid);
      setCopied(true);
      toast.success('SAID copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Failed to copy SAID');
    }
  };

  return (
    <div className="h-16 border-b bg-card px-4 flex items-center justify-between group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{displayName}</p>
            {selectedContact && (
              <button
                onClick={handleCopySaid}
                className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Copy SAID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {selectedGroup ? `Group • ${selectedGroup.members.length} members` : selectedContact?.aid}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessages({ emptyState }: { emptyState?: React.ReactNode }) {
  const { selectedContactAid, contacts } = useContacts();
  const { selectedGroupId, getCanonicalMessages } = useGroups();
  const { messages: allMessages, refreshChannel, retryMessage } = useMessages();
  const { currentUser } = useIdentity();
  const selectedContact = contacts.find((c) => c.aid === selectedContactAid);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContactAid) {
      refreshChannel(selectedContactAid);
    }
  }, [selectedContactAid]);

  // Load group messages when group is selected and poll for updates
  useEffect(() => {
    if (selectedGroupId) {
      const loadMessages = () => {
        getCanonicalMessages(selectedGroupId).then(setGroupMessages);
      };

      loadMessages();
      const interval = setInterval(loadMessages, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [selectedGroupId]);

  // Get messages for selected contact or group
  const messages = selectedGroupId
    ? groupMessages
    : selectedContactAid
    ? (allMessages.get(selectedContactAid) || [])
    : [];

  // No contact or group selected - show empty state
  if (!selectedContact && !selectedGroupId) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        {emptyState || (
          <div className="text-center text-muted-foreground">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No conversation selected</p>
            <p className="text-sm">Choose a contact or group from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    );
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status icon component with tooltip
  const StatusIcon = ({ status, timestamp }: { status: DetailedMessageStatus; timestamp: number }) => {
    const displayStatus = getDisplayStatus(status);
    const time = new Date(timestamp).toLocaleString();

    if (displayStatus === 'sending') {
      return <span className="opacity-50" title="Sending...">○</span>;
    }
    if (displayStatus === 'sent') {
      return <Check className="w-3 h-3 opacity-50" title={`Sent at ${time}`} />;
    }
    if (displayStatus === 'delivered') {
      return <CheckCheck className="w-3 h-3 opacity-50" title={`Delivered at ${time}`} />;
    }
    if (displayStatus === 'read') {
      return <CheckCheck className="w-3 h-3 text-blue-400" title={`Read at ${time}`} />;
    }
    if (displayStatus === 'failed') {
      return <span className="text-destructive" title="Failed to send">✗</span>;
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isFromMe = msg.from === currentUser?.aid;
          const isFailed = getDisplayStatus(msg.status) === 'failed';
          const isRetrying = retrying.has(msg.id);

          const handleRetry = async () => {
            setRetrying(prev => new Set(prev).add(msg.id));
            try {
              await retryMessage(msg.id);
              toast.success('Message sent!');
            } catch (error) {
              toast.error('Still unable to send. Check your connection.');
            } finally {
              setRetrying(prev => {
                const next = new Set(prev);
                next.delete(msg.id);
                return next;
              });
            }
          };

          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isFromMe ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  isFromMe
                    ? isFailed
                      ? 'bg-destructive/20 border-2 border-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={cn(
                  "text-xs mt-1 flex items-center gap-1.5",
                  isFromMe
                    ? isFailed
                      ? 'text-destructive justify-end'
                      : 'text-primary-foreground/70 justify-end'
                    : 'text-muted-foreground'
                )}>
                  <span>{formatTime(msg.timestamp)}</span>
                  {isFromMe && <StatusIcon status={msg.status} timestamp={msg.timestamp} />}
                </div>

                {/* Failed message actions */}
                {isFromMe && isFailed && (
                  <div className="mt-2 pt-2 border-t border-destructive/30 flex items-center gap-2">
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                    {msg.error && (
                      <span className="text-xs text-destructive/80" title={msg.error}>
                        {msg.error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ChatInput() {
  const { selectedContactAid } = useContacts();
  const { selectedGroupId, sendMessage: sendGroupMessage } = useGroups();
  const { sendMessage } = useMessages();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const hasSelection = selectedContactAid || selectedGroupId;

  const handleSend = async () => {
    if (!message.trim() || !hasSelection || sending) return;

    setSending(true);
    try {
      if (selectedGroupId) {
        await sendGroupMessage(selectedGroupId, message.trim());
      } else if (selectedContactAid) {
        await sendMessage(selectedContactAid, message.trim());
      }
      setMessage('');
      // Don't show success toast - messages show their own status
    } catch (error) {
      console.error('[ChatInput] Send error:', error);

      // Show error toast with helpful message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      if (errorMessage.includes('Invalid signatures')) {
        toast.error('Authentication failed. Your key state may not be registered. Try refreshing the page.');
      } else if (errorMessage.includes('Not connected')) {
        toast.error('Not connected to message server. Check your connection.');
      } else {
        toast.error(`Failed to send: ${errorMessage}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-card p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={hasSelection ? "Type a message..." : "Select a contact or group to send a message"}
          disabled={!hasSelection}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!hasSelection || !message.trim() || sending}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
