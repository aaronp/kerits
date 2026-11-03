import { describe, expect, test } from 'bun:test';
import type { AID, SAID } from '../../common/types.js';
import { TELEvents } from '../events.js';

const CRED = 'EcredSaid123456789012345678901234567890123' as SAID;
const REG = 'EvcpSaid1234567890123456789012345678901234' as SAID;
const PRIOR = 'EissSaid12345678901234567890123456789012345' as SAID;
const SEAL = { i: 'EIssuerAid123456789012345678901234567890', s: 'a', d: 'EanchorSaid2345678901234567890123456789012' };
const DT = '2026-01-01T00:00:00.000Z';

describe('TEL builders write keripy hex s', () => {
  test('every builder encodes its numeric sequence as hex', () => {
    // call our method under test: each builder at sn 16 (hex "10"; a decimal writer would give "16")
    const s = [
      TELEvents.buildVrt({ registryId: REG, sequence: 16, priorEventSaid: PRIOR, backerThreshold: '0', backersRemoved: [], backersAdded: [] }),
      TELEvents.buildIss({ credentialSaid: CRED, registryId: REG, sequence: 16, datetime: DT }),
      TELEvents.buildRev({ credentialSaid: CRED, registryId: REG, sequence: 16, priorEventSaid: PRIOR, datetime: DT }),
      TELEvents.buildBis({ credentialSaid: CRED, issuerAid: SEAL.i as AID, registrySeal: SEAL, sequence: 16, datetime: DT }),
      TELEvents.buildBrv({ credentialSaid: CRED, registrySeal: SEAL, sequence: 16, priorEventSaid: PRIOR, datetime: DT }),
    ].map((r) => (r.unsignedEvent as { s: string }).s);

    // assertions: all "10"
    expect(s).toEqual(['10', '10', '10', '10', '10']);
  });

  test('nextSequence reads the prior hex s and returns the next sn', () => {
    // call our method under test
    const next = ['0', '9', 'f'].map((p) => TELEvents.nextSequence(p));

    // assertions: hex in, number out
    expect(next).toEqual([1, 10, 16]);
  });
});
