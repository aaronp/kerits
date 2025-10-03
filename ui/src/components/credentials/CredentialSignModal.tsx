import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { Copy, Pencil } from 'lucide-react';
import { diger } from '@kerits/diger';
import { sign, encodeBase64Url } from '@kerits/sign';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import type { StoredCredential } from '@/lib/storage';

interface CredentialSignModalProps {
  credential: StoredCredential | null;
  isOpen: boolean;
  onClose: () => void;
}

// Encode private key (32 bytes) to CESR format with 'A' prefix
function encodePrivateKeyCESR(privateKeyHex: string): string {
  const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
  const code = 'A'; // Ed25519 seed prefix
  const ps = (3 - (privateKeyBytes.length % 3)) % 3;
  const padded = new Uint8Array(ps + privateKeyBytes.length);
  for (let i = 0; i < ps; i++) padded[i] = 0;
  for (let i = 0; i < privateKeyBytes.length; i++) padded[ps + i] = privateKeyBytes[i];
  const b64 = encodeBase64Url(padded);
  const sliceOffset = code.length % 4;
  return code + b64.slice(sliceOffset);
}

export function CredentialSignModal({ credential, isOpen, onClose }: CredentialSignModalProps) {
  const { identities } = useStore();
  const { currentUser } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const [challenge, setChallenge] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [hash, setHash] = useState('');
  const [signature, setSignature] = useState('');
  const [copied, setCopied] = useState<'hash' | 'signature' | null>(null);

  // Calculate hash and signature with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!credential || !challenge || !walletAddress) {
        setHash('');
        setSignature('');
        return;
      }

      try {
        // Create data object: credential + challenge + wallet
        const dataToSign = {
          credential: credential.sad,
          challenge: challenge,
          wallet: walletAddress,
        };

        // Calculate hash
        const jsonString = JSON.stringify(dataToSign);
        const dataHash = await diger(jsonString);
        setHash(dataHash);

        // Calculate signature using current user's identity
        if (currentUser) {
          const identity = identities.find(i => i.alias.toLowerCase() === currentUser.name.toLowerCase());
          if (identity?.currentKeys?.private) {
            try {
              // Convert hex private key to CESR format
              const privateKeyCESR = encodePrivateKeyCESR(identity.currentKeys?.private);

              // Sign the hash using the kerits sign function
              const sig = await sign(dataHash, privateKeyCESR);

              setSignature(sig);
            } catch (error) {
              console.error('Error signing:', error);
              setSignature('Error signing data');
            }
          } else {
            setSignature('');
          }
        } else {
          setSignature('');
        }
      } catch (error) {
        console.error('Error calculating hash/signature:', error);
        setHash('Error calculating hash');
        setSignature('');
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [credential, challenge, walletAddress, currentUser, identities]);

  const handleCopy = async (text: string, type: 'hash' | 'signature') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    showToast(type === 'hash' ? 'Hash copied to clipboard' : 'Signature copied to clipboard');
  };

  const handleClose = () => {
    setChallenge('');
    setWalletAddress('');
    setHash('');
    setSignature('');
    setCopied(null);
    onClose();
  };

  if (!credential) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Sign Credential
          </DialogTitle>
          <DialogDescription>
            Sign this credential with a challenge and wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Challenge Input */}
          <div className="space-y-2">
            <Label htmlFor="challenge">Challenge</Label>
            <Input
              id="challenge"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="Enter challenge string..."
            />
          </div>

          {/* Wallet Address Input */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address..."
            />
          </div>

          {/* Hash Output */}
          <div className="space-y-2">
            <Label>Hash</Label>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted-foreground break-all p-3 bg-muted rounded-md border flex-1 min-h-[2.5rem] flex items-center">
                {hash || 'Hash will appear here...'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(hash, 'hash')}
                disabled={!hash}
                title="Copy hash"
              >
                <Copy className={`h-4 w-4 ${copied === 'hash' ? 'text-green-600' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Signature Output */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted-foreground break-all p-3 bg-muted rounded-md border flex-1 min-h-[2.5rem] flex items-center">
                {signature || 'Signature will appear here...'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(signature, 'signature')}
                disabled={!signature}
                title="Copy signature"
              >
                <Copy className={`h-4 w-4 ${copied === 'signature' ? 'text-green-600' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </Dialog>
  );
}
