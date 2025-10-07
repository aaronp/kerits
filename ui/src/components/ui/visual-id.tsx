import Avatar from 'boring-avatars';
import { Button } from './button';
import { Copy } from 'lucide-react';

interface VisualIdProps {
  label: string;
  value: string;
  showCopy?: boolean;
  bold?: boolean;
  small?: boolean;
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
  bold = false,
  small = false,
  variant,
  size = 40,
  maxCharacters = 8,
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
  // Total length including "..." should equal max characters
  const truncateValue = (val: string, max: number): string => {
    if (val.length <= max) return val;

    // Reserve 3 characters for "..."
    const availableChars = max - 3;
    const startChars = Math.floor(availableChars / 2);
    const endChars = Math.ceil(availableChars / 2);

    const start = val.slice(0, startChars);
    const end = val.slice(-endChars);
    return `${start}...${end}`;
  };

  const selectedVariant = getVariant();
  const displayValue = truncateValue(value, maxCharacters);

  const avatarSize = small ? 24 : size;
  const gapClass = small ? 'gap-2' : 'gap-3';
  const labelClass = small
    ? 'text-xs font-medium text-muted-foreground'
    : bold
      ? 'text-foreground font-semibold font-8xl'
      : 'font-medium text-muted-foreground';
  const valueClass = small ? 'text-xs font-mono' : 'text-xs font-mono';

  return (
    <div className={`flex items-center ${gapClass} ${className}`}>
      <Avatar
        size={avatarSize}
        name={value}
        variant={selectedVariant}
        colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
      />
      <div className="flex-1 min-w-0">
        <div className={labelClass}>{label}</div>
        <div
          className={valueClass}
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
