import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';

import { describe, expect, it, test } from 'bun:test';
import { encodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { PublicKey, Signature } from '../common/types.js';
import { generateKeyPair, sign } from './primitives.js';
import type { Algo } from '../common/algo.js';
import { verify, verifyByAlgo } from './verify.js';

describe('verify', () => {
  it('returns true for a valid signature', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sigRaw = sign(data, kp.privateKey);

    const publicKey = encodeKey(kp.publicKey).qb64 as PublicKey;
    const signature = encodeSig(sigRaw).qb64 as Signature;

    expect(verify(publicKey, signature, data)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sigRaw = sign(data, kp.privateKey);

    // Sign with correct key but verify against different data
    const otherData = new TextEncoder().encode('goodbye world');
    const publicKey = encodeKey(kp.publicKey).qb64 as PublicKey;
    const signature = encodeSig(sigRaw).qb64 as Signature;

    expect(verify(publicKey, signature, otherData)).toBe(false);
  });

  it('returns false for malformed input instead of throwing', () => {
    expect(verify('not-a-key' as PublicKey, 'not-a-sig' as Signature, new Uint8Array([1]))).toBe(false);
  });
});

describe('verify secp256k1', () => {
  test('verifies valid secp256k1 signature', () => {
    // setup: generate a secp256k1 key pair and sign data
    // secp256k1.sign defaults to prehash: true (internal sha256)
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKeyRaw = secp256k1.getPublicKey(privateKey, true);
    const data = new TextEncoder().encode('verify me');
    const sig = secp256k1.sign(data, privateKey);

    const cesrPub = encodeKey(publicKeyRaw, true, 'secp256k1').qb64 as PublicKey;
    const cesrSig = encodeSig(sig, 'secp256k1').qb64 as Signature;

    // call our method under test
    expect(verify(cesrPub, cesrSig, data)).toBe(true);
  });

  test('rejects invalid secp256k1 signature', () => {
    // setup: sign original data, then verify against tampered data
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKeyRaw = secp256k1.getPublicKey(privateKey, true);
    const data = new TextEncoder().encode('original');
    const wrongData = new TextEncoder().encode('tampered');
    const sig = secp256k1.sign(data, privateKey);

    const cesrPub = encodeKey(publicKeyRaw, true, 'secp256k1').qb64 as PublicKey;
    const cesrSig = encodeSig(sig, 'secp256k1').qb64 as Signature;

    // call our method under test
    // signature is over original data but we verify against wrongData
    expect(verify(cesrPub, cesrSig, wrongData)).toBe(false);
  });

  test('rejects mismatched algo (ed25519 key + secp256k1 sig)', () => {
    // setup: ed25519 key encoded as ed25519, secp256k1 sig encoded as secp256k1
    const edPriv = ed25519.utils.randomSecretKey();
    const edPub = encodeKey(ed25519.getPublicKey(edPriv), true, 'ed25519').qb64 as PublicKey;

    const secPriv = secp256k1.utils.randomSecretKey();
    const data = new TextEncoder().encode('mismatch');
    const sig = secp256k1.sign(data, secPriv);
    const secSig = encodeSig(sig, 'secp256k1').qb64 as Signature;

    // call our method under test — algo mismatch must be rejected
    expect(verify(edPub, secSig, data)).toBe(false);
  });

  test('ed25519 verification still works', () => {
    // setup: ed25519 key pair with explicit algo encoding
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKeyRaw = ed25519.getPublicKey(privateKey);
    const data = new TextEncoder().encode('ed25519 test');
    const sig = ed25519.sign(data, privateKey);

    const cesrPub = encodeKey(publicKeyRaw, true, 'ed25519').qb64 as PublicKey;
    const cesrSig = encodeSig(sig, 'ed25519').qb64 as Signature;

    // call our method under test
    expect(verify(cesrPub, cesrSig, data)).toBe(true);
  });
});

describe('verifyByAlgo', () => {
  test('branches explicitly per algo; an unknown algo is never treated as ed25519', () => {
    // setup: a valid ed25519 signature and a valid secp256k1 signature over the same data
    const data = new TextEncoder().encode('hello world');
    const edPriv = ed25519.utils.randomSecretKey();
    const ed = { sig: ed25519.sign(data, edPriv), pub: ed25519.getPublicKey(edPriv) };
    const kPriv = secp256k1.utils.randomSecretKey();
    const k = { sig: secp256k1.sign(data, kPriv), pub: secp256k1.getPublicKey(kPriv) };

    // call our method under test
    const edOk = verifyByAlgo('ed25519', ed, data);
    const kOk = verifyByAlgo('secp256k1', k, data);
    const unknown = verifyByAlgo('bls12-381' as Algo, ed, data);

    // each known algo verifies; an unknown algo is rejected even with valid ed25519 bytes
    expect(edOk).toBe(true);
    expect(kOk).toBe(true);
    expect(unknown).toBe(false);
  });
});
