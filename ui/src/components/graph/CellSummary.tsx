/**
 * CellSummary - Compact event cell for table display
 *
 * Shows: ID, public key, signature, seqno, event type
 * With a details button that opens a modal with full event data
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
import { Eye, FileJson, Binary } from 'lucide-react';
import { VisualId } from '../ui/visual-id';
import { Signature } from '../ui/signature';
import { NodeDetails } from '../ui/NodeDetails';
import type { EventMeta } from '@kerits/storage/types';

interface CellSummaryProps {
  event: {
    said: string;
    meta: EventMeta;
    raw?: Uint8Array;
    parsed?: any;
    publicKeys?: string[];
    signatures?: string[];
  };
}

export function CellSummary({ event }: CellSummaryProps) {
  const [showModal, setShowModal] = useState(false);

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

  const formatCesr = (raw?: Uint8Array): string => {
    if (!raw) return 'N/A';
    try {
      return new TextDecoder().decode(raw);
    } catch {
      return '[Binary data]';
    }
  };

  // Extract display details
  const sequenceNumber = event.meta.s !== undefined ? parseInt(event.meta.s, 16) : undefined;
  const primaryPublicKey = event.publicKeys?.[0];
  const primarySignature = event.signatures?.[0];

  // Extract event bytes (without signatures) for verification
  // The signature is over the event bytes, not including the signature section
  const getEventBytes = (): Uint8Array | undefined => {
    if (!event.raw) return undefined;
    try {
      const text = new TextDecoder().decode(event.raw);
      const sigStart = text.indexOf('-AAD');
      if (sigStart === -1) return event.raw; // No signatures found

      // Find the newline before -AAD
      let eventEnd = sigStart;
      if (sigStart > 0 && text[sigStart - 1] === '\n') {
        eventEnd = sigStart - 1;
      }

      return event.raw.slice(0, eventEnd);
    } catch {
      return undefined;
    }
  };

  const eventBytesForVerification = getEventBytes();

  // Prepare data for NodeDetails
  const nodeDetailsData: Record<string, any> = {
    'Event Type': event.meta.t,
    'SAID': event.said,
  };

  if (event.meta.i) {
    nodeDetailsData['Controller AID'] = event.meta.i;
  }

  if (sequenceNumber !== undefined) {
    nodeDetailsData['Sequence Number'] = sequenceNumber;
  }

  if (event.meta.p) {
    nodeDetailsData['Prior SAID'] = event.meta.p;
  }

  if (event.meta.ri) {
    nodeDetailsData['Registry ID'] = event.meta.ri;
  }

  if (event.meta.dt) {
    nodeDetailsData['Timestamp'] = event.meta.dt;
  }

  if (event.publicKeys && event.publicKeys.length > 0) {
    nodeDetailsData['Public Keys'] = event.publicKeys;
  }

  if (event.signatures && event.signatures.length > 0) {
    nodeDetailsData['Signatures'] = event.signatures;
  }

  // Add parsed data if available
  if (event.parsed) {
    // Filter out technical fields that are already shown
    const filteredParsed = Object.entries(event.parsed)
      .filter(([key]) => !['v', 't', 'd', 'i', 's', 'p', 'k', 'a'].includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (Object.keys(filteredParsed).length > 0) {
      Object.assign(nodeDetailsData, filteredParsed);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 p-2">
        {/* Event type and sequence */}
        <div className="flex items-center gap-2">
          <Badge className={`${getEventTypeColor(event.meta.t)} text-white text-xs px-2 py-0.5`}>
            {event.meta.t}
          </Badge>
          {sequenceNumber !== undefined && (
            <span className="text-xs text-muted-foreground">
              #{sequenceNumber}
            </span>
          )}
        </div>

        {/* SAID */}
        <div className="flex items-center gap-1">
          <VisualId
            label=""
            variant="marble"
            value={event.said}
            size={16}
            maxCharacters={10}
            showCopy={false}
            small
            linkToGraph={true}
          />
        </div>

        {/* Public Key */}
        {primaryPublicKey && (
          <div className="flex items-center gap-1">
            <VisualId
              label="Key"
              variant="ring"
              value={primaryPublicKey}
              size={16}
              maxCharacters={10}
              showCopy={true}
              small
              linkToGraph={false}
            />
          </div>
        )}

        {/* Signature */}
        {primarySignature && (
          <div className="flex items-center gap-1">
            <Signature
              label="Sig"
              value={primarySignature}
              size={16}
              maxCharacters={10}
              showCopy={true}
              showVerify={true}
              publicKey={primaryPublicKey}
              message={eventBytesForVerification}
              small
            />
          </div>
        )}

        {/* Details button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="w-full mt-1"
        >
          <Eye className="mr-1 h-3 w-3" />
          Details
        </Button>
      </div>

      {/* Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {event.meta.t} • {event.said.substring(0, 16)}...
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="mb-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="cesr">CESR</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto">
              <div className="p-4 bg-muted/50 rounded-md">
                <NodeDetails data={nodeDetailsData} layout="stacked" />
              </div>
            </TabsContent>

            <TabsContent value="json" className="flex-1 overflow-auto">
              <pre className="p-4 bg-muted/50 rounded-md text-xs font-mono overflow-auto">
                {JSON.stringify(event.parsed || event.meta, null, 2)}
              </pre>
            </TabsContent>

            <TabsContent value="cesr" className="flex-1 overflow-auto">
              <pre className="p-4 bg-muted/50 rounded-md text-xs font-mono overflow-auto whitespace-pre-wrap break-all">
                {formatCesr(event.raw)}
              </pre>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
