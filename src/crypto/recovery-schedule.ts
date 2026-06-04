import { ed25519 } from '@noble/curves/ed25519.js';
import { digestVerfer } from '../cesr/digest.js';
import { encodeKey } from '../cesr/keys.js';
import { hkdfSha256 } from './hkdf-sha256.js';

export const RECOVERY_SCHEDULE_VERSION = 'kerits-recovery-v1' as const;
export const RECOVERY_EXPAND_SALT = 'kerits-recovery-v1';
export const ACCOUNT_RECOVERY_PATH_PREFIX = 'kerits/v1/account/recovery/signing';

export type RecoveryKdfParams = {
  readonly name: 'argon2id';
  readonly memoryKiB: number;
  readonly iterations: number;
  readonly parallelism: number;
  readonly salt: string;
};

export type KeritsRecoveryDerivation = {
  readonly type: 'KeritsRecoveryDerivation';
  readonly version: typeof RECOVERY_SCHEDULE_VERSION;
  readonly purpose: 'account-recovery';
  readonly curve: 'ed25519';
  readonly kdf: RecoveryKdfParams;
  readonly expand: 'hkdf-sha256';
  readonly pathPrefix: typeof ACCOUNT_RECOVERY_PATH_PREFIX;
  readonly currentIndex: number;
  readonly nextIndex: number;
};

export type RecoveryKeyDerivationSpec = {
  readonly version: typeof RECOVERY_SCHEDULE_VERSION;
  readonly kdf: 'argon2id';
  readonly kdfParams: RecoveryKdfParams;
  readonly expand: 'hkdf-sha256';
  readonly curve: 'ed25519';
  readonly path: string;
  readonly index: number;
};

const textEncoder = new TextEncoder();

export function buildAccountRecoverySigningPath(index: number): string {
  return `${ACCOUNT_RECOVERY_PATH_PREFIX}/${index}`;
}

export function buildDeviceRecoverySigningPath(deviceAid: string, index: number): string {
  return `kerits/v1/device/${deviceAid}/recovery/signing/${index}`;
}

export function deriveScheduledEd25519Keypair(
  seed: Uint8Array,
  infoPath: string,
): { readonly publicKey: Uint8Array; readonly privateKey: Uint8Array } {
  if (seed.length < 32) {
    throw new Error(`Expected 32+ byte recovery seed, got ${seed.length}`);
  }
  const info = textEncoder.encode(infoPath);
  const salt = textEncoder.encode(RECOVERY_EXPAND_SALT);
  const childSeed = hkdfSha256(seed, salt, info, 32);
  const privateKey = childSeed;
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

export function recoveryPublicKeyAt(seed: Uint8Array, index: number): Uint8Array {
  const path = buildAccountRecoverySigningPath(index);
  return deriveScheduledEd25519Keypair(seed, path).publicKey;
}

/** Digest commitment for the recovery key at `commitmentIndex` (typically currentIndex + 1 at inception). */
export function recoveryCommitmentAt(seed: Uint8Array, commitmentIndex: number): string {
  const publicKey = recoveryPublicKeyAt(seed, commitmentIndex);
  return digestVerfer(encodeKey(publicKey, true).qb64);
}

export function createInitialRecoveryDerivation(saltBase64Url: string): KeritsRecoveryDerivation {
  return {
    type: 'KeritsRecoveryDerivation',
    version: RECOVERY_SCHEDULE_VERSION,
    purpose: 'account-recovery',
    curve: 'ed25519',
    kdf: {
      name: 'argon2id',
      memoryKiB: 262144,
      iterations: 3,
      parallelism: 1,
      salt: saltBase64Url,
    },
    expand: 'hkdf-sha256',
    pathPrefix: ACCOUNT_RECOVERY_PATH_PREFIX,
    currentIndex: 0,
    nextIndex: 1,
  };
}

export function advanceRecoveryDerivation(meta: KeritsRecoveryDerivation): KeritsRecoveryDerivation {
  return {
    ...meta,
    currentIndex: meta.currentIndex + 1,
    nextIndex: meta.nextIndex + 1,
  };
}

export function recoveryKeyDerivationSpec(meta: KeritsRecoveryDerivation, index: number): RecoveryKeyDerivationSpec {
  return {
    version: meta.version,
    kdf: 'argon2id',
    kdfParams: meta.kdf,
    expand: meta.expand,
    curve: meta.curve,
    path: buildAccountRecoverySigningPath(index),
    index,
  };
}
