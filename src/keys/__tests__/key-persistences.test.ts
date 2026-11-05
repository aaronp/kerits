import { describe, expect, test } from 'bun:test';
import { KeyPersistences } from '../key-persistences.js';
import { asRawPublicKey } from '../raw-public-key.js';
import type { EncryptedKeyEntry } from '../types.js';
import { UnlockRefs } from '../unlock-ref.js';
import type { Timestamp } from '../../common/types.js';

describe('KeyPersistences.inMemory', () => {
  function makeEntry(byte: number): EncryptedKeyEntry {
    const publicKey = asRawPublicKey(new Uint8Array(32).fill(byte));
    return {
      publicKey,
      algo: 'ed25519',
      encryptedPrivateKey: new Uint8Array(32).fill(byte + 1),
      iv: new Uint8Array(12),
      ref: UnlockRefs.passphrase('test-provider'),
      publicKeyDigest: `digest-${byte}`,
      createdAt: '2026-01-01T00:00:00Z' as Timestamp,
    };
  }

  test('store then lookup returns the entry', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();
    const entry = makeEntry(1);

    // method under test
    await persistence.store(entry);
    const result = await persistence.lookup(entry.publicKey);

    // assertions
    expect(result).toEqual(entry);
  });

  test('lookup unknown key returns undefined', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();
    const unknownKey = asRawPublicKey(new Uint8Array(32));

    // method under test
    const result = await persistence.lookup(unknownKey);

    // assertions
    expect(result).toBeUndefined();
  });

  test('list returns all stored entries', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();
    const entry1 = makeEntry(1);
    const entry2 = makeEntry(2);
    await persistence.store(entry1);
    await persistence.store(entry2);

    // method under test
    const entries = await persistence.list();

    // assertions
    expect(entries.length).toBe(2);
  });

  test('list returns empty array when no entries', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();

    // method under test + assertions
    expect(await persistence.list()).toEqual([]);
  });
});
