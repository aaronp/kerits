export type { ResolvedNodeLookup } from './is-allowed.js';
export { isAllowed } from './is-allowed.js';
export { makeAclNode } from './make-node.js';
export { ownerGroupId } from './namespace.js';
export {
  canonicalAclRef,
  canonicalIdentifier,
  normalizeChildren,
  normalizeKeys,
  normalizeMembers,
} from './normalize.js';
export type { AidKeyLookup, NodeLookup } from './resolve.js';
export { resolve } from './resolve.js';
export {
  computeGroupSAID,
  computeNodeSAID,
  computeResolvedGroupSAID,
  computeResolvedNodeSAID,
} from './said.js';
export type { AclOp, AclTree } from './tree.js';
export type {
  AclNode,
  AclRef,
  AclTarget,
  PublicKey,
  ResolutionError,
  ResolutionLimits,
  ResolvedNode,
} from './types.js';
export { DEFAULT_RESOLUTION_LIMITS, MAX_CASCADE_GROUPS, MAX_CASCADE_NODES } from './types.js';

import { Acl } from './acl.js';
import type { AclAdminPatch, CheckError, CheckOpts, VerifyFn } from './check.js';
import {
  applyAdmin,
  check,
  checkAgainstAccessControl,
  checkAgainstSnapshot,
  checkAgainstSnapshotWithVerify,
  checkWithVerify,
  isValid,
  isValidRotation,
  isValidWithVerify,
} from './check.js';

const AclWithCheck = {
  ...Acl,
  check,
  isValid,
  isValidRotation,
  isValidWithVerify,
  checkAgainstAccessControl,
  checkAgainstSnapshot,
  checkAgainstSnapshotWithVerify,
  checkWithVerify,
  applyAdmin,
} as const;

export type {
  AccessControl,
  AccessControls,
  AccessControlsError,
} from './access-controls.js';
export {
  accessControlForOp,
  accessControlsTip,
  importAccessControls,
  projectAccessControls,
  slotKeysSaid,
} from './access-controls.js';
export type { AclOps } from './acl.js';
export {
  type AcceptAclPutInput,
  type AcceptWriteInput,
  type AclInstallMode,
  acceptAclPut,
  acceptPathWrite,
  aclDocumentPath,
  aclInstallMode,
  ancestorPrefixes,
  joinPathSegments,
  kvsAclSystemId,
  type PathAclError,
  resolveClosestAclPrefix,
  resolveParentAclPrefix,
} from './path-acl.js';
export type {
  AclOperation,
  SignAclMessageInput,
  SignedAclFieldsV1,
  SignedAclMessageV1,
} from './signed-message.js';
export {
  ACL_MSG_V1,
  aclPayloadOf,
  canonicalSignedAclBytes,
  payloadDigestOf,
  signAclMessage,
  signAclMessageWithSigner,
  verifyAclMessageSignature,
} from './signed-message.js';
export type { KeyPurpose, Snapshot, SnapshotError } from './snapshot.js';
export { importSnapshot, snapshotOf } from './snapshot.js';
export type { AclAdminPatch, CheckError, CheckOpts, VerifyFn };
export {
  AclWithCheck as Acl,
  applyAdmin,
  check,
  checkAgainstAccessControl,
  checkAgainstSnapshot,
  checkAgainstSnapshotWithVerify,
  checkWithVerify,
  isValid,
  isValidRotation,
  isValidWithVerify,
};
