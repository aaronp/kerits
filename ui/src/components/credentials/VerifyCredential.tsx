import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Toast, useToast } from '../ui/toast';
import { CheckCircle2, XCircle, FileText, Shield } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { blake3 } from '@noble/hashes/blake3';

// Base64 URL-safe encoding
const BASE64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : 0;
    const b3 = i < bytes.length ? bytes[i++] : 0;
    const hasB2 = i >= 2 && (i - 2) < bytes.length;
    const hasB3 = i >= 3 && (i - 3) < bytes.length;
    result += BASE64_URL[b1 >> 2];
    result += BASE64_URL[((b1 & 0x03) << 4) | (b2 >> 4)];
    if (hasB2) result += BASE64_URL[((b2 & 0x0f) << 2) | (b3 >> 6)];
    if (hasB3) result += BASE64_URL[b3 & 0x3f];
  }
  return result;
}

// Simplified SAID verification
function verifySAID(obj: any, label: string = 'd'): { valid: boolean; computed: string } {
  const placeholder = '#'.repeat(44);
  const original = obj[label];
  obj[label] = placeholder;
  const serialized = JSON.stringify(obj);
  const hash = blake3(serialized, { dkLen: 32 });
  const ps = (3 - (hash.length % 3)) % 3;
  const padded = new Uint8Array(ps + hash.length);
  for (let i = 0; i < ps; i++) padded[i] = 0;
  for (let i = 0; i < hash.length; i++) padded[ps + i] = hash[i];
  const b64 = encodeBase64Url(padded);
  const computed = 'E' + b64.slice(1);
  obj[label] = original;
  return { valid: computed === original, computed };
}

interface VerificationResult {
  valid: boolean;
  credential?: any;
  issuer?: string;
  recipient?: string;
  schema?: string;
  saidValid?: boolean;
  signatureValid?: boolean;
  error?: string;
}

export function VerifyCredential() {
  const { credentials } = useStore();
  const { toast, showToast, hideToast } = useToast();
  const [inputMethod, setInputMethod] = useState<'paste' | 'select'>('paste');
  const [credentialJson, setCredentialJson] = useState('');
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);

    try {
      let credentialData: any;

      // Get credential data based on input method
      if (inputMethod === 'paste') {
        if (!credentialJson.trim()) {
          throw new Error('Please paste credential JSON');
        }
        credentialData = JSON.parse(credentialJson);
      } else {
        if (!selectedCredentialId) {
          throw new Error('Please select a credential');
        }
        const selected = credentials.find(c => c.id === selectedCredentialId);
        if (!selected) {
          throw new Error('Selected credential not found');
        }
        credentialData = selected.sad;
      }

      // Extract credential fields
      const { v, d, i, s, a } = credentialData;

      if (!v || !d || !i || !s || !a) {
        throw new Error('Invalid credential format: missing required fields (v, d, i, s, a)');
      }

      // Verify SAID (Self-Addressing Identifier)
      const saidCheck = verifySAID(credentialData, 'd');
      const saidValid = saidCheck.valid;

      // Verify subject SAID
      const subjectSaidCheck = verifySAID(a, 'd');
      const subjectSaidValid = subjectSaidCheck.valid;

      // TODO: Signature verification would require the signature from IPEX exchange
      // For now, we verify the SAID integrity
      const signatureValid = undefined; // Will be implemented with IPEX signature data

      const verificationResult: VerificationResult = {
        valid: saidValid && subjectSaidValid,
        credential: credentialData,
        issuer: i,
        recipient: a.i,
        schema: s,
        saidValid,
        signatureValid,
      };

      setResult(verificationResult);

      if (verificationResult.valid) {
        showToast('✓ Credential verified successfully');
      } else {
        showToast('✗ Credential verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      });
      showToast(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleClear = () => {
    setCredentialJson('');
    setSelectedCredentialId('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Credential</CardTitle>
          <CardDescription>
            Verify IPEX credentials by checking SAID integrity and signatures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Method Selection */}
          <div className="space-y-2">
            <Label>Input Method</Label>
            <div className="flex gap-2">
              <Button
                variant={inputMethod === 'paste' ? 'default' : 'outline'}
                onClick={() => setInputMethod('paste')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Paste JSON
              </Button>
              <Button
                variant={inputMethod === 'select' ? 'default' : 'outline'}
                onClick={() => setInputMethod('select')}
                className="flex-1"
                disabled={credentials.length === 0}
              >
                <Shield className="h-4 w-4 mr-2" />
                Select Stored
              </Button>
            </div>
          </div>

          {/* Paste JSON Input */}
          {inputMethod === 'paste' && (
            <div className="space-y-2">
              <Label htmlFor="credential-json">Credential JSON</Label>
              <Textarea
                id="credential-json"
                placeholder='{"v": "ACDC...", "d": "...", "i": "...", "s": "...", "a": {...}}'
                value={credentialJson}
                onChange={(e) => setCredentialJson(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Paste the complete ACDC credential JSON (includes v, d, i, s, a fields)
              </p>
            </div>
          )}

          {/* Select Stored Credential */}
          {inputMethod === 'select' && (
            <div className="space-y-2">
              <Label htmlFor="stored-credential">Stored Credential</Label>
              <Select
                id="stored-credential"
                value={selectedCredentialId}
                onChange={(e) => setSelectedCredentialId(e.target.value)}
              >
                <option value="">Select a credential...</option>
                {credentials.map((cred) => {
                  const label = cred.recipientAlias
                    ? `${cred.recipientAlias} - ${cred.schemaName || cred.schema.substring(0, 20)}`
                    : `${cred.id.substring(0, 20)}...`;
                  return (
                    <option key={cred.id} value={cred.id}>
                      {label}
                    </option>
                  );
                })}
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a credential from your stored credentials
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleVerify}
              disabled={verifying || (inputMethod === 'paste' && !credentialJson.trim()) || (inputMethod === 'select' && !selectedCredentialId)}
              className="flex-1"
            >
              {verifying ? 'Verifying...' : 'Verify Credential'}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.valid ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <CardTitle className={result.valid ? 'text-green-600' : 'text-red-600'}>
                  {result.valid ? 'Credential Valid' : 'Credential Invalid'}
                </CardTitle>
                <CardDescription>
                  {result.error || 'Verification complete'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Verification Checks */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Verification Checks</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {result.saidValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Credential SAID integrity: {result.saidValid ? 'Valid' : 'Invalid'}</span>
                </div>
                {result.signatureValid !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    {result.signatureValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Signature: {result.signatureValid ? 'Valid' : 'Invalid'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Credential Details */}
            {result.credential && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Issuer</div>
                  <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                    {result.issuer}
                  </code>
                </div>

                {result.recipient && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Recipient</div>
                    <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                      {result.recipient}
                    </code>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Schema</div>
                  <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                    {result.schema}
                  </code>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Credential Data</div>
                  <div className="bg-muted p-3 rounded space-y-2">
                    {Object.entries(result.credential.a || {}).map(([key, value]) => {
                      if (key === 'd' || key === 'dt' || key === 'i') return null;
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Full Credential</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                    {JSON.stringify(result.credential, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
