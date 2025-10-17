/**
 * Decode the CESR key to see what the actual public key bytes should be
 */

const cesrKey = 'DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE';

// CESR format: First character is the code, rest is base64url encoded
const code = cesrKey[0]; // 'D'
const b64url = cesrKey.slice(1);

console.log('CESR Key:', cesrKey);
console.log('Code:', code, '(Ed25519 public key)');
console.log('Base64url payload:', b64url);

// Decode base64url to bytes
const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
const padding = '='.repeat((4 - (b64.length % 4)) % 4);
const b64WithPadding = b64 + padding;

console.log('Base64 (with padding):', b64WithPadding);

const binaryString = atob(b64WithPadding);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

console.log('\nDecoded public key bytes (ALL 32):');
console.log(Array.from(bytes));
console.log('\nFirst 8 bytes:', Array.from(bytes.slice(0, 8)));

console.log('\n=== COMPARISON ===');
console.log('Server has:', [9, 136, 63, 200, 219, 12, 179, 67]);
console.log('Client has:', [38, 32, 255, 35, 108, 50, 205, 13]);
console.log('CESR decodes to:', Array.from(bytes.slice(0, 8)));
