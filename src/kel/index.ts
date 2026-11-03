import * as eventSigning from './event-signing.js';
import { KELEvents } from './events.js';
import * as predicates from './predicates.js';
import * as rotation from './rotation.js';
import * as validation from './validation.js';
import * as validationPredicates from './validation-predicates.js';

export const Kel = {
  ...predicates,
  ...validationPredicates,
  ...rotation,
  ...validation,
  ...eventSigning,
  ...KELEvents,
} as const;

export {
  type AnchorTargetsValidationResult,
  validateAnchorTargets,
} from './anchor-targets.js';
export {
  type DelegationValidationInput,
  type DelegationValidationResult,
  validateDelegation,
} from './delegation-validation.js';
export { KELEvents } from './events.js';
export { KELData } from './kel-data.js';
export { KELOps, type SupersedeError } from './ops.js';
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
export type { RotationChange, RotationPlan, RotationPlanError, RotationSigner } from './rotation.js';
export {
  anchoredLane,
  anchoredPrefix,
  assessTelKelAnchor,
  assessTelKelAnchors,
  type TelKelAnchorResult,
} from './tel-kel-anchor.js';
export * from './types.js';
export {
  eventContainsAnchorForSaid,
  isDelegationAnchor,
  type VrcVerificationResult,
  verifyVrcAgainstThreshold,
  verifyWitnessReceipt,
} from './validation-predicates.js';
