import { useEffect, useState } from 'react'
import { useConnection } from '../store/connection'
import { useIdentity } from '../store/identity'
import { Wifi, WifiOff, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ConnectionPanel() {
  const { status, serverUrl, error, connect, disconnect } = useConnection()
  const { currentUser } = useIdentity()
  const [copied, setCopied] = useState(false)

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  // Update connection store when current user changes
  useEffect(() => {
    if (currentUser) {
      useConnection.getState().setAid(currentUser.aid)
    }
  }, [currentUser])

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

          {!isConnected && !isConnecting && currentUser && (
            <button
              onClick={connect}
              className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Connect
            </button>
          )}

          {isConnected && (
            <button
              onClick={disconnect}
              className="text-xs px-3 py-1 border rounded hover:bg-muted transition-colors"
            >
              Disconnect
            </button>
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

        {/* Server URL (collapsed when connected) */}
        {!isConnected && (
          <div className="text-xs text-muted-foreground">
            {serverUrl}
          </div>
        )}
      </div>
    </div>
  )
}
