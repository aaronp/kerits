// packages/core/src/crypto/envelope/__tests__/build-aad.test.ts

import { describe, expect, it } from 'bun:test';
import type { AID } from '../../../common/types.js';
import { buildAAD } from '../aad.js';
import type { EnvelopeAAD } from '../types.js';

const ownerAid = 'EaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM' as AID;

describe('buildAAD', () => {
  // deterministic: same input always produces identical bytes
  it('produces deterministic output for the same input', () => {
    const aad: EnvelopeAAD = { path: '/test/path', ownerAid, contentType: 'application/json' };
    const a = buildAAD(aad);
    const b = buildAAD(aad);
    expect(a).toEqual(b);
  });

  // canonical: key order does not depend on property insertion order
  it('is independent of property insertion order', () => {
    const a = buildAAD({ path: '/a', ownerAid, contentType: 'application/json' });
    const b = buildAAD({ contentType: 'application/json', ownerAid, path: '/a' } as EnvelopeAAD);
    expect(a).toEqual(b);
  });

  // version: included when present, omitted when undefined
  it('includes version in output when provided', () => {
    const without = buildAAD({ path: '/a', ownerAid, contentType: 'application/json' });
    const withVer = buildAAD({ path: '/a', ownerAid, contentType: 'application/json', version: 'v1' });
    expect(without).not.toEqual(withVer);
  });

  it('omits version key when undefined', () => {
    const a = buildAAD({ path: '/a', ownerAid, contentType: 'application/json' });
    const b = buildAAD({ path: '/a', ownerAid, contentType: 'application/json', version: undefined });
    expect(a).toEqual(b);
  });

  // output is Uint8Array (UTF-8 encoded)
  it('returns a Uint8Array', () => {
    const result = buildAAD({ path: '/a', ownerAid, contentType: 'application/json' });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});
