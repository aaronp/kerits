/**
 * Sync types for exporting/importing KEL and TEL data
 */

export type BundleType = 'kel' | 'tel' | 'acdc' | 'mixed';

export interface CESRBundle {
  type: BundleType;
  version: string;
  events: Uint8Array[];
  metadata: {
    source?: string;      // AID of exporter
    created: string;      // ISO timestamp
    scope?: {             // What this bundle contains
      aid?: string;       // For KEL bundles
      registryId?: string; // For TEL bundles
      credentialId?: string; // For ACDC bundles
    };
  };
}

export interface ExportOptions {
  format?: 'bundle' | 'raw';  // Bundle with metadata or raw CESR
  includeAttachments?: boolean; // Future: signatures, receipts
  includeACDCs?: boolean; // Include referenced ACDC credentials in TEL exports
}

export interface ExportDSL {
  asBundle(): CESRBundle;
  asRaw(): Uint8Array[];
  toJSON(): string;
  toCESR(): Uint8Array;
  toFile(path: string, format?: 'json' | 'cesr'): Promise<void>;
}
