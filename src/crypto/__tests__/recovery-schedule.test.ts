import { describe, expect, test } from 'bun:test';
import { digestVerfer } from '../../cesr/digest.js';
import { encodeKey } from '../../cesr/keys.js';
import {
  advanceRecoveryDerivation,
  buildAccountRecoverySigningPath,
  buildDeviceRecoverySigningPath,
  createInitialRecoveryDerivation,
  deriveScheduledEd25519Keypair,
  recoveryCommitmentAt,
  recoveryPublicKeyAt,
} from '../recovery-schedule.js';

describe('recovery-schedule', () => {
  const seed = new Uint8Array(32);
  seed.fill(0xab);

  test('buildAccountRecoverySigningPath formats index', () => {
    expect(buildAccountRecoverySigningPath(0)).toBe('kerits/v1/account/recovery/signing/0');
    expect(buildAccountRecoverySigningPath(3)).toBe('kerits/v1/account/recovery/signing/3');
  });

  test('account and device paths do not collide', () => {
    const accountPath = buildAccountRecoverySigningPath(0);
    const devicePath = buildDeviceRecoverySigningPath('EABC123', 0);
    expect(accountPath).not.toBe(devicePath);
  });

  test('deriveScheduledEd25519Keypair is deterministic', () => {
    const path = buildAccountRecoverySigningPath(0);
    const a = deriveScheduledEd25519Keypair(seed, path);
    const b = deriveScheduledEd25519Keypair(seed, path);
    expect(encodeKey(a.publicKey, true).qb64).toBe(encodeKey(b.publicKey, true).qb64);
  });

  test('different indices produce different public keys', () => {
    const pub0 = recoveryPublicKeyAt(seed, 0);
    const pub1 = recoveryPublicKeyAt(seed, 1);
    const pub2 = recoveryPublicKeyAt(seed, 2);
    expect(encodeKey(pub0, true).qb64).not.toBe(encodeKey(pub1, true).qb64);
    expect(encodeKey(pub1, true).qb64).not.toBe(encodeKey(pub2, true).qb64);
  });

  test('recoveryCommitmentAt equals digest of key at commitment index', () => {
    const commitment = recoveryCommitmentAt(seed, 1);
    const pub1 = recoveryPublicKeyAt(seed, 1);
    expect(commitment).toBe(digestVerfer(encodeKey(pub1, true).qb64));
  });

  test('advanceRecoveryDerivation bumps indices', () => {
    const initial = createInitialRecoveryDerivation('c2FsdA');
    const next = advanceRecoveryDerivation(initial);
    expect(next.currentIndex).toBe(1);
    expect(next.nextIndex).toBe(2);
  });
});
