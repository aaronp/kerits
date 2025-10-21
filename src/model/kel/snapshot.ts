/**
 * Snapshot types and helpers for KEL state serialization
 *
 * Supports dumping and loading complete KEL state for:
 * - Regression testing (golden files)
 * - Visual inspection of system state
 * - Round-trip serialization verification
 */

import type { AID, SAID } from '../types';
import type { KelEvent, KelEnvelope, CesrSig, SignerSetRef } from './types';
import type { ChainMetadata } from './api';

/**
 * Complete snapshot of KEL system state
 *
 * This is a raw dump of all stores - designed for testing and debugging
 */
export interface KelSnapshot {
    /** Schema version for future compatibility */
    version: 1;

    /** When this snapshot was created (ISO 8601) - informational only, not used in digest */
    createdAt: string;

    /** Blake3 digest of entire snapshot (excluding this field) */
    digest: string;

    /** All stores as flat key-value maps */
    stores: {
        /** Alias mapping (bidirectional) */
        aliases: {
            /** Lowercase alias → AID mapping */
            aliasToAid: Record<string, AID>;
            /** AID → original alias mapping */
            aidToAlias: Record<AID, { key: string; display: string }>;
        };

        /** KEL events by SAID */
        kelEvents: Record<SAID, KelEvent>;

        /** KEL envelopes (with signatures) by SAID */
        kelCesr: Record<SAID, KelEnvelope>;

        /** Chain metadata by AID (key: "chain:{aid}") */
        kelMetadata: Record<string, ChainMetadata>;

        /** Vault entries (public keys only by default) */
        vault: Record<string, VaultSnapshot>;
    };
}

/**
 * Vault snapshot entry
 *
 * By default, only public keys are included
 * If includeSecrets=true, privateKeySeed is base64url-encoded
 */
export interface VaultSnapshot {
    /** Current keypair */
    current: {
        publicKey: string;
        /** Base64url-encoded private key seed (only if includeSecrets=true) */
        privateKeySeed?: string;
    };

    /** Next keypair (for rotation) */
    next: {
        publicKey: string;
        /** Base64url-encoded private key seed (only if includeSecrets=true) */
        privateKeySeed?: string;
    };
}

/**
 * Options for dumping state
 */
export interface DumpStateOptions {
    /** Include private key seeds in vault (default: false) */
    includeSecrets?: boolean;

    /** Timestamp to use for createdAt (default: current time, useful for deterministic tests) */
    timestamp?: string;
}

/**
 * Options for loading state
 */
export interface LoadStateOptions {
    /** Allow loading secrets if present in snapshot (default: false) */
    allowSecrets?: boolean;

    /** Clear existing stores before loading (default: false, requires fresh stores) */
    truncateExisting?: boolean;
}

/**
 * Sort signatures deterministically for snapshots
 *
 * Sorting order:
 * 1. signerSet.kind ('current' < 'prior' < 'witness')
 * 2. signerSet.sn (sequence number)
 * 3. keyIndex
 */
export function sortSignatures(sigs: CesrSig[]): CesrSig[] {
    return [...sigs].sort((a, b) => {
        // signerSet should always be present in snapshots
        const aSet = a.signerSet;
        const bSet = b.signerSet;

        if (!aSet || !bSet) {
            // Fallback: sort by keyIndex only
            return a.keyIndex - b.keyIndex;
        }

        // 1. Sort by kind
        if (aSet.kind !== bSet.kind) {
            const kindOrder = { current: 0, prior: 1, witness: 2 };
            return kindOrder[aSet.kind] - kindOrder[bSet.kind];
        }

        // 2. Sort by sequence number (if applicable)
        const aSn = 'sn' in aSet ? aSet.sn : -1;
        const bSn = 'sn' in bSet ? bSet.sn : -1;
        if (aSn !== bSn) {
            return aSn - bSn;
        }

        // 3. Sort by keyIndex
        return a.keyIndex - b.keyIndex;
    });
}

/**
 * Sort object keys alphabetically (for deterministic output)
 */
export function sortObject<T extends Record<string, any>>(obj: T): T {
    const sorted: any = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = obj[key];
    }
    return sorted;
}

/**
 * Sort array of objects by a key extractor
 */
export function sortBy<T>(arr: T[], keyFn: (item: T) => string | number): T[] {
    return [...arr].sort((a, b) => {
        const aKey = keyFn(a);
        const bKey = keyFn(b);
        return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });
}
