import { describe, expect, test } from 'bun:test';
import type { CESREvent, CesrAttachment } from '../types.js';
import { validateDelegation } from '../delegation-validation.js';

/* ------------------------------------------------------------------------------------------------
 * Test helpers — build minimal CESREvent structures for each event type
 * ----------------------------------------------------------------------------------------------*/

function makeDipEvent(opts: {
  aid: string;
  said: string;
  di: string;
  k: string[];
  attachments?: CesrAttachment[];
}): CESREvent {
  return {
    event: {
      v: 'KERI10JSON000000_',
      t: 'dip',
      d: opts.said,
      i: opts.aid,
      s: '0',
      kt: '1',
      k: opts.k,
      nt: '1',
      n: ['EnextDigest'],
      bt: '0',
      b: [],
      c: [],
      a: [],
      di: opts.di,
    } as any,
    attachments: opts.attachments ?? [],
    enc: 'JSON',
  };
}

function makeParentIcp(opts: { aid: string; said: string; k: string[]; sig: string }): CESREvent {
  return {
    event: {
      v: 'KERI10JSON000000_',
      t: 'icp',
      d: opts.said,
      i: opts.aid,
      s: '0',
      kt: '1',
      k: opts.k,
      nt: '1',
      n: ['EnextDigest'],
      bt: '0',
      b: [],
      c: [],
      a: [],
    } as any,
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig: opts.sig }],
    enc: 'JSON',
  };
}

function makeParentIxn(opts: {
  aid: string;
  said: string;
  sn: string;
  prior: string;
  anchors: Array<{ i: string; s: string; d: string }>;
  sig: string;
}): CESREvent {
  return {
    event: {
      v: 'KERI10JSON000000_',
      t: 'ixn',
      d: opts.said,
      i: opts.aid,
      s: opts.sn,
      p: opts.prior,
      a: opts.anchors,
    } as any,
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig: opts.sig }],
    enc: 'JSON',
  };
}

describe('validateDelegation', () => {
  // --- non-delegated events are rejected early ---
  test('returns not-delegated for icp event', () => {
    // setup: a plain icp event (not delegated)
    const icp: CESREvent = {
      event: {
        v: 'KERI10JSON000000_',
        t: 'icp',
        d: 'Eicp',
        i: 'Eicp',
        s: '0',
        kt: '1',
        k: ['Dk1'],
        nt: '1',
        n: ['En1'],
        bt: '0',
        b: [],
        c: [],
        a: [],
      } as any,
      attachments: [],
      enc: 'JSON',
    };

    // method under test
    const result = validateDelegation({ childEvent: icp });

    // assertion: non-delegated event type is rejected
    expect(result).toEqual({ passed: false, reason: 'not-delegated' });
  });

  // --- dip without seal-source attachment ---
  test('returns missing-seal-source when no attachment', () => {
    // setup: dip event with no delegator-seal-source attachment
    const dip = makeDipEvent({ aid: 'Echild', said: 'Echild', di: 'Eparent', k: ['Dk1'] });

    // method under test
    const result = validateDelegation({ childEvent: dip });

    // assertion: missing seal-source is detected
    expect(result).toEqual({ passed: false, parentAid: 'Eparent', reason: 'missing-seal-source' });
  });

  // --- dip with seal-source but no parent KEL supplied ---
  test('returns missing-parent-kel when no parentKel provided', () => {
    // setup: dip with seal-source but no parent KEL to validate against
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '1', d: 'EparentIxnSaid' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip });

    // assertion: missing parent KEL is reported
    expect(result).toEqual({ passed: false, parentAid: 'Eparent', reason: 'missing-parent-kel' });
  });

  // --- parent KEL has no event at the referenced sequence number ---
  test('returns parent-event-not-found when parent KEL has no event at source sn', () => {
    // setup: parent KEL only has sn=0, but seal-source points to sn=5
    const parentIcp = makeParentIcp({ aid: 'Eparent', said: 'EparentIcpSaid', k: ['Dpk1'], sig: 'sig1' });
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '5', d: 'EnonExistent' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip, parentKel: [parentIcp] });

    // assertion: parent event at referenced sn does not exist
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('parent-event-not-found');
  });

  // --- SAID mismatch between seal-source and actual parent event ---
  test('returns parent-said-mismatch when parent event SAID differs', () => {
    // setup: seal-source points to sn=1 but with wrong SAID
    const parentIcp = makeParentIcp({ aid: 'Eparent', said: 'EparentIcpSaid', k: ['Dpk1'], sig: 'sig1' });
    const parentIxn = makeParentIxn({
      aid: 'Eparent',
      said: 'EparentIxnSaid',
      sn: '1',
      prior: 'EparentIcpSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'Echild' }],
      sig: 'sig2',
    });
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '1', d: 'EwrongSaid' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip, parentKel: [parentIcp, parentIxn] });

    // assertion: SAID mismatch detected
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('parent-said-mismatch');
  });

  // --- anchor seal missing from parent event ---
  test('returns anchor-seal-missing when parent event lacks child seal', () => {
    // setup: parent ixn exists and SAID matches, but its anchors array is empty
    const parentIcp = makeParentIcp({ aid: 'Eparent', said: 'EparentIcpSaid', k: ['Dpk1'], sig: 'sig1' });
    const parentIxn = makeParentIxn({
      aid: 'Eparent',
      said: 'EparentIxnSaid',
      sn: '1',
      prior: 'EparentIcpSaid',
      anchors: [],
      sig: 'sig2',
    });
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '1', d: 'EparentIxnSaid' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip, parentKel: [parentIcp, parentIxn] });

    // assertion: anchor seal referencing child is missing
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('anchor-seal-missing');
  });

  // --- drt without delegatorAid parameter ---
  test('returns missing-delegator-aid for drt without delegatorAid param', () => {
    // setup: drt event (no `di` field) and no delegatorAid supplied
    const drt: CESREvent = {
      event: {
        v: 'KERI10JSON000000_',
        t: 'drt',
        d: 'Edrt',
        i: 'Echild',
        s: '1',
        kt: '1',
        k: ['Dk2'],
        nt: '1',
        n: ['En2'],
        bt: '0',
        b: [],
        ba: [],
        br: [],
        p: 'Echild',
      } as any,
      attachments: [{ kind: 'delegator-seal-source', s: '2', d: 'EparentRotSaid' }],
      enc: 'JSON',
    };

    // method under test
    const result = validateDelegation({ childEvent: drt });

    // assertion: drt needs delegatorAid param since it has no `di` field
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('missing-delegator-aid');
  });

  // --- happy path: full valid delegation chain ---
  test('returns passed for valid delegation chain', () => {
    // setup: parent icp + ixn with anchor seal, child dip with seal-source pointing to ixn
    const parentIcp = makeParentIcp({ aid: 'Eparent', said: 'EparentIcpSaid', k: ['Dpk1'], sig: 'sig1' });
    const parentIxn = makeParentIxn({
      aid: 'Eparent',
      said: 'EparentIxnSaid',
      sn: '1',
      prior: 'EparentIcpSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'Echild' }],
      sig: 'sig2',
    });
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '1', d: 'EparentIxnSaid' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip, parentKel: [parentIcp, parentIxn] });

    // assertion: full chain validates — child seal-source -> parent ixn -> anchor seal -> child
    expect(result).toEqual({ passed: true, parentAid: 'Eparent' });
  });

  // --- parent AID mismatch ---
  test('returns parent-aid-mismatch when parent event AID differs from delegator', () => {
    // setup: parent ixn has a different AID than what the dip's `di` field says
    const wrongAidIcp = makeParentIcp({ aid: 'Ewrong', said: 'EwrongIcpSaid', k: ['Dpk1'], sig: 'sig1' });
    const wrongAidIxn = makeParentIxn({
      aid: 'Ewrong',
      said: 'EwrongIxnSaid',
      sn: '1',
      prior: 'EwrongIcpSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'Echild' }],
      sig: 'sig2',
    });
    const dip = makeDipEvent({
      aid: 'Echild',
      said: 'Echild',
      di: 'Eparent',
      k: ['Dk1'],
      attachments: [{ kind: 'delegator-seal-source', s: '1', d: 'EwrongIxnSaid' }],
    });

    // method under test
    const result = validateDelegation({ childEvent: dip, parentKel: [wrongAidIcp, wrongAidIxn] });

    // assertion: parent event AID does not match expected delegator
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('parent-aid-mismatch');
  });
});
