// @kerits/core
//
// Pure KERI primitives: types, cryptographic operations, CESR encoding,
// KEL validation, SAID computation, and data canonicalization.
//
// Namespace objects provide a discoverable API surface:
//   Cesr.encode(), Kel.checkThreshold(), Said.encodeSAID(), Signature.sign()
//
// Flat re-exports are provided for convenience and backwards compatibility.

export type { SaidValidationResult } from './acdc/index.js';
// ── ACDC types and ops ───────────────────────────────────────────────
export { ACDCData, ACDCOps, Acdc } from './acdc/index.js';
export type {
  ACDCCredential,
  ACDCProof,
  CredentialJudgment,
  CredentialPolicy,
  CredentialStatus,
  CredentialStatusEvidence,
  CredentialStatusSource,
} from './acdc/types.js';
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
// ── SAID helpers ─────────────────────────────────────────────────────
export type { DerivationSurface } from './common/derivation-surface.js';
export { deriveSaid, recomputeSaid, serializeForSigning } from './common/derivation-surface.js';
export * from './common/errors.js';
export { transferableKeyToPublicKey } from './common/key-conversions.js';
export * from './common/types.js';
export { hkdfBlake3 } from './crypto/hkdf.js';
export { KeriKeyPairs } from './crypto/index.js';
export { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from './crypto/x25519.js';
// ── KEL event canonicalization ────────────────────────────────────────
export { canonicalizeEvent } from './kel/event-crypto.js';
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
export { nextKeyDigestQb64FromPublicKeyQb64 } from './said/next-key-digest.js';
export {
  encodeSAID,
  validateSAID,
} from './said/said.js';
export {
  ACDC_CREDENTIAL_SURFACE,
  ACDC_SCHEMA_SURFACE,
  buildACDCCredentialSurface,
  KEL_DIP_SURFACE,
  KEL_DRT_SURFACE,
  KEL_ICP_SURFACE,
  KEL_IXN_SURFACE,
  KEL_ROT_SURFACE,
  TEL_BIS_SURFACE,
  TEL_BRV_SURFACE,
  TEL_ISS_SURFACE,
  TEL_REV_SURFACE,
  TEL_VCP_SURFACE,
  TEL_VCP_WITH_NONCE_SURFACE,
  TEL_VRT_SURFACE,
} from './said/surfaces.js';
// ── Schema types and ops ─────────────────────────────────────────────
export { Schema, SchemaData, SchemaOps } from './schema/index.js';
export type {
  ACDCSchema,
  FlatField,
  JSONSchema,
  SchemaEdge,
  SchemaInfo,
} from './schema/types.js';
export type { Signer } from './signature/index.js';
// Value namespace renamed to avoid shadowing the Signature branded type from common/types.
export { Signature as SignatureOps, Signers } from './signature/index.js';
export type { KeyAgreementCapability, KeyAgreementInput } from './signature/key-agreement.js';
export { MAX_HKDF_DERIVE_LENGTH } from './signature/key-agreement.js';
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
// ── TEL types and ops ────────────────────────────────────────────────
export { TELData, TELOps, Tel } from './tel/index.js';
export type { TelValidationError, TelValidationResult } from './tel/ops.js';
export type {
  BisEvent,
  BrvEvent,
  EstablishmentTelEvent,
  IssEvent,
  RevEvent,
  RSN,
  TelEvent,
  VcpEvent,
  VrtEvent,
} from './tel/types.js';

// ── Version ──────────────────────────────────────────────────────────
export * from './version.js';
