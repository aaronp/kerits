import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KELEvents, KeriKeyPairs, digestVerfer, sign, decodeKey, encodeSignature } from '../../index.js';
import type { KELEvent } from '../types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createSignedIcp() {
  const pair = KeriKeyPairs.create();
  const nextPair = KeriKeyPairs.create();
  const nextDigest = digestVerfer(nextPair.publicKey);

  const { unsignedEvent } = KELEvents.buildIcp({
    keys: [pair.publicKey],
    nextKeyDigests: [nextDigest],
  });
  const finalized = KELEvents.computeSaid(unsignedEvent, true);

  const privRaw = decodeKey(pair.privateKey).raw;
  const sigRaw = sign(finalized.canonFinal.raw, privRaw);
  const sig = encodeSignature(sigRaw, true).qb64;

  return {
    event: finalized.event,
    pair,
    nextPair,
    sig,
    signingKeys: [pair.publicKey],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KELOps.validateControllerSignature', () => {
  test('accepts a valid signature at keyIndex 0', () => {
    const { event, sig, signingKeys } = createSignedIcp();

    const result = KELOps.validateControllerSignature(
      event,
      [],
      { keyIndex: 0, sig },
      signingKeys,
    );

    expect(result.ok).toBe(true);
  });

  test('rejects keyIndex out of range', () => {
    const { event, sig, signingKeys } = createSignedIcp();

    const result = KELOps.validateControllerSignature(
      event,
      [],
      { keyIndex: 5, sig },
      signingKeys,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('KEY_INDEX_OUT_OF_RANGE');
    }
  });

  test('rejects invalid signature bytes', () => {
    const { event, signingKeys } = createSignedIcp();
    // Create a different key pair to get a wrong signature
    const wrongPair = KeriKeyPairs.create();
    const wrongPriv = decodeKey(wrongPair.privateKey).raw;
    const wrongSigRaw = sign(new Uint8Array(32), wrongPriv);
    const wrongSig = encodeSignature(wrongSigRaw, true).qb64;

    const result = KELOps.validateControllerSignature(
      event,
      [],
      { keyIndex: 0, sig: wrongSig },
      signingKeys,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('SIGNATURE_INVALID');
    }
  });

  test('rejects duplicate keyIndex already in existingSignatures', () => {
    const { event, sig, signingKeys } = createSignedIcp();

    const result = KELOps.validateControllerSignature(
      event,
      [{ keyIndex: 0, sig }],
      { keyIndex: 0, sig },
      signingKeys,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('DUPLICATE_SIGNATURE');
    }
  });
});
