import { describe, expect, test } from 'bun:test';
import { KELData, KELOps, KeriKeyPairs } from '../../index.js';
import type { AID } from '../../index.js';

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

describe('KELData.prepareDip', () => {
  test('produces a valid DIP event with di field and correct SAID', () => {
    // setup: create key pairs for the delegate identity and a parent AID
    const currentKeys = KeriKeyPairs.create();
    const nextKeys = KeriKeyPairs.create();
    const nextCommitment = KELOps.buildNextCommitment([nextKeys.publicKey], '1');
    const parentAid = 'DparentAid00000000000000000000000000000000000' as AID;

    // method under test: build a DIP event with parentAid
    const { event, bytes } = KELData.prepareDip({
      keys: [currentKeys.publicKey],
      nextKeyDigests: nextCommitment.n,
      signingThreshold: '1',
      nextThreshold: nextCommitment.nt,
      parentAid,
    });

    // assertions: DIP event has correct type, di field, self-addressing SAID, and signable bytes
    expect(event.t).toBe('dip');
    expect(event.di).toBe(parentAid);
    expect(event.i).toBe(event.d);
    expect(event.s).toBe('0');
    expect(event.k).toEqual([currentKeys.publicKey]);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
