/**
 * Convert WriteTimeIndexer state to graph visualization format
 */

import type { IndexerState, KELEntry, TELEntry } from '@/../../src/app/indexer/types';

export interface VisualizationEvent {
  id: string;
  type: string;
  registry: string;
  parent?: string;
  links?: string[];
  label: string;
  sn: number;
  // Additional metadata for verification
  publicKeys?: string[];
  signatures?: Array<{ publicKey: string; signature: string; signingIndex: number }>;
  timestamp?: string;
  raw?: string; // Raw event data for verification
}

export interface VisualizationIdentity {
  prefix: string;
  alias: string;
  events: VisualizationEvent[];
}

export interface VisualizationData {
  identities: VisualizationIdentity[];
}

/**
 * Convert indexer state to visualization format
 */
export function indexerStateToGraph(state: IndexerState): VisualizationData {
  const identities: VisualizationIdentity[] = [];

  // Build a map of TEL registry hierarchy
  const telParents = new Map<string, string>(); // child TEL ID -> parent TEL ID
  const telToKel = new Map<string, string>(); // TEL ID -> KEL ID

  // First pass: map TELs to their parent registries and source KELs
  for (const [telId, events] of Object.entries(state.tels)) {
    if (events.length > 0) {
      const vcpEvent = events[0]; // First event should be vcp

      // Find the issuer KEL
      const kelRef = vcpEvent.references?.find(r => r.type === 'KEL' && r.relationship === 'issuer-kel');
      if (kelRef) {
        telToKel.set(telId, kelRef.id);
      }

      // Check if this TEL has a parent registry
      if (vcpEvent.parentRegistryId) {
        telParents.set(telId, vcpEvent.parentRegistryId);
      }
    }
  }

  // Build registry path names (e.g., "public", "public/child", "public/child/grandchild")
  const telRegistryNames = new Map<string, string>();

  function buildRegistryPath(telId: string): string {
    if (telRegistryNames.has(telId)) {
      return telRegistryNames.get(telId)!;
    }

    const alias = state.aliasById.TELs[telId] || telId.slice(0, 8);
    const parentId = telParents.get(telId);

    if (parentId) {
      const parentPath = buildRegistryPath(parentId);
      const path = `${parentPath}/${alias}`;
      telRegistryNames.set(telId, path);
      return path;
    } else {
      telRegistryNames.set(telId, alias);
      return alias;
    }
  }

  // Pre-build all registry paths
  for (const telId of Object.keys(state.tels)) {
    buildRegistryPath(telId);
  }

  // Process each KEL (identity)
  for (const [kelId, kelEvents] of Object.entries(state.kels)) {
    const alias = state.aliasById.KELs[kelId] || kelId.slice(0, 8);
    const events: VisualizationEvent[] = [];

    // Process KEL events
    for (const event of kelEvents) {
      const vizEvent: VisualizationEvent = {
        id: event.eventId,
        type: event.eventType,
        registry: 'KEL',
        label: getEventLabel(event, 'KEL', state),
        sn: event.sequenceNumber ?? 0,
        publicKeys: event.signers?.map(s => s.publicKey),
        signatures: event.signers,
        timestamp: event.timestamp,
        raw: event.eventData,
      };

      if (event.priorEventId) {
        vizEvent.parent = event.priorEventId;
      }

      // Check if this event creates a child TEL registry
      const childTelRef = event.references?.find(r => r.type === 'TEL' && r.relationship === 'child-registry-created');
      if (childTelRef) {
        // We'll link to the first event in that TEL
        const childTelEvents = state.tels[childTelRef.id];
        if (childTelEvents && childTelEvents.length > 0) {
          vizEvent.links = [childTelEvents[0].eventId];
        }
      }

      events.push(vizEvent);
    }

    // Process TELs that belong to this KEL
    for (const [telId, telEvents] of Object.entries(state.tels)) {
      if (telToKel.get(telId) === kelId) {
        const registryName = telRegistryNames.get(telId) || telId.slice(0, 8);

        for (const event of telEvents) {
          const vizEvent: VisualizationEvent = {
            id: event.eventId,
            type: event.eventType,
            registry: registryName,
            label: getEventLabel(event, registryName, state),
            sn: event.sequenceNumber ?? 0,
            publicKeys: event.signers?.map(s => s.publicKey),
            signatures: event.signers,
            timestamp: event.timestamp,
            raw: event.eventData,
          };

          if (event.priorEventId) {
            vizEvent.parent = event.priorEventId;
          }

          // Link vcp events to their source KEL event (the ixn that created them)
          if (event.eventType === 'vcp') {
            // Find the KEL ixn event that references this TEL
            const kelEvent = kelEvents.find(ke =>
              ke.references?.some(r => r.type === 'TEL' && r.id === telId && r.relationship === 'child-registry-created')
            );
            if (kelEvent) {
              vizEvent.parent = kelEvent.eventId;
            }

            // Link VCP to the first ISS event in this registry (if any)
            const firstIssEvent = telEvents.find(e => e.eventType === 'iss');
            if (firstIssEvent) {
              vizEvent.links = vizEvent.links || [];
              vizEvent.links.push(firstIssEvent.eventId);
            }
          }

          // Check if this TEL event creates a child registry
          const childTelRef = event.references?.find(r => r.type === 'TEL' && r.relationship === 'child-registry-created');
          if (childTelRef) {
            const childTelEvents = state.tels[childTelRef.id];
            if (childTelEvents && childTelEvents.length > 0) {
              vizEvent.links = [childTelEvents[0].eventId];
            }
          }

          events.push(vizEvent);
        }
      }
    }

    identities.push({
      prefix: kelId,
      alias,
      events,
    });
  }

  return { identities };
}

function getEventLabel(event: KELEntry | TELEntry, registry: string, state: IndexerState): string {
  const type = event.eventType;

  switch (type) {
    case 'icp':
      return 'Inception';
    case 'rot':
      return `Rotation ${event.sequenceNumber ?? '?'}`;
    case 'ixn':
      // Check if this creates a child registry
      const childRef = event.references?.find(r => r.relationship === 'child-registry-created');
      if (childRef) {
        const registryAlias = state.aliasById.TELs[childRef.id] || childRef.id.slice(0, 8);
        return `Create registry: ${registryAlias}`;
      }
      return `Interaction ${event.sequenceNumber ?? '?'}`;
    case 'vcp':
      return `Create registry: ${registry}`;
    case 'iss':
      if ('acdcSaid' in event && event.acdcSaid) {
        const acdcAlias = state.aliasById.ACDCs[event.acdcSaid];
        if (acdcAlias) {
          return `Issue: ${acdcAlias}`;
        }
        return `Issue credential`;
      }
      return 'Issue';
    case 'rev':
      if ('acdcSaid' in event && event.acdcSaid) {
        const acdcAlias = state.aliasById.ACDCs[event.acdcSaid];
        if (acdcAlias) {
          return `Revoke: ${acdcAlias}`;
        }
        return `Revoke credential`;
      }
      return 'Revoke';
    default:
      return type;
  }
}
