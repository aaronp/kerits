import { useState, useCallback, useMemo } from 'react';
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
import { useStore } from '@/store/useStore';
import type { StoredIdentity, StoredCredential } from '@/lib/storage';

type GraphType = 'kel' | 'tel';

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

const nodeTypes = {
  event: EventNode,
};

export function NetworkGraph() {
  const { identities, credentials } = useStore();
  const [graphType, setGraphType] = useState<GraphType>('kel');

  // Use first identity as current user's identity
  const selectedIdentity = identities.length > 0 ? identities[0].alias : '';
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Build KEL graph for selected identity
  const kelGraph = useMemo(() => {
    if (!selectedIdentity) return { nodes: [], edges: [] };

    const identity = identities.find(i => i.alias === selectedIdentity);
    if (!identity) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add inception event
    const inceptionEvent = identity.inceptionEvent;
    nodes.push({
      id: 'inception',
      type: 'event',
      position: { x: 50, y: 150 },
      data: {
        label: `Inception (${identity.alias})`,
        type: inceptionEvent.ked?.t || 'icp',
        sn: 0,
        event: inceptionEvent,
      },
    });

    // Add rotation events
    identity.kel.forEach((event: any, index: number) => {
      const eventId = `event-${index}`;
      const prevId = index === 0 ? 'inception' : `event-${index - 1}`;

      nodes.push({
        id: eventId,
        type: 'event',
        position: { x: 300 + (index * 300), y: 150 },
        data: {
          label: `Rotation ${index + 1}`,
          type: event.ked?.t || 'rot',
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

    return { nodes, edges };
  }, [selectedIdentity, identities]);

  // Build TEL graph for credentials related to selected identity
  const telGraph = useMemo(() => {
    if (!selectedIdentity) return { nodes: [], edges: [] };

    const identity = identities.find(i => i.alias === selectedIdentity);
    if (!identity) return { nodes: [], edges: [] };

    const relatedCredentials = credentials.filter(
      c => c.issuer === identity.prefix || c.recipient === identity.prefix
    );

    if (relatedCredentials.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 50;

    relatedCredentials.forEach((credential, credIndex) => {
      const baseY = 50 + (credIndex * 200);
      let xOffset = 50;

      // Add credential node
      const credNodeId = `cred-${credIndex}`;
      nodes.push({
        id: credNodeId,
        type: 'event',
        position: { x: xOffset, y: baseY },
        data: {
          label: credential.name,
          type: 'Credential',
          event: credential,
        },
      });

      // Add TEL events
      if (credential.tel && credential.tel.length > 0) {
        credential.tel.forEach((telEvent: any, telIndex: number) => {
          const telNodeId = `tel-${credIndex}-${telIndex}`;
          const prevNodeId = telIndex === 0 ? credNodeId : `tel-${credIndex}-${telIndex - 1}`;

          nodes.push({
            id: telNodeId,
            type: 'event',
            position: { x: xOffset + 300 + (telIndex * 300), y: baseY },
            data: {
              label: telEvent.t || telEvent.ked?.t || 'TEL Event',
              type: telEvent.t || telEvent.ked?.t || 'event',
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
        });
      }
    });

    return { nodes, edges };
  }, [selectedIdentity, identities, credentials]);

  const currentGraph = graphType === 'kel' ? kelGraph : telGraph;
  const [nodes, setNodes, onNodesChange] = useNodesState(currentGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentGraph.edges);

  // Update nodes/edges when graph changes
  useMemo(() => {
    setNodes(currentGraph.nodes);
    setEdges(currentGraph.edges);
  }, [currentGraph, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-12rem)]">
      {/* Controls */}
      <Card className="flex-shrink-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Graph Type:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
                <Button
                  variant={graphType === 'kel' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGraphType('kel')}
                  className={`h-8 ${graphType === 'kel' ? 'shadow-sm' : 'hover:bg-accent'}`}
                >
                  KEL
                </Button>
                <Button
                  variant={graphType === 'tel' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGraphType('tel')}
                  className={`h-8 ${graphType === 'tel' ? 'shadow-sm' : 'hover:bg-accent'}`}
                >
                  TEL
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setTimeout(() => {
                  setNodes(currentGraph.nodes);
                  setEdges(currentGraph.edges);
                }, 0);
              }}
            >
              Reset Layout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Graph Container */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">
              {graphType === 'kel' ? 'Key Event Log' : 'Transaction Event Log'}
            </CardTitle>
            <CardDescription>
              {selectedIdentity
                ? `Showing ${graphType.toUpperCase()} for ${selectedIdentity}`
                : 'No identity found - create an identity to view graphs'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            {selectedIdentity ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                <Controls />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No identity found - create an identity to view graphs
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">Node Details</CardTitle>
            <CardDescription>
              {selectedNode ? 'Selected node information' : 'Click a node to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0">
            {selectedNode ? (
              <div className="space-y-4 pb-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Label</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.label}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Type</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.type}</div>
                  </div>

                  {selectedNode.data.sn !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Sequence Number</div>
                      <div className="text-sm text-muted-foreground">{selectedNode.data.sn}</div>
                    </div>
                  )}
                </div>

                {/* Event Fields with Human-Readable Labels */}
                {selectedNode.data.event?.ked && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="text-sm font-semibold mb-3">Event Fields</div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {selectedNode.data.event.ked.v && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Version String (v)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.v}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.t && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Message Type (t)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.t}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.d && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Self-Addressing Identifier (d)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.d}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.i && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Issuer AID (i)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.i}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.s && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Schema SAID (s)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.s}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.p && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Prior Event Digest (p)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.p}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.kt && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Keys Signing Threshold (kt)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.kt}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.k && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Signing Keys (k)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {Array.isArray(selectedNode.data.event.ked.k)
                              ? selectedNode.data.event.ked.k.join(', ')
                              : selectedNode.data.event.ked.k}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.nt && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Next Keys Threshold (nt)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {selectedNode.data.event.ked.nt}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.n && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Next Key Digests (n)</div>
                          <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                            {Array.isArray(selectedNode.data.event.ked.n)
                              ? selectedNode.data.event.ked.n.join(', ')
                              : selectedNode.data.event.ked.n}
                          </div>
                        </div>
                      )}
                      {selectedNode.data.event.ked.a && (
                        <div className="space-y-1 lg:col-span-2">
                          <div className="text-xs font-medium text-muted-foreground">Attributes (a)</div>
                          <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(selectedNode.data.event.ked.a, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Event Data */}
                <div className="space-y-2 border-t pt-4">
                  <div className="text-sm font-semibold">Raw Event Data</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedNode.data.event, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No node selected
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
