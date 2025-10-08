import Avatar from 'boring-avatars';
import { Button } from './button';
import { Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { route } from '@/config';

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
  linkToGraph?: boolean;
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
  onCopy,
  linkToGraph = true,
}: VisualIdProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: `${label || 'ID'}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`,
    });
    onCopy?.(label);
  };

  // If variant is not specified, determine it from the value's hash
  const getVariant = (): 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus' => {
    if (variant) return variant;
    if (!value) return 'marble'; // Default variant if value is undefined

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
  const truncateValue = (val: string | undefined, max: number): string => {
    if (!val) return 'N/A';
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

  const ContentWrapper = linkToGraph && value ? Link : 'div';
  const wrapperProps = linkToGraph && value
    ? {
      to: route(`/graph?id=${value}`),
      className: `flex items-center ${gapClass} ${className} group hover:bg-muted/50 rounded-md transition-colors cursor-pointer`,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    }
    : {
      className: `flex items-center ${gapClass} ${className} group`,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    };

  return (
    // @ts-expect-error: TypeScript may complain about the dynamic ContentWrapper type (Link | 'div')
    <ContentWrapper {...wrapperProps}>
      <Avatar
        size={avatarSize}
        name={value || 'N/A'}
        variant={selectedVariant}
        colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
      />
      <div className="flex-1 min-w-0">
        <div className={labelClass}>{label}</div>
        <div
          className={valueClass}
          title={value || 'N/A'}
        >
          {displayValue}
        </div>
      </div>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={`flex-shrink-0 transition-opacity ${(isHovered || copied) ? 'opacity-100' : 'opacity-0'}`}
          title="Copy to clipboard"
          tabIndex={-1}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </ContentWrapper>
  );
}
