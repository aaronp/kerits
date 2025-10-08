/**
 * EventSummary - Display event details with expandable full view
 *
 * Shows pertinent event details inline, with a modal for full JSON/CESR data
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileJson, Binary, Eye } from 'lucide-react';
import type { EventMeta } from '@kerits/storage/types';

interface EventSummaryProps {
  event: {
    said: string;
    meta: EventMeta;
    raw?: Uint8Array;
    parsed?: any;
  };
  compact?: boolean;
}

export function EventSummary({ event, compact = false }: EventSummaryProps) {
  const [showModal, setShowModal] = useState(false);

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      icp: 'Inception',
      rot: 'Rotation',
      ixn: 'Interaction',
      vcp: 'Registry Inception',
      iss: 'Issuance',
      rev: 'Revocation',
      upg: 'Upgrade',
      vtc: 'Transfer Control',
      nrx: 'Notice of Revocation',
    };
    return labels[type] || type.toUpperCase();
  };

  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      icp: 'bg-blue-500',
      rot: 'bg-purple-500',
      ixn: 'bg-cyan-500',
      vcp: 'bg-green-500',
      iss: 'bg-amber-500',
      rev: 'bg-red-500',
      upg: 'bg-indigo-500',
      vtc: 'bg-orange-500',
      nrx: 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const formatCesr = (raw?: Uint8Array): string => {
    if (!raw) return 'N/A';
    try {
      return new TextDecoder().decode(raw);
    } catch {
      return '[Binary data]';
    }
  };

  // Extract key details from event
  const getEventDetails = () => {
    const details: Array<{ label: string; value: any }> = [];
    const { meta, parsed } = event;

    // Sequence number
    if (meta.s !== undefined) {
      details.push({ label: 'Sequence', value: parseInt(meta.s, 16) });
    }

    // Controller/Issuer AID
    if (meta.i) {
      details.push({ label: 'Controller', value: meta.i });
    }

    // Registry ID (for TEL events)
    if (meta.ri) {
      details.push({ label: 'Registry', value: meta.ri });
    }

    // ACDC details (for iss/rev events)
    if (meta.acdcSaid) {
      details.push({ label: 'Credential', value: meta.acdcSaid });
    }

    // Timestamp
    if (meta.dt) {
      details.push({ label: 'Timestamp', value: new Date(meta.dt).toLocaleString() });
    }

    // Schema fields (for ACDC events)
    if (parsed?.a?.d) {
      const acdcData = parsed.a.d;
      // Filter out technical fields
      const dataFields = Object.entries(acdcData)
        .filter(([key]) => !['d', 'i', 's', 'u', 'e'].includes(key))
        .slice(0, 3); // Show first 3 fields

      if (dataFields.length > 0) {
        details.push({
          label: 'Data',
          value: dataFields.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', '),
        });
      }
    }

    return details;
  };

  const details = getEventDetails();

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Badge className={`${getEventTypeColor(event.meta.t)} text-white text-xs`}>
            {getEventTypeLabel(event.meta.t)}
          </Badge>
          {details.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {details[0].label}: {String(details[0].value).substring(0, 20)}...
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
            className="ml-auto"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>
                {getEventTypeLabel(event.meta.t)} • {event.said.substring(0, 16)}...
              </DialogDescription>
            </DialogHeader>
            <EventDetailsContent event={event} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={`${getEventTypeColor(event.meta.t)} text-white`}>
            {getEventTypeLabel(event.meta.t)}
          </Badge>
          <span className="text-sm font-mono text-muted-foreground">
            {event.said.substring(0, 24)}...
          </span>
        </div>

        {details.length > 0 && (
          <div className="space-y-1 text-sm">
            {details.map((detail, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-medium text-muted-foreground">{detail.label}:</span>
                <span className="font-mono break-all">{String(detail.value)}</span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="w-full"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Full Details
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {getEventTypeLabel(event.meta.t)} • {event.said.substring(0, 16)}...
            </DialogDescription>
          </DialogHeader>
          <EventDetailsContent event={event} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EventDetailsContent({ event }: { event: EventSummaryProps['event'] }) {
  return (
    <Tabs defaultValue="parsed" className="flex-1 overflow-hidden flex flex-col">
      <TabsList className="mb-2">
        <TabsTrigger value="parsed">
          <FileJson className="mr-2 h-4 w-4" />
          Parsed
        </TabsTrigger>
        <TabsTrigger value="json">
          <FileJson className="mr-2 h-4 w-4" />
          JSON
        </TabsTrigger>
        <TabsTrigger value="cesr">
          <Binary className="mr-2 h-4 w-4" />
          CESR
        </TabsTrigger>
      </TabsList>

      <TabsContent value="parsed" className="flex-1 overflow-auto">
        <div className="space-y-3 p-4 bg-muted/50 rounded-md">
          <div>
            <div className="text-sm font-semibold mb-1">Event Type</div>
            <div className="px-3 py-2 bg-background rounded text-sm font-mono">
              {event.meta.t}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-1">SAID</div>
            <div className="px-3 py-2 bg-background rounded text-sm font-mono break-all">
              {event.said}
            </div>
          </div>

          {event.meta.i && (
            <div>
              <div className="text-sm font-semibold mb-1">Controller AID</div>
              <div className="px-3 py-2 bg-background rounded text-sm font-mono break-all">
                {event.meta.i}
              </div>
            </div>
          )}

          {event.meta.s !== undefined && (
            <div>
              <div className="text-sm font-semibold mb-1">Sequence Number</div>
              <div className="px-3 py-2 bg-background rounded text-sm font-mono">
                {parseInt(event.meta.s, 16)} (0x{event.meta.s})
              </div>
            </div>
          )}

          {event.meta.p && (
            <div>
              <div className="text-sm font-semibold mb-1">Prior SAID</div>
              <div className="px-3 py-2 bg-background rounded text-sm font-mono break-all">
                {event.meta.p}
              </div>
            </div>
          )}

          {event.meta.ri && (
            <div>
              <div className="text-sm font-semibold mb-1">Registry ID</div>
              <div className="px-3 py-2 bg-background rounded text-sm font-mono break-all">
                {event.meta.ri}
              </div>
            </div>
          )}

          {event.meta.dt && (
            <div>
              <div className="text-sm font-semibold mb-1">Timestamp</div>
              <div className="px-3 py-2 bg-background rounded text-sm">
                {new Date(event.meta.dt).toLocaleString()}
              </div>
            </div>
          )}

          {event.parsed && (
            <div>
              <div className="text-sm font-semibold mb-1">Full Event Data</div>
              <pre className="px-3 py-2 bg-background rounded text-xs font-mono overflow-auto max-h-60">
                {JSON.stringify(event.parsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="json" className="flex-1 overflow-auto">
        <pre className="p-4 bg-muted/50 rounded-md text-xs font-mono overflow-auto">
          {JSON.stringify(event.parsed || event.meta, null, 2)}
        </pre>
      </TabsContent>

      <TabsContent value="cesr" className="flex-1 overflow-auto">
        <pre className="p-4 bg-muted/50 rounded-md text-xs font-mono overflow-auto whitespace-pre-wrap break-all">
          {event.raw ? formatCesr(event.raw) : 'CESR data not available'}
        </pre>
      </TabsContent>
    </Tabs>
  );
}

function formatCesr(raw: Uint8Array): string {
  try {
    return new TextDecoder().decode(raw);
  } catch {
    return '[Binary data]';
  }
}
