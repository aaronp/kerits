import * as nextKeyDigest from './next-key-digest.js';
import * as said from './said.js';

export const Said = {
  ...said,
  ...nextKeyDigest,
} as const;

export type * from './said.js';
