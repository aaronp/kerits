import * as eventSigning from './event-signing.js';
import { KELEvents } from './events.js';
import * as predicates from './predicates.js';
import * as rotation from './rotation.js';
import * as threshold from './threshold.js';
import * as validation from './validation.js';

export const Kel = {
  ...predicates,
  ...threshold,
  ...rotation,
  ...validation,
  ...eventSigning,
  ...KELEvents,
} as const;

export { KELEvents } from './events.js';
export type { KEL } from './kel-interface.js';
export * from './types.js';
export type { Vault } from './vault-interface.js';
