/**
 * Contact Sync Tracking Types
 *
 * Track what KEL/TEL events each contact has seen using SAID/SeqNo pointers
 */

export interface SyncPointer {
  /** Last SAID the contact has seen */
  lastSaid: string;
  /** Last sequence number (for KEL) or timestamp (for TEL) */
  lastSeq: string;
  /** Timestamp when sync state was last updated */
  syncedAt: string;
}

export interface ContactSyncState {
  /** Contact alias */
  contactAlias: string;
  /** Contact AID */
  contactAid: string;
  /** KEL sync state per AID */
  kelSync: Record<string, SyncPointer>;
  /** TEL sync state per registry ID */
  telSync: Record<string, SyncPointer>;
  /** Last sync timestamp */
  lastSync: string;
}

export interface IncrementalExportOptions {
  /** Only export events after this SAID */
  afterSaid?: string;
  /** Only export events after this sequence number */
  afterSeq?: string;
  /** Maximum number of events to export */
  limit?: number;
}

export interface SyncReport {
  /** Total new events available */
  newEvents: number;
  /** Events exported in this batch */
  exported: number;
  /** Has more events to sync */
  hasMore: boolean;
  /** Last SAID in this export */
  lastSaid?: string;
  /** Last sequence number in this export */
  lastSeq?: string;
}

export interface ContactSyncDSL {
  /**
   * Get sync state for a contact
   */
  getState(contactAlias: string): Promise<ContactSyncState | null>;

  /**
   * Update sync state after successful import
   */
  updateState(
    contactAlias: string,
    updates: {
      kelSync?: Record<string, SyncPointer>;
      telSync?: Record<string, SyncPointer>;
    }
  ): Promise<void>;

  /**
   * Mark KEL as synced up to a specific event
   */
  markKelSynced(
    contactAlias: string,
    aid: string,
    lastSaid: string,
    lastSeq: string
  ): Promise<void>;

  /**
   * Mark TEL as synced up to a specific event
   */
  markTelSynced(
    contactAlias: string,
    registryId: string,
    lastSaid: string,
    lastSeq: string
  ): Promise<void>;

  /**
   * Get new KEL events for a contact (incremental export)
   */
  getNewKelEvents(
    contactAlias: string,
    aid: string,
    options?: IncrementalExportOptions
  ): Promise<SyncReport>;

  /**
   * Get new TEL events for a contact (incremental export)
   */
  getNewTelEvents(
    contactAlias: string,
    registryId: string,
    options?: IncrementalExportOptions
  ): Promise<SyncReport>;

  /**
   * Reset sync state for a contact
   */
  resetState(contactAlias: string): Promise<void>;

  /**
   * List all contacts with sync state
   */
  listSynced(): Promise<string[]>;
}
