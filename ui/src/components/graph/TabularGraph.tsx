/**
 * TabularGraph - Tabular view of KERI event history
 *
 * Displays events in a table starting from KEL inception,
 * following anchors to show all reachable TEL events in chronological order.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { VisualId } from '../ui/visual-id';
import { EventSummary } from './EventSummary';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { KeritsDSL } from '@kerits/app/dsl/types';
import type { KerStore, EventMeta, SAID, AID } from '@kerits/storage/types';

interface TabularGraphProps {
  dsl: KeritsDSL | null;
  selectedId: string | null;
}

interface EventRow {
  said: SAID;
  meta: EventMeta;
  raw?: Uint8Array;
  parsed?: any;
  controllerAid?: AID;
  publicKeys?: string[];
  signatures?: string[];
  references?: SAID[]; // Referenced SAIDs (from seals or edges)
  depth: number; // Nesting depth for visual hierarchy
}

export function TabularGraph({ dsl, selectedId }: TabularGraphProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadEvents() {
      if (!dsl || !selectedId) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const store = dsl.getStore();
        const rows: EventRow[] = [];
        const visited = new Set<SAID>();

        // Find the KEL inception for the selected ID
        const kelInceptionSaid = await findKelInception(store, selectedId);
        if (!kelInceptionSaid) {
          throw new Error('Could not find KEL inception for selected ID');
        }

        // Traverse from KEL inception
        await traverseFromKel(store, kelInceptionSaid, rows, visited, 0);

        setEvents(rows);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [dsl, selectedId]);

  /**
   * Find the KEL inception event for a given ID
   */
  async function findKelInception(store: KerStore, id: SAID): Promise<SAID | null> {
    try {
      // First, try to get the event directly
      const event = await store.getEvent(id);
      if (!event) return null;

      const { meta } = event;

      // If it's a KEL event, trace back to inception
      if (['icp', 'rot', 'ixn'].includes(meta.t)) {
        const aid = meta.i;
        if (!aid) return null;

        // Get all KEL events for this AID
        const kelEvents = await store.listKel(aid);
        if (kelEvents.length === 0) return null;

        // First event is inception
        return kelEvents[0].said;
      }

      // If it's a TEL event, find the registry and trace to its anchoring KEL
      if (['vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'].includes(meta.t)) {
        const registryId = meta.ri;
        if (!registryId) return null;

        // Get the registry inception
        const regEvent = await store.getEvent(registryId);
        if (!regEvent) return null;

        // Find the KEL that anchored this registry
        const issuerAid = regEvent.meta.i;
        if (!issuerAid) return null;

        // Get KEL inception for the issuer
        const kelEvents = await store.listKel(issuerAid);
        if (kelEvents.length === 0) return null;

        return kelEvents[0].said;
      }

      // For other types (ACDC, SCHEMA), try to find via references
      return null;
    } catch (err) {
      console.error('Error finding KEL inception:', err);
      return null;
    }
  }

  /**
   * Traverse events starting from KEL, following anchors to TELs
   */
  async function traverseFromKel(
    store: KerStore,
    kelSaid: SAID,
    rows: EventRow[],
    visited: Set<SAID>,
    depth: number
  ): Promise<void> {
    if (visited.has(kelSaid)) return;
    visited.add(kelSaid);

    try {
      const event = await store.getEvent(kelSaid);
      if (!event) return;

      const { raw, meta } = event;
      let parsed: any = null;
      let publicKeys: string[] = [];
      let signatures: string[] = [];
      let references: SAID[] = [];

      // Parse the event JSON
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(raw);
        const lines = text.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          parsed = JSON.parse(jsonLine);

          // Extract public keys
          if (parsed.k) {
            publicKeys = Array.isArray(parsed.k) ? parsed.k : [parsed.k];
          }

          // Extract seals/anchors for references
          if (parsed.a && Array.isArray(parsed.a)) {
            for (const seal of parsed.a) {
              if (seal.d) references.push(seal.d);
              if (seal.i) references.push(seal.i);
            }
          }

          // Extract edges (for ACDC events)
          if (parsed.e && typeof parsed.e === 'object') {
            for (const edge of Object.values(parsed.e)) {
              if (typeof edge === 'object' && edge !== null && 'n' in edge) {
                references.push((edge as any).n);
              }
            }
          }
        }

        // Extract signatures from CESR attachments
        const sigRegex = /0A([A-Za-z0-9_-]{86})/g;
        let match;
        while ((match = sigRegex.exec(text)) !== null) {
          signatures.push(match[1]);
        }
      } catch (parseErr) {
        console.warn('Failed to parse event:', parseErr);
      }

      // Add this event to rows
      rows.push({
        said: kelSaid,
        meta,
        raw,
        parsed,
        controllerAid: meta.i,
        publicKeys,
        signatures,
        references,
        depth,
      });

      // If this is a KEL event, get all events in the chain
      if (meta.i && ['icp', 'rot', 'ixn'].includes(meta.t)) {
        const kelEvents = await store.listKel(meta.i);

        for (const kelEvent of kelEvents) {
          if (kelEvent.said === kelSaid) continue; // Skip the one we just added

          // Parse this KEL event
          let kelParsed: any = null;
          let kelPublicKeys: string[] = [];
          let kelSignatures: string[] = [];
          let kelReferences: SAID[] = [];

          try {
            const decoder = new TextDecoder();
            const text = decoder.decode(kelEvent.raw);
            const lines = text.split('\n');
            const jsonLine = lines.find(line => line.trim().startsWith('{'));
            if (jsonLine) {
              kelParsed = JSON.parse(jsonLine);

              if (kelParsed.k) {
                kelPublicKeys = Array.isArray(kelParsed.k) ? kelParsed.k : [kelParsed.k];
              }

              if (kelParsed.a && Array.isArray(kelParsed.a)) {
                for (const seal of kelParsed.a) {
                  if (seal.d) kelReferences.push(seal.d);
                  if (seal.i) kelReferences.push(seal.i);
                }
              }
            }

            const sigRegex = /0A([A-Za-z0-9_-]{86})/g;
            let match;
            while ((match = sigRegex.exec(text)) !== null) {
              kelSignatures.push(match[1]);
            }
          } catch (parseErr) {
            console.warn('Failed to parse KEL event:', parseErr);
          }

          rows.push({
            said: kelEvent.said,
            meta: kelEvent.meta,
            raw: kelEvent.raw,
            parsed: kelParsed,
            controllerAid: kelEvent.meta.i,
            publicKeys: kelPublicKeys,
            signatures: kelSignatures,
            references: kelReferences,
            depth,
          });

          // Check for TEL anchors in seals
          if (kelParsed?.a && Array.isArray(kelParsed.a)) {
            for (const seal of kelParsed.a) {
              if (seal.i && seal.d) {
                // This might be a TEL anchor
                const anchoredEvent = await store.getEvent(seal.d);
                if (anchoredEvent && ['vcp', 'iss', 'rev'].includes(anchoredEvent.meta.t)) {
                  // Traverse this TEL
                  await traverseTel(store, seal.i, rows, visited, depth + 1);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error traversing from KEL:', err);
    }
  }

  /**
   * Traverse a TEL (Transaction Event Log) chain
   */
  async function traverseTel(
    store: KerStore,
    registryId: SAID,
    rows: EventRow[],
    visited: Set<SAID>,
    depth: number
  ): Promise<void> {
    try {
      const telEvents = await store.listTel(registryId);

      for (const telEvent of telEvents) {
        if (visited.has(telEvent.said)) continue;
        visited.add(telEvent.said);

        let parsed: any = null;
        let publicKeys: string[] = [];
        let signatures: string[] = [];
        let references: SAID[] = [];

        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(telEvent.raw);
          const lines = text.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          if (jsonLine) {
            parsed = JSON.parse(jsonLine);

            if (parsed.k) {
              publicKeys = Array.isArray(parsed.k) ? parsed.k : [parsed.k];
            }

            if (parsed.b) {
              publicKeys = Array.isArray(parsed.b) ? parsed.b : [parsed.b];
            }

            // Extract ACDC references
            if (parsed.a && typeof parsed.a === 'object' && parsed.a.d) {
              references.push(parsed.a.d);
            }

            // Extract edges from ACDC
            if (parsed.e && typeof parsed.e === 'object') {
              for (const edge of Object.values(parsed.e)) {
                if (typeof edge === 'object' && edge !== null && 'n' in edge) {
                  references.push((edge as any).n);
                }
              }
            }

            // Check for nested registry references
            if (parsed.a && Array.isArray(parsed.a)) {
              for (const seal of parsed.a) {
                if (seal.i && seal.d) {
                  references.push(seal.d);
                  references.push(seal.i);
                }
              }
            }
          }

          const sigRegex = /0A([A-Za-z0-9_-]{86})/g;
          let match;
          while ((match = sigRegex.exec(text)) !== null) {
            signatures.push(match[1]);
          }
        } catch (parseErr) {
          console.warn('Failed to parse TEL event:', parseErr);
        }

        rows.push({
          said: telEvent.said,
          meta: telEvent.meta,
          raw: telEvent.raw,
          parsed,
          controllerAid: telEvent.meta.i,
          publicKeys,
          signatures,
          references,
          depth,
        });

        // Check for nested registries
        if (parsed?.a && Array.isArray(parsed.a)) {
          for (const seal of parsed.a) {
            if (seal.i && seal.d) {
              const nestedEvent = await store.getEvent(seal.d);
              if (nestedEvent && nestedEvent.meta.t === 'vcp') {
                // Traverse nested TEL
                await traverseTel(store, seal.i, rows, visited, depth + 1);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error traversing TEL:', err);
    }
  }

  const toggleRow = (said: SAID) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(said)) {
      newExpanded.delete(said);
    } else {
      newExpanded.add(said);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No events found. Select an ID to view its event history.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event History</CardTitle>
        <CardDescription>
          {events.length} events • Starting from KEL inception
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[200px]">Controller</TableHead>
                <TableHead>Public Keys</TableHead>
                <TableHead>Signatures</TableHead>
                <TableHead>References</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const isExpanded = expandedRows.has(event.said);
                const indentStyle = { paddingLeft: `${event.depth * 24}px` };

                return (
                  <>
                    <TableRow
                      key={event.said}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRow(event.said)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell style={indentStyle}>
                        <Badge variant="outline">{event.meta.t}</Badge>
                      </TableCell>
                      <TableCell>
                        {event.controllerAid && (
                          <VisualId
                            label=""
                            variant="marble"
                            value={event.controllerAid}
                            size={20}
                            maxCharacters={12}
                            showCopy={false}
                            small
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {event.publicKeys && event.publicKeys.length > 0 ? (
                            event.publicKeys.slice(0, 2).map((key, i) => (
                              <code key={i} className="text-xs truncate block">
                                {key.substring(0, 24)}...
                              </code>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {event.publicKeys && event.publicKeys.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{event.publicKeys.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {event.signatures && event.signatures.length > 0 ? (
                            event.signatures.slice(0, 2).map((sig, i) => (
                              <code key={i} className="text-xs truncate block">
                                {sig.substring(0, 24)}...
                              </code>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {event.signatures && event.signatures.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{event.signatures.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {event.references && event.references.length > 0 ? (
                            event.references.slice(0, 3).map((ref, i) => (
                              <VisualId
                                key={i}
                                label=""
                                variant="marble"
                                value={ref}
                                size={16}
                                maxCharacters={8}
                                showCopy={false}
                                small
                                linkToGraph={true}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {event.references && event.references.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{event.references.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-4">
                            <EventSummary event={event} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
