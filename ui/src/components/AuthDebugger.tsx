/**
 * AuthDebugger - Debug UI for KERI challenge-response authentication
 *
 * Allows manual step-through of the authentication flow:
 * 1. View key state (AID, keys, ksn)
 * 2. Issue challenge
 * 3. Sign payload
 * 4. Verify signature
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useConnection } from '../merits/store/connection';
import { useUser } from '../lib/user-provider';
import { useAccount } from '../lib/account-provider';

interface KeyState {
  aid: string;
  ksn: number;
  keys: string[];
  signerPublicKey: string;
  threshold: string;
  lastEvtSaid: string;
}

interface Challenge {
  challengeId: string;
  payload: any;
}

interface SignatureResult {
  signatures: string[];
  canonical: string;
}

export function AuthDebugger() {
  const [keyState, setKeyState] = useState<KeyState | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { messageBus } = useConnection();
  const { currentUser } = useUser();
  const { currentAccountAlias } = useAccount();

  // Step 1: Load key state from KERITS
  const loadKeyState = async () => {
    try {
      setError(null);

      if (!currentUser) {
        setError('No user logged in');
        return;
      }

      if (!currentAccountAlias) {
        setError('No account selected');
        return;
      }

      const { getDSL } = await import('../lib/dsl');
      const { getMessagingIdentity } = await import('../lib/messaging-bridge');

      const identity = await getMessagingIdentity(currentUser.id, currentAccountAlias);
      const dsl = await getDSL(currentUser.id);
      const accountDsl = await dsl.account(currentAccountAlias);
      if (!accountDsl) throw new Error('Account not found');

      const kelEvents = await accountDsl.getKel();
      const latestEvent = kelEvents[kelEvents.length - 1];
      const ked = latestEvent.meta?.ked || latestEvent;

      // CRITICAL: Use the Signer's ACTUAL public key, not the KEL key
      // The KEL might have a different key than what the Signer actually has
      const actualSignerKey = identity.signer.verfer.qb64;

      const state: KeyState = {
        aid: identity.aid,
        ksn: identity.ksn,
        keys: [actualSignerKey], // Use signer's actual key, not KEL
        signerPublicKey: actualSignerKey,
        threshold: ked.kt || ked.threshold || '1',
        lastEvtSaid: ked.d || latestEvent.meta?.d || '',
      };

      console.log('[AuthDebugger] KEL keys:', ked.k || ked.keys || []);
      console.log('[AuthDebugger] Signer actual key:', actualSignerKey);
      console.log('[AuthDebugger] Keys match KEL?', (ked.k || ked.keys || []).includes(actualSignerKey));

      setKeyState(state);
      console.log('[AuthDebugger] Loaded key state:', state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load key state';
      setError(message);
      console.error('[AuthDebugger] Error:', err);
    }
  };

  // Step 2: Issue challenge from Convex
  const issueChallenge = async () => {
    if (!keyState) {
      setError('Load key state first');
      return;
    }

    try {
      setError(null);
      const { ConvexClient } = await import('convex/browser');
      const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://accurate-penguin-901.convex.cloud';
      const client = new ConvexClient(convexUrl);

      try {
        // First, register the key state
        console.log('[AuthDebugger] Registering key state:', keyState);
        await client.mutation('auth:registerKeyState' as any, {
          aid: keyState.aid,
          ksn: keyState.ksn,
          keys: keyState.keys,
          threshold: keyState.threshold,
          lastEvtSaid: keyState.lastEvtSaid,
        });
        console.log('[AuthDebugger] Key state registered');

        // Now issue challenge
        // Compute args hash for a test message
        const testArgs = {
          recpAid: 'ETestRecipientAID1234567890123456789012345',
          ctHash: 'test-ciphertext-hash-1234567890',
          ttl: 86400000,
          alg: '',
          ek: '',
        };

        const argsHash = await client.query('auth:computeHash' as any, {
          args: testArgs
        });

        console.log('[AuthDebugger] Args hash:', argsHash);

        // Issue challenge
        const result = await client.mutation('auth:issueChallenge' as any, {
          aid: keyState.aid,
          purpose: 'send',
          argsHash,
        });

        setChallenge(result);
        console.log('[AuthDebugger] Challenge issued:', result);
      } finally {
        client.close();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to issue challenge';
      setError(message);
      console.error('[AuthDebugger] Error:', err);
    }
  };

  // Step 3: Sign challenge payload with KERITS Signer
  const signChallenge = async () => {
    if (!keyState || !challenge) {
      setError('Load key state and issue challenge first');
      return;
    }

    try {
      setError(null);

      if (!currentUser) {
        setError('No user logged in');
        return;
      }

      if (!currentAccountAlias) {
        setError('No account selected');
        return;
      }

      const { getMessagingIdentity } = await import('../lib/messaging-bridge');
      const { signPayload } = await import('../lib/keri-signer');

      const identity = await getMessagingIdentity(currentUser.id, currentAccountAlias);

      // Sign the challenge payload
      const sigs = await signPayload(challenge.payload, identity.signer, 0);

      // Also show canonical form
      const canonical = JSON.stringify(
        challenge.payload,
        Object.keys(challenge.payload).sort()
      );

      setSignature({
        signatures: sigs,
        canonical,
      });

      console.log('[AuthDebugger] Signatures created:', sigs);
      console.log('[AuthDebugger] Canonical payload:', canonical);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign challenge';
      setError(message);
      console.error('[AuthDebugger] Error:', err);
    }
  };

  // Step 4: Verify signature on backend
  const verifySignature = async () => {
    if (!keyState || !challenge || !signature) {
      setError('Complete all previous steps first');
      return;
    }

    try {
      setError(null);

      console.log('[AuthDebugger] Verifying with:');
      console.log('  Challenge ID:', challenge.challengeId);
      console.log('  Challenge nonce:', challenge.payload.nonce);
      console.log('  Signatures:', signature.signatures);
      console.log('  KSN:', keyState.ksn);

      const { ConvexClient } = await import('convex/browser');
      const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://accurate-penguin-901.convex.cloud';
      const client = new ConvexClient(convexUrl);

      try {
        // Try to verify using a test mutation that calls verifyAuth
        const result = await client.mutation('auth:debugVerify' as any, {
          challengeId: challenge.challengeId,
          sigs: signature.signatures,
          ksn: keyState.ksn,
        });

        setVerificationResult(result);
        console.log('[AuthDebugger] Verification result:', result);
      } catch (err) {
        // Verification failed - capture the error details
        const message = err instanceof Error ? err.message : String(err);
        setVerificationResult({ success: false, error: message });
        console.error('[AuthDebugger] Verification failed:', err);
      } finally {
        client.close();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify signature';
      setError(message);
      console.error('[AuthDebugger] Error:', err);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>KERI Authentication Debugger</CardTitle>
          <CardDescription>
            Step through the challenge-response authentication flow to debug signature issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Step 1: Key State */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">1. Key State</h3>
              <Button onClick={loadKeyState} size="sm">
                Load Key State
              </Button>
            </div>
            {keyState && (
              <div className="p-4 bg-gray-50 rounded text-xs font-mono space-y-1">
                <div><strong>AID:</strong> {keyState.aid}</div>
                <div><strong>KSN:</strong> {keyState.ksn}</div>
                <div><strong>Threshold:</strong> {keyState.threshold}</div>
                <div><strong>Signer Public Key:</strong> {keyState.signerPublicKey}</div>
                <div><strong>KEL Keys:</strong> [{keyState.keys.join(', ')}]</div>
                <div className={keyState.keys.includes(keyState.signerPublicKey) ? 'text-green-600' : 'text-red-600'}>
                  <strong>Match:</strong> {keyState.keys.includes(keyState.signerPublicKey) ? '✓ Yes' : '✗ No - MISMATCH!'}
                </div>
                <div><strong>Last Event SAID:</strong> {keyState.lastEvtSaid}</div>
              </div>
            )}
          </div>

          {/* Step 2: Challenge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">2. Challenge</h3>
              <Button
                onClick={issueChallenge}
                size="sm"
                disabled={!keyState}
              >
                Issue Challenge
              </Button>
            </div>
            {challenge && (
              <div className="p-4 bg-gray-50 rounded text-xs font-mono space-y-1">
                <div><strong>Challenge ID:</strong> {challenge.challengeId}</div>
                <div><strong>Payload:</strong></div>
                <pre className="ml-4 overflow-x-auto">{JSON.stringify(challenge.payload, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Step 3: Signature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">3. Signature</h3>
              <Button
                onClick={signChallenge}
                size="sm"
                disabled={!challenge}
              >
                Sign Challenge
              </Button>
            </div>
            {signature && (
              <div className="p-4 bg-gray-50 rounded text-xs font-mono space-y-1">
                <div><strong>Signatures:</strong></div>
                {signature.signatures.map((sig, i) => (
                  <div key={i} className="ml-4 break-all">{sig}</div>
                ))}
                <div><strong>Canonical Payload:</strong></div>
                <pre className="ml-4 overflow-x-auto">{signature.canonical}</pre>
              </div>
            )}
          </div>

          {/* Step 4: Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">4. Verification</h3>
              <Button
                onClick={verifySignature}
                size="sm"
                disabled={!signature}
              >
                Verify Signature
              </Button>
            </div>
            {verificationResult && (
              <div className={`p-4 rounded text-xs font-mono space-y-2 ${verificationResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                {verificationResult.success ? (
                  <div className="text-green-800">
                    <strong>✓ Verification Successful</strong>
                  </div>
                ) : (
                  <div className="text-red-800">
                    <strong>✗ Verification Failed</strong>
                    <div className="mt-2">{verificationResult.error}</div>
                    {verificationResult.debug && (
                      <div className="mt-2 space-y-1">
                        <div><strong>Debug Info:</strong></div>
                        <div><strong>Server Canonical:</strong></div>
                        <pre className="ml-4 overflow-x-auto whitespace-pre-wrap break-all">{verificationResult.debug.canonical}</pre>
                        <div><strong>Keys:</strong></div>
                        <pre className="ml-4 overflow-x-auto">{JSON.stringify(verificationResult.debug.keyState.keys, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
