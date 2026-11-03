import { describe, expect, test } from 'bun:test';
import { KELData, KELOps, KeriKeyPairs } from '../../index.js';
import type { AID, SAID } from '../../index.js';

describe('KELData.prepareIxn', () => {
  test('produces finalized IXN with computed SAID derived from real parent ICP', () => {
    // setup: create a real parent ICP using real keys
    const currentKeys = KeriKeyPairs.create();
    const nextKeys = KeriKeyPairs.create();
    const nextCommitment = KELOps.buildNextCommitment([nextKeys.publicKey], '1');
    const { event: icpEvent } = KELData.prepareIcp({
      keys: [currentKeys.publicKey],
      nextKeyDigests: nextCommitment.n,
      signingThreshold: '1',
      nextThreshold: nextCommitment.nt,
    });
    const parentAid = icpEvent.i as AID;
    const priorSaid = icpEvent.d as SAID;

    // method under test
    const { event, bytes } = KELData.prepareIxn({
      aid: parentAid,
      sequence: 1,
      priorEventSaid: priorSaid,
      anchors: [],
    });

    // assertions: exact event structure with computed SAID
    expect(event.t).toBe('ixn');
    expect(event.i).toBe(parentAid);
    expect(event.s).toBe('1');
    expect(event.p).toBe(priorSaid);
    expect(event.a).toEqual([]);
    expect(event.d).toMatch(/^E/);
    expect(JSON.parse(new TextDecoder().decode(bytes))).toEqual(event);
  });
});

describe('KELData.prepareDelegationAnchorIxn', () => {
  test('produces IXN with anchor seal from real parent ICP + child DIP', () => {
    // setup: real parent ICP
    const parentCurrent = KeriKeyPairs.create();
    const parentNext = KeriKeyPairs.create();
    const parentNextCommitment = KELOps.buildNextCommitment([parentNext.publicKey], '1');
    const { event: parentIcp } = KELData.prepareIcp({
      keys: [parentCurrent.publicKey],
      nextKeyDigests: parentNextCommitment.n,
      signingThreshold: '1',
      nextThreshold: parentNextCommitment.nt,
    });
    const parentAid = parentIcp.i as AID;
    const parentIcpSaid = parentIcp.d as SAID;

    // setup: real child DIP referencing parent
    const childCurrent = KeriKeyPairs.create();
    const childNext = KeriKeyPairs.create();
    const childNextCommitment = KELOps.buildNextCommitment([childNext.publicKey], '1');
    const { event: childDip } = KELData.prepareDip({
      keys: [childCurrent.publicKey],
      nextKeyDigests: childNextCommitment.n,
      signingThreshold: '1',
      nextThreshold: childNextCommitment.nt,
      parentAid,
    });
    const childAid = childDip.i as AID;
    const childDipSaid = childDip.d as SAID;

    // method under test
    const { event, bytes } = KELData.prepareDelegationAnchorIxn({
      parentAid,
      head: { sn: 0, said: parentIcpSaid },
      childAid,
      childEventSaid: childDipSaid,
      childEventSn: '0',
    });

    // assertions: IXN anchors the child DIP with correct seal and sequence
    expect(event.t).toBe('ixn');
    expect(event.i).toBe(parentAid);
    expect(event.s).toBe('1');
    expect(event.p).toBe(parentIcpSaid);
    expect(event.a).toEqual([{ i: childAid, s: '0', d: childDipSaid }]);
    expect(event.d).toMatch(/^E/);
    expect(JSON.parse(new TextDecoder().decode(bytes))).toEqual(event);
  });

  test('defaults childEventSn to "0" when not provided', () => {
    // setup: parent ICP
    const parentCurrent = KeriKeyPairs.create();
    const parentNext = KeriKeyPairs.create();
    const parentNextCommitment = KELOps.buildNextCommitment([parentNext.publicKey], '1');
    const { event: parentIcp } = KELData.prepareIcp({
      keys: [parentCurrent.publicKey],
      nextKeyDigests: parentNextCommitment.n,
      signingThreshold: '1',
      nextThreshold: parentNextCommitment.nt,
    });
    const parentAid = parentIcp.i as AID;
    const parentIcpSaid = parentIcp.d as SAID;

    // setup: child DIP
    const childCurrent = KeriKeyPairs.create();
    const childNext = KeriKeyPairs.create();
    const childNextCommitment = KELOps.buildNextCommitment([childNext.publicKey], '1');
    const { event: childDip } = KELData.prepareDip({
      keys: [childCurrent.publicKey],
      nextKeyDigests: childNextCommitment.n,
      signingThreshold: '1',
      nextThreshold: childNextCommitment.nt,
      parentAid,
    });

    // method under test — omit childEventSn
    const { event } = KELData.prepareDelegationAnchorIxn({
      parentAid,
      head: { sn: 0, said: parentIcpSaid },
      childAid: childDip.i as AID,
      childEventSaid: childDip.d as SAID,
    });

    // assertions: missing childEventSn defaults to '0' in the seal
    expect(event.a).toEqual([{ i: childDip.i, s: '0', d: childDip.d }]);
  });
});

// ── Keripy cross-validation ──
// Load fixture produced by scripts/generate-keripy-delegation.py — fail clearly if absent
let expectedData: {
  parentAid: string;
  childAid: string;
  parentIcpSaid: string;
  parentIxnSn: string;
  parentIxnSaid: string;
  childDipSaid: string;
  parentIxnEvent: Record<string, unknown>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expectedData = require('../fixtures/delegation-expected.json');
} catch {
  // Will be caught below — test fails with clear message
}

describe('prepareDelegationAnchorIxn keripy cross-validation', () => {
  test('fixture exists (run: python3 scripts/generate-keripy-delegation.py)', () => {
    if (!expectedData)
      throw new Error('delegation-expected.json missing — run: python3 scripts/generate-keripy-delegation.py');
  });

  test('produced event body matches keripy field-for-field', () => {
    if (!expectedData)
      throw new Error('delegation-expected.json missing — run: python3 scripts/generate-keripy-delegation.py');
    const { event } = KELData.prepareDelegationAnchorIxn({
      parentAid: expectedData.parentAid as AID,
      head: { sn: Number(expectedData.parentIxnSn) - 1, said: expectedData.parentIcpSaid as SAID },
      childAid: expectedData.childAid as AID,
      childEventSaid: expectedData.childDipSaid as SAID,
    });
    expect(event).toEqual(expectedData.parentIxnEvent);
  });

  test('SAID matches keripy-generated value', () => {
    if (!expectedData)
      throw new Error('delegation-expected.json missing — run: python3 scripts/generate-keripy-delegation.py');
    const { event } = KELData.prepareDelegationAnchorIxn({
      parentAid: expectedData.parentAid as AID,
      head: { sn: Number(expectedData.parentIxnSn) - 1, said: expectedData.parentIcpSaid as SAID },
      childAid: expectedData.childAid as AID,
      childEventSaid: expectedData.childDipSaid as SAID,
    });
    expect(event.d).toBe(expectedData.parentIxnSaid);
  });
});
