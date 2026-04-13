import { describe, expect, it } from 'bun:test';
import { nextKeyDigestQb64FromPublicKeyQb64 } from './next-key-digest.js';

describe('nextKeyDigestQb64FromPublicKeyQb64', () => {
  it('should return a qb64 digest string for a valid Ed25519 public key', () => {
    // Ed25519 public key starts with 'D' code, 44 chars total in qb64
    const pubKeyQb64 = 'DGApkA68ECWhLmEVn3iVdSBvJEKINLeTHiqI_IBru1Dy';
    const digest = nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64);
    expect(typeof digest).toBe('string');
    expect(digest.length).toBeGreaterThan(0);
    // Blake3-256 digests start with 'E'
    expect(digest.startsWith('E')).toBe(true);
  });

  it('should produce deterministic results', () => {
    const pubKeyQb64 = 'DGApkA68ECWhLmEVn3iVdSBvJEKINLeTHiqI_IBru1Dy';
    const digest1 = nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64);
    const digest2 = nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64);
    expect(digest1).toBe(digest2);
  });

  it('should produce different digests for different keys', () => {
    const key1 = 'DGApkA68ECWhLmEVn3iVdSBvJEKINLeTHiqI_IBru1Dy';
    const key2 = 'DHr0-I-mMN7h6cLMOTRJkkfPuMd0vgQPrOk4Y3edaHjr';
    const digest1 = nextKeyDigestQb64FromPublicKeyQb64(key1);
    const digest2 = nextKeyDigestQb64FromPublicKeyQb64(key2);
    expect(digest1).not.toBe(digest2);
  });
});
