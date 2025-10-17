/**
 * Status Footer - VS Code style status bar
 *
 * Shows connection status, errors, and other app-wide state
 */

import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useConnection } from '../merits/store/connection';

export function StatusFooter() {
  const { status, error } = useConnection();

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Connected',
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-600/10',
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-3 w-3 animate-pulse" />,
          text: 'Connecting...',
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-600/10',
        };
      case 'error':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: error ? `Error: ${error}` : 'Connection Error',
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-600/10',
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Disconnected',
          color: 'text-muted-foreground',
          bg: 'bg-muted',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <footer className="h-6 bg-accent/50 border-t border-border flex items-center px-4 text-xs flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-2 py-0.5 rounded ${statusInfo.bg}`}>
          <span className={statusInfo.color}>{statusInfo.icon}</span>
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </div>

        {/* Additional status items can be added here */}
      </div>

      {/* Right-aligned items */}
      <div className="ml-auto flex items-center gap-4">
        <div className="text-muted-foreground">
          KERITS
        </div>
      </div>
    </footer>
  );
}
