import { TELEvents } from './events.js';
import { TELOps } from './ops.js';
import { TELData } from './tel-data.js';

export const Tel = {
  ...TELData,
  ...TELOps,
  ...TELEvents,
} as const;

export { TELEvents } from './events.js';
export type { TelValidationError, TelValidationResult } from './ops.js';
export { TELOps } from './ops.js';
export { TELData } from './tel-data.js';
export * from './types.js';
