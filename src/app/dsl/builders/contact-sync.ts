/**
 * Contact Sync DSL - Track what events contacts have seen
 */

import type { KerStore } from '../../../storage/types';
import type {
  ContactSyncDSL,
  ContactSyncState,
  SyncPointer,
  IncrementalExportOptions,
  SyncReport,
} from '../types/contact-sync';
import { serializeEvent } from '../utils';
import { s } from '../../../types/keri';

const SYNC_STATE_PREFIX = 'contact-sync-state';

/**
 * Create ContactSyncDSL for managing sync state per contact
 */
export function createContactSyncDSL(store: KerStore): ContactSyncDSL {
  return {
    async getState(contactAlias: string): Promise<ContactSyncState | null> {
      // Resolve contact AID from remotes/{alias}/meta.json
      const metaKey = `remotes/${contactAlias}/meta.json`;
      const raw = await store.kv.get(metaKey);
      if (!raw) {
        return null;
      }

      let contactAid: string;
      try {
        const json = new TextDecoder().decode(raw);
        const meta = JSON.parse(json);
        contactAid = meta.aid;
      } catch (error) {
        return null;
      }

      // Get sync state from storage
      const stateId = `${SYNC_STATE_PREFIX}:${contactAlias}`;
      const stored = await store.getEvent(s(stateId).asSAID());

      if (!stored) {
        // Initialize empty state
        return {
          contactAlias,
          contactAid,
          kelSync: {},
          telSync: {},
          lastSync: new Date().toISOString(),
        };
      }

      // Parse stored state
      const rawBytes = ensureUint8Array(stored.raw);
      const rawText = new TextDecoder().decode(rawBytes);
      const jsonMatch = rawText.match(/\{.*\}/s);
      if (jsonMatch) {
        const state = JSON.parse(jsonMatch[0]) as ContactSyncState;
        return state;
      }

      return null;
    },

    async updateState(
      contactAlias: string,
      updates: {
        kelSync?: Record<string, SyncPointer>;
        telSync?: Record<string, SyncPointer>;
      }
    ): Promise<void> {
      const currentState = await this.getState(contactAlias);
      if (!currentState) {
        throw new Error(`Contact not found: ${contactAlias}`);
      }

      // Merge updates
      const newState: ContactSyncState = {
        ...currentState,
        kelSync: { ...currentState.kelSync, ...updates.kelSync },
        telSync: { ...currentState.telSync, ...updates.telSync },
        lastSync: new Date().toISOString(),
      };

      // Store updated state
      const stateId = `${SYNC_STATE_PREFIX}:${contactAlias}`;
      const stateEvent = serializeEvent({
        v: 'KERI10JSON',
        t: 'contact-sync-state',
        d: stateId,
        ...newState,
      });

      await store.putEvent(stateEvent);
    },

    async markKelSynced(
      contactAlias: string,
      aid: string,
      lastSaid: string,
      lastSeq: string
    ): Promise<void> {
      const pointer: SyncPointer = {
        lastSaid,
        lastSeq,
        syncedAt: new Date().toISOString(),
      };

      await this.updateState(contactAlias, {
        kelSync: { [aid]: pointer },
      });
    },

    async markTelSynced(
      contactAlias: string,
      registryId: string,
      lastSaid: string,
      lastSeq: string
    ): Promise<void> {
      const pointer: SyncPointer = {
        lastSaid,
        lastSeq,
        syncedAt: new Date().toISOString(),
      };

      await this.updateState(contactAlias, {
        telSync: { [registryId]: pointer },
      });
    },

    async getNewKelEvents(
      contactAlias: string,
      aid: string,
      options: IncrementalExportOptions = {}
    ): Promise<SyncReport> {
      const state = await this.getState(contactAlias);
      const syncPointer = state?.kelSync[aid];

      // Get all KEL events
      const allEvents = await store.listKel(s(aid).asAID());

      // Find where to start
      let startIndex = 0;
      if (syncPointer && options.afterSaid) {
        startIndex = allEvents.findIndex(e => e.meta.d === options.afterSaid) + 1;
      } else if (syncPointer) {
        startIndex = allEvents.findIndex(e => e.meta.d === syncPointer.lastSaid) + 1;
      }

      // Get new events
      const newEvents = allEvents.slice(startIndex);
      const limit = options.limit || newEvents.length;
      const exported = newEvents.slice(0, limit);

      const report: SyncReport = {
        newEvents: newEvents.length,
        exported: exported.length,
        hasMore: newEvents.length > limit,
      };

      if (exported.length > 0) {
        const last = exported[exported.length - 1];
        report.lastSaid = last.meta.d;
        report.lastSeq = last.meta.s;
      }

      return report;
    },

    async getNewTelEvents(
      contactAlias: string,
      registryId: string,
      options: IncrementalExportOptions = {}
    ): Promise<SyncReport> {
      const state = await this.getState(contactAlias);
      const syncPointer = state?.telSync[registryId];

      // Get all TEL events
      const allEvents = await store.listTel(s(registryId).asSAID());

      // Find where to start
      let startIndex = 0;
      if (syncPointer && options.afterSaid) {
        startIndex = allEvents.findIndex(e => e.meta.d === options.afterSaid) + 1;
      } else if (syncPointer) {
        startIndex = allEvents.findIndex(e => e.meta.d === syncPointer.lastSaid) + 1;
      }

      // Get new events
      const newEvents = allEvents.slice(startIndex);
      const limit = options.limit || newEvents.length;
      const exported = newEvents.slice(0, limit);

      const report: SyncReport = {
        newEvents: newEvents.length,
        exported: exported.length,
        hasMore: newEvents.length > limit,
      };

      if (exported.length > 0) {
        const last = exported[exported.length - 1];
        report.lastSaid = last.meta.d;
        report.lastSeq = last.meta.dt || '';
      }

      return report;
    },

    async resetState(contactAlias: string): Promise<void> {
      // Get contact AID from remotes/{alias}/meta.json
      const metaKey = `remotes/${contactAlias}/meta.json`;
      const raw = await store.kv.get(metaKey);
      if (!raw) {
        throw new Error(`Contact not found: ${contactAlias}`);
      }

      let contactAid: string;
      try {
        const json = new TextDecoder().decode(raw);
        const meta = JSON.parse(json);
        contactAid = meta.aid;
      } catch (error) {
        throw new Error(`Contact not found: ${contactAlias}`);
      }

      // Create fresh state
      const freshState: ContactSyncState = {
        contactAlias,
        contactAid,
        kelSync: {},
        telSync: {},
        lastSync: new Date().toISOString(),
      };

      const stateId = `${SYNC_STATE_PREFIX}:${contactAlias}`;
      const stateEvent = serializeEvent({
        v: 'KERI10JSON',
        t: 'contact-sync-state',
        d: stateId,
        ...freshState,
      });

      await store.putEvent(stateEvent);
    },

    async listSynced(): Promise<string[]> {
      // Get all contacts from remotes/*/meta.json
      const results = await store.kv.list('remotes/', { keysOnly: true });
      const allContacts: string[] = [];

      for (const { key } of results) {
        const match = key.match(/^remotes\/([^/]+)\/meta\.json$/);
        if (match) {
          allContacts.push(match[1]);
        }
      }

      const synced: string[] = [];

      for (const alias of allContacts) {
        const state = await this.getState(alias);
        if (state && (Object.keys(state.kelSync).length > 0 || Object.keys(state.telSync).length > 0)) {
          synced.push(alias);
        }
      }

      return synced;
    },
  };
}

// Helper to ensure Uint8Array from various storage formats
function ensureUint8Array(raw: any): Uint8Array {
  if (raw instanceof Uint8Array) {
    return raw;
  } else if (Array.isArray(raw)) {
    return new Uint8Array(raw);
  } else if (typeof raw === 'object' && raw !== null) {
    return new Uint8Array(Object.values(raw));
  }
  throw new Error(`Cannot convert to Uint8Array: ${typeof raw}`);
}
