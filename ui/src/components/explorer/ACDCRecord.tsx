/**
 * ACDCRecord - Expandable credential record component
 *
 * Displays credential summary with expand/collapse to show full details
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Ban } from 'lucide-react';
import { Button } from '../ui/button';
import { NodeDetails } from '../ui/NodeDetails';
import type { IndexedACDC } from '@kerits/app/indexer/types';

interface ACDCRecordProps {
  acdc: IndexedACDC;
  /** Optional full ACDC data to display when expanded */
  fullData?: Record<string, any>;
  /** Callback to load full data when expanded */
  onExpand?: () => Promise<Record<string, any>>;
  /** Callback to revoke credential */
  onRevoke?: () => Promise<void>;
}

export function ACDCRecord({ acdc, fullData: initialFullData, onExpand, onRevoke }: ACDCRecordProps) {
  const [expanded, setExpanded] = useState(false);
  const [fullData, setFullData] = useState<Record<string, any> | null>(initialFullData || null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

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

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Summary - always visible */}
      <div
        className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <h4 className="font-medium">{acdc.alias}</h4>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-6">
              {acdc.credentialId.substring(0, 24)}...
            </p>
            <div className="flex gap-2 mt-2 ml-6 text-xs">
              <span
                className={`px-2 py-0.5 rounded ${
                  acdc.revoked
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
            <>
              {/* Show credential data first if present */}
              {fullData.Data && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Credential Data</h4>
                  <div className="bg-background/50 rounded p-3">
                    <NodeDetails data={fullData.Data} />
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
                  }}
                />
              </div>

              {/* Action buttons */}
              {onRevoke && acdc.status === 'issued' && !acdc.revoked && (
                <div className="pt-2 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setRevoking(true);
                      try {
                        await onRevoke();
                      } finally {
                        setRevoking(false);
                      }
                    }}
                    disabled={revoking}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {revoking ? 'Revoking...' : 'Revoke Credential'}
                  </Button>
                </div>
              )}
            </>
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
