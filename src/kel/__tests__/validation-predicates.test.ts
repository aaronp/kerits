import { describe, expect, test } from 'bun:test';
import { KeriKeyPairs } from '../../crypto/index.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';
import { sign } from '../../signature/primitives.js';
import { Data } from '../../common/data.js';
import { KELEvents } from '../events.js';
import { digestVerfer } from '../../cesr/digest.js';
import type { AID, KeriKeyPair, Signature } from '../../common/types.js';
import type { KELEvent } from '../types.js';
import { verifyWitnessReceipt, verifyVrcAgainstThreshold, eventContainsAnchorForSaid, isDelegationAnchor, type VrcVerificationResult } from '../validation-predicates.js';
import type { PublicKey } from '../../common/types.js';

// ---------------------------------------------------------------------------
// Deterministic key fixtures
// ---------------------------------------------------------------------------
const WIT1 = KeriKeyPairs.fromSeedNumber(100);
const WIT2 = KeriKeyPairs.fromSeedNumber(101);
const KEY1 = KeriKeyPairs.fromSeedNumber(1);
const KEY2 = KeriKeyPairs.fromSeedNumber(2);

// Additional fixtures for VRC tests
const PARENT1 = KeriKeyPairs.fromSeedNumber(200);
const PARENT2 = KeriKeyPairs.fromSeedNumber(201);
const PARENT3 = KeriKeyPairs.fromSeedNumber(202);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sign an event's canonical bytes with a keypair, return qb64 signature */
function signEventBytes(event: KELEvent, keypair: KeriKeyPair): string {
  const { raw } = Data.fromJson(event).canonicalize();
  const privBytes = decodeKey(keypair.privateKey).raw;
  const sigBytes = sign(raw, privBytes);
  return encodeSig(sigBytes, keypair.transferable ?? true).qb64;
}

/** Build a minimal signed icp event for testing */
function buildTestIcp(): KELEvent {
  const { unsignedEvent } = KELEvents.buildIcp({
    keys: [KEY1.publicKey],
    nextKeyDigests: [digestVerfer(KEY2.publicKey)],
    signingThreshold: '1',
    nextThreshold: '1',
    witnesses: [WIT1.publicKey, WIT2.publicKey],
    witnessThreshold: '2',
  });
  const { event } = KELEvents.finalize(unsignedEvent, true);
  return event;
}

// ===========================================================================
// verifyWitnessReceipt
// ===========================================================================

describe('verifyWitnessReceipt', () => {
  test('valid receipt from known witness returns true', () => {
    const event = buildTestIcp();
    const sig = signEventBytes(event, WIT1);
    const result = verifyWitnessReceipt(
      { by: WIT1.publicKey as AID, sig: sig as Signature },
      event,
    );
    expect(result).toBe(true);
  });

  test('receipt with wrong signature returns false', () => {
    const event = buildTestIcp();
    // Sign with WIT2's key but claim it's from WIT1
    const wrongSig = signEventBytes(event, WIT2);
    const result = verifyWitnessReceipt(
      { by: WIT1.publicKey as AID, sig: wrongSig as Signature },
      event,
    );
    expect(result).toBe(false);
  });

  test('receipt signed over different event returns false', () => {
    const event1 = buildTestIcp();
    // Build a different event and sign that instead
    const { unsignedEvent: unsigned2 } = KELEvents.buildIcp({
      keys: [KEY2.publicKey],
      nextKeyDigests: [digestVerfer(KEY1.publicKey)],
      signingThreshold: '1',
      nextThreshold: '1',
    });
    const { event: event2 } = KELEvents.finalize(unsigned2, true);
    const wrongEventSig = signEventBytes(event2, WIT1);

    const result = verifyWitnessReceipt(
      { by: WIT1.publicKey as AID, sig: wrongEventSig as Signature },
      event1,
    );
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VRC helpers
// ---------------------------------------------------------------------------

/** Build a VRC attachment for a child event, signed by a parent key */
function buildVrc(
  childEvent: KELEvent,
  parentKeypair: KeriKeyPair,
  opts: { keyIndex?: number; cid?: string; sealS?: string; sealD?: string } = {},
) {
  const sig = signEventBytes(childEvent, parentKeypair);
  return {
    cid: opts.cid ?? childEvent.d,
    seal: { s: opts.sealS ?? '0', d: opts.sealD ?? 'Eseal...' },
    sig: sig as Signature,
    ...(opts.keyIndex !== undefined ? { keyIndex: opts.keyIndex } : {}),
  };
}

// ===========================================================================
// verifyVrcAgainstThreshold
// ===========================================================================

describe('verifyVrcAgainstThreshold', () => {
  test('single VRC, single-sig parent (kt=1) — passes', () => {
    const event = buildTestIcp();
    const vrc = buildVrc(event, PARENT1, { keyIndex: 0 });
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    expect(result.passed).toBe(true);
    expect(result.validKeyIndices).toEqual([0]);
  });

  test('single VRC, multi-sig parent (kt=2) — threshold not met', () => {
    const event = buildTestIcp();
    const vrc = buildVrc(event, PARENT1, { keyIndex: 0 });
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey], kt: '2' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('threshold-not-met');
    expect(result.validKeyIndices).toEqual([0]);
  });

  test('two valid VRCs with distinct keyIndex values meeting threshold', () => {
    const event = buildTestIcp();
    const vrc1 = buildVrc(event, PARENT1, { keyIndex: 0 });
    const vrc2 = buildVrc(event, PARENT2, { keyIndex: 1 });
    const result = verifyVrcAgainstThreshold(
      [vrc1, vrc2],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey], kt: '2' },
    );
    expect(result.passed).toBe(true);
    expect(result.validKeyIndices).toEqual([0, 1]);
  });

  test('two valid VRCs with same keyIndex — does not double-count', () => {
    const event = buildTestIcp();
    const vrc1 = buildVrc(event, PARENT1, { keyIndex: 0 });
    const vrc2 = buildVrc(event, PARENT1, { keyIndex: 0 }); // duplicate
    const result = verifyVrcAgainstThreshold(
      [vrc1, vrc2],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey], kt: '2' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('threshold-not-met');
    expect(result.validKeyIndices).toEqual([0]); // only one distinct index
  });

  test('one valid + one invalid VRC on same keyIndex — valid counts', () => {
    const event = buildTestIcp();
    const validVrc = buildVrc(event, PARENT1, { keyIndex: 0 });
    const invalidVrc = { ...buildVrc(event, PARENT2, { keyIndex: 0 }), sig: 'AAinvalidsig...' as Signature };
    const result = verifyVrcAgainstThreshold(
      [validVrc, invalidVrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    // Valid VRC at index 0 counts, invalid one doesn't override it
    expect(result.passed).toBe(true);
    expect(result.validKeyIndices).toEqual([0]);
  });

  test('VRC with keyIndex out of bounds — dedicated test', () => {
    const event = buildTestIcp();
    const vrc = buildVrc(event, PARENT1, { keyIndex: 5 });
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('key-index-out-of-range');
    expect(result.validKeyIndices).toEqual([]);
  });

  test('mixed valid indices with duplicates — threshold by distinct set only', () => {
    const event = buildTestIcp();
    const vrc0a = buildVrc(event, PARENT1, { keyIndex: 0 });
    const vrc0b = buildVrc(event, PARENT1, { keyIndex: 0 }); // duplicate index
    const vrc1 = buildVrc(event, PARENT2, { keyIndex: 1 });
    const result = verifyVrcAgainstThreshold(
      [vrc0a, vrc0b, vrc1],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey, PARENT3.publicKey as PublicKey], kt: '3' },
    );
    // Only 2 distinct indices (0, 1) — need 3
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('threshold-not-met');
    expect(result.validKeyIndices).toEqual([0, 1]);
  });

  test('VRC with absent keyIndex — defaults to 0', () => {
    const event = buildTestIcp();
    // No keyIndex property at all
    const vrc = buildVrc(event, PARENT1);
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    expect(result.passed).toBe(true);
    expect(result.validKeyIndices).toEqual([0]);
  });

  test('absent keyIndex + explicit keyIndex 0 — no phantom double-count', () => {
    const event = buildTestIcp();
    const vrcImplicit = buildVrc(event, PARENT1); // defaults to 0
    const vrcExplicit = buildVrc(event, PARENT1, { keyIndex: 0 });
    const result = verifyVrcAgainstThreshold(
      [vrcImplicit, vrcExplicit],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey], kt: '2' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('threshold-not-met');
    expect(result.validKeyIndices).toEqual([0]); // one distinct index
  });

  test('CID mismatch — cid-mismatch', () => {
    const event = buildTestIcp();
    const vrc = buildVrc(event, PARENT1, { keyIndex: 0, cid: 'Ewrong...' });
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('cid-mismatch');
  });

  test('signature invalid — signature-invalid', () => {
    const event = buildTestIcp();
    const vrc = { ...buildVrc(event, PARENT1, { keyIndex: 0 }), sig: 'AAinvalidsig...' as Signature };
    const result = verifyVrcAgainstThreshold(
      [vrc],
      event,
      { k: [PARENT1.publicKey as PublicKey], kt: '1' },
    );
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('signature-invalid');
  });

  test('failure precedence: out-of-range outranks threshold-not-met', () => {
    const event = buildTestIcp();
    const oobVrc = buildVrc(event, PARENT1, { keyIndex: 99 });
    const validVrc = buildVrc(event, PARENT2, { keyIndex: 0 });
    const result = verifyVrcAgainstThreshold(
      [oobVrc, validVrc],
      event,
      { k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey], kt: '2' },
    );
    // Even though threshold also not met, out-of-range dominates
    expect(result.passed).toBe(false);
    expect((result as any).reason).toBe('key-index-out-of-range');
  });

  test('weighted threshold with partial satisfaction', () => {
    const event = buildTestIcp();
    const vrc1 = buildVrc(event, PARENT1, { keyIndex: 0 });
    const vrc2 = buildVrc(event, PARENT2, { keyIndex: 1 });
    // Weighted threshold: any 2 of 3 satisfies (each weight 1/2, need sum >= 1)
    const result = verifyVrcAgainstThreshold(
      [vrc1, vrc2],
      event,
      {
        k: [PARENT1.publicKey as PublicKey, PARENT2.publicKey as PublicKey, PARENT3.publicKey as PublicKey],
        kt: [['1/2', '1/2', '1/2']],
      },
    );
    expect(result.passed).toBe(true);
    expect(result.validKeyIndices).toEqual([0, 1]);
  });
});

// ===========================================================================
// eventContainsAnchorForSaid
// ===========================================================================

describe('eventContainsAnchorForSaid', () => {
  test('returns true when a[] entry has matching d field', () => {
    const event = { t: 'ixn', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(true);
  });

  test('returns false when no a[] entry matches', () => {
    const event = { t: 'ixn', a: [{ d: 'Eother...' }] } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(false);
  });

  test('returns false when event has no a field', () => {
    const event = { t: 'icp' } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(false);
  });

  test('returns false when a is empty', () => {
    const event = { t: 'ixn', a: [] } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(false);
  });

  test('returns true with multiple anchors, one matching', () => {
    const event = { t: 'rot', a: [{ d: 'Eother...' }, { d: 'Etarget...' }, { i: 'no-d-field' }] } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(true);
  });

  test('skips entries without d field', () => {
    const event = { t: 'ixn', a: [{ i: 'Eaid...', s: '0' }] } as unknown as KELEvent;
    expect(eventContainsAnchorForSaid(event, 'Etarget...')).toBe(false);
  });
});

// ===========================================================================
// isDelegationAnchor
// ===========================================================================

describe('isDelegationAnchor', () => {
  test('returns true for ixn with matching anchor', () => {
    const event = { t: 'ixn', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(true);
  });

  test('returns true for rot with matching anchor', () => {
    const event = { t: 'rot', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(true);
  });

  test('returns true for drt with matching anchor', () => {
    const event = { t: 'drt', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(true);
  });

  test('returns false for icp (cannot carry delegation seals)', () => {
    const event = { t: 'icp', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(false);
  });

  test('returns false for dip (cannot carry delegation seals)', () => {
    const event = { t: 'dip', a: [{ d: 'Etarget...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(false);
  });

  test('returns false when anchor SAID does not match', () => {
    const event = { t: 'ixn', a: [{ d: 'Eother...' }] } as unknown as KELEvent;
    expect(isDelegationAnchor(event, 'Etarget...')).toBe(false);
  });
});
