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
export * from './common/types.js';
export type {
  DipParams,
  DrtParams,
  FinalizedEventResult,
  IcpParams,
  IxnParams,
  RotParams,
  UnsignedEventResult,
} from './kel/events.js';
// ── KEL event factories ─────────────────────────────────────────────
export { KELEvents } from './kel/events.js';
// ── Namespace types ──────────────────────────────────────────────────
// ── KEL event types ──────────────────────────────────────────────────
export type {
  AnySeal,
  CESREvent,
  CesrAttachment,
  CesrSeal,
  DigestSeal,
  DipEvent,
  DrtEvent,
  IcpEvent,
  IxnEvent,
  KEL,
  KELEvent,
  KelAppend,
  KelManifest,
  KeyIndex,
  KSN,
  PublishedResource,
  PublishFormat,
  RotEvent,
  Vault,
  VaultAppend,
} from './kel/index.js';
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
  ValidationResult,
} from './kel/validation.js';
export {
  isValidKeriEvent,
  validateEventSaid,
  validateKelChain,
  validateKeyChain,
  validateRequiredFields,
} from './kel/validation.js';
export { Said } from './said/index.js';
// ── SAID helpers ─────────────────────────────────────────────────────
export { nextKeyDigestQb64FromPublicKeyQb64 } from './said/next-key-digest.js';
export {
  encodeSAID,
  validateSAID,
} from './said/said.js';
export type { Signer } from './signature/index.js';
export { Signature } from './signature/index.js';
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
