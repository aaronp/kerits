/**
 * Connection Panel (Simplified)
 *
 * Shows connection status - no manual connect/disconnect buttons needed!
 * MessageBus auto-connects when user logs in.
 */

import { useState } from 'react'
import { useConnection } from '../store/connection'
import { useIdentity } from '../store/identity'
import { Wifi, WifiOff, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ConnectionPanel() {
  const { status, error } = useConnection()
  const { currentUser } = useIdentity()
  const [copied, setCopied] = useState(false)

  async function handleCopyAid() {
    if (!currentUser) return

    await navigator.clipboard.writeText(currentUser.aid)
    setCopied(true)
    toast.success('AID copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 border-b bg-card/50">
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'connected' && <Wifi className="h-4 w-4 text-green-500" />}
            {status === 'disconnected' && <WifiOff className="h-4 w-4 text-muted-foreground" />}
            {status === 'connecting' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
            {status === 'error' && <WifiOff className="h-4 w-4 text-destructive" />}
            <span className="text-sm font-medium">
              {status === 'connected' && 'Connected'}
              {status === 'disconnected' && 'Disconnected'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'error' && 'Connection Error'}
            </span>
          </div>

          {/* Status badge - no manual controls needed */}
          {status === 'connected' && (
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full">
              Syncing
            </span>
          )}
        </div>

        {/* Current User AID */}
        {currentUser && (
          <div className="group flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono flex-1">{currentUser.aid.substring(0, 30)}...</span>
            <button
              onClick={handleCopyAid}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
              title="Copy AID"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
