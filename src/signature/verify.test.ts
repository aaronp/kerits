import { describe, expect, it } from 'bun:test';
import { encodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { PublicKey, Signature } from '../common/types.js';
import { generateKeyPair, sign } from './primitives.js';
import { verify } from './verify.js';

describe('verify', () => {
  it('returns true for a valid signature', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sigRaw = sign(data, kp.privateKey);

    const publicKey = encodeKey(kp.publicKey).qb64 as PublicKey;
    const signature = encodeSig(sigRaw).qb64 as Signature;

    expect(verify(publicKey, signature, data)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sigRaw = sign(data, kp.privateKey);

    // Sign with correct key but verify against different data
    const otherData = new TextEncoder().encode('goodbye world');
    const publicKey = encodeKey(kp.publicKey).qb64 as PublicKey;
    const signature = encodeSig(sigRaw).qb64 as Signature;

    expect(verify(publicKey, signature, otherData)).toBe(false);
  });

  it('returns false for malformed input instead of throwing', () => {
    expect(verify('not-a-key' as PublicKey, 'not-a-sig' as Signature, new Uint8Array([1]))).toBe(false);
  });
});
