import { describe, expect, test } from 'bun:test';
import type { KELEvent } from '../types.js';
import { anchoredLane, anchoredPrefix, assessTelKelAnchor } from '../tel-kel-anchor.js';

const TEL_SAID = 'EtelSaid00000000000000000000000000000000000';
const OTHER_TEL = 'EotherTel000000000000000000000000000000000';
const IXN_SAID = 'EixnSaid00000000000000000000000000000000000';
const ISSUER = 'EissuerAid00000000000000000000000000000000';

function ixnAnchoring(telSaid: string): KELEvent {
  return {
    t: 'ixn',
    d: IXN_SAID,
    i: ISSUER,
    s: '1',
    p: 'Eprior000000000000000000000000000000000000',
    a: [{ i: ISSUER, s: '0', d: telSaid }],
  } as KELEvent;
}

function icpOnly(): KELEvent {
  return {
    t: 'icp',
    d: 'EicpSaid00000000000000000000000000000000000',
    i: ISSUER,
    s: '0',
    kt: '1',
    k: ['Dkey'],
    nt: '1',
    n: ['Enext'],
    bt: '0',
    b: [],
    c: [],
    a: [],
  } as KELEvent;
}

describe('assessTelKelAnchor', () => {
  test('returns anchored when an ixn seals the TEL SAID', () => {
    // setup: issuer KEL with ixn anchoring the TEL event
    const kel = [icpOnly(), ixnAnchoring(TEL_SAID)];

    // call out our method under test
    const result = assessTelKelAnchor(kel, TEL_SAID);

    // TEL event is sealed by the ixn
    expect(result).toEqual({
      status: 'anchored',
      telEventSaid: TEL_SAID,
      kelEventSaid: IXN_SAID,
    });
  });

  test('returns missing when KEL has seals but not for this TEL SAID', () => {
    // setup: ixn anchors a different TEL
    const kel = [icpOnly(), ixnAnchoring(OTHER_TEL)];

    // call out our method under test
    const result = assessTelKelAnchor(kel, TEL_SAID);

    // this TEL SAID is not sealed
    expect(result).toEqual({
      status: 'missing',
      telEventSaid: TEL_SAID,
    });
  });

  test('returns missing when KEL has no seal-capable events (ICP only)', () => {
    // setup: ICP-only KEL — no place for seals; still "missing" for this TEL
    const kel = [icpOnly()];

    // call out our method under test
    const result = assessTelKelAnchor(kel, TEL_SAID);

    // callers may tolerate missing; the function does not invent a third status
    expect(result).toEqual({
      status: 'missing',
      telEventSaid: TEL_SAID,
    });
  });

  test('returns missing for empty KEL', () => {
    // setup: no events
    const result = assessTelKelAnchor([], TEL_SAID);

    expect(result).toEqual({
      status: 'missing',
      telEventSaid: TEL_SAID,
    });
  });

  test('returns invalid for empty TEL SAID', () => {
    // setup: bad coordinates
    const result = assessTelKelAnchor([icpOnly()], '   ');

    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('anchoredPrefix', () => {
  test('stops at the first TEL event the issuer KEL does not seal', () => {
    // setup: KEL seals the iss only; the rev that follows is unanchored
    const kel = [icpOnly(), ixnAnchoring(TEL_SAID)];
    const iss = { d: TEL_SAID };
    const revUnanchored = { d: OTHER_TEL };

    // call out our method under test
    const prefix = anchoredPrefix([iss, revUnanchored], kel);

    // only the anchored iss counts
    expect(prefix).toEqual([iss]);
  });

  test('all anchored → every event; first unanchored → empty; empty input → empty', () => {
    // setup: KEL sealing TEL_SAID only
    const kel = [icpOnly(), ixnAnchoring(TEL_SAID)];
    const anchored = { d: TEL_SAID };
    const unanchored = { d: OTHER_TEL };

    // call out our method under test
    const all = anchoredPrefix([anchored, anchored], kel);
    const none = anchoredPrefix([unanchored, anchored], kel);
    const empty = anchoredPrefix([], kel);

    // a prefix never skips a gap: an unanchored first event hides everything after it
    expect(all).toEqual([anchored, anchored]);
    expect(none).toEqual([]);
    expect(empty).toEqual([]);
  });
});

describe('anchoredLane', () => {
  test('an unanchored inception is kept, so the anchor check reports it', () => {
    // setup: the KEL seals nothing for this lane; its inception (iss) and a later event are stored
    const kel = [icpOnly()];
    const iss = { d: TEL_SAID };
    const rev = { d: OTHER_TEL };

    // call out our method under test
    const lane = anchoredLane([iss, rev], kel);

    // only the inception: never an empty lane for a stored TEL
    expect(lane).toEqual([iss]);
  });

  test('an anchored prefix with trailing unanchored events reads as the prefix (as anchoredPrefix)', () => {
    // setup: the iss is sealed; the rev after it is not (stored junk past the anchored head)
    const kel = [icpOnly(), ixnAnchoring(TEL_SAID)];
    const iss = { d: TEL_SAID };
    const rev = { d: OTHER_TEL };

    // call out our method under test
    const lane = anchoredLane([iss, rev], kel);

    // the trailing unanchored rev is never read; an empty input stays empty
    expect(lane).toEqual([iss]);
    expect(anchoredLane([], kel)).toEqual([]);
  });
});
