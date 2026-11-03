/**
 * kerits-acl-msg/1 — signed ACL messages (exact wire format).
 */
import { canonical } from '../common/canonical.js';
import { Data } from '../common/data.js';
import type { KeriKeyPair, PublicKey, SAID, Signature } from '../common/types.js';
import { Signers } from '../signature/signers.js';

export const ACL_MSG_V1 = 'kerits-acl-msg/1' as const;

export type AclOperation = 'write' | 'admin';

/** Fields included in the signature (payload + signature excluded). */
export type SignedAclFieldsV1 = {
  v: typeof ACL_MSG_V1;
  system: string;
  operation: AclOperation;
  aclHash: SAID;
  readHash?: SAID;
  payloadDigest: SAID;
  messageId: string;
  expiresAt: number;
  signerPublicKey: PublicKey;
};

export type SignedAclMessageV1 = SignedAclFieldsV1 & {
  payload: Uint8Array;
  signature: string;
};

/** Canonical signed-input bytes — lexicographic JSON keys via RFC8785; no signature/payload. */
export function canonicalSignedAclBytes(fields: SignedAclFieldsV1): Uint8Array {
  const obj: Record<string, string | number> = {
    aclHash: fields.aclHash,
    expiresAt: fields.expiresAt,
    messageId: fields.messageId,
    operation: fields.operation,
    payloadDigest: fields.payloadDigest,
    signerPublicKey: fields.signerPublicKey,
    system: fields.system,
    v: fields.v,
  };
  if (fields.readHash !== undefined) {
    obj.readHash = fields.readHash;
  }
  return new TextEncoder().encode(canonical(obj));
}

/** The bytes an ACL rotation's payloadDigest commits to: RFC 8785 canonical JSON, so field order never matters. Verifiers rebuild it from the ACL they are installing. */
export function aclPayloadOf(accessControls: unknown): Uint8Array {
  return new TextEncoder().encode(canonical(accessControls));
}

export function payloadDigestOf(payload: Uint8Array): SAID {
  return Data.digest(payload) as SAID;
}

export type SignAclMessageInput = {
  system: string;
  operation: AclOperation;
  aclHash: SAID;
  readHash?: SAID;
  messageId: string;
  expiresAt: number;
  signerPublicKey: PublicKey;
};

export async function signAclMessage(
  input: SignAclMessageInput,
  payload: Uint8Array,
  keyPair: KeriKeyPair,
): Promise<SignedAclMessageV1> {
  const signer = Signers.fromKeyPair(keyPair);
  return signAclMessageWithSigner(input, payload, {
    publicKey: input.signerPublicKey,
    signBytes: (data) => signer.signBytes(data),
  });
}

/** Sign with any Ed25519 signer (e.g. IdentitySigner) — no private key material required here. */
export async function signAclMessageWithSigner(
  input: SignAclMessageInput,
  payload: Uint8Array,
  signer: {
    publicKey: PublicKey;
    signBytes: (data: Uint8Array) => Promise<Signature>;
  },
): Promise<SignedAclMessageV1> {
  const payloadDigest = payloadDigestOf(payload);
  const fields: SignedAclFieldsV1 = {
    v: ACL_MSG_V1,
    system: input.system,
    operation: input.operation,
    aclHash: input.aclHash,
    ...(input.readHash !== undefined ? { readHash: input.readHash } : {}),
    payloadDigest,
    messageId: input.messageId,
    expiresAt: input.expiresAt,
    signerPublicKey: signer.publicKey,
  };
  const signature = await signer.signBytes(canonicalSignedAclBytes(fields));
  return { ...fields, payload, signature };
}

/** Recompute digest + verify Ed25519 over canonical signed-input. */
export function verifyAclMessageSignature(msg: SignedAclMessageV1): boolean {
  if (msg.v !== ACL_MSG_V1) return false;
  const digest = payloadDigestOf(msg.payload);
  if (digest !== msg.payloadDigest) return false;
  const fields: SignedAclFieldsV1 = {
    v: msg.v,
    system: msg.system,
    operation: msg.operation,
    aclHash: msg.aclHash,
    ...(msg.readHash !== undefined ? { readHash: msg.readHash } : {}),
    payloadDigest: msg.payloadDigest,
    messageId: msg.messageId,
    expiresAt: msg.expiresAt,
    signerPublicKey: msg.signerPublicKey,
  };
  return Signers.verify(msg.signerPublicKey, msg.signature as Signature, canonicalSignedAclBytes(fields));
}
