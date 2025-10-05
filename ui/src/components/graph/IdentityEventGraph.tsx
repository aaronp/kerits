import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import type { Node, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Download, Upload } from 'lucide-react';
import { KeriID } from '../ui/keri-id';
import { VisualId } from '../ui/visual-id';
import { getTELRegistriesByIssuer, saveTELRegistry } from '@/lib/storage';
import type { TELRegistry, StoredCredential } from '@/lib/storage';
import { Toast, useToast } from '../ui/toast';

// Custom node component for SAID root
function SAIDNode({ data }: NodeProps) {
  return (
    <div className="px-6 py-4 rounded-lg border-2 border-primary bg-primary/10 shadow-lg min-w-[250px]">
      <div className="space-y-1 text-center">
        <div className="font-bold text-lg text-primary">{data.label}</div>
        <div className="text-xs text-muted-foreground font-mono break-all">
          {data.prefix?.substring(0, 24)}...
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-4 h-4" />
    </div>
  );
}

// Custom node component for KEL/TEL events
function EventNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-card-foreground">{data.label}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {data.type}
        </div>
        {data.sn !== undefined && (
          <div className="text-xs text-muted-foreground">
            Sequence: {data.sn}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

// Custom node component for TEL Registry
function RegistryNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 shadow-md min-w-[220px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-green-700 dark:text-green-300">{data.label}</div>
        <div className="text-xs text-muted-foreground">
          Registry
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  said: SAIDNode,
  event: EventNode,
  registry: RegistryNode,
};

interface IdentityEventGraphProps {
  /** The identity alias/name to display */
  alias: string;
  /** The AID/prefix of the identity */
  prefix: string;
  /** The inception event */
  inceptionEvent: any;
  /** The KEL events (rotations, etc.) */
  kelEvents: any[];
  /** Whether to load and display TEL registries (default: true) */
  showTEL?: boolean;
  /** Credentials to match with TEL events */
  credentials?: StoredCredential[];
  /** External trigger to refresh TEL data */
  telRefreshTrigger?: number;
}

export function IdentityEventGraph({
  alias,
  prefix,
  inceptionEvent,
  kelEvents,
  showTEL = true,
  credentials = [],
  telRefreshTrigger = 0,
}: IdentityEventGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [telRegistries, setTelRegistries] = useState<TELRegistry[]>([]);
  const { toast, showToast, hideToast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [graphHeight, setGraphHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);

  // Load TEL registries for this identity
  useEffect(() => {
    if (!showTEL || !prefix) return;

    const loadRegistries = async () => {
      try {
        const registries = await getTELRegistriesByIssuer(prefix);
        console.log('IdentityEventGraph: Loaded TEL registries for', prefix, ':', registries);
        setTelRegistries(registries);
      } catch (error) {
        console.error('Failed to load TEL registries:', error);
      }
    };

    loadRegistries();
  }, [prefix, showTEL, telRefreshTrigger]);

  // Build unified graph with SAID root, KEL, and TELs
  const unifiedGraph = useMemo(() => {
    if (!prefix || !inceptionEvent) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root SAID node
    nodes.push({
      id: 'root-said',
      type: 'said',
      position: { x: 50, y: 400 },
      data: {
        label: alias,
        prefix: prefix,
      },
    });

    // KEL branch (to the right of SAID)
    const kelY = 400;
    const kelXStart = 400;

    // Inception event - handle different KEL formats
    const inceptionEventType = inceptionEvent.ked?.t || inceptionEvent.t || 'icp';
    nodes.push({
      id: 'kel-inception',
      type: 'event',
      position: { x: kelXStart, y: kelY },
      data: {
        label: `Inception`,
        type: inceptionEventType,
        sn: 0,
        event: inceptionEvent,
      },
    });

    edges.push({
      id: 'edge-root-kel',
      source: 'root-said',
      target: 'kel-inception',
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      label: 'KEL',
    });

    // Rotation events - handle array or empty kelEvents
    if (kelEvents && Array.isArray(kelEvents)) {
      kelEvents.forEach((event: any, index: number) => {
        const eventId = `kel-${index}`;
        const prevId = index === 0 ? 'kel-inception' : `kel-${index - 1}`;

        // Handle different event formats
        const eventType = event.ked?.t || event.t || 'rot';

        nodes.push({
          id: eventId,
          type: 'event',
          position: { x: kelXStart + 300 + (index * 300), y: kelY },
          data: {
            label: `Rotation ${index + 1}`,
            type: eventType,
            sn: index + 1,
            event,
          },
        });

        edges.push({
          id: `edge-${prevId}-${eventId}`,
          source: prevId,
          target: eventId,
          animated: false,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        });
      });
    }

    // TEL branches (distributed above and below KEL) - only if showTEL is true
    if (showTEL) {
      const telXStart = 400;
      const telSpacing = 250;

      console.log('IdentityEventGraph: Building graph with', telRegistries.length, 'TEL registries');

      telRegistries.forEach((registry, regIndex) => {
        console.log(`IdentityEventGraph: Processing registry ${regIndex}:`, registry.alias, 'with', registry.tel?.length || 0, 'events');
        // Calculate Y position - distribute evenly above and below KEL
        const isAbove = regIndex % 2 === 0;
        const groupIndex = Math.floor(regIndex / 2);
        const telY = isAbove
          ? kelY - (telSpacing * (groupIndex + 1))
          : kelY + (telSpacing * (groupIndex + 1));

        // Registry node
        const regNodeId = `tel-reg-${regIndex}`;
        nodes.push({
          id: regNodeId,
          type: 'registry',
          position: { x: telXStart, y: telY },
          data: {
            label: registry.alias,
            registryAID: registry.registryAID,
          },
        });

        // Edge from root SAID to registry
        edges.push({
          id: `edge-root-${regNodeId}`,
          source: 'root-said',
          target: regNodeId,
          animated: false,
          style: { stroke: '#10b981', strokeWidth: 2 },
          label: 'TEL',
        });

        // Read TEL events directly from the registry's TEL log
        const baseX = telXStart + 350;
        let prevNodeId = regNodeId;

        // Handle registries that might not have tel array (legacy)
        const telEvents = registry.tel || [];

        telEvents.forEach((telEvent: any, telIndex: number) => {
          const telNodeId = `tel-${regIndex}-evt-${telIndex}`;

          // Determine event type and label
          const eventType = telEvent.ked?.t || telEvent.t || 'event';
          let eventLabel = eventType;

          // For issuance events, try to find the credential to show a better label
          if (eventType === 'iss' || eventType === 'bis' || eventType === 'brv') {
            const credSAID = telEvent.ked?.i || telEvent.i;
            const credential = credentials.find(c => c.id === credSAID);
            if (credential) {
              eventLabel = `${eventType}: ${credential.schemaName || credential.name}`;
            } else {
              eventLabel = `${eventType}: ${credSAID?.substring(0, 12)}...`;
            }
          }

          nodes.push({
            id: telNodeId,
            type: 'event',
            position: { x: baseX + (telIndex * 300), y: telY },
            data: {
              label: eventLabel,
              type: eventType,
              sn: telEvent.ked?.s !== undefined ? telEvent.ked.s : undefined,
              event: telEvent,
            },
          });

          edges.push({
            id: `edge-${prevNodeId}-${telNodeId}`,
            source: prevNodeId,
            target: telNodeId,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 },
          });

          prevNodeId = telNodeId;
        });
      });
    }

    return { nodes, edges };
  }, [prefix, alias, inceptionEvent, kelEvents, showTEL, telRegistries, credentials]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Create a stable key based on actual graph content to prevent infinite loops
  const graphKey = useMemo(() => {
    // Include total TEL events count to detect when registries are updated
    const totalTelEvents = telRegistries.reduce((sum, reg) => sum + (reg.tel?.length || 0), 0);
    return `${prefix}-${kelEvents?.length || 0}-${telRegistries.length}-${totalTelEvents}-${showTEL}-${telRefreshTrigger}`;
  }, [prefix, kelEvents?.length, telRegistries, showTEL, telRefreshTrigger]);

  // Update nodes/edges when graph key changes (use graphKey to prevent infinite loops)
  useEffect(() => {
    setNodes(unifiedGraph.nodes);
    setEdges(unifiedGraph.edges);
  }, [graphKey]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newHeight = e.clientY - 200; // Adjust based on offset from top
    if (newHeight >= 300 && newHeight <= 800) {
      setGraphHeight(newHeight);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle exporting credential from TEL event or registry
  const handleExportCredential = useCallback(async (node: Node) => {
    // If clicking on a registry node, export the entire TEL registry
    if (node.type === 'registry') {
      const registryAID = node.data.registryAID;
      const registry = telRegistries.find(r => r.registryAID === registryAID);

      if (!registry) {
        showToast('Registry not found');
        return;
      }

      // Export the entire TEL registry
      const exportData = {
        registryAID: registry.registryAID,
        alias: registry.alias,
        issuerAID: registry.issuerAID,
        inceptionEvent: registry.inceptionEvent,
        tel: registry.tel,
        createdAt: registry.createdAt,
      };

      const json = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(json);
      showToast('TEL Registry copied to clipboard');
      return;
    }

    // Otherwise, handle individual credential export
    // Check event type from multiple possible locations
    const eventType = node.data.type ||
                     node.data.event?.sad?.t ||
                     node.data.event?.ked?.t ||
                     node.data.event?.t;

    // Check if this is a TEL issuance event (iss, bis, brv)
    if (!['iss', 'bis', 'brv'].includes(eventType)) {
      showToast('This event is not a credential issuance event');
      return;
    }

    const telEvent = node.data.event;
    // Check for credential SAID in multiple possible locations
    const credSAID = telEvent.sad?.i || telEvent.ked?.i || telEvent.i;

    if (!credSAID) {
      showToast('Could not find credential SAID in this event');
      return;
    }

    // Find the credential
    const credential = credentials.find(c => c.id === credSAID);

    if (!credential) {
      showToast('Credential not found. The credential may not be in your local storage.');
      return;
    }

    // Export the full credential
    const exportData = {
      id: credential.id,
      name: credential.name,
      issuer: credential.issuer,
      issuerAlias: credential.issuerAlias,
      recipient: credential.recipient,
      recipientAlias: credential.recipientAlias,
      schema: credential.schema,
      schemaName: credential.schemaName,
      sad: credential.sad,
      tel: credential.tel,
      registry: credential.registry,
      createdAt: credential.createdAt,
    };

    const json = JSON.stringify(exportData, null, 2);
    await navigator.clipboard.writeText(json);
    showToast('Credential copied to clipboard');
  }, [credentials, telRegistries, showToast]);

  const handleImportTEL = useCallback(async (node: Node) => {
    // If clicking on SAID node, show import dialog
    if (node.type === 'said') {
      setShowImportDialog(true);
    } else {
      showToast('Import credential from the Credentials page');
    }
  }, [showToast]);

  const handleImportConfirm = useCallback(async () => {
    if (!importData.trim()) {
      showToast('Please paste TEL registry data');
      return;
    }

    try {
      const parsed = JSON.parse(importData);

      // Validate TEL registry structure
      if (!parsed.registryAID || !parsed.issuerAID || !parsed.inceptionEvent) {
        showToast('Invalid TEL registry format - missing required fields');
        return;
      }

      // KERI Validation: Verify issuerAID matches the current identity's prefix
      if (parsed.issuerAID !== prefix) {
        showToast(`TEL registry issuer (${parsed.issuerAID.substring(0, 12)}...) does not match this identity (${prefix.substring(0, 12)}...)`);
        return;
      }

      // Validate inception event structure
      const inceptionEvent = parsed.inceptionEvent;
      if (!inceptionEvent.sad || inceptionEvent.sad.t !== 'vcp') {
        showToast('Invalid TEL inception event - must be type "vcp"');
        return;
      }

      // Validate registryAID matches inception event
      if (parsed.registryAID !== inceptionEvent.sad.i) {
        showToast('Registry AID does not match inception event identifier');
        return;
      }

      // Create TEL registry object
      const telRegistry: TELRegistry = {
        registryAID: parsed.registryAID,
        alias: parsed.alias || 'Imported Registry',
        issuerAID: parsed.issuerAID,
        inceptionEvent: parsed.inceptionEvent,
        tel: parsed.tel || [],
        createdAt: parsed.createdAt || new Date().toISOString(),
      };

      // Save the TEL registry
      await saveTELRegistry(telRegistry);

      // Force reload TEL registries to update the graph
      const registries = await getTELRegistriesByIssuer(prefix);
      setTelRegistries(registries);

      console.log('TEL Registry imported:', telRegistry);
      console.log('Reloaded registries:', registries);

      setImportData('');
      setShowImportDialog(false);
      showToast('TEL Registry imported successfully');
    } catch (error) {
      console.error('Failed to import TEL registry:', error);
      if (error instanceof SyntaxError) {
        showToast('Invalid JSON format');
      } else {
        showToast(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [importData, prefix, showToast]);

  return (
    <div className="space-y-0">
      {/* Graph Container - Resizable */}
      <Card className="flex flex-col overflow-hidden" style={{ height: `${graphHeight}px` }}>
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">
              Network Graph: {alias}
            </CardTitle>
            <CardDescription>
              Showing KEL{showTEL ? ' and TELs' : ''} for {prefix.substring(0, 32)}...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.3}
              maxZoom={1.5}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
            </ReactFlow>
          </CardContent>
        </Card>

      {/* Resize Handle */}
      <div
        className="h-2 bg-border hover:bg-primary cursor-ns-resize flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="w-12 h-1 bg-muted-foreground rounded-full" />
      </div>

      {/* Detail Panel - Always Visible */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {selectedNode ? (() => {
                  const event = selectedNode.data.event;
                  const eventData = event?.sad || event?.ked || event;
                  const eventType = eventData?.t || selectedNode.data.type;

                  const eventTypeNames: Record<string, string> = {
                    'icp': 'Inception',
                    'rot': 'Rotation',
                    'iss': 'Issuance',
                    'rev': 'Revocation',
                    'bis': 'Backerless Issuance',
                    'brv': 'Backerless Revocation',
                    'vcp': 'Registry Inception',
                    'vrt': 'Registry Rotation',
                    'ixn': 'Interaction',
                  };

                  if (selectedNode.type === 'said') return selectedNode.data.label || 'Identity';
                  if (selectedNode.type === 'registry') return selectedNode.data.label || 'Registry';

                  return eventTypeNames[eventType] || eventType || 'Event Details';
                })() : 'Node Details'}
              </CardTitle>
              <CardDescription>
                {selectedNode ? 'Click a different node to view its details' : 'Click a node to view details'}
              </CardDescription>
            </div>
            {selectedNode && (() => {
              // Check if this is a credential issuance event - check multiple locations for type
              const eventType = selectedNode.data.type ||
                               selectedNode.data.event?.sad?.t ||
                               selectedNode.data.event?.ked?.t ||
                               selectedNode.data.event?.t;
              const isCredentialEvent = ['iss', 'bis', 'brv'].includes(eventType) ||
                                       selectedNode.type === 'registry';
              const isSAIDNode = selectedNode.type === 'said';

              return isCredentialEvent || isSAIDNode;
            })() && (
              <div className="flex gap-2">
                {selectedNode.type !== 'said' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCredential(selectedNode)}
                    title="Export credential to clipboard"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImportTEL(selectedNode)}
                  title={selectedNode.type === 'said' ? 'Import TEL Registry' : 'Import credential (use Credentials page)'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-4 pb-4">
              {/* Render event-specific details */}
              {(() => {
                const event = selectedNode.data.event;
                const eventData = event?.sad || event?.ked || event;
                const eventType = eventData?.t || selectedNode.data.type;

                return (
                  <>
                    {/* Event-specific fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                      {/* Event ID (d field) - Show for all events that have it */}
                      {eventData?.d && selectedNode.type !== 'said' && selectedNode.type !== 'registry' && (
                        <div className="col-span-full">
                          <VisualId
                            label="Event ID"
                            value={eventData.d}
                            size={40}
                            onCopy={(label) => showToast(`${label} copied to clipboard`)}
                          />
                        </div>
                      )}

                      {/* SAID node (root identity) */}
                      {selectedNode.type === 'said' && selectedNode.data.prefix && (
                        <div className="flex gap-4 items-start">
                          <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Identity (AID)</div>
                          <div className="flex-1 min-w-0">
                            <KeriID id={selectedNode.data.prefix} type="kel" onCopy={showToast} />
                          </div>
                        </div>
                      )}

                      {/* Registry node */}
                      {selectedNode.type === 'registry' && selectedNode.data.registryAID && (
                        <div className="flex gap-4 items-start">
                          <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Registry ID</div>
                          <div className="flex-1 min-w-0">
                            <KeriID id={selectedNode.data.registryAID} type="tel" onCopy={showToast} />
                          </div>
                        </div>
                      )}

                      {/* TEL Issuance events (iss, bis, brv) */}
                      {['iss', 'bis', 'brv'].includes(eventType) && eventData && (
                        <>
                          {eventData.i && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Credential ID</div>
                              <div className="flex-1 min-w-0">
                                <KeriID id={eventData.i} type="acdc" onCopy={showToast} />
                              </div>
                            </div>
                          )}
                          {eventData.s !== undefined && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Sequence Number</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">{eventData.s}</div>
                              </div>
                            </div>
                          )}
                          {eventData.ri && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Registry ID</div>
                              <div className="flex-1 min-w-0">
                                <KeriID id={eventData.ri} type="tel" onCopy={showToast} />
                              </div>
                            </div>
                          )}
                          {eventData.dt && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Timestamp</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">
                                  {new Date(eventData.dt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* KEL events (icp, rot) */}
                      {['icp', 'rot'].includes(eventType) && eventData && (
                        <>
                          {eventData.i && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Identifier (AID)</div>
                              <div className="flex-1 min-w-0">
                                <KeriID id={eventData.i} type="kel" onCopy={showToast} />
                              </div>
                            </div>
                          )}
                          {eventData.s !== undefined && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Sequence Number</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">{eventData.s}</div>
                              </div>
                            </div>
                          )}
                          {eventData.kt && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Signing Threshold</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">{eventData.kt}</div>
                              </div>
                            </div>
                          )}
                          {eventData.nt && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Next Threshold</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">{eventData.nt}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Registry inception (vcp) */}
                      {eventType === 'vcp' && eventData && (
                        <>
                          {eventData.i && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Registry ID</div>
                              <div className="flex-1 min-w-0">
                                <KeriID id={eventData.i} type="tel" onCopy={showToast} />
                              </div>
                            </div>
                          )}
                          {eventData.ii && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Issuer (AID)</div>
                              <div className="flex-1 min-w-0">
                                <KeriID id={eventData.ii} type="kel" onCopy={showToast} />
                              </div>
                            </div>
                          )}
                          {eventData.s !== undefined && (
                            <div className="flex gap-4 items-start">
                              <div className="text-sm font-semibold text-right whitespace-nowrap w-32 flex-shrink-0">Sequence Number</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-muted-foreground">{eventData.s}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Collapsible Raw JSON */}
                    {event && (
                      <Accordion type="single" collapsible className="border-t pt-4">
                        <AccordionItem value="raw-json" className="border-0">
                          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                            Raw Event Data (JSON)
                          </AccordionTrigger>
                          <AccordionContent>
                            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64 mt-2">
                              {JSON.stringify(event, null, 2)}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No node selected
            </div>
          )}
        </CardContent>
        </Card>

      {/* Import TEL Registry Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import TEL Registry</DialogTitle>
            <DialogDescription>
              Paste the TEL registry JSON data to import it for this identity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tel-data">TEL Registry JSON</Label>
              <Textarea
                id="tel-data"
                placeholder='{"registryAID": "...", "alias": "...", "issuerAID": "...", ...}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportData('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportConfirm}>
              Import Registry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
