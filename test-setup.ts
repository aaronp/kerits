/**
 * Test setup for Bun test runner
 * Ensures crypto is available globally for @noble/ed25519
 */
import { webcrypto } from 'node:crypto';

// Ensure @noble/ed25519 has access to crypto in test environment
if (!globalThis.crypto) {
  // @ts-ignore - Add crypto to global scope for Node.js test environment
  globalThis.crypto = webcrypto;
}
