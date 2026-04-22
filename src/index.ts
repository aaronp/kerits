// @kerits/core
//
// Pure KERI primitives: types, cryptographic operations, CESR encoding,
// KEL validation, SAID computation, and data canonicalization.
//
// Namespace objects provide a discoverable API surface:
//   Cesr.encode(), Kel.checkThreshold(), Said.encodeSAID(), Signature.sign()
//
// Flat re-exports are provided for convenience and backwards compatibility.

export type {
  CESRCodeMeta,
  CESRDecoded,
} from './cesr/digest.js';
export {
  decode,
  decodeDigest,
  digestVerfer,
  encode,
  encodeDigest,
  getCodeMeta,
} from './cesr/digest.js';
// ── Namespace objects ────────────────────────────────────────────────
export { Cesr } from './cesr/index.js';
// ── CESR encoding/decoding ───────────────────────────────────────────
export {
  decodeKey,
  encodeKey,
} from './cesr/keys.js';
export type { PrefixInfo } from './cesr/prefix.js';
export { inspect } from './cesr/prefix.js';
export {
  decodeSig as decodeSignature,
  encodeSig as encodeSignature,
} from './cesr/sigs.js';
export type {
  EncodedKey,
  EncodedSig,
  KeyAlgo,
  SaidAlgo,
  SigAlgo,
} from './cesr/types.js';
// ── Common types, branding, and utilities ────────────────────────────
export * from './common/base64url.js';
export * from './common/brand.js';
export * from './common/canonical.js';
export * from './common/data.js';
export * from './common/errors.js';
export { transferableKeyToPublicKey } from './common/key-conversions.js';
export * from './common/types.js';
export { KeriKeyPairs } from './crypto/index.js';
export { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from './crypto/x25519.js';
export type {
  DipParams,
  DrtParams,
  FinalizedEventResult,
  IcpParams,
  IxnParams,
  RotParams,
  UnsignedEventResult,
} from './kel/events.js';
export { KELEvents } from './kel/events.js';
// ── Namespace types ──────────────────────────────────────────────────
// ── KEL event types ──────────────────────────────────────────────────
export type {
  AnySeal,
  CESREvent,
  CesrAttachment,
  CesrSeal,
  ControllerSignatureValidationError,
  CreatedKey,
  CurrentKeySet,
  DigestSeal,
  DipEvent,
  DrtEvent,
  EstablishmentEvent,
  EventRef,
  IcpEvent,
  IxnEvent,
  KEL,
  KELEvent,
  KELView,
  KelAppend,
  KelManifest,
  KeyCreateOptions,
  KeyIndex,
  KSN,
  MatchKeyRevelationInput,
  MatchKeyRevelationResult,
  PreviousNextKeyCommitment,
  PublishedResource,
  PublishFormat,
  RotEvent,
  ValidateAppendResult,
  ValidateControllerSignatureResult,
  Vault,
  VaultAppend,
  VaultPurpose,
} from './kel/index.js';
// ── KEL ops ─────────────────────────────────────────────────────────
// ── KEL ops ─────────────────────────────────────────────────────────
// ── KEL event schemas and namespaces ─────────────────────────────────
export {
  AnySealSchema,
  CESREventSchema,
  CesrAttachment_Signature,
  CesrAttachment_ValidatorReceipt,
  CesrAttachment_WitnessReceipt,
  CesrAttachmentSchema,
  CesrSealSchema,
  DigestSealSchema,
  DipEventSchema,
  DrtEventSchema,
  IcpEventSchema,
  IxnEventSchema,
  KELEventSchema,
  KELOps,
  Kel,
  KelAppendSchema,
  KelAppends,
  KelManifestSchema,
  KeyIndexSchema,
  KSNSchema,
  KSNs,
  PublishedResourceSchema,
  RotEventSchema,
  VaultAppendSchema,
} from './kel/index.js';
// ── KEL event factories ─────────────────────────────────────────────
export { KELData } from './kel/kel-data.js';
// ── KEL state derivation ────────────────────────────────────────────
export type { DerivedState } from './kel/kel-state.js';
export { reduceKelState } from './kel/kel-state.js';
export type {
  ThresholdCheckResult,
  ThresholdSpec,
  ThresholdValue,
} from './kel/threshold.js';
// ── KEL threshold ────────────────────────────────────────────────────
export {
  checkThreshold,
  parseSimpleThreshold,
} from './kel/threshold.js';
// ── KEL threshold normalization ─────────────────────────────────────
export type { NormalizedThreshold } from './kel/threshold-normalize.js';
export { normalizeThreshold } from './kel/threshold-normalize.js';
// ── KEL validation ──────────────────────────────────────────────────
export type {
  CheckResult,
  EventValidationDetail,
  KelEventType,
  KelValidationOptions,
  RichValidationResult,
  SignatureDetail,
  ValidationError,
  ValidationErrorCode,
  ValidationPreset,
  ValidationResult,
} from './kel/validation.js';
export {
  isValidKeriEvent,
  validateEventSaid,
  validateKel,
  validateKelChain,
  validateKeyChain,
  validateRequiredFields,
} from './kel/validation.js';
// ── Remote publishing contracts ──────────────────────────────────────
export * from './remote/index.js';
// ── Result type ──────────────────────────────────────────────────────
export type { Result } from './result.js';
export { err, ok } from './result.js';
export { Said } from './said/index.js';
// ── SAID helpers ─────────────────────────────────────────────────────
export { nextKeyDigestQb64FromPublicKeyQb64 } from './said/next-key-digest.js';
export {
  encodeSAID,
  validateSAID,
} from './said/said.js';
export type { Signer } from './signature/index.js';
// Value namespace renamed to avoid shadowing the Signature branded type from common/types.
export { Signature as SignatureOps, Signers } from './signature/index.js';
// ── Crypto primitives ────────────────────────────────────────────────
export {
  bytesToHex,
  canonicalize,
  canonicalizeToBytes,
  generateKeyPair,
  getPublicKey,
  hexToBytes,
  randomBytes,
  sha256,
  sha256Hex,
  sha512,
  sha512Hex,
  sign,
  verify,
} from './signature/primitives.js';

// ── Version ──────────────────────────────────────────────────────────
export * from './version.js';
