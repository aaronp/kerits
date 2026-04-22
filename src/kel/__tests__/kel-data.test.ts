import { describe, expect, test } from 'bun:test';
import { KELData, KELOps, KeriKeyPairs } from '../../index.js';

describe('KELData.prepareIcp', () => {
  test('returns event with valid identifier prefix and signable bytes', () => {
    const currentKeys = KeriKeyPairs.create();
    const nextKeys = KeriKeyPairs.create();
    const nextCommitment = KELOps.buildNextCommitment(
      [nextKeys.publicKey],
      '1',
    );

    const { event, bytes } = KELData.prepareIcp({
      keys: [currentKeys.publicKey],
      nextKeyDigests: nextCommitment.n,
      signingThreshold: '1',
      nextThreshold: nextCommitment.nt,
    });

    // event has i and d fields set (not empty placeholders)
    expect(event.i).toBeTruthy();
    expect(event.d).toBeTruthy();
    // For self-addressing inception, i === d
    expect(event.i).toBe(event.d);
    // event type is icp
    expect(event.t).toBe('icp');
    // bytes are non-empty Uint8Array
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    // sequence number is 0
    expect(event.s).toBe('0');
    // keys match what we provided
    expect(event.k).toEqual([currentKeys.publicKey]);
  });
});
