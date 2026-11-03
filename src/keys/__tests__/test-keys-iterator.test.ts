import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import rotationExpected from '../../kel/fixtures/rotation-expected.json';
import { TestKeys } from '../test-keys.js';

describe('TestKeys.iterator', () => {
  test('seed chain: seed0 = sha256("kerits-test-keys/"+name), seed(i+1) = sha256(seed(i))', () => {
    // setup: derive the first two seeds independently
    const seed0 = sha256(new TextEncoder().encode('kerits-test-keys/alice'));
    const seed1 = sha256(seed0);
    // call our method under test
    const alice = TestKeys.iterator('alice');
    // assertions: exact private and public keys, and stable memoisation
    expect(alice.at(0).privateKey).toEqual(seed0);
    expect(alice.at(1).privateKey).toEqual(seed1);
    expect(alice.at(1).publicKey).toEqual(ed25519.getPublicKey(seed1));
    expect(alice.at(1)).toBe(alice.at(1));
  });

  test('streams are independent by name and iterable in order', () => {
    // setup + call: two named streams
    const [a0, a1] = TestKeys.iterator('alice');
    // assertions: order matches at(n); names don't collide
    expect(a0).toBe(TestKeys.iterator('alice').at(0));
    expect(a1).toBe(TestKeys.iterator('alice').at(1));
    expect(TestKeys.iterator('bob').at(0).cesr).not.toBe(a0!.cesr);
  });

  test('keys match keripy, which derived them independently', () => {
    // setup: keripy's CESR public keys for the add-device scenario
    const keys = rotationExpected['add-device-kt1'].keys;
    // call our method under test
    const alice2 = TestKeys.iterator('alice').at(2).cesr;
    const joiner1 = TestKeys.iterator('joiner').at(1).cesr;
    // assertions: exact CESR equality with keripy's derivation
    expect(alice2).toBe(keys['alice[2]']);
    expect(joiner1).toBe(keys['joiner[1]']);
    expect(alice2).toBe('DHaEbKeeNDnsZQKN6rk4o7i_5OD_N60GW1g8Nv9y7x7c');
    expect(joiner1).toBe('DFibCBsq3jo34-CMvpaMJw0rtx2Td1ja0zf_ajar7Hx6');
  });
});
