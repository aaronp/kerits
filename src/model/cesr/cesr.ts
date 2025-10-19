/**
 * CESR - Composable Event Streaming Representation
 *
 * Unified interface for CESR encoding/decoding using cesr-ts library.
 * Provides static methods for keypair generation, mnemonic handling, and CESR operations.
 */

import { Signer as CesrSigner } from 'cesr-ts/src/signer';
import { Verfer as CesrVerfer } from 'cesr-ts/src/verfer';
import { generateMnemonic, mnemonicToEntropy, entropyToMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Set up the hash function for @noble/ed25519
ed25519.hashes.sha512 = sha512;

export type Mnemonic = string;

/**
 * CESR-encoded public key (qb64 format)
 */
export type CESRPublicKey = string;

/**
 * Keypair with CESR-encoded public key
 */
export interface CESRKeypair {
    /** Private key (32-byte seed) */
    privateKey: Uint8Array;
    /** Public key (32 bytes) */
    publicKey: Uint8Array;
    /** CESR-encoded public key (qb64 format) */
    verfer: CESRPublicKey;
    /** BIP39 mnemonic phrase (if generated) */
    mnemonic?: Mnemonic;
}

/**
 * CESR utility class for encoding/decoding operations
 */
export class CESR {
    /**
     * Generate a keypair from a seed
     *
     * @param seed - 32-byte seed
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with CESR-encoded verfer
     */
    static keypairFromSeed(seed: Uint8Array, transferable: boolean = true): CESRKeypair {
        if (seed.length !== 32) {
            throw new Error('Seed must be exactly 32 bytes');
        }

        try {
            // Try using cesr-ts first
            const signer = new CesrSigner({ raw: seed, transferable });
            return {
                privateKey: seed,
                publicKey: signer.verfer.raw,
                verfer: signer.verfer.qb64,
            };
        } catch (error) {
            // Fallback to @noble/ed25519 if cesr-ts fails (e.g., in Bun environment)
            return CESR.keypairFromSeedNoble(seed, transferable);
        }
    }

    /**
     * Generate a keypair from a seed using @noble/ed25519 (fallback method)
     *
     * @param seed - 32-byte seed
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with CESR-encoded verfer
     */
    static keypairFromSeedNoble(seed: Uint8Array, transferable: boolean = true): CESRKeypair {
        try {
            // Generate public key from seed using @noble/ed25519
            const publicKey = ed25519.getPublicKey(seed);

            // Encode public key as CESR
            const verfer = CESR.encodePublicKey(publicKey, transferable);

            return {
                privateKey: seed, // Use seed as private key
                publicKey: publicKey,
                verfer: verfer,
            };
        } catch (error) {
            console.warn('@noble/ed25519 keypair generation failed:', error);
            throw new Error('Failed to generate keypair from seed');
        }
    }

    /**
     * Generate a random keypair
     *
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with CESR-encoded verfer
     */
    static randomKeypair(transferable: boolean = true): CESRKeypair {
        // Use crypto.getRandomValues for browser compatibility
        const seed = crypto.getRandomValues(new Uint8Array(32));
        return CESR.keypairFromSeed(seed, transferable);
    }

    /**
     * Encode public key to CESR format
     *
     * @param publicKey - 32-byte Ed25519 public key
     * @param transferable - Whether the key is transferable (default: true)
     * @returns CESR-encoded string (qb64)
     */
    static encodePublicKey(publicKey: Uint8Array, transferable: boolean = true): string {
        try {
            // Try using cesr-ts first
            const code = transferable ? 'D' : 'B'; // D = Ed25519 transferable, B = Ed25519 non-transferable
            const verfer = new CesrVerfer({ raw: publicKey, code });
            return verfer.qb64;
        } catch (error) {
            // Fallback to manual encoding if cesr-ts fails
            return CESR.encodePublicKeyNoble(publicKey, transferable);
        }
    }

    /**
     * Encode public key to CESR format using manual encoding (fallback method)
     *
     * @param publicKey - 32-byte Ed25519 public key
     * @param transferable - Whether the key is transferable (default: true)
     * @returns CESR-encoded string (qb64)
     */
    static encodePublicKeyNoble(publicKey: Uint8Array, transferable: boolean = true): string {
        // CESR public key format: code + base64url(publicKey)
        const code = transferable ? 'D' : 'B'; // D = Ed25519 transferable, B = Ed25519 non-transferable

        // Convert to base64url
        const base64 = btoa(String.fromCharCode(...publicKey));
        const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        return code + base64url;
    }


    /**
     * Sign data with a seed
     *
     * @param data - Data to sign
     * @param seed - 32-byte signing seed
     * @param transferable - Whether the key is transferable (default: true)
     * @returns CESR-encoded signature (qb64)
     */
    static sign(data: Uint8Array, seed: Uint8Array, transferable: boolean = true): string {
        // Since cesr-ts is not working correctly in Bun, always use the fallback
        return CESR.signWithNoble(data, seed, transferable);
    }

    /**
     * Sign data using @noble/ed25519 (fallback method)
     *
     * @param data - Data to sign
     * @param seed - 32-byte signing seed
     * @param transferable - Whether the key is transferable (default: true)
     * @returns CESR-encoded signature (qb64)
     */
    static signWithNoble(data: Uint8Array, seed: Uint8Array, transferable: boolean = true): string {
        try {
            // Sign the data using @noble/ed25519
            const signature = ed25519.sign(data, seed);

            // Encode as CESR signature
            return CESR.encodeSignature(signature, transferable);
        } catch (error) {
            console.warn('@noble/ed25519 signing failed:', error);
            throw new Error('Failed to sign data');
        }
    }

    /**
     * Verify a signature
     *
     * @param signature - CESR-encoded signature (qb64)
     * @param data - Data that was signed
     * @param verferQb64 - CESR-encoded public key
     * @returns true if signature is valid
     */
    static async verify(signature: string, data: Uint8Array, verferQb64: string, rawPublicKey?: Uint8Array): Promise<boolean> {
        // Since cesr-ts is not working correctly in Bun, always use the fallback
        try {
            return await CESR.verifyWithNoble(signature, data, verferQb64, rawPublicKey);
        } catch (fallbackError) {
            console.warn('CESR verification failed with @noble/ed25519:', fallbackError);
            return false;
        }
    }

    /**
     * Verify a signature using @noble/ed25519 (fallback method)
     *
     * @param signature - CESR-encoded signature (qb64)
     * @param data - Data that was signed
     * @param verferQb64 - CESR-encoded public key
     * @returns true if signature is valid
     */
    static async verifyWithNoble(signature: string, data: Uint8Array, verferQb64: string, rawPublicKey?: Uint8Array): Promise<boolean> {
        try {
            // Use raw public key if provided, otherwise try to decode from CESR
            let publicKey: Uint8Array;
            if (rawPublicKey) {
                publicKey = rawPublicKey;
            } else {
                try {
                    const verfer = new CesrVerfer({ qb64: verferQb64 });
                    publicKey = verfer.raw;
                } catch (error) {
                    // Fallback: Since cesr-ts is not working in Bun, we need to find the public key
                    // by looking it up from the keypair that was used to create the signature
                    // This is a temporary workaround until cesr-ts is fixed
                    throw new Error('cesr-ts not working in Bun environment and no raw public key provided');
                }
            }

            // Decode the signature - CESR signatures are base64url encoded
            const signatureBytes = CESR.decodeSignature(signature);

            // Verify using @noble/ed25519
            return await ed25519.verifyAsync(signatureBytes, data, publicKey);
        } catch (error) {
            console.warn('@noble/ed25519 verification failed:', error);
            return false;
        }
    }

    /**
     * Decode a CESR-encoded public key to raw bytes (fallback method)
     *
     * @param qb64 - CESR-encoded public key
     * @returns Raw public key bytes
     */
    static decodePublicKey(qb64: string): Uint8Array {
        // CESR public keys start with code (D or B) followed by base64url encoded key
        if (!qb64.startsWith('D') && !qb64.startsWith('B')) {
            throw new Error('Invalid CESR public key format');
        }

        // Remove the code prefix
        const base64url = qb64.slice(1);

        // Convert from base64url to base64
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        // Convert from base64 to bytes
        const binaryString = atob(padded);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes;
    }

    /**
     * Encode a raw signature to CESR format
     *
     * @param signature - Raw signature bytes (64 bytes for Ed25519)
     * @param transferable - Whether the signature is transferable (default: true)
     * @returns CESR-encoded signature (qb64)
     */
    static encodeSignature(signature: Uint8Array, transferable: boolean = true): string {
        // CESR signature format: code + base64url(signature)
        const code = transferable ? '0B' : '0A'; // 0B = Ed25519 transferable signature, 0A = Ed25519 non-transferable signature

        // Convert to base64url
        const base64 = btoa(String.fromCharCode(...signature));
        const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        return code + base64url;
    }

    /**
     * Decode a CESR-encoded signature to raw bytes
     *
     * @param qb64 - CESR-encoded signature
     * @returns Raw signature bytes
     */
    static decodeSignature(qb64: string): Uint8Array {
        // CESR signatures start with code (0B or 0A) followed by base64url encoded signature
        if (!qb64.startsWith('0B') && !qb64.startsWith('0A')) {
            throw new Error('Invalid CESR signature format');
        }

        // Remove the code prefix
        const base64url = qb64.slice(2);

        // Convert from base64url to base64
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        // Convert from base64 to bytes
        const binaryString = atob(padded);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes;
    }

    /**
     * Check if a string is a valid CESR encoding
     *
     * @param qb64 - String to check
     * @returns true if valid CESR format
     */
    static isValid(qb64: string): boolean {
        try {
            new CesrVerfer({ qb64 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the code from a CESR-encoded string
     *
     * @param qb64 - CESR-encoded string
     * @returns CESR code (e.g., 'D', 'B')
     */
    static getCode(qb64: string): string {
        const verfer = new CesrVerfer({ qb64 });
        return verfer.code;
    }

    /**
     * Check if a CESR-encoded key is transferable
     *
     * @param qb64 - CESR-encoded public key
     * @returns true if transferable (code 'D'), false if non-transferable (code 'B')
     */
    static isTransferable(qb64: string): boolean {
        const code = CESR.getCode(qb64);
        return code === 'D'; // Ed25519 transferable
    }

    /**
     * Extract CESR-encoded public key from a keypair
     *
     * @param keypair - CESR keypair
     * @returns CESR-encoded public key
     */
    static getPublicKey(keypair: CESRKeypair): CESRPublicKey {
        return keypair.verfer;
    }

    // ============================================================================
    // Mnemonic Operations
    // ============================================================================

    /**
     * Generate a random 24-word BIP39 mnemonic
     *
     * @returns Random 24-word mnemonic
     */
    static generateMnemonic(): Mnemonic {
        // 256 bits = 24 words
        return generateMnemonic(englishWordlist, 256);
    }

    /**
     * Validate a BIP39 mnemonic
     *
     * @param mnemonic - Mnemonic to validate
     * @returns true if valid
     */
    static validateMnemonic(mnemonic: Mnemonic): boolean {
        return validateMnemonic(mnemonic, englishWordlist);
    }

    /**
     * Convert BIP39 mnemonic to 32-byte seed
     *
     * @param mnemonic - BIP39 mnemonic phrase (12 or 24 words)
     * @returns 32-byte seed
     */
    static mnemonicToSeed(mnemonic: Mnemonic): Uint8Array {
        // Validate mnemonic
        if (!validateMnemonic(mnemonic, englishWordlist)) {
            throw new Error('Invalid BIP39 mnemonic');
        }

        // Convert mnemonic to entropy
        const entropy = mnemonicToEntropy(mnemonic, englishWordlist);

        // For 24-word mnemonic, entropy is 32 bytes (256 bits)
        // For 12-word mnemonic, entropy is 16 bytes (128 bits)
        if (entropy.length === 16) {
            // Extend 16 bytes to 32 bytes by repeating
            const seed = new Uint8Array(32);
            seed.set(entropy, 0);
            seed.set(entropy, 16);
            return seed;
        }

        return entropy;
    }

    /**
     * Convert 32-byte seed to BIP39 mnemonic (24 words)
     *
     * @param seed - 32-byte seed (256 bits)
     * @returns 24-word mnemonic phrase
     */
    static seedToMnemonic(seed: Uint8Array): Mnemonic {
        if (seed.length !== 32) {
            throw new Error('Seed must be 32 bytes for 24-word mnemonic');
        }

        // Convert 256-bit entropy to 24-word mnemonic
        return entropyToMnemonic(seed, englishWordlist);
    }

    /**
     * Generate keypair from mnemonic
     *
     * @param mnemonic - BIP39 mnemonic phrase
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with mnemonic
     */
    static keypairFromMnemonic(mnemonic: Mnemonic, transferable: boolean = true): CESRKeypair {
        if (!CESR.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase');
        }

        const seed = CESR.mnemonicToSeed(mnemonic);
        const keypair = CESR.keypairFromSeed(seed, transferable);

        return {
            ...keypair,
            mnemonic,
        };
    }

    /**
     * Generate deterministic keypair from numeric entropy
     *
     * @param entropy - Numeric entropy (e.g., timestamp, test number)
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with mnemonic
     */
    static keypairFrom(entropy: number, transferable: boolean = true): CESRKeypair {
        // Convert number to 32-byte seed deterministically
        const seed = new Uint8Array(32);
        const view = new DataView(seed.buffer);

        // Use the number as seed for deterministic generation
        // Fill the 32-byte array with the number repeated in different ways
        for (let i = 0; i < 32; i += 4) {
            view.setUint32(i, entropy + i, false); // little-endian
        }

        // Create mnemonic from the deterministic seed
        const mnemonic = CESR.seedToMnemonic(seed);

        // Generate keypair from mnemonic
        return CESR.keypairFromMnemonic(mnemonic, transferable);
    }

    /**
     * Generate random keypair with mnemonic
     *
     * @param transferable - Whether the key is transferable (default: true)
     * @returns Keypair with mnemonic
     */
    static randomKeypairWithMnemonic(transferable: boolean = true): CESRKeypair {
        const seed = crypto.getRandomValues(new Uint8Array(32));
        const mnemonic = CESR.seedToMnemonic(seed);
        const keypair = CESR.keypairFromSeed(seed, transferable);

        return {
            ...keypair,
            mnemonic,
        };
    }

    /**
     * Generate multiple keypairs for KERI operations
     *
     * @param count - Number of keypairs to generate
     * @param transferable - Whether keys are transferable (default: true)
     * @returns Array of keypairs
     */
    static createMultiple(count: number, transferable: boolean = true): CESRKeypair[] {
        const results: CESRKeypair[] = [];

        for (let i = 0; i < count; i++) {
            results.push(CESR.randomKeypairWithMnemonic(transferable));
        }

        return results;
    }

    /**
     * Generate current and next keypairs for KERI inception
     *
     * @param transferable - Whether keys are transferable (default: true)
     * @returns Object with current and next keypairs
     */
    static createForInception(transferable: boolean = true): {
        current: CESRKeypair;
        next: CESRKeypair;
    } {
        const [current, next] = CESR.createMultiple(2, transferable);

        return { current, next };
    }

    // ============================================================================
    // Legacy Compatibility Functions
    // ============================================================================

    /**
     * Legacy function for compatibility with old signer module
     * @deprecated Use keypairFromSeed instead
     */
    static async generateKeypairFromSeed(seed: Uint8Array, transferable: boolean = true): Promise<CESRKeypair> {
        return CESR.keypairFromSeed(seed, transferable);
    }
}
