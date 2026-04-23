import { TELOps } from './ops.js';
import { TELData } from './tel-data.js';

export const Tel = {
  ...TELData,
  ...TELOps,
} as const;

export type { TelValidationError, TelValidationResult } from './ops.js';
export { TELOps } from './ops.js';
export { TELData } from './tel-data.js';
export * from './types.js';
