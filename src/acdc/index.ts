import { ACDCData } from './acdc-data.js';
import { ACDCOps } from './ops.js';

export const Acdc = {
  ...ACDCData,
  ...ACDCOps,
} as const;

export { ACDCData } from './acdc-data.js';
export type { SaidValidationResult, SignatureResult } from './ops.js';
export { ACDCOps } from './ops.js';
export * from './types.js';
