import { describe, expect, test } from 'bun:test';
import { encodeAttachmentGroups } from '../../cesr/attachments.js';
import { encodeEventBytes } from '../event-signing.js';
import type { CesrAttachment, KELEvent } from '../types.js';

import fixtureData from './kel-wire-fixtures.json';

type WireExpected = {
  event: KELEvent;
  bodyHex: string;
  bodyLength: number;
  sigMatterQb64: string;
  sigerQb64: string;
  attachmentWireV2Qb64: string;
  attachmentCounterCodeV2: string;
  fullEventWireHex: string;
};

let expectedData: {
  expected: Record<string, WireExpected | { error: string }>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expectedData = require('./kel-wire-expected.json');
} catch {
  // Optional until scripts/generate-keripy-kel-wire.py is run.
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** KERIpy Serder.raw keeps i="" on icp wire bodies even when the logical AID is d. */
function eventBodyForKeripyWire(event: KELEvent): KELEvent {
  if ((event.t === 'icp' || event.t === 'dip') && event.i === event.d) {
    return { ...event, i: '' } as KELEvent;
  }
  return event;
}

function attachmentsFromExpected(exp: WireExpected): CesrAttachment[] {
  return [
    {
      kind: 'sig',
      form: 'indexed',
      keyIndex: 0,
      sig: exp.sigMatterQb64,
    },
  ];
}

describe('KEL wire cross-validation against keripy', () => {
  if (!expectedData) {
    test.todo('kel-wire-expected.json missing — run: python3 scripts/generate-keripy-kel-wire.py');
    return;
  }

  for (const fixture of fixtureData.fixtures) {
    const exp = expectedData.expected[fixture.id];
    if (!exp || 'error' in exp) continue;

    describe(fixture.id, () => {
      test('canonical body bytes match keripy Serder.raw', () => {
        const wireEvent = eventBodyForKeripyWire(exp.event as KELEvent);
        const body = encodeEventBytes(wireEvent);
        expect(body.length).toBe(exp.bodyLength);
        expect(Buffer.from(body).toString('hex')).toBe(exp.bodyHex);
      });

      test('kerits v1 attachment wire uses -A counter (differs from keripy v2 -J)', () => {
        const v1Wire = encodeAttachmentGroups(attachmentsFromExpected(exp));
        const text = new TextDecoder().decode(v1Wire);
        expect(text.startsWith('-A')).toBe(true);
        expect(text).not.toBe(exp.attachmentWireV2Qb64);
        expect(exp.attachmentCounterCodeV2).toBe('-J');
      });

      test('keripy v2 attachment wire prefix is -J', () => {
        expect(exp.attachmentWireV2Qb64.startsWith('-J')).toBe(true);
      });

      test('full keripy wire equals body + v2 attachments', () => {
        const body = hexToBytes(exp.bodyHex);
        const att = new TextEncoder().encode(exp.attachmentWireV2Qb64);
        const combined = new Uint8Array(body.length + att.length);
        combined.set(body);
        combined.set(att, body.length);
        expect(Buffer.from(combined).toString('hex')).toBe(exp.fullEventWireHex);
      });
    });
  }
});
