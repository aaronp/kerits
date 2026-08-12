import * as hashing from './hashing.js';
import * as primitives from './primitives.js';
import { verify } from './verify.js';

export const Signature = {
  ...primitives,
  ...hashing,
  verify,
} as const;

export type { Ed25519Signer, Secp256k1Signer, Signer } from './signer.js';
export { isEd25519Signer, isSecp256k1Signer } from './signer.js';
export { Signers } from './signers.js';
