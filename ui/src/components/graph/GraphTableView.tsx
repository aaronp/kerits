import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { VisualId } from '../ui/visual-id';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { getDSL } from '@/lib/dsl';
import { createKeriGraph } from '@/../../src/app/graph';
import type { Graph, GraphNode, GraphEdge } from '@/../src/storage/types';

interface EventCard {
  id: string;
  type: string;
  label: string;
  sequence?: string;
  kind: 'KEL_EVT' | 'TEL_EVT' | 'TEL_REGISTRY' | 'ACDC';
  meta?: any;
}

interface TimelineRow {
  kelEvent?: EventCard;
  telColumns: Map<string, EventCard[]>; // registryId -> events at this row
}

function EventCardComponent({ evt }: { evt: EventCard }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const cardClass =
    evt.kind === 'TEL_REGISTRY'
      ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 mb-2'
      : evt.kind === 'TEL_EVT'
      ? 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700 mb-2'
      : evt.kind === 'KEL_EVT'
      ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 mb-2'
      : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 mb-2';

  const getEventSummary = () => {
    const summary: Array<[string, any, 'text' | 'visualid']> = [];

    if (evt.meta?.eventMeta) {
      const em = evt.meta.eventMeta;
      summary.push(['Type', em.t, 'text']);
      if (em.s !== undefined) summary.push(['Seq', parseInt(em.s, 16), 'text']);
      if (em.i) summary.push(['Identifier', em.i, 'visualid']);
      if (em.p) summary.push(['Prior', em.p, 'visualid']);
      if (em.ri) summary.push(['Registry', em.ri, 'visualid']);
      if (em.dt) summary.push(['Timestamp', em.dt, 'text']);
      if (em.acdcSaid) summary.push(['ACDC', em.acdcSaid, 'visualid']);
      if (em.issuerAid) summary.push(['Issuer', em.issuerAid, 'visualid']);
      if (em.holderAid) summary.push(['Holder', em.holderAid, 'visualid']);
    }

    // Check for stored event metadata
    if (evt.meta?.event) {
      const storedEvent = evt.meta.event;
      if (storedEvent.ingestedAt) summary.push(['Ingested At', storedEvent.ingestedAt, 'text']);
    }

    // Check for seal information in 'a' attribute
    if (evt.meta?.eventMeta?.a && Array.isArray(evt.meta.eventMeta.a)) {
      evt.meta.eventMeta.a.forEach((seal: any, idx: number) => {
        if (seal && typeof seal === 'object') {
          if (seal.i) summary.push([`Seal ${idx + 1} ID`, seal.i, 'visualid']);
          if (seal.d) summary.push([`Seal ${idx + 1} Digest`, seal.d, 'visualid']);
          if (seal.s !== undefined) summary.push([`Seal ${idx + 1} Seq`, parseInt(seal.s, 16), 'text']);
        }
      });
    }

    return summary;
  };

  return (
    <>
      <Card className={cardClass}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-1">
                {evt.kind === 'TEL_REGISTRY'
                  ? 'Registry'
                  : evt.kind === 'TEL_EVT'
                  ? `${evt.type.toUpperCase()} #${parseInt(evt.sequence || '0', 16)}`
                  : evt.kind === 'KEL_EVT'
                  ? `${evt.type.toUpperCase()} #${parseInt(evt.sequence || '0', 16)}`
                  : `ACDC (${evt.type})`}
              </div>
              <VisualId value={evt.id} label={evt.label} size={24} maxCharacters={16} />
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowModal(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {getEventSummary().map(([key, value, type], idx) => (
                <div key={`${key}-${idx}`} className="flex items-start text-xs gap-2">
                  <span className="font-semibold min-w-[100px] flex-shrink-0">{key}:</span>
                  {type === 'visualid' ? (
                    <VisualId value={value} label="" size={20} maxCharacters={12} />
                  ) : (
                    <span className="text-muted-foreground break-all flex-1">{String(value)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {evt.kind === 'TEL_REGISTRY'
                ? 'Registry'
                : evt.kind === 'TEL_EVT'
                ? `${evt.type.toUpperCase()} Event #${parseInt(evt.sequence || '0', 16)}`
                : evt.kind === 'KEL_EVT'
                ? `${evt.type.toUpperCase()} Event #${parseInt(evt.sequence || '0', 16)}`
                : `ACDC (${evt.type})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">Event ID</div>
              <VisualId value={evt.id} label={evt.label} size={32} maxCharacters={64} />
            </div>

            {evt.meta && (
              <div>
                <div className="text-sm font-semibold mb-2">Metadata</div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(evt.meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GraphTableView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [registryIds, setRegistryIds] = useState<string[]>([]);
  const [registryAliases, setRegistryAliases] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function buildTable() {
      try {
        setLoading(true);
        setError(null);

        const dsl = await getDSL();

        // Build graph using createKeriGraph
        const graphBuilder = createKeriGraph(dsl.getStore(), dsl);
        const graph = await graphBuilder.build();

        // Build alias map
        const aliasMap = new Map<string, string>();

        const accountNames = await dsl.accountNames();
        for (const alias of accountNames) {
          const account = await dsl.getAccount(alias);
          if (account) {
            aliasMap.set(account.aid, alias);
          }
        }

        for (const accountAlias of accountNames) {
          const accountDsl = await dsl.account(accountAlias);
          if (accountDsl) {
            const registryAliases = await accountDsl.listRegistries();
            for (const regAlias of registryAliases) {
              const registryDsl = await accountDsl.registry(regAlias);
              if (registryDsl) {
                aliasMap.set(registryDsl.registry.registryId, regAlias);

                const acdcAliases = await registryDsl.listACDCs();
                for (const acdcAlias of acdcAliases) {
                  const acdcDsl = await registryDsl.acdc(acdcAlias);
                  if (acdcDsl) {
                    aliasMap.set(acdcDsl.acdc.credentialId, acdcAlias);
                  }
                }
              }
            }
          }
        }

        // Extract KEL events (sorted by sequence)
        const kelEvents = graph.nodes
          .filter(n => n.kind === 'KEL_EVT')
          .map(n => ({
            id: n.id,
            type: n.meta?.t || 'KEL',
            label: aliasMap.get(n.id) || n.label || n.id.substring(0, 12),
            sequence: n.meta?.s,
            kind: 'KEL_EVT' as const,
            meta: n.meta,
          }))
          .sort((a, b) => {
            const seqA = parseInt(a.sequence || '0', 16);
            const seqB = parseInt(b.sequence || '0', 16);
            return seqA - seqB;
          });

        // Extract registries
        const registries = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY');
        const regIds = registries.map(r => r.id);
        const regAliasMap = new Map(registries.map(r => [r.id, aliasMap.get(r.id) || r.label || r.id.substring(0, 12)]));

        setRegistryIds(regIds);
        setRegistryAliases(regAliasMap);

        // Build timeline rows
        const timeline: TimelineRow[] = [];
        let rowIndex = 0;

        // For each KEL event, create a row
        for (const kelEvt of kelEvents) {
          const row: TimelineRow = {
            kelEvent: kelEvt,
            telColumns: new Map(),
          };

          // Find registries anchored by this KEL event
          const anchoredRegistries = graph.edges
            .filter(e => e.kind === 'ANCHOR' && e.from === kelEvt.id)
            .map(e => e.to);

          for (const regId of anchoredRegistries) {
            const reg = registries.find(r => r.id === regId);
            if (reg) {
              const regCard: EventCard = {
                id: reg.id,
                type: 'vcp',
                label: aliasMap.get(reg.id) || reg.label || reg.id.substring(0, 12),
                kind: 'TEL_REGISTRY',
                meta: reg.meta,
              };
              row.telColumns.set(regId, [regCard]);
            }
          }

          timeline.push(row);
          rowIndex++;
        }

        // Now process TEL events and ACDCs for each registry
        for (const regId of regIds) {
          // Get all TEL events for this registry (sorted by sequence)
          const telEvents = graph.nodes
            .filter(n => n.kind === 'TEL_EVT' && n.meta?.ri === regId)
            .map(n => ({
              id: n.id,
              type: n.meta?.t || 'TEL',
              label: n.meta?.t?.toUpperCase() || 'TEL',
              sequence: n.meta?.s,
              kind: 'TEL_EVT' as const,
              meta: n.meta,
            }))
            .sort((a, b) => {
              const seqA = parseInt(a.sequence || '0', 16);
              const seqB = parseInt(b.sequence || '0', 16);
              return seqA - seqB;
            });

          // Add each TEL event to a new row or existing row
          for (const telEvt of telEvents) {
            // Find ACDCs issued/revoked by this event
            const acdcs = graph.edges
              .filter(e => (e.kind === 'ISSUES' || e.kind === 'REVOKES') && e.from === telEvt.id)
              .map(e => {
                const acdcNode = graph.nodes.find(n => n.id === e.to);
                if (!acdcNode) return null;
                return {
                  id: acdcNode.id,
                  type: e.kind.toLowerCase(),
                  label: aliasMap.get(acdcNode.id) || acdcNode.label || acdcNode.id.substring(0, 12),
                  kind: 'ACDC' as const,
                  meta: acdcNode.meta,
                };
              })
              .filter(Boolean) as EventCard[];

            const events = [telEvt, ...acdcs];

            // Add to a new row
            const newRow: TimelineRow = {
              telColumns: new Map([[regId, events]]),
            };
            timeline.push(newRow);
          }
        }

        setRows(timeline);
      } catch (err) {
        console.error('Failed to build table:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    buildTable();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Loading table view...
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
            Error loading table: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No data found - create an identity to view the table
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-semibold bg-blue-50 dark:bg-blue-950 min-w-[200px]">
                KEL Events
              </th>
              {registryIds.map(regId => (
                <th key={regId} className="px-4 py-3 text-left font-semibold bg-green-50 dark:bg-green-950 min-w-[200px]">
                  TEL: {registryAliases.get(regId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 align-top">
                  {row.kelEvent && <EventCardComponent evt={row.kelEvent} />}
                </td>
                {registryIds.map(regId => (
                  <td key={regId} className="px-4 py-3 align-top">
                    {row.telColumns.get(regId)?.map(evt => (
                      <EventCardComponent key={evt.id} evt={evt} />
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
