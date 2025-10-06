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
}

export interface ImportOptions {
  verify?: boolean;      // Verify signatures and SAIDs
  skipExisting?: boolean; // Skip events already in store
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ExportDSL {
  asBundle(): CESRBundle;
  asRaw(): Uint8Array[];
  toJSON(): string;
  toCESR(): Uint8Array;
  toFile(path: string, format?: 'json' | 'cesr'): Promise<void>;
}

export interface ImportDSL {
  fromBundle(bundle: CESRBundle, options?: ImportOptions): Promise<ImportResult>;
  fromRaw(events: Uint8Array[], options?: ImportOptions): Promise<ImportResult>;
  fromJSON(json: string, options?: ImportOptions): Promise<ImportResult>;
  fromCESR(cesr: Uint8Array, options?: ImportOptions): Promise<ImportResult>;
  fromFile(path: string, options?: ImportOptions): Promise<ImportResult>;
}
