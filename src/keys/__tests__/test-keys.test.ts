import { describe, expect, test } from 'bun:test';
import { TestKeys } from '../test-keys.js';
import { publicKeyHex, toCESRPublicKey } from '../raw-public-key.js';
import { Signers } from '../../signature/index.js';

const testPurpose = { purpose: { type: 'test' }, purposeText: 'test' };

describe('TestKeys', () => {
  test('get() delegates to create() with default keys', () => {
    // setup: just call the factory — no state needed
    const tk = TestKeys.get();
    expect(tk.id).toBe(TestKeys.GENERATOR_ID);
    expect(tk.supports().has('ed25519')).toBe(true);
  });

  test('generate returns deterministic keys in sequence', async () => {
    // setup: two independent instances both start from the same default key list
    const tk1 = TestKeys.get();
    const tk2 = TestKeys.get();
    // call our method under test
    const k1 = await tk1.generate('ed25519');
    const k2 = await tk2.generate('ed25519');
    // first key from each instance should be identical (same seed[0])
    expect(k1.ok).toBe(true);
    expect(k2.ok).toBe(true);
    if (!k1.ok || !k2.ok) return;
    expect(publicKeyHex(k1.value.publicKey)).toBe(publicKeyHex(k2.value.publicKey));
  });

  test('sequential generates return different keys', async () => {
    // setup: one instance, advance the cursor twice
    const tk = TestKeys.get();
    // call our method under test
    const k1 = await tk.generate('ed25519');
    const k2 = await tk.generate('ed25519');
    // different positions in the list must yield different keys
    expect(k1.ok).toBe(true);
    expect(k2.ok).toBe(true);
    if (!k1.ok || !k2.ok) return;
    expect(publicKeyHex(k1.value.publicKey)).not.toBe(publicKeyHex(k2.value.publicKey));
  });

  test('generateBatch returns N sequential keys', async () => {
    // setup: fresh instance, request a batch of 3
    const tk = TestKeys.get();
    // call our method under test
    const batch = await tk.generateBatch('ed25519', 3);
    // all 3 keys should be unique
    expect(batch.ok).toBe(true);
    if (!batch.ok) return;
    expect(batch.value.length).toBe(3);
    const hexes = batch.value.map((k) => publicKeyHex(k.publicKey));
    expect(new Set(hexes).size).toBe(3);
  });

  test('generate past list end returns error', async () => {
    // setup: create instance with only 2 keys, exhaust them
    const tk = TestKeys.create(TestKeys.defaultKeys().slice(0, 2));
    await tk.generate('ed25519');
    await tk.generate('ed25519');
    // call our method under test — third call should fail
    const r = await tk.generate('ed25519');
    // should signal generation-failed when list is exhausted
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.kind).toBe('generation-failed');
  });

  test('unsupported algo returns error', async () => {
    // setup: fresh instance
    const tk = TestKeys.get();
    // call our method under test with an unsupported algorithm
    const r = await tk.generate('secp256k1');
    // should signal algo-not-supported
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.kind).toBe('algo-not-supported');
  });

  test('hasKey returns true for generated keys', async () => {
    // setup: generate one key so it's tracked
    const tk = TestKeys.get();
    const k = await tk.generate('ed25519');
    expect(k.ok).toBe(true);
    if (!k.ok) return;
    // call our method under test
    expect(await tk.hasKey(k.value.publicKey)).toBe(true);
  });

  test('resolve returns working signer for generated key', async () => {
    // setup: generate a key so it's available in the store
    const tk = TestKeys.get();
    const k = await tk.generate('ed25519');
    expect(k.ok).toBe(true);
    if (!k.ok) return;
    // call our method under test
    const scope = await tk.resolve(k.value.publicKey, testPurpose);
    expect(scope.ok).toBe(true);
    if (!scope.ok) return;
    // signer should produce a valid signature verifiable against the public key
    const data = new TextEncoder().encode('test-keys signing');
    const sig = await scope.value.withSigner(async (s) => s.signBytes(data));
    expect(Signers.verify(toCESRPublicKey(k.value.publicKey), sig, data)).toBe(true);
  });

  test('resolve returns key-not-found for unconsumed key', async () => {
    // setup: two separate instances — key generated in otherTk is unknown to tk
    const tk = TestKeys.get();
    const otherTk = TestKeys.get();
    const k = await otherTk.generate('ed25519');
    if (!k.ok) return;
    // call our method under test
    const r = await tk.resolve(k.value.publicKey, testPurpose);
    // tk never issued that key, so it must not resolve
    expect(r.ok).toBe(false);
  });

  test('defaultKeys returns the static key list', () => {
    // setup: no instance needed — static accessor
    const keys = TestKeys.defaultKeys();
    // should expose at least 50 pre-seeded key pairs
    expect(keys.length).toBeGreaterThanOrEqual(50);
    expect(keys[0].privateKey.length).toBe(32);
    expect(keys[0].publicKey.length).toBe(32);
  });
});
