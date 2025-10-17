/**
 * Agent Stats Footer
 *
 * Shows MERITS agent statistics at the bottom of the UI
 */

import { useEffect, useState } from 'react';
import { Activity, Users, Clock, Heart } from 'lucide-react';
import { useConnection } from '../store/connection';
import { useContacts } from '../store/contacts';

export function AgentStatsFooter() {
  const { agentStats, status, clientHeartbeatInterval, client } = useConnection();
  const { contacts } = useContacts();
  const [timeSinceLastHeartbeat, setTimeSinceLastHeartbeat] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [onlineAids, setOnlineAids] = useState<string[]>([]);

  useEffect(() => {
    console.log('[AgentStatsFooter] Status:', status, 'AgentStats:', agentStats)
  }, [status, agentStats])

  // Calculate contacts count
  const contactsCount = contacts.length;

  // Update countdown timer and progress bar (counts DOWN from interval to 0)
  useEffect(() => {
    if (!agentStats) {
      setTimeSinceLastHeartbeat(0);
      setProgressPercent(0);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - agentStats.lastReceived;
      const remaining = Math.max(0, clientHeartbeatInterval - elapsed);
      setTimeSinceLastHeartbeat(remaining);

      // Calculate progress (how much time is REMAINING, so bar shrinks)
      const percent = Math.max(0, (remaining / clientHeartbeatInterval) * 100);
      setProgressPercent(percent);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [agentStats, clientHeartbeatInterval]);

  const isConnected = status === 'connected' && agentStats;
  const lastReceivedDate = agentStats ? new Date(agentStats.lastReceived).toISOString() : '';

  // Format time since last heartbeat
  const formatTimeSince = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="border-t bg-card px-6 py-1.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-6 text-xs">
        {/* Left side - Connection status */}
        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              {/* Server Health */}
              <div className="flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">Healthy</span>
              </div>

              {/* Total Online */}
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" />
                <span className="font-mono">{agentStats.onlineUsers}</span>
                <span className="text-muted-foreground">online</span>
              </div>

              {/* Contacts count */}
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="font-mono">{contactsCount}</span>
                <span className="text-muted-foreground">contacts</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse" />
              <span className="text-muted-foreground">
                {status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>

        {/* Right side - Metadata */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <>
              {/* Last Heartbeat with countdown and progress bar */}
              <div className="relative w-[100px] h-5 rounded bg-muted/30 overflow-hidden" title={lastReceivedDate}>
                {/* Progress bar - shrinks from right to left */}
                <div
                  className="absolute right-0 top-0 h-full bg-green-500/20 transition-all duration-100 ease-linear"
                  style={{
                    width: `${progressPercent}%`
                  }}
                />
                {/* Countdown text */}
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-xs">
                    {formatTimeSince(timeSinceLastHeartbeat)}
                  </span>
                </div>
              </div>

              {/* Server Version */}
              <div className="text-muted-foreground">
                v{agentStats.serverVersion}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
