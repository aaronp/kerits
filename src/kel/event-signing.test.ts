/**
 * Tests for Event Signing
 *
 * Minimal tests for the ported event signing module.
 */

import { describe, expect, test } from 'bun:test';
import { encodeEventBytes } from './event-signing.js';
import type { KELEvent } from './types.js';

describe('encodeEventBytes', () => {
  test('encodes event to JSON canonical bytes', () => {
    const event = {
      v: 'KERI10JSON000156_',
      t: 'icp',
      d: 'Etest...',
      i: 'Etest...',
      s: '0',
      kt: '1',
      k: ['DA...'],
      nt: '1',
      n: ['E...'],
      bt: '0',
      b: [],
      c: [],
      a: [],
    } as unknown as KELEvent;

    const bytes = encodeEventBytes(event);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);

    // Verify it's valid JSON by decoding
    const decoded = new TextDecoder().decode(bytes);
    expect(() => JSON.parse(decoded)).not.toThrow();
  });

  test('throws for unsupported encoding', () => {
    const event = { t: 'icp' } as unknown as KELEvent;
    expect(() => encodeEventBytes(event, 'CBOR')).toThrow(/not yet supported/);
    expect(() => encodeEventBytes(event, 'MGPK')).toThrow(/not yet supported/);
  });
});
