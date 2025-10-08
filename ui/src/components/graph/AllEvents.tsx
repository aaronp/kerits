/**
 * AllEvents - Show all events grouped by registry
 *
 * Displays a table with:
 * - One row per registry
 * - KEL events in columns across the top row
 * - TEL events for each registry in subsequent rows
 */

import { useState, useEffect } from 'react';
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
import { CellSummary } from './CellSummary';
import { parseKeriEvent } from './parse-event';
import type { KeritsDSL } from '@kerits/app/dsl/types';
import type { KerStore, KelEvent, TelEvent, SAID, AID } from '@kerits/storage/types';

interface AllEventsProps {
  dsl: KeritsDSL | null;
}

interface ParsedEvent {
  said: SAID;
  meta: any;
  raw: Uint8Array;
  parsed?: any;
  publicKeys?: string[];
  signatures?: string[];
}

interface RegistryRow {
  type: 'KEL' | 'TEL';
  id: SAID;
  label: string;
  events: ParsedEvent[];
}

export function AllEvents({ dsl }: AllEventsProps) {
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [maxColumns, setMaxColumns] = useState(0);

  useEffect(() => {
    async function loadAllEvents() {
      if (!dsl) {
        setRows([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const store = dsl.getStore();
        const allRows: RegistryRow[] = [];

        // Get all accounts (KELs)
        const accountNames = await dsl.accountNames();

        for (const accountAlias of accountNames) {
          const accountDsl = await dsl.account(accountAlias);
          if (!accountDsl) continue;

          const aid = accountDsl.account.aid;

          // Get all KEL events for this account
          const kelEvents = await store.listKel(aid);
          const kelParsedEvents = await Promise.all(
            kelEvents.map(e => parseEvent(e.raw, e.said, e.meta))
          );

          allRows.push({
            type: 'KEL',
            id: aid,
            label: `${accountAlias} (KEL)`,
            events: kelParsedEvents,
          });

          // Get all registries for this account
          const registryAliases = await accountDsl.listRegistries();

          for (const registryAlias of registryAliases) {
            const registryDsl = await accountDsl.registry(registryAlias);
            if (!registryDsl) continue;

            const registryId = registryDsl.registry.registryId;

            // Get all TEL events for this registry
            const telEvents = await store.listTel(registryId);
            const telParsedEvents = await Promise.all(
              telEvents.map(e => parseEvent(e.raw, e.said, e.meta))
            );

            allRows.push({
              type: 'TEL',
              id: registryId,
              label: `  ${registryAlias} (TEL)`,
              events: telParsedEvents,
            });
          }
        }

        // Calculate max columns
        const maxCols = Math.max(...allRows.map(row => row.events.length), 0);
        setMaxColumns(maxCols);

        setRows(allRows);
      } catch (err) {
        console.error('Failed to load all events:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadAllEvents();
  }, [dsl]);

  async function parseEvent(
    raw: Uint8Array,
    said: SAID,
    meta: any
  ): Promise<ParsedEvent> {
    const { parsed, publicKeys, signatures } = parseKeriEvent(raw);

    return {
      said,
      meta,
      raw,
      parsed,
      publicKeys,
      signatures,
    };
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Loading all events...
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

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No events found. Create an identity to view events.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Events</CardTitle>
        <CardDescription>
          {rows.length} registries • {rows.reduce((sum, r) => sum + r.events.length, 0)} total events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-card/95 backdrop-blur-sm z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  Registry
                </TableHead>
                {Array.from({ length: maxColumns }, (_, i) => (
                  <TableHead key={i} className="min-w-[180px]">
                    Event {i}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium sticky left-0 bg-card/95 backdrop-blur-sm z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                    <div className="flex flex-col gap-1">
                      <span className={row.type === 'KEL' ? 'font-semibold' : 'pl-4'}>
                        {row.label}
                      </span>
                      <code className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {row.id.substring(0, 20)}...
                      </code>
                    </div>
                  </TableCell>
                  {row.events.map((event, idx) => {
                    const isHighlighted = selectedId && event.said === selectedId;
                    return (
                      <TableCell
                        key={`${row.id}-${idx}`}
                        className={`align-top transition-all ${
                          isHighlighted
                            ? 'bg-blue-100 dark:bg-blue-950 border-4 border-blue-500 dark:border-blue-400 shadow-lg'
                            : ''
                        }`}
                      >
                        <CellSummary event={event} />
                      </TableCell>
                    );
                  })}
                  {/* Fill empty cells if this row has fewer events than maxColumns */}
                  {Array.from({ length: maxColumns - row.events.length }, (_, i) => (
                    <TableCell key={`empty-${i}`} className="bg-muted/20" />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
