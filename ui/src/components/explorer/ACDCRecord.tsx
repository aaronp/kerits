/**
 * ACDCRecord - Expandable credential record component
 *
 * Displays credential summary with expand/collapse to show full details
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Ban, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { NodeDetails } from '../ui/NodeDetails';
import { VisualId } from '../ui/visual-id';
import { useTheme } from '@/lib/theme-provider';
import type { IndexedACDC } from '@kerits/app/indexer/types';

interface ACDCRecordProps {
  acdc: IndexedACDC;
  /** Optional full ACDC data to display when expanded */
  fullData?: Record<string, any>;
  /** Callback to load full data when expanded */
  onExpand?: () => Promise<Record<string, any>>;
  /** Callback to revoke credential */
  onRevoke?: () => Promise<void>;
  /** Callback to share credential */
  onShare?: () => Promise<void>;
  /** Auto-expand this record on mount */
  autoExpand?: boolean;
}

export function ACDCRecord({ acdc, fullData: initialFullData, onExpand, onRevoke, onShare, autoExpand }: ACDCRecordProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(autoExpand || false);
  const [fullData, setFullData] = useState<Record<string, any> | null>(initialFullData || null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Auto-load data when auto-expanding
  useEffect(() => {
    if (autoExpand && !fullData && onExpand) {
      setLoading(true);
      onExpand()
        .then(data => setFullData(data))
        .catch(error => console.error('Failed to load full ACDC data:', error))
        .finally(() => setLoading(false));
    }
  }, [autoExpand, onExpand]);

  const handleToggle = async () => {
    if (!expanded && !fullData && onExpand) {
      // Load full data when expanding for the first time
      setLoading(true);
      try {
        const data = await onExpand();
        setFullData(data);
      } catch (error) {
        console.error('Failed to load full ACDC data:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const handleRevoke = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRevoke) return;
    setRevoking(true);
    try {
      await onRevoke();
    } finally {
      setRevoking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onShare) return;
    setSharing(true);
    try {
      await onShare();
    } finally {
      setSharing(false);
    }
  };

  // Get background colors based on theme and revocation status
  const getBackgroundClasses = () => {
    if (acdc.revoked) {
      return 'bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/20';
    }

    if (theme === 'dark') {
      return 'bg-slate-900 hover:bg-slate-800';
    } else {
      return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${getBackgroundClasses()}`}>
      {/* Summary - always visible */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div
            className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleToggle}
          >
            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground cursor-pointer" />
              )}
              <VisualId
                label={acdc.alias}
                value={acdc.credentialId}
                variant="marble"
                size={48}
                maxCharacters={24}
                bold={true}
                showCopy={true}
                linkToGraph={false}
              />
            </div>
            <div className="flex gap-2 mt-2 ml-14 text-xs">
              <span
                className={`px-2 py-0.5 rounded ${acdc.revoked
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  }`}
              >
                {acdc.status}
              </span>
              <span className="text-muted-foreground">
                Issued: {acdc.issuedAt ? new Date(acdc.issuedAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing}
                className='cursor-pointer'
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            {onRevoke && acdc.status === 'issued' && !acdc.revoked && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={revoking}
                className='cursor-pointer'
              >
                <Ban className="h-4 w-4 mr-2" />
                {revoking ? 'Revoking...' : 'Revoke'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details - shown when expanded */}
      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading details...
            </div>
          ) : fullData ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Details
                </TabsTrigger>
                <TabsTrigger value="json" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  JSON
                </TabsTrigger>
                <TabsTrigger value="cesr" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  CESR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Show credential data first if present */}
                {fullData.Data && Object.keys(fullData.Data).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Credential Data</h4>
                    <div className="bg-background/50 rounded p-3">
                      <NodeDetails data={fullData.Data} />
                    </div>
                  </div>
                )}

                {/* Show linked credentials if present */}
                {fullData['Linked Credentials'] && Object.keys(fullData['Linked Credentials']).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Linked Credentials</h4>
                    <div className="bg-background/50 rounded p-3 space-y-1.5">
                      {Object.entries(fullData['Linked Credentials']).map(([edgeName, edgeData]: [string, any]) => {
                        const credentialSaid = edgeData?.n;
                        const alias = edgeData?.alias;
                        if (!credentialSaid) return null;

                        return (
                          <div
                            key={edgeName}
                            className="flex items-center gap-2 p-1.5 rounded"
                          >
                            <span className="text-xs text-muted-foreground min-w-[80px] shrink-0">{edgeName}</span>
                            <VisualId
                              label=""
                              variant="marble"
                              value={credentialSaid}
                              size={20}
                              showCopy={true}
                              small
                            />
                            <span className="text-sm font-medium">
                              {alias || credentialSaid.substring(0, 12) + '...'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show metadata */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Metadata</h4>
                  <NodeDetails
                    data={{
                      'Credential ID': fullData['Credential ID'],
                      'Alias': fullData['Alias'],
                      'Registry ID': fullData['Registry ID'],
                      'Schema ID': fullData['Schema ID'],
                      'Issuer': fullData['Issuer'],
                      'Holder': fullData['Holder'],
                      'Issued At': fullData['Issued At'],
                      ...(fullData['Public Keys'] && { 'Public Keys': fullData['Public Keys'] }),
                      ...(fullData['Signatures'] && { 'Signatures': fullData['Signatures'] }),
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto">
                  {fullData.JSON || 'Loading...'}
                </pre>
              </TabsContent>

              <TabsContent value="cesr" className="mt-4">
                <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto font-mono">
                  {fullData.CESR || 'Loading...'}
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <NodeDetails
              data={{
                'Credential ID': acdc.credentialId,
                'Registry ID': acdc.registryId,
                'Schema ID': acdc.schemaId,
                'Issued At': acdc.issuedAt,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
