import { describe, expect, test } from 'bun:test';
import { digestVerfer } from '../../cesr/digest.js';
import { encodeSig } from '../../cesr/sigs.js';
import type { AID, PublicKey, SAID, Threshold } from '../../common/types.js';
import { TestKeys } from '../../keys/test-keys.js';
import { sign } from '../../signature/primitives.js';
import { canonicalizeEvent } from '../event-crypto.js';
import { KELEvents } from '../events.js';
import { KELOps } from '../ops.js';
import { planRotation } from '../rotation.js';
import type { CESREvent, KELEvent } from '../types.js';
import { validateKelChain } from '../validation.js';

const key = (name: string, n: number) => TestKeys.iterator(name).at(n);
const pub = (name: string, n: number): PublicKey => key(name, n).cesr;
const dig = (name: string, n: number): string => digestVerfer(pub(name, n));

const [A0, A1, B0, B1, C0, C1, J0] = [
  pub('alice', 0),
  pub('alice', 1),
  pub('bob', 0),
  pub('bob', 1),
  pub('carol', 0),
  pub('carol', 1),
  pub('joiner', 0),
];

describe('planRotation', () => {
  test('a refresh keeps the other key first and carries its commitment', () => {
    // setup: alice at 0, bob at 1; alice is the one rotating
    const prior = { k: [A0, B0], kt: '1', n: [dig('alice', 1), dig('bob', 1)], nt: '1' };

    // call our method under test: keep bob, reveal alice[1]
    const result = planRotation(
      prior,
      {
        keep: [B0],
        reveal: [A1],
        carryNext: [dig('bob', 1)],
        nextDigests: [dig('alice', 2)],
        kt: '2',
        nt: '2',
      },
      [A1, B0],
    );

    // keripy order: the kept key and its carried commitment, then the revealed key
    expect(result).toEqual({
      ok: true,
      value: {
        k: [B0, A1],
        kt: '2',
        n: [dig('bob', 1), dig('alice', 2)],
        nt: '2',
        signers: [
          { kIndex: 0 },
          { kIndex: 1, ondex: 0 },
        ],
      },
    });
  });

  test('remove B under nt=2 compacts k and gives carol ondex 2', () => {
    // setup: three-key identity committed to alice[1], bob[1], carol[1] with nt=2
    const prior = { k: [A0, B0, C0], kt: '2', n: [dig('alice', 1), dig('bob', 1), dig('carol', 1)], nt: '2' };

    // call our method under test: reveal alice[1] and carol[1], drop bob
    const result = planRotation(
      prior,
      { reveal: [A1, C1], nextDigests: [dig('alice', 2), dig('carol', 2)], kt: '2', nt: '2' },
      [A1, C1],
    );

    // assertions: compacted k, n in order, carol signs at index 1 with prior-n index 2
    expect(result).toEqual({
      ok: true,
      value: {
        k: [A1, C1],
        kt: '2',
        n: [dig('alice', 2), dig('carol', 2)],
        nt: '2',
        signers: [
          { kIndex: 0, ondex: 0 },
          { kIndex: 1, ondex: 2 },
        ],
      },
    });
  });

  test("nt '0' with no next digests abandons the identifier", () => {
    // setup: single-key identity committed to alice[1]
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: reveal alice[1], commit to nothing
    const result = planRotation(prior, { reveal: [A1], nextDigests: [], kt: '1', nt: '0' }, [A1]);

    // assertions: accepted, with an empty n and alice signing at index 0 with prior-n index 0
    expect(result).toEqual({
      ok: true,
      value: { k: [A1], kt: '1', n: [], nt: '0', signers: [{ kIndex: 0, ondex: 0 }] },
    });
  });

  test('revealing a key the prior n never committed to is not-committed', () => {
    // setup: single-key identity committed to alice[1]
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: "reveal" the joiner's key
    const result = planRotation(prior, { reveal: [J0], nextDigests: [dig('joiner', 1)], kt: '1', nt: '1' }, [J0]);

    // assertions: the uncommitted key is named
    expect(result).toEqual({ ok: false, error: { kind: 'not-committed', key: J0 } });
  });

  test('prior nt=3 with two revealed keys is prior-nt-unsatisfiable', () => {
    // setup: three-key identity with nt=3
    const prior = { k: [A0, B0, C0], kt: '3', n: [dig('alice', 1), dig('bob', 1), dig('carol', 1)], nt: '3' };

    // call our method under test: reveal only alice[1] and bob[1]
    const result = planRotation(
      prior,
      { reveal: [A1, B1], nextDigests: [dig('alice', 2), dig('bob', 2)], kt: '2', nt: '2' },
      [A1, B1],
    );

    // assertions: two revealed signers can't meet nt=3
    expect(result).toEqual({ ok: false, error: { kind: 'prior-nt-unsatisfiable', nt: '3', revealed: 2 } });
  });

  test('add-device with kt=2 and only the host available is kt-unsatisfiable-by', () => {
    // setup: single-key identity committed to alice[1]
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: host reveals alice[1], adds joiner[0], asks for kt=2
    const result = planRotation(
      prior,
      { reveal: [A1], add: [J0], nextDigests: [dig('alice', 2), dig('joiner', 1)], kt: '2', nt: '1' },
      [A1],
    );

    // assertions: the joiner never signs, so one available signer can't meet kt=2
    expect(result).toEqual({ ok: false, error: { kind: 'kt-unsatisfiable-by', kt: '2', available: 1 } });
  });

  test('nt larger than the new n is invalid-threshold', () => {
    // setup: single-key identity
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: nt=3 over two next digests
    const result = planRotation(
      prior,
      { reveal: [A1], nextDigests: [dig('alice', 2), dig('bob', 2)], kt: '1', nt: '3' },
      [A1],
    );

    // assertions: rejected with the threshold validator's message
    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid-threshold', field: 'nt', message: 'nt: threshold "3" (3) exceeds the key count 2' },
    });
  });

  test('kt "0" is invalid-threshold, not unsatisfiable (keripy builders reject a kt below 1)', () => {
    // setup: single-key identity
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: kt "0"
    const result = planRotation(prior, { reveal: [A1], nextDigests: [dig('alice', 2)], kt: '0', nt: '1' }, [A1]);

    // assertions: rejected as an invalid threshold
    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid-threshold', field: 'kt', message: 'kt: threshold "0" is less than 1' },
    });
  });

  test('a weighted kt with more weights than keys is invalid-threshold, not unsatisfiable', () => {
    // setup: single-key identity
    const prior = { k: [A0], kt: '1', n: [dig('alice', 1)], nt: '1' };

    // call our method under test: three weights for two keys
    const result = planRotation(
      prior,
      { reveal: [A1], add: [J0], nextDigests: [dig('alice', 2)], kt: [['1/2', '1/2', '1/2']], nt: '1' },
      [A1],
    );

    // assertions: rejected as malformed
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'invalid-threshold',
        field: 'kt',
        message: 'kt: weighted threshold has 3 weights for 2 keys',
      },
    });
  });

  test('the same key in keep and add is duplicate-key', () => {
    // setup: two-key identity
    const prior = { k: [A0, B0], kt: '1', n: [dig('alice', 1), dig('bob', 1)], nt: '1' };

    // call our method under test: keep alice[0] and also add it
    const result = planRotation(
      prior,
      { keep: [A0], reveal: [B1], add: [A0], nextDigests: [dig('bob', 2)], kt: '1', nt: '1' },
      [B1],
    );

    // assertions: the duplicated key is named
    expect(result).toEqual({ ok: false, error: { kind: 'duplicate-key', key: A0 } });
  });
});

// ---------------------------------------------------------------------------
// Validation: rotation thresholds met by signatures
// ---------------------------------------------------------------------------

type Sig = { signer: [string, number]; keyIndex: number; ondex?: number };

function signed(event: KELEvent, sigs: Sig[]): CESREvent {
  return KELEvents.assembleSignedEvent({
    event,
    signatures: sigs.map((s) => ({
      keyIndex: s.keyIndex,
      ...(s.ondex === undefined ? {} : { ondex: s.ondex }),
      sig: encodeSig(sign(canonicalizeEvent(event), key(...s.signer).privateKey), true).qb64,
    })),
  });
}

/** icp alice[0], bob[0] (kt=nt=2) → rot alice[1], bob[1] with the given kt and signatures. */
function twoKeyKel(rotKt: Threshold, rotSigs: Sig[]): CESREvent[] {
  const { event: icp } = KELEvents.finalize(
    KELEvents.buildIcp({
      keys: [A0, B0],
      nextKeyDigests: [dig('alice', 1), dig('bob', 1)],
      signingThreshold: '2',
      nextThreshold: '2',
    }).unsignedEvent,
    true,
  );
  const { event: rot } = KELEvents.finalize(
    KELEvents.buildRot({
      aid: icp.i as AID,
      sequence: 1,
      priorEventSaid: icp.d as SAID,
      keys: [A1, B1],
      nextKeyDigests: [dig('alice', 2), dig('bob', 2)],
      signingThreshold: rotKt,
      nextThreshold: '2',
    }).unsignedEvent,
    false,
  );
  const icpSigs: Sig[] = [
    { signer: ['alice', 0], keyIndex: 0, ondex: 0 },
    { signer: ['bob', 0], keyIndex: 1, ondex: 1 },
  ];
  return [signed(icp, icpSigs), signed(rot, rotSigs)];
}

describe('validateKelChain: rotation signature thresholds', () => {
  test('a duplicate signature counts once (KT_UNMET)', () => {
    // setup: kt=2 rotation signed twice by alice[1] only
    const kel = twoKeyKel('2', [
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: one counted index, kt=2 unmet
    expect(result.valid).toBe(false);
    expect(result.firstError).toEqual({
      code: 'KT_UNMET',
      scope: 'attachment',
      severity: 'error',
      message: 'KT_UNMET: kt 2 not met; verified signatures at k indices [0] (event 1)',
      eventIndex: 1,
    });
  });

  test('an unknown signer is dropped without throwing, and the thresholds reject the event', () => {
    // setup: mallory signs in alice[1]'s place
    const kel = twoKeyKel('1', [{ signer: ['mallory', 0], keyIndex: 0, ondex: 0 }]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: mallory's signature is listed as dropped; nothing verified, so kt=1 is unmet
    expect(result.eventDetails[1]!.checks.signaturesValid.dropped).toEqual([
      { keyIndex: 0, reason: 'signature-invalid', error: 'Signature verification failed' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.firstError).toEqual({
      code: 'KT_UNMET',
      scope: 'attachment',
      severity: 'error',
      message: 'KT_UNMET: kt 1 not met; verified signatures at k indices [] (event 1)',
      eventIndex: 1,
    });
  });

  test('a valid signature meets the thresholds despite an attached invalid one', () => {
    // setup: both revealed keys sign; mallory adds a bad signature at index 1 first
    const kel = twoKeyKel('2', [
      { signer: ['mallory', 0], keyIndex: 1, ondex: 1 },
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['bob', 1], keyIndex: 1, ondex: 1 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: accepted, with mallory's signature listed as dropped
    expect(result.valid).toBe(true);
    expect(result.eventDetails[1]!.checks.signaturesValid.dropped).toEqual([
      { keyIndex: 1, reason: 'signature-invalid', error: 'Signature verification failed' },
    ]);
  });

  test('kt met by one key but prior nt=2 needs both revealed keys (PRIOR_NT_UNMET)', () => {
    // setup: kt=1 rotation signed by alice[1] only
    const kel = twoKeyKel('1', [{ signer: ['alice', 1], keyIndex: 0, ondex: 0 }]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: one revealed-key signature can't meet prior nt=2
    expect(result.valid).toBe(false);
    expect(result.firstError?.code).toBe('PRIOR_NT_UNMET');
    expect(result.eventDetails[1]!.checks.thresholdMet.error).toBe(
      'PRIOR_NT_UNMET: prior nt 2 not met; revealed-key signatures at prior n indices [0]',
    );
  });

  test('a signature claiming the wrong prior-n index is ONDEX_MISMATCH', () => {
    // setup: bob[1] signs at index 1 but claims prior n index 0 (alice's commitment)
    const kel = twoKeyKel('2', [
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['bob', 1], keyIndex: 1, ondex: 0 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: bob's claim is skipped (listed) as keripy's exposeds does; nt=2 is then unmet
    expect(result.valid).toBe(false);
    expect(result.firstError?.code).toBe('ONDEX_MISMATCH');
    expect(result.eventDetails[1]!.checks.thresholdMet.error).toBe(
      'ONDEX_MISMATCH: prior nt 2 not met; revealed-key signatures at prior n indices [0]; skipped mismatched ondex at k indices [1]',
    );
    expect(result.eventDetails[1]!.checks.signaturesValid.dropped).toEqual([
      {
        keyIndex: 1,
        reason: 'ondex-mismatch',
        error: 'signature at k index 1 claims prior n index 0, but its key digest does not match n[0]; not counted toward prior nt',
      },
    ]);
  });

  test('a correct ondex claim at the same index still exposes the key after a wrong one', () => {
    // setup: bob[1] first claims alice's commitment, then signs again claiming his own
    const kel = twoKeyKel('2', [
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['bob', 1], keyIndex: 1, ondex: 0 },
      { signer: ['bob', 1], keyIndex: 1, ondex: 1 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: accepted; the index is exposed by its matching claim, so nothing is skipped
    expect(result.valid).toBe(true);
    expect(result.eventDetails[1]!.checks.signaturesValid.dropped).toEqual([]);
  });

  test('a kept key signing with the default ondex (code A) is skipped for nt and accepted, as keripy', () => {
    // setup: icp alice[0] → rot keeping alice[0] and revealing alice[1]; both sign with ondex 0
    const { event: icp } = KELEvents.finalize(
      KELEvents.buildIcp({ keys: [A0], nextKeyDigests: [dig('alice', 1)] }).unsignedEvent,
      true,
    );
    const { event: rot } = KELEvents.finalize(
      KELEvents.buildRot({
        aid: icp.i as AID,
        sequence: 1,
        priorEventSaid: icp.d as SAID,
        keys: [A0, A1],
        nextKeyDigests: [dig('alice', 2)],
        signingThreshold: '1',
        nextThreshold: '1',
      }).unsignedEvent,
      false,
    );
    const kel = [
      signed(icp, [{ signer: ['alice', 0], keyIndex: 0 }]),
      signed(rot, [
        { signer: ['alice', 1], keyIndex: 1, ondex: 0 },
        { signer: ['alice', 0], keyIndex: 0, ondex: 0 },
      ]),
    ];

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: accepted; the kept key's ondex claim is listed as skipped
    expect(result.valid).toBe(true);
    expect(result.eventDetails[1]!.checks.signaturesValid.dropped).toEqual([
      {
        keyIndex: 0,
        reason: 'ondex-mismatch',
        error: 'signature at k index 0 claims prior n index 0, but its key digest does not match n[0]; not counted toward prior nt',
      },
    ]);
  });

  test('the same key signing twice, current-only (B) and dual-indexed (A), counts once (KT_UNMET)', () => {
    // setup: kt=2 rotation signed by alice[1] twice at k index 0: once with ondex 0, once current-only
    const kel = twoKeyKel('2', [
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['alice', 1], keyIndex: 0 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: index 0 counted once, so kt=2 is unmet
    expect(result.firstError).toEqual({
      code: 'KT_UNMET',
      scope: 'attachment',
      severity: 'error',
      message: 'KT_UNMET: kt 2 not met; verified signatures at k indices [0] (event 1)',
      eventIndex: 1,
    });
  });

  test('a weighted kt with more weights than keys is THRESHOLD_INVALID, never defaulted to 1-of-n', () => {
    // setup: rotation with kt [["1/3","1/3","1/3"]] over two keys, signed by alice[1] only
    const kel = twoKeyKel([['1/3', '1/3', '1/3']], [{ signer: ['alice', 1], keyIndex: 0, ondex: 0 }]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: rejected at the rotation with the exact code, and the check blocks persistence (not pending)
    expect(result.valid).toBe(false);
    expect(result.firstError).toEqual({
      code: 'THRESHOLD_INVALID',
      scope: 'event',
      severity: 'error',
      message: 'THRESHOLD_INVALID: kt: weighted threshold has 3 weights for 2 keys (event 1)',
      eventIndex: 1,
    });
    expect(result.eventDetails[1]!.checks.thresholdValid?.passed).toBe(false);
  });

  test('a received rot whose nt exceeds its n entries is THRESHOLD_INVALID', () => {
    // setup: icp alice[0], bob[0] → rot with nt "3" over two n entries
    const { event: icp } = KELEvents.finalize(
      KELEvents.buildIcp({
        keys: [A0, B0],
        nextKeyDigests: [dig('alice', 1), dig('bob', 1)],
        signingThreshold: '2',
        nextThreshold: '2',
      }).unsignedEvent,
      true,
    );
    const { event: rot } = KELEvents.finalize(
      KELEvents.buildRot({
        aid: icp.i as AID,
        sequence: 1,
        priorEventSaid: icp.d as SAID,
        keys: [A1, B1],
        nextKeyDigests: [dig('alice', 2), dig('bob', 2)],
        signingThreshold: '2',
        nextThreshold: '3',
      }).unsignedEvent,
      false,
    );
    const kel = [
      signed(icp, [
        { signer: ['alice', 0], keyIndex: 0, ondex: 0 },
        { signer: ['bob', 0], keyIndex: 1, ondex: 1 },
      ]),
      signed(rot, [
        { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
        { signer: ['bob', 1], keyIndex: 1, ondex: 1 },
      ]),
    ];

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: rejected at the rotation with the exact code and message (the validator side of the nt-size divergence)
    expect(result.valid).toBe(false);
    expect(result.firstError).toEqual({
      code: 'THRESHOLD_INVALID',
      scope: 'event',
      severity: 'error',
      message: 'THRESHOLD_INVALID: nt: threshold "3" (3) exceeds the key count 2 (event 1)',
      eventIndex: 1,
    });
  });

  test('abandonment (nt "0", empty n) is accepted; any later rotation is ABANDONED', () => {
    // setup: icp alice[0] (n=[alice[1]]) → rot1 reveals alice[1] and commits to nothing → rot2 tries to rotate again
    const { event: icp } = KELEvents.finalize(
      KELEvents.buildIcp({ keys: [A0], nextKeyDigests: [dig('alice', 1)], signingThreshold: '1', nextThreshold: '1' })
        .unsignedEvent,
      true,
    );
    const rot = (sn: number, prior: KELEvent, n: string[], nt: string) =>
      KELEvents.finalize(
        KELEvents.buildRot({
          aid: icp.i as AID,
          sequence: sn,
          priorEventSaid: prior.d as SAID,
          keys: [A1],
          nextKeyDigests: n,
          signingThreshold: '1',
          nextThreshold: nt,
        }).unsignedEvent,
        false,
      ).event;
    const abandon = rot(1, icp, [], '0');
    const after = rot(2, abandon, [dig('alice', 2)], '1');
    const icpSigned = signed(icp, [{ signer: ['alice', 0], keyIndex: 0, ondex: 0 }]);
    const abandonSigned = signed(abandon, [{ signer: ['alice', 1], keyIndex: 0, ondex: 0 }]);

    // call our method under test: the abandoning KEL, then with the rotation that follows
    const abandoned = validateKelChain([icpSigned, abandonSigned]);
    const continued = validateKelChain([icpSigned, abandonSigned, signed(after, [{ signer: ['alice', 1], keyIndex: 0 }])]);

    // assertions: abandonment is valid (as keripy); the next event is rejected with the exact reason
    expect(abandoned.valid).toBe(true);
    expect(continued.firstError).toEqual({
      code: 'ABANDONED',
      scope: 'event',
      severity: 'error',
      message: 'ABANDONED: the identifier was abandoned (nt 0, empty n); no event may follow, got rot at index 2',
      eventIndex: 2,
    });
  });

  test('both revealed keys signing with matching ondex is valid', () => {
    // setup: kt=2 rotation signed by alice[1] and bob[1]
    const kel = twoKeyKel('2', [
      { signer: ['alice', 1], keyIndex: 0, ondex: 0 },
      { signer: ['bob', 1], keyIndex: 1, ondex: 1 },
    ]);

    // call our method under test
    const result = validateKelChain(kel);

    // assertions: accepted with no error
    expect(result.valid).toBe(true);
    expect(result.firstError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateAppend: rules that only record the first error still reject (keripy Kever.update)
// ---------------------------------------------------------------------------

/** icp alice[0] committing to `n` (empty: non-transferable), signed by alice[0]. */
function icpWith(n: string[]): { icp: KELEvent; signedIcp: CESREvent } {
  const { event: icp } = KELEvents.finalize(
    KELEvents.buildIcp({ keys: [A0], nextKeyDigests: n, signingThreshold: '1', nextThreshold: n.length === 0 ? '0' : '1' })
      .unsignedEvent,
    true,
  );
  return { icp, signedIcp: signed(icp, [{ signer: ['alice', 0], keyIndex: 0, ondex: 0 }]) };
}

/** An ixn at `sn` after `prior`, signed by `signer` at k index 0. */
function ixnAfter(prior: KELEvent, sn: number, signer: [string, number]): CESREvent {
  const { event } = KELEvents.finalize(
    KELEvents.buildIxn({ aid: prior.i as AID, sequence: sn, priorEventSaid: prior.d as SAID }).unsignedEvent,
    false,
  );
  return signed(event, [{ signer, keyIndex: 0 }]);
}

describe('validateAppend: non-pending failures reject the candidate', () => {
  test('an ixn after an abandoning rotation is ABANDONED', () => {
    // setup: icp alice[0] → rot to alice[1] with nt "0", empty n (abandoned)
    const { icp, signedIcp } = icpWith([dig('alice', 1)]);
    const { event: abandon } = KELEvents.finalize(
      KELEvents.buildRot({
        aid: icp.i as AID,
        sequence: 1,
        priorEventSaid: icp.d as SAID,
        keys: [A1],
        nextKeyDigests: [],
        signingThreshold: '1',
        nextThreshold: '0',
      }).unsignedEvent,
      false,
    );
    const kel = [signedIcp, signed(abandon, [{ signer: ['alice', 1], keyIndex: 0, ondex: 0 }])];

    // call our method under test: append an ixn signed by the abandoned current key
    const result = KELOps.validateAppend(kel, ixnAfter(abandon, 2, ['alice', 1]));

    // assertions: rejected with the exact code, and the failing check blocks persistence (not pending)
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors[0]).toEqual({
      code: 'ABANDONED',
      scope: 'event',
      severity: 'error',
      message: 'ABANDONED: the identifier was abandoned (nt 0, empty n); no event may follow, got ixn at index 2',
      eventIndex: 2,
    });
    expect(result.validation.checks.transferable?.passed).toBe(false);
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('an ixn after an n=[] inception is NON_TRANSFERABLE_VIOLATION', () => {
    // setup: non-transferable inception
    const { icp, signedIcp } = icpWith([]);

    // call our method under test
    const result = KELOps.validateAppend([signedIcp], ixnAfter(icp, 1, ['alice', 0]));

    // assertions: rejected with the exact code
    expect(!result.ok && result.errors[0]).toEqual({
      code: 'NON_TRANSFERABLE_VIOLATION',
      scope: 'event',
      severity: 'error',
      message: 'Non-transferable AID cannot have any event after inception at index 1',
      eventIndex: 1,
    });
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('an ixn with a wrong sequence number is SEQUENCE_INVALID', () => {
    // setup: transferable inception
    const { icp, signedIcp } = icpWith([dig('alice', 1)]);

    // call our method under test: s "7" where 1 is next
    const result = KELOps.validateAppend([signedIcp], ixnAfter(icp, 7, ['alice', 0]));

    // assertions: the rule's own error and failing check; not pending
    expect(!result.ok && result.errors).toEqual([
      {
        code: 'SEQUENCE_INVALID',
        scope: 'event',
        severity: 'error',
        message: 'Sequence number mismatch at event 1: expected 1, got 7',
        eventIndex: 1,
      },
    ]);
    expect(result.validation.checks.sequenceValid).toEqual({
      passed: false,
      error: 'Sequence number mismatch at event 1: expected 1, got 7',
    });
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('an under-signed rotation is still only pending', () => {
    // setup: kt=2 rotation signed by alice[1] alone (bob[1] may sign later)
    const kel = twoKeyKel('2', [{ signer: ['alice', 1], keyIndex: 0, ondex: 0 }]);

    // call our method under test
    const result = KELOps.validateAppend([kel[0]!], kel[1]!);

    // assertions: rejected for now, but only for signatures: the append may persist it as pending
    expect(!result.ok && result.errors.map((e) => e.code)).toEqual(['KT_UNMET']);
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateAppend: every rule records its own check, so under-signed never hides a chain-rule failure
// ---------------------------------------------------------------------------

/** icp alice[0], bob[0] with kt=2, signed by both. */
function twoKeyIcp(): { icp: KELEvent; signedIcp: CESREvent } {
  const { event: icp } = KELEvents.finalize(
    KELEvents.buildIcp({
      keys: [A0, B0],
      nextKeyDigests: [dig('alice', 1), dig('bob', 1)],
      signingThreshold: '2',
      nextThreshold: '2',
    }).unsignedEvent,
    true,
  );
  const signedIcp = signed(icp, [
    { signer: ['alice', 0], keyIndex: 0, ondex: 0 },
    { signer: ['bob', 0], keyIndex: 1, ondex: 1 },
  ]);
  return { icp, signedIcp };
}

/** An ixn signed by alice[0] alone (kt=2 needs bob[0] too). */
function underSignedIxn(aid: string, sequence: number, priorEventSaid: string): CESREvent {
  const { event } = KELEvents.finalize(
    KELEvents.buildIxn({ aid: aid as AID, sequence, priorEventSaid: priorEventSaid as SAID }).unsignedEvent,
    false,
  );
  return signed(event, [{ signer: ['alice', 0], keyIndex: 0 }]);
}

const UNDER_SIGNED = {
  code: 'THRESHOLD_NOT_MET',
  scope: 'attachment',
  severity: 'error',
  message: 'Threshold not met for event 1: 1 valid signatures',
  eventIndex: 1,
} as const;

describe('validateAppend: an under-signed event that breaks a chain rule is rejected, not pending', () => {
  test('under-signed + wrong s: SEQUENCE_INVALID leads', () => {
    // setup: kt=2 inception; an ixn at s "2" where 1 is next
    const { icp, signedIcp } = twoKeyIcp();

    // call our method under test
    const result = KELOps.validateAppend([signedIcp], underSignedIxn(icp.i, 2, icp.d));

    // assertions: both rules record their error; the blocking one leads; not pending
    expect(!result.ok && result.errors).toEqual([
      {
        code: 'SEQUENCE_INVALID',
        scope: 'event',
        severity: 'error',
        message: 'Sequence number mismatch at event 1: expected 1, got 2',
        eventIndex: 1,
      },
      UNDER_SIGNED,
    ]);
    expect(result.validation.checks.sequenceValid?.passed).toBe(false);
    expect(result.validation.checks.thresholdMet.passed).toBe(false);
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('under-signed + wrong prior digest: PREVIOUS_EVENT_MISMATCH leads', () => {
    // setup: kt=2 inception; an ixn whose p is not the inception's SAID
    const { icp, signedIcp } = twoKeyIcp();
    const wrongPrior = dig('mallory', 0);

    // call our method under test
    const result = KELOps.validateAppend([signedIcp], underSignedIxn(icp.i, 1, wrongPrior));

    // assertions: both errors, the blocking one first; not pending
    expect(!result.ok && result.errors).toEqual([
      {
        code: 'PREVIOUS_EVENT_MISMATCH',
        scope: 'chain',
        severity: 'error',
        message: `Previous event mismatch: p field is ${wrongPrior}, expected ${icp.d}`,
        eventIndex: 1,
      },
      UNDER_SIGNED,
    ]);
    expect(result.validation.checks.previousEventValid?.passed).toBe(false);
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('under-signed + wrong AID: AID_INCONSISTENT leads', () => {
    // setup: kt=2 inception; an ixn carrying another identifier's AID
    const { icp, signedIcp } = twoKeyIcp();
    const other = icpWith([dig('alice', 1)]).icp.i;

    // call our method under test
    const result = KELOps.validateAppend([signedIcp], underSignedIxn(other, 1, icp.d));

    // assertions: both errors, the blocking one first; not pending
    expect(!result.ok && result.errors).toEqual([
      {
        code: 'AID_INCONSISTENT',
        scope: 'chain',
        severity: 'error',
        message: `AID mismatch at event 1: expected ${icp.i}, got ${other}`,
        eventIndex: 1,
      },
      UNDER_SIGNED,
    ]);
    expect(result.validation.checks.aidValid).toEqual({
      passed: false,
      error: `AID mismatch at event 1: expected ${icp.i}, got ${other}`,
    });
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });

  test('under-signed alone stays pending', () => {
    // setup: kt=2 inception; a well-formed ixn signed by alice[0] alone
    const { icp, signedIcp } = twoKeyIcp();

    // call our method under test
    const result = KELOps.validateAppend([signedIcp], underSignedIxn(icp.i, 1, icp.d));

    // assertions: only the pending error; the append may persist it as pending
    expect(!result.ok && result.errors).toEqual([UNDER_SIGNED]);
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(true);
  });
});
