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
export { KELData } from './kel-data.js';
export type { KEL } from './kel-interface.js';
export { KELOps } from './ops.js';
export type {
  ControllerSignatureValidationError,
  CurrentKeySet,
  EstablishmentEvent,
  EventRef,
  KELView,
  MatchKeyRevelationInput,
  MatchKeyRevelationResult,
  PreviousNextKeyCommitment,
  ValidateAppendResult,
  ValidateControllerSignatureResult,
} from './ops-types.js';
export * from './types.js';
export type { CreatedKey, KeyCreateOptions, Vault, VaultPurpose } from './vault-interface.js';
