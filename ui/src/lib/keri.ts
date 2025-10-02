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

export { incept } from '@kerits/incept';
export type { InceptOptions, InceptionEvent } from '@kerits/incept';

export { rotate } from '@kerits/rotate';
export type { RotateOptions, RotationEvent } from '@kerits/rotate';

export { schema } from '@kerits/schema';
export type { SchemaDefinition, Schema } from '@kerits/schema';

export { credential } from '@kerits/credential';
export type { CredentialOptions, Credential, CredentialData } from '@kerits/credential';

export { registryIncept, issue } from '@kerits/tel';
export type { RegistryInceptionOptions, RegistryInception, IssuanceOptions, IssuanceEvent } from '@kerits/tel';

export { receipt } from '@kerits/receipt';
export type { ReceiptOptions, Receipt } from '@kerits/receipt';

export { verifyCredential } from '@kerits/verify';
export type { VerificationResult } from '@kerits/verify';

export { saidify } from '@kerits/saidify';
export { generateKeypair, generateKeypairFromSeed } from '@kerits/signer';
export type { Keypair } from '@kerits/signer';

export { diger } from '@kerits/diger';
