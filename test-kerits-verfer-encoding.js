/**
 * Test if KERITS Verfer encodes public keys correctly
 */
import { Verfer } from './src/cesr/signer.ts';
import { MatterCodex } from './src/cesr/codex.ts';

// Test with a known public key
const testPublicKey = new Uint8Array([
  9, 136, 63, 200, 219, 12, 179, 67, 84, 181, 175, 63, 242, 105, 18, 166,
  121, 161, 42, 240, 84, 191, 14, 247, 224, 68, 210, 248, 227, 145, 241, 145
]);

console.log('Test public key:', Array.from(testPublicKey));

// Create a Verfer with this public key
const verfer = new Verfer({
  raw: testPublicKey,
  code: MatterCodex.Ed25519,
});

console.log('\nVerfer created:');
console.log('  qb64:', verfer.qb64);
console.log('  raw:', Array.from(verfer.raw));

// Expected CESR encoding (from our manual test)
const expectedQb64 = 'DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE';

console.log('\nComparison:');
console.log('  Expected qb64:', expectedQb64);
console.log('  Actual qb64:  ', verfer.qb64);
console.log('  Match?', verfer.qb64 === expectedQb64);

// Verify raw bytes match
console.log('\nRaw bytes match?', Array.from(verfer.raw).toString() === Array.from(testPublicKey).toString());

// Now test the reverse: decode the qb64 back to raw
const verfer2 = new Verfer({ qb64: expectedQb64 });
console.log('\nDecoded from qb64:');
console.log('  raw:', Array.from(verfer2.raw));
console.log('  Match original?', Array.from(verfer2.raw).toString() === Array.from(testPublicKey).toString());
