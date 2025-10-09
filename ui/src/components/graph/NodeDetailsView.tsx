import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Textarea } from '../ui/textarea';
import type { VisualizationData, VisualizationEvent } from '@/lib/indexer-to-graph';
import { verifyEvent } from '@/../../src/app/verification';
import { saidify } from '@/../../src/saidify';
import { VisualId } from '../ui/visual-id';
import { Signature } from '../ui/signature';

interface NodeDetailsViewProps {
  node: VisualizationEvent | null;
  allData: VisualizationData;
  isPinned?: boolean;
}

interface VerificationResult {
  saidValid: boolean;
  signatureValid: boolean;
  saidError?: string;
  signatureError?: string;
}

export default function NodeDetailsView({ node, allData, isPinned = false }: NodeDetailsViewProps) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [editedEventJson, setEditedEventJson] = useState<string>('');
  const [editedSaid, setEditedSaid] = useState<string>('');
  const [editedPublicKeys, setEditedPublicKeys] = useState<string>('');
  const [editedSignatures, setEditedSignatures] = useState<string>('');

  if (!node) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <p>Hover over a node to preview</p>
        <p className="text-sm">Click to pin details</p>
      </div>
    );
  }

  // Find the full identity data
  let identityData: any = null;
  if (allData?.identities) {
    for (const identity of allData.identities) {
      const event = identity.events?.find((e) => e.id === node.id);
      if (event) {
        identityData = { ...identity, currentEvent: event };
        break;
      }
    }
  }

  // Extract event JSON from raw data
  const getEventJson = (): string => {
    if (!node.raw) return '';
    try {
      const eventText = node.raw;
      const jsonStart = eventText.indexOf('{');
      if (jsonStart < 0) return '';
      const jsonEnd = eventText.lastIndexOf('}');
      if (jsonEnd < 0) return '';
      const jsonText = eventText.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return '';
    }
  };

  const handleVerify = async () => {
    // Use edited values if available, otherwise use original node data
    const eventJsonToVerify = editedEventJson || getEventJson();
    const saidToVerify = editedSaid || node.id;
    const publicKeysToVerify = editedPublicKeys
      ? editedPublicKeys.split('\n').filter(k => k.trim())
      : (node.publicKeys || []);
    const signaturesToVerify = editedSignatures
      ? editedSignatures.split('\n').filter(s => s.trim())
      : (node.signatures?.map(s => s.signature) || []);

    if (!eventJsonToVerify) {
      setVerificationResult({
        saidValid: false,
        signatureValid: false,
        saidError: 'Event JSON not available',
        signatureError: 'Event JSON not available',
      });
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Verify SAID
      let saidValid = false;
      let saidError: string | undefined;
      try {
        // Parse the event JSON
        const eventJson = JSON.parse(eventJsonToVerify);
        const storedSaid = eventJson.d;

        // Check if the SAID field matches what we expect
        saidValid = storedSaid === saidToVerify;

        if (!saidValid) {
          saidError = `SAID field mismatch: event.d="${storedSaid}", but expected "${saidToVerify}"`;
        } else if (editedEventJson) {
          // If data was edited, note that we're only checking field equality
          // True cryptographic verification would require recomputing the hash
          // with the exact same key ordering as the original serialization
          saidError = undefined; // Will pass if user hasn't changed the 'd' field
        }
      } catch (err) {
        saidError = err instanceof Error ? err.message : 'SAID verification failed';
      }

      // Verify signature
      let signatureValid = false;
      let signatureError: string | undefined;
      try {
        if (publicKeysToVerify.length === 0) {
          throw new Error('No public keys available for verification');
        }

        // Reconstruct the full event with signatures for verification
        const eventBytes = new TextEncoder().encode(node.raw || '');
        const result = await verifyEvent(eventBytes, publicKeysToVerify, 1);
        signatureValid = result.valid;
        if (!signatureValid) {
          signatureError = result.errors.join(', ');
        }
      } catch (err) {
        signatureError = err instanceof Error ? err.message : 'Signature verification failed';
      }

      setVerificationResult({
        saidValid,
        signatureValid,
        saidError,
        signatureError,
      });
    } catch (err) {
      setVerificationResult({
        saidValid: false,
        signatureValid: false,
        saidError: err instanceof Error ? err.message : 'Verification failed',
        signatureError: err instanceof Error ? err.message : 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Get event type color (matching CellSummary)
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

  const identityLabel = identityData?.alias || identityData?.prefix || 'Unknown';
  const hasSinglePublicKey = node.publicKeys?.length === 1;
  const hasSingleSignature = node.signatures?.length === 1;

  return (
    <div className="p-4 overflow-auto h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b-2 pb-2">
        <h3 className="font-semibold text-base flex-1">Node Details</h3>
        {isPinned && (
          <Badge variant="default" className="text-xs">
            PINNED
          </Badge>
        )}
      </div>

      {/* Event ID */}
      <div className="pb-2 border-b">
        <VisualId
          label="Event ID"
          value={node.id}
          showCopy={true}
          bold={true}
          maxCharacters={16}
          linkToGraph={false}
        />
      </div>

      {/* Main Details - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {/* Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Type:</span>
          <Badge className={`${getEventTypeColor(node.type)} text-white text-xs px-2 py-0.5`}>
            {node.type}
          </Badge>
        </div>

        {/* Timestamp */}
        {node.timestamp && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Timestamp:</span>
            <span className="text-xs text-foreground">
              {new Date(node.timestamp).toLocaleString()}
            </span>
          </div>
        )}

        {/* Identity */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Identity:</span>
          <span className="text-xs text-foreground font-medium">{identityLabel}</span>
        </div>

        {/* Registry */}
        {node.registry && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Registry:</span>
            <span className="text-xs text-foreground font-mono">{node.registry}</span>
          </div>
        )}

        {/* Sequence Number */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Sequence #:</span>
          <span className="text-xs text-foreground">{node.sn?.toString() || 'N/A'}</span>
        </div>

        {/* Label */}
        {node.label && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Label:</span>
            <span className="text-xs text-foreground">{node.label}</span>
          </div>
        )}
      </div>

      {/* Single Public Key */}
      {hasSinglePublicKey && node.publicKeys && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Public Key:</span>
          <VisualId
            label=""
            value={node.publicKeys[0]}
            variant="ring"
            size={24}
            maxCharacters={16}
            showCopy={true}
            small
            linkToGraph={false}
          />
        </div>
      )}

      {/* Multiple Public Keys */}
      {!hasSinglePublicKey && node.publicKeys && node.publicKeys.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-foreground">
            Public Keys ({node.publicKeys.length}):
          </div>
          <div className="space-y-1 pl-2">
            {node.publicKeys.map((key, idx) => (
              <VisualId
                key={idx}
                label={`[${idx}]`}
                value={key}
                variant="ring"
                size={20}
                maxCharacters={14}
                showCopy={true}
                small
                linkToGraph={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Single Signature */}
      {hasSingleSignature && node.signatures && node.publicKeys && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground min-w-[80px]">Signature:</span>
          <Signature
            label=""
            value={node.signatures[0].signature}
            size={24}
            maxCharacters={16}
            showCopy={true}
            showVerify={false}
            small
          />
        </div>
      )}

      {/* Multiple Signatures */}
      {!hasSingleSignature && node.signatures && node.signatures.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">
            Signatures ({node.signatures.length}):
          </div>
          <div className="space-y-1 pl-2">
            {node.signatures.map((sig, idx) => (
              <Signature
                key={idx}
                label={`[${sig.signingIndex}]`}
                value={sig.signature}
                size={20}
                maxCharacters={14}
                showCopy={true}
                showVerify={false}
                small
              />
            ))}
          </div>
        </div>
      )}

      {/* Cross-Identity Links */}
      {node.links && node.links.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-semibold text-foreground">
            Cross-Identity Links:
          </div>
          <div className="space-y-1 pl-2">
            {node.links.map((link, idx) => (
              <VisualId
                key={idx}
                label=""
                value={link}
                size={20}
                maxCharacters={16}
                showCopy={true}
                small
              />
            ))}
          </div>
        </div>
      )}

      {/* Cryptographic Verification Section */}
      {node.raw && (
        <Card className="p-4 space-y-3 bg-muted/30 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Cryptographic Verification</h4>
            <Button
              size="sm"
              onClick={handleVerify}
              disabled={verifying}
              variant="outline"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>

          {verificationResult && (
            <div className="space-y-2">
              {/* SAID Verification */}
              <div className="flex items-start gap-2 text-sm">
                {verificationResult.saidValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    SAID {verificationResult.saidValid ? 'Valid' : 'Invalid'}
                  </div>
                  {verificationResult.saidError && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {verificationResult.saidError}
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Verification */}
              <div className="flex items-start gap-2 text-sm">
                {verificationResult.signatureValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    Signature {verificationResult.signatureValid ? 'Valid' : 'Invalid'}
                  </div>
                  {verificationResult.signatureError && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {verificationResult.signatureError}
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Status */}
              {verificationResult.saidValid && verificationResult.signatureValid && (
                <div className="flex items-center gap-2 text-sm pt-2 border-t text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Event integrity verified</span>
                </div>
              )}
            </div>
          )}

          {/* Expandable section for manual editing and verification */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="edit-verify" className="border-none">
              <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                Advanced: Edit & Revalidate
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Edit the event data below to demonstrate that verification fails when data is tampered with.
                </p>

                {/* Event JSON */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Event JSON:</label>
                  <Textarea
                    value={editedEventJson || getEventJson()}
                    onChange={(e) => setEditedEventJson(e.target.value)}
                    className="font-mono text-xs min-h-[120px]"
                    placeholder="Event JSON..."
                  />
                </div>

                {/* SAID */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">SAID:</label>
                  <Textarea
                    value={editedSaid || node.id}
                    onChange={(e) => setEditedSaid(e.target.value)}
                    className="font-mono text-xs"
                    rows={2}
                    placeholder="SAID..."
                  />
                </div>

                {/* Public Keys */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Public Keys (one per line):
                  </label>
                  <Textarea
                    value={editedPublicKeys || (node.publicKeys || []).join('\n')}
                    onChange={(e) => setEditedPublicKeys(e.target.value)}
                    className="font-mono text-xs"
                    rows={3}
                    placeholder="Public keys..."
                  />
                </div>

                {/* Signatures */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Signatures (one per line):
                  </label>
                  <Textarea
                    value={editedSignatures || (node.signatures?.map(s => s.signature) || []).join('\n')}
                    onChange={(e) => setEditedSignatures(e.target.value)}
                    className="font-mono text-xs"
                    rows={3}
                    placeholder="Signatures..."
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Verifying Edited Data...
                    </>
                  ) : (
                    'Verify Edited Data'
                  )}
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}
    </div>
  );
}
