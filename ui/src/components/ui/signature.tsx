/**
 * Signature component - Display CESR signatures with copy and verify actions
 *
 * Similar to VisualId but specifically for cryptographic signatures
 */

import { useState } from 'react';
import { Button } from './button';
import { Copy, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Avatar from 'boring-avatars';

interface SignatureProps {
  /** The signature value (CESR format, e.g., "0B...") */
  value: string;
  /** Optional label */
  label?: string;
  /** Show copy button on hover */
  showCopy?: boolean;
  /** Show verify button on hover (requires publicKey and message) */
  showVerify?: boolean;
  /** Public key for signature verification (CESR format) */
  publicKey?: string;
  /** Message that was signed (typically the serialized event bytes) */
  message?: Uint8Array;
  /** Display size */
  small?: boolean;
  /** Avatar size */
  size?: number;
  /** Maximum characters to display */
  maxCharacters?: number;
  /** Additional CSS classes */
  className?: string;
}

export function Signature({
  value,
  label = 'Signature',
  showCopy = true,
  showVerify = true,
  publicKey,
  message,
  small = false,
  size = 40,
  maxCharacters = 12,
  className = '',
}: SignatureProps) {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
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
      title: 'Signature copied',
      description: `${value.substring(0, 24)}...`,
    });
  };

  const handleVerify = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!publicKey || !message) {
      toast({
        title: 'Cannot verify',
        description: 'Public key and message are required for verification',
      });
      return;
    }

    setVerifying(true);

    try {
      // Import verification classes
      const { Verfer, Cigar } = await import('@/../../src/cesr/signer');

      // Create verfer from public key
      const verfer = new Verfer({ qb64: publicKey });

      // Create cigar from signature
      const cigar = new Cigar({ qb64: value });

      // Verify the signature against the message
      const isValid = verfer.verify(cigar, message);

      setVerificationResult(isValid);

      toast({
        title: isValid ? 'Signature valid ✓' : 'Signature invalid ✗',
        description: isValid
          ? 'The signature is cryptographically valid'
          : 'The signature verification failed',
      });

      // Reset verification result after 5 seconds
      setTimeout(() => setVerificationResult(null), 5000);
    } catch (error) {
      console.error('Signature verification failed:', error);
      toast({
        title: 'Verification error',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setVerificationResult(false);
    } finally {
      setVerifying(false);
    }
  };

  // Truncate signature value
  const truncateValue = (val: string, max: number): string => {
    if (!val) return 'N/A';
    if (val.length <= max) return val;

    const availableChars = max - 3;
    const startChars = Math.floor(availableChars / 2);
    const endChars = Math.ceil(availableChars / 2);

    const start = val.slice(0, startChars);
    const end = val.slice(-endChars);
    return `${start}...${end}`;
  };

  const displayValue = truncateValue(value, maxCharacters);
  const avatarSize = small ? 20 : size;
  const gapClass = small ? 'gap-2' : 'gap-3';
  const labelClass = small
    ? 'text-xs font-medium text-muted-foreground'
    : 'font-medium text-muted-foreground';
  const valueClass = small ? 'text-xs font-mono' : 'text-xs font-mono';

  // Determine verification icon color
  const getVerificationColor = () => {
    if (verificationResult === true) return 'text-green-500';
    if (verificationResult === false) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const canVerify = showVerify && publicKey && message;

  return (
    <div
      className={`flex items-center ${gapClass} ${className} group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar
        size={avatarSize}
        name={value || 'N/A'}
        variant="beam"
        colors={['#4338ca', '#7c3aed', '#db2777', '#dc2626', '#ea580c']}
        square
      />
      <div className="flex-1 min-w-0">
        {label && <div className={labelClass}>{label}</div>}
        <div className={valueClass} title={value || 'N/A'}>
          {displayValue}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1">
        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`flex-shrink-0 transition-opacity ${isHovered || copied ? 'opacity-100' : 'opacity-0'
              }`}
            title="Copy signature"
            tabIndex={-1}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}

        {canVerify && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVerify}
            disabled={verifying}
            className={`flex-shrink-0 transition-opacity ${isHovered || verificationResult !== null ? 'opacity-100' : 'opacity-0'
              }`}
            title="Verify signature"
            tabIndex={-1}
          >
            {verifying ? (
              <ShieldCheck className="h-3 w-3 animate-spin" />
            ) : verificationResult === null ? (
              <ShieldCheck className="h-3 w-3" />
            ) : verificationResult ? (
              <ShieldCheck className={`h-3 w-3 ${getVerificationColor()}`} />
            ) : (
              <ShieldAlert className={`h-3 w-3 ${getVerificationColor()}`} />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
