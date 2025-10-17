/**
 * Test if we can create and verify a signature locally
 * This helps us triangulate where the problem is
 */
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Configure sha512 for v3.x
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

async function testLocalSignatureVerification() {
  console.log('=== Testing Local Signature Creation and Verification ===\n');

  // The public key from the logs (CESR format: DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE)
  // Strip 'D' and decode base64url
  const cesrKey = 'CYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE'; // Without 'D' prefix
  const publicKeyBase64 = cesrKey.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (publicKeyBase64.length % 4)) % 4);
  const publicKeyB64 = publicKeyBase64 + padding;
  const publicKey = new Uint8Array(atob(publicKeyB64).split('').map(c => c.charCodeAt(0)));

  console.log('Public key (first 8 bytes):', Array.from(publicKey.slice(0, 8)));
  console.log('Expected:', [9, 136, 63, 200, 219, 12, 179, 67]);

  // The signature from the logs
  const sigBase64Url = 'auTAWs0frp00z_a-mokyat8ULUZvhdc1UyUL4wuTvDHqJGQ299ucKe6sPlUIQGj8mk_w_J_F3yZX9Ph4RVCcBA';
  const sigBase64 = sigBase64Url.replace(/-/g, '+').replace(/_/g, '/');
  const sigPadding = '='.repeat((4 - (sigBase64.length % 4)) % 4);
  const sigB64 = sigBase64 + sigPadding;
  const signature = new Uint8Array(atob(sigB64).split('').map(c => c.charCodeAt(0)));

  console.log('\nSignature (first 8 bytes):', Array.from(signature.slice(0, 8)));
  console.log('Expected:', [106, 228, 192, 90, 205, 31, 174, 157]);

  // The canonical payload that was signed
  const canonical = '{"aid":"DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE","argsHash":"b47a1865bc5ce5940f04cc3de24fa3ebdceb1a059e5fcb2b28ae1ea345876b49","aud":"https://merits-convex.app","nonce":"8a5c5f9c-672e-4aea-c2ee-5eed67d8b1ad","purpose":"send","ts":1760728591520,"ver":"msg-auth/1"}';
  const data = new TextEncoder().encode(canonical);

  console.log('\nCanonical payload length:', data.length, 'bytes');

  // Test 1: Verify with @noble/ed25519
  console.log('\n--- Test 1: Verify with @noble/ed25519 ---');
  try {
    const valid = await ed.verifyAsync(signature, data, publicKey);
    console.log('Result:', valid ? '✓ VALID' : '✗ INVALID');
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Verify with Web Crypto API (same as server)
  console.log('\n--- Test 2: Verify with Web Crypto API ---');
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify('Ed25519', key, signature, data);
    console.log('Result:', valid ? '✓ VALID' : '✗ INVALID');
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Create a test signature with a known seed and verify it
  console.log('\n--- Test 3: Create and verify test signature ---');
  const testSeed = crypto.getRandomValues(new Uint8Array(32));
  const testPublicKey = await ed.getPublicKeyAsync(testSeed);
  const testData = new TextEncoder().encode('test message');
  const testSignature = await ed.signAsync(testData, testSeed);

  console.log('Test signature created, length:', testSignature.length);

  // Verify with noble
  const validNoble = await ed.verifyAsync(testSignature, testData, testPublicKey);
  console.log('Noble verification:', validNoble ? '✓ VALID' : '✗ INVALID');

  // Verify with Web Crypto
  const testKey = await crypto.subtle.importKey(
    'raw',
    testPublicKey,
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  const validWebCrypto = await crypto.subtle.verify('Ed25519', testKey, testSignature, testData);
  console.log('Web Crypto verification:', validWebCrypto ? '✓ VALID' : '✗ INVALID');

  console.log('\n=== Summary ===');
  console.log('If Test 1 or 2 shows VALID, the signature is correct but something else is wrong.');
  console.log('If both show INVALID, the signature was created incorrectly.');
  console.log('If Test 3 fails, there\'s a bug in our crypto setup.');
}

testLocalSignatureVerification().catch(console.error);
