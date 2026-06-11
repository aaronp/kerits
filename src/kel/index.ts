import * as eventSigning from './event-signing.js';
import { KELEvents } from './events.js';
import * as predicates from './predicates.js';
import * as rotation from './rotation.js';
import * as threshold from './threshold.js';
import * as validation from './validation.js';
import * as validationPredicates from './validation-predicates.js';

export const Kel = {
  ...predicates,
  ...validationPredicates,
  ...threshold,
  ...rotation,
  ...validation,
  ...eventSigning,
  ...KELEvents,
} as const;

export { KELEvents } from './events.js';
export { KELData } from './kel-data.js';
export { KELOps } from './ops.js';
export type {
  ControllerSignatureValidationError,
  CurrentKeySet,
  EstablishmentEvent,
  EventRef,
  KELView,
  KeyStateError,
  KeyStateResult,
  MatchKeyRevelationInput,
  MatchKeyRevelationResult,
  PreviousNextKeyCommitment,
  ValidateAppendResult,
  ValidateControllerSignatureResult,
  VerifiedKeyState,
} from './ops-types.js';
export * from './types.js';
export {
  eventContainsAnchorForSaid,
  isDelegationAnchor,
  type VrcVerificationResult,
  verifyVrcAgainstThreshold,
  verifyWitnessReceipt,
} from './validation-predicates.js';
