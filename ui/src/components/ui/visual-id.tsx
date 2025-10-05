import Avatar from 'boring-avatars';
import { Button } from './button';
import { Copy } from 'lucide-react';

interface VisualIdProps {
  label: string;
  value: string;
  showCopy?: boolean;
  variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
  size?: number;
  maxCharacters?: number;
  className?: string;
  onCopy?: (label: string) => void;
}

export function VisualId({
  label,
  value,
  showCopy = true,
  variant,
  size = 40,
  maxCharacters = 12,
  className = '',
  onCopy
}: VisualIdProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    onCopy?.(label);
  };

  // If variant is not specified, determine it from the value's hash
  const getVariant = (): 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus' => {
    if (variant) return variant;

    const variants: Array<'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'> = [
      'marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'
    ];

    // Simple hash function to get a number from the string
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use modulus to select variant
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  };

  // Truncate value with ellipsis in the middle if longer than maxCharacters
  const truncateValue = (val: string, max: number): string => {
    if (val.length <= max) return val;

    const halfMax = Math.floor(max / 2);
    const start = val.slice(0, halfMax);
    const end = val.slice(-halfMax);
    return `${start}...${end}`;
  };

  const selectedVariant = getVariant();
  const displayValue = truncateValue(value, maxCharacters);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar
        size={size}
        name={value}
        variant={selectedVariant}
        colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div
          className="text-sm font-mono cursor-help"
          title={value}
        >
          {displayValue}
        </div>
      </div>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0"
          title="Copy to clipboard"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
