import { describe, expect, test } from 'bun:test';
import type { CESREvent } from '../types.js';
import { validateAnchorTargets } from '../anchor-targets.js';

function makeDip(opts: { aid: string; said: string; sn?: string }): CESREvent {
  return {
    event: {
      v: 'KERI10JSON000000_',
      t: 'dip',
      d: opts.said,
      i: opts.aid,
      s: opts.sn ?? '0',
      kt: '1',
      k: ['Dk1'],
      nt: '1',
      n: ['En1'],
      bt: '0',
      b: [],
      c: [],
      a: [],
      di: 'Eparent',
    } as CESREvent['event'],
    attachments: [],
    enc: 'JSON',
  };
}

function makeIxn(opts: {
  aid: string;
  said: string;
  anchors: Array<{ i: string; s: string; d: string }>;
}): CESREvent {
  return {
    event: {
      v: 'KERI10JSON000000_',
      t: 'ixn',
      d: opts.said,
      i: opts.aid,
      s: '1',
      p: opts.aid,
      a: opts.anchors,
    } as CESREvent['event'],
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig: 'Asig' }],
    enc: 'JSON',
  };
}

describe('validateAnchorTargets', () => {
  test('passes when a[] targets exist in referencedEvents', () => {
    // setup: parent IXN seals child DIP that is in referencedEvents
    const child = makeDip({ aid: 'Echild', said: 'EdipSaid' });
    const ixn = makeIxn({
      aid: 'Eparent',
      said: 'EixnSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'EdipSaid' }],
    });

    // method under test
    const result = validateAnchorTargets(ixn.event, [child]);

    // assertion
    expect(result).toEqual({ passed: true });
  });

  test('returns missing-referenced-event when target AID absent', () => {
    // setup: IXN seals a child that is not in referencedEvents
    const ixn = makeIxn({
      aid: 'Eparent',
      said: 'EixnSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'EdipSaid' }],
    });

    // method under test
    const result = validateAnchorTargets(ixn.event, []);

    // assertion
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('missing-referenced-event');
  });

  test('returns missing-referenced-event when sn does not match', () => {
    // setup: child at sn=0 but anchor points to sn=1
    const child = makeDip({ aid: 'Echild', said: 'EdipSaid', sn: '0' });
    const ixn = makeIxn({
      aid: 'Eparent',
      said: 'EixnSaid',
      anchors: [{ i: 'Echild', s: '1', d: 'EdipSaid' }],
    });

    // method under test
    const result = validateAnchorTargets(ixn.event, [child]);

    // assertion
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('missing-referenced-event');
  });

  test('returns said-mismatch when d does not match event at sn', () => {
    // setup: child exists at sn=0 but SAID differs from anchor d
    const child = makeDip({ aid: 'Echild', said: 'EactualSaid' });
    const ixn = makeIxn({
      aid: 'Eparent',
      said: 'EixnSaid',
      anchors: [{ i: 'Echild', s: '0', d: 'EwrongSaid' }],
    });

    // method under test
    const result = validateAnchorTargets(ixn.event, [child]);

    // assertion
    expect(result.passed).toBe(false);
    if (!result.passed) expect(result.reason).toBe('said-mismatch');
  });

  test('passes when event has empty a[]', () => {
    // setup: IXN with no anchors
    const ixn = makeIxn({ aid: 'Eparent', said: 'EixnSaid', anchors: [] });

    // method under test
    const result = validateAnchorTargets(ixn.event, []);

    // assertion
    expect(result).toEqual({ passed: true });
  });
});
