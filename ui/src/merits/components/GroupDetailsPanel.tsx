/**
 * Group Details Panel
 *
 * Shows group members and their message read status
 */

import { Users, Check, CheckCheck } from 'lucide-react';
import { useContacts } from '../store/contacts';
import type { Group, GroupMessage } from '../lib/dsl/groups/types';

interface GroupDetailsPanelProps {
  group: Group;
  messages: GroupMessage[];
}

export function GroupDetailsPanel({ group, messages }: GroupDetailsPanelProps) {
  const { contacts } = useContacts();

  // Get the latest canonical message ID
  const latestMessage = messages
    .filter(m => m.status === 'canonical')
    .sort((a, b) => (b.seq || 0) - (a.seq || 0))[0];

  const getMemberStatus = (member: typeof group.members[0]) => {
    if (!latestMessage) return 'none';
    if (!member.lastSeenMessageId) return 'none';
    if (member.lastSeenMessageId === latestMessage.id) return 'seen';
    return 'partial';
  };

  const getContactDisplayName = (aid: string) => {
    const contact = contacts.find(c => c.aid === aid);
    return contact?.alias || aid.substring(0, 20);
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="h-16 border-b px-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-muted-foreground" />
        <h3 className="font-semibold">Group Details</h3>
      </div>

      {/* Group Info */}
      <div className="p-4 border-b">
        <div className="text-sm text-muted-foreground mb-1">Group Name</div>
        <div className="font-medium">{group.name}</div>
        <div className="text-xs text-muted-foreground mt-3">
          {group.members.length} members • Created {new Date(group.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="text-sm font-medium mb-3">Members</div>
          <div className="space-y-2">
            {group.members.map((member) => {
              const status = getMemberStatus(member);
              const displayName = getContactDisplayName(member.aid);
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={member.aid}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    {initial}
                  </div>

                  {/* Name and Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {displayName}
                      </span>
                      {member.role === 'creator' && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          Creator
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {member.aid}
                    </div>
                  </div>

                  {/* Read Status Icon */}
                  <div className="flex-shrink-0">
                    {status === 'seen' && (
                      <CheckCheck className="w-4 h-4 text-blue-400" title="Seen latest message" />
                    )}
                    {status === 'partial' && (
                      <Check className="w-4 h-4 opacity-50" title="Has not seen latest message" />
                    )}
                    {status === 'none' && (
                      <span className="w-4 h-4 opacity-30" title="No messages seen">○</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {messages.filter(m => m.status === 'canonical').length}
            </div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {messages.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
