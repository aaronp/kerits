import * as hashing from './hashing.js';
import * as primitives from './primitives.js';
import { verify } from './verify.js';

export const Signature = {
  ...primitives,
  ...hashing,
  verify,
} as const;

export type { Signer } from './signer.js';
