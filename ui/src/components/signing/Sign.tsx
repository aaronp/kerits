import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import { diger } from '@kerits/diger';
import { sign, encodeBase64Url } from '@kerits/sign';

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

type KeyValuePair = {
  id: string;
  key: string;
  value: string;
};

export function Sign() {
  const { identities } = useStore();
  const { currentUser } = useUser();
  const [pairs, setPairs] = useState<KeyValuePair[]>([
    { id: crypto.randomUUID(), key: '', value: '' }
  ]);
  const [hash, setHash] = useState('');
  const [signature, setSignature] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Get JSON object from pairs
  const getJsonObject = useCallback(() => {
    const obj: Record<string, string> = {};
    pairs.forEach(pair => {
      if (pair.key.trim()) {
        obj[pair.key] = pair.value;
      }
    });
    return obj;
  }, [pairs]);

  // Calculate hash and signature with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      const jsonObj = getJsonObject();

      // Only calculate if there's at least one valid key
      const hasValidKeys = Object.keys(jsonObj).length > 0;

      if (hasValidKeys) {
        // Calculate hash
        const jsonString = JSON.stringify(jsonObj);
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
      } else {
        setHash('');
        setSignature('');
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [pairs, currentUser, identities, getJsonObject]);

  const addPair = () => {
    setPairs([...pairs, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const removePair = (id: string) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter(pair => pair.id !== id));
    }
  };

  const updatePair = (id: string, field: 'key' | 'value', newValue: string) => {
    setPairs(pairs.map(pair =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign Data</CardTitle>
          <CardDescription>
            Create arbitrary key-value pairs and sign the resulting data with your identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hash Display */}
          <div className="space-y-2">
            <Label>Data Hash</Label>
            <p className="font-mono text-xs text-muted-foreground break-all p-3 bg-muted rounded-md border min-h-[2.5rem] flex items-center">
              {hash || 'Hash will appear here...'}
            </p>
          </div>

          {/* Signature Display */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <p className="font-mono text-xs text-muted-foreground break-all p-3 bg-muted rounded-md border min-h-[2.5rem] flex items-center">
              {signature || 'Signature will appear here...'}
            </p>
          </div>

          {/* Key-Value Pairs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Data Fields</Label>
              <Button
                onClick={addPair}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {pairs.map((pair) => (
                <div key={pair.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Key"
                      value={pair.key}
                      onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Value"
                      value={pair.value}
                      onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => removePair(pair.id)}
                    size="icon"
                    variant="ghost"
                    disabled={pairs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
            >
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Details
            </button>

            {showDetails && (
              <div className="mt-4 space-y-2">
                <Label>JSON Representation</Label>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto border">
                  {JSON.stringify(getJsonObject(), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
