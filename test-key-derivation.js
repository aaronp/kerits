/**
 * Quick test to verify key derivation
 */
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Set sha512 for noble/ed25519
ed.utils.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// The seed from console logs
const seed = new Uint8Array([199, 203, 193, 42, 172, 22, 146, 227]);

console.log('Seed (first 8 bytes):', Array.from(seed));

// But wait, we only have 8 bytes - we need 32 bytes!
// Let me check what the full seed should be

// Expected public key in CESR: DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE
// Strip 'D' prefix and decode base64url
const cesrKey = 'DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE';
const b64 = cesrKey.slice(1); // Remove 'D'

// Convert base64url to base64
const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
const padding = '='.repeat((4 - (base64.length % 4)) % 4);
const b64WithPadding = base64 + padding;

// Decode
const binaryString = atob(b64WithPadding);
const publicKey = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  publicKey[i] = binaryString.charCodeAt(i);
}

console.log('Expected public key:', Array.from(publicKey));
console.log('Expected public key length:', publicKey.length);
