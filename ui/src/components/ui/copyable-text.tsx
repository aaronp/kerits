import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface CopyableTextProps {
  text: string;
  label?: string;
  className?: string;
  displayText?: string;
  onCopy?: () => void;
}

export function CopyableText({
  text,
  label,
  className,
  displayText,
  onCopy
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
        className
      )}
      onClick={handleCopy}
    >
      <div className="flex-1 text-xs font-mono text-muted-foreground break-all">
        {displayText || text}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
        title={label ? `Copy ${label}` : 'Copy'}
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
