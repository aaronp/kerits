import { describe, expect, test } from 'bun:test';
import { FakeHsmKeyStores } from '../fake-hsm-key-store.js';
import { asRawPublicKey } from '../raw-public-key.js';
import { Signers } from '../../signature/index.js';
import { toCESRPublicKey } from '../raw-public-key.js';

describe('FakeHsmKeyStore', () => {
  test('generate → resolve → sign → verify', async () => {
    // setup: simulates an external hardware key source
    const hsm = FakeHsmKeyStores.create();

    // method under test: generate
    const genResult = await hsm.generate('ed25519');
    expect(genResult.ok).toBe(true);
    if (!genResult.ok) return;

    // method under test: resolve + sign
    const resolveResult = await hsm.resolve(genResult.value.publicKey);
    expect(resolveResult.ok).toBe(true);
    if (!resolveResult.ok) return;

    const data = new TextEncoder().encode('hsm-test');
    const sig = await resolveResult.value.withSigner(async (signer) => signer.signBytes(data));

    // assertions: valid CESR signature
    expect(Signers.verify(toCESRPublicKey(genResult.value.publicKey), sig, data)).toBe(true);
  });

  test('each create() produces a unique id', () => {
    // setup: two independent HSM instances
    const hsm1 = FakeHsmKeyStores.create();
    const hsm2 = FakeHsmKeyStores.create();

    // assertions: ids are prefixed and distinct
    expect(hsm1.id.startsWith('fake-hsm')).toBe(true);
    expect(hsm2.id.startsWith('fake-hsm')).toBe(true);
    expect(hsm1.id).not.toBe(hsm2.id);
  });

  test('resolve unknown key returns key-not-found', async () => {
    // setup: empty store with a key that was never generated
    const hsm = FakeHsmKeyStores.create();
    const unknownKey = asRawPublicKey(new Uint8Array(32));

    // method under test: resolve
    const result = await hsm.resolve(unknownKey);

    // assertions: returns key-not-found error
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('key-not-found');
  });
});
