/**
 * Test Signing - Debug signature verification
 *
 * This file helps test if KERITS signing matches what Convex expects
 */

import { signPayload } from './keri-signer';

/**
 * Test signing with a known payload
 */
export async function testSigning(privateKey: Uint8Array) {
  const testPayload = {
    challenge: 'test-challenge-123',
    timestamp: Date.now(),
    aid: 'test-aid',
  };

  console.log('[Test Signing] Testing signature generation...');
  console.log('[Test Signing] Payload:', testPayload);
  console.log('[Test Signing] Private key length:', privateKey.length);

  try {
    const signatures = await signPayload(testPayload, privateKey, 0);
    console.log('[Test Signing] ✅ Signature generated:', signatures);

    // Parse the signature
    const [indexedSig] = signatures;
    const [index, sig] = indexedSig.split('-');

    console.log('[Test Signing] Index:', index);
    console.log('[Test Signing] Signature (base64url):', sig.substring(0, 20) + '...');
    console.log('[Test Signing] Signature length:', sig.length);

    return signatures;
  } catch (error) {
    console.error('[Test Signing] ❌ Signature failed:', error);
    throw error;
  }
}

/**
 * Compare KERITS vs crypto.subtle signing
 */
export async function compareSigningMethods(privateKey: Uint8Array) {
  const testPayload = {
    challenge: 'test',
    timestamp: 123456,
  };

  console.log('[Compare Signing] Testing both methods...');

  // KERITS method
  const keritsSig = await signPayload(testPayload, privateKey, 0);
  console.log('[Compare Signing] KERITS signature:', keritsSig[0].substring(0, 30) + '...');

  // crypto.subtle method (original)
  const canonical = JSON.stringify(testPayload, Object.keys(testPayload).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  // Reconstruct PKCS8
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
    0x04, 0x22, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(pkcs8Header.length + privateKey.length);
  pkcs8.set(pkcs8Header, 0);
  pkcs8.set(privateKey, pkcs8Header.length);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('Ed25519', key, data);
  const signature = new Uint8Array(signatureBuffer);

  // Encode to base64url
  let binary = '';
  for (let i = 0; i < signature.length; i++) {
    binary += String.fromCharCode(signature[i]);
  }
  const base64 = btoa(binary);
  const sigBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const subtleSig = `0-${sigBase64}`;

  console.log('[Compare Signing] crypto.subtle signature:', subtleSig.substring(0, 30) + '...');
  console.log('[Compare Signing] Match:', keritsSig[0] === subtleSig ? '✅ YES' : '❌ NO');

  return {
    kerits: keritsSig[0],
    subtle: subtleSig,
    match: keritsSig[0] === subtleSig,
  };
}
