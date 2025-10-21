/**
 * KERI library - imports from parent kerits/src
 */

// Setup @noble/ed25519 with sha512 from @noble/hashes
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
// @ts-ignore - sha512Sync is dynamically added
ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));
// @ts-ignore - sha512Async is dynamically added
ed.etc.sha512Async = (...m: Uint8Array[]) => Promise.resolve(ed.etc.sha512Sync!(...m));

export { incept } from '../../../src/incept';
export type { InceptOptions, InceptionEvent } from '../../../src/incept';

export { rotate } from '../../../src/rotate';
export type { RotateOptions, RotationEvent } from '../../../src/rotate';

export { schema } from '../../../src/schema';
export type { SchemaDefinition, Schema } from '../../../src/schema';

export { credential } from '../../../src/credential';
export type { CredentialOptions, Credential, CredentialData } from '../../../src/credential';

export { registryIncept, issue } from '../../../src/tel';
export type { RegistryInceptionOptions, RegistryInception, IssuanceOptions, IssuanceEvent } from '../../../src/tel';

export { receipt } from '../../../src/receipt';
export type { ReceiptOptions, Receipt } from '../../../src/receipt';

export { verifyCredential } from '../../../src/verify';
export type { VerificationResult } from '../../../src/verify';

export { saidify } from '../../../src/saidify';
export { CESR } from '../../../src/model/cesr/cesr';
export type { CESRKeypair } from '../../../src/model/cesr/cesr';

export { diger } from '../../../src/diger';
