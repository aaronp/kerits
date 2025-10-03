import { Buffer } from 'buffer';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Make Buffer globally available
globalThis.Buffer = Buffer;

// Configure @noble/ed25519 for sha512
// @ts-ignore - sha512Sync is dynamically added
ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));
// @ts-ignore - sha512Async is dynamically added
ed.etc.sha512Async = (...m: Uint8Array[]) => Promise.resolve(ed.etc.sha512Sync!(...m));
