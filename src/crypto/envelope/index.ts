// packages/core/src/crypto/envelope/index.ts
//
// Public API for envelope encryption. Consumers import from here —
// jwe.ts, aad.ts, and serialization.ts are implementation details.

export { buildAAD } from './aad.js';
export { decryptEnvelope, encryptEnvelope } from './jwe.js';
export { deserializeEnvelope, serializeEnvelope } from './serialization.js';
export type { EncryptedEnvelope, EnvelopeAAD, PublicKeyRef, UnlockProvider } from './types.js';
