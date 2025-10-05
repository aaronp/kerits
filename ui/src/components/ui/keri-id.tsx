import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { Button } from './button';
import { getAliasBySAID } from '@/lib/storage';
import { useToast } from './toast';

interface KeriIDProps {
  id: string;
  type?: 'kel' | 'tel' | 'schema' | 'acdc';
  showCopy?: boolean;
  className?: string;
}

export function KeriID({ id, type, showCopy = true, className = '' }: KeriIDProps) {
  const [alias, setAlias] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const loadAlias = async () => {
      if (!id) return;

      try {
        const aliasMapping = await getAliasBySAID(id);
        if (aliasMapping && aliasMapping.type === type) {
          setAlias(aliasMapping.alias);
        }
      } catch (error) {
        console.error('Failed to load alias:', error);
      }
    };

    loadAlias();
  }, [id, type]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    showToast('ID copied to clipboard');
  };

  if (!id) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        {alias ? (
          <div>
            <div className="font-medium">{alias}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {id}
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono break-all">
            {id}
          </div>
        )}
      </div>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 flex-shrink-0"
          title="Copy ID"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
