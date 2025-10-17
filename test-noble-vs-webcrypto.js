/**
 * Test if @noble/ed25519 signatures can be verified by Web Crypto API
 */
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Configure sha512 for v2+
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

async function test() {
  console.log('Testing @noble/ed25519 vs Web Crypto API compatibility\n');

  // Generate a keypair using @noble/ed25519
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const publicKey = await ed.getPublicKeyAsync(seed);

  console.log('Seed (first 8 bytes):', Array.from(seed.slice(0, 8)));
  console.log('Public key (first 8 bytes):', Array.from(publicKey.slice(0, 8)));

  // Create test data
  const message = 'test message';
  const data = new TextEncoder().encode(message);

  // Sign with @noble/ed25519 (async)
  const signatureNoble = await ed.signAsync(data, seed);
  console.log('\n@noble/ed25519 signature (first 8 bytes):', Array.from(signatureNoble.slice(0, 8)));

  // Try to verify with Web Crypto API
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify('Ed25519', key, signatureNoble, data);
    console.log('\nWeb Crypto verification of @noble signature:', valid ? '✓ VALID' : '✗ INVALID');

    if (!valid) {
      console.log('\n❌ INCOMPATIBILITY DETECTED!');
      console.log('Signatures from @noble/ed25519 cannot be verified by Web Crypto API');
    }
  } catch (error) {
    console.log('\n❌ ERROR during verification:', error.message);
  }

  // Now try the reverse: sign with Web Crypto, verify with @noble
  try {
    // Generate keypair with Web Crypto
    const keypair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const publicKeyWebCrypto = new Uint8Array(await crypto.subtle.exportKey('raw', keypair.publicKey));
    const signatureWebCrypto = new Uint8Array(await crypto.subtle.sign('Ed25519', keypair.privateKey, data));

    console.log('\nWeb Crypto signature (first 8 bytes):', Array.from(signatureWebCrypto.slice(0, 8)));

    // Verify with @noble/ed25519
    const validNoble = await ed.verifyAsync(signatureWebCrypto, data, publicKeyWebCrypto);
    console.log('@noble verification of Web Crypto signature:', validNoble ? '✓ VALID' : '✗ INVALID');

  } catch (error) {
    console.log('\n❌ ERROR during reverse test:', error.message);
  }
}

test().catch(console.error);
