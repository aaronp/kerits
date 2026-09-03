import { describe, expect, test } from 'bun:test';
import { encodeAttachmentGroups, decodeAttachmentGroups } from '../../cesr/attachments.js';
import { validateDelegation } from '../delegation-validation.js';
import type { CESREvent, CesrAttachment } from '../types.js';

let expectedData: {
  parentAid: string;
  childAid: string;
  parentIcpSaid: string;
  parentIxnSn: string;
  parentIxnSaid: string;
  childDipSaid: string;
  sealSourceCoupleQb64: string;
  parentIcpEvent: Record<string, unknown>;
  parentIxnEvent: Record<string, unknown>;
  childDipEvent: Record<string, unknown>;
  parentIcpSigQb64: string;
  parentIxnSigQb64: string;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expectedData = require('./delegation-expected.json');
} catch {
  // Optional until scripts/generate-keripy-delegation.py is run
}

describe('Delegation cross-validation against keripy', () => {
  if (!expectedData) {
    test.todo('delegation-expected.json missing — run: python3 scripts/generate-keripy-delegation.py');
    return;
  }

  const data = expectedData;

  test('seal-source couple encoding matches keripy', () => {
    // setup: encode a seal-source couple with same values keripy used
    const couple: CesrAttachment = {
      kind: 'delegator-seal-source',
      s: data.parentIxnSn,
      d: data.parentIxnSaid,
    };
    // method under test: our CESR encoder
    const encoded = encodeAttachmentGroups([couple]);
    const ourQb64 = new TextDecoder().decode(encoded);
    // assertion: matches keripy output
    expect(ourQb64).toBe(data.sealSourceCoupleQb64);
  });

  test('can decode keripy seal-source couple', () => {
    // setup: keripy-generated CESR bytes
    const keripyBytes = new TextEncoder().encode(data.sealSourceCoupleQb64);
    // method under test: our CESR decoder
    const decoded = decodeAttachmentGroups(keripyBytes);
    // assertions: decoded values match
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual({
      kind: 'delegator-seal-source',
      s: data.parentIxnSn,
      d: data.parentIxnSaid,
    });
  });

  test('our validator accepts the keripy-generated delegation chain', () => {
    // setup: build CESREvents from keripy fixture data
    const parentIcp: CESREvent = {
      event: data.parentIcpEvent as any,
      attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig: data.parentIcpSigQb64 }],
      enc: 'JSON',
    };
    const parentIxn: CESREvent = {
      event: data.parentIxnEvent as any,
      attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig: data.parentIxnSigQb64 }],
      enc: 'JSON',
    };
    const childDip: CESREvent = {
      event: data.childDipEvent as any,
      attachments: [{ kind: 'delegator-seal-source', s: data.parentIxnSn, d: data.parentIxnSaid }],
      enc: 'JSON',
    };

    // method under test: our delegation validator
    const result = validateDelegation({
      childEvent: childDip,
      parentKel: [parentIcp, parentIxn],
    });

    // assertion: validation passes
    expect(result.passed).toBe(true);
    if (result.passed) {
      expect(result.parentAid).toBe(data.parentAid);
    }
  });
});
