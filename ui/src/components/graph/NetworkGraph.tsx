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
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { useStore } from '@/store/useStore';
import type { StoredIdentity, StoredCredential } from '@/lib/storage';

type GraphType = 'kel' | 'tel';

// Custom node component for KEL/TEL events
function EventNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm">{data.label}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {data.type}
        </div>
        {data.sn !== undefined && (
          <div className="text-xs text-muted-foreground">
            Sequence: {data.sn}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  event: EventNode,
};

export function NetworkGraph() {
  const { identities, credentials } = useStore();
  const [selectedIdentity, setSelectedIdentity] = useState<string>('');
  const [graphType, setGraphType] = useState<GraphType>('kel');
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
      position: { x: 250, y: 50 },
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
        position: { x: 250, y: 150 + (index * 100) },
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
      const baseX = 100 + (credIndex * 300);

      // Add credential node
      const credNodeId = `cred-${credIndex}`;
      nodes.push({
        id: credNodeId,
        type: 'event',
        position: { x: baseX, y: yOffset },
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
            position: { x: baseX, y: yOffset + 100 + (telIndex * 100) },
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
    <div className="space-y-4 h-[calc(100vh-12rem)]">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identity-select">Identity</Label>
              <Select
                id="identity-select"
                value={selectedIdentity}
                onChange={(e) => setSelectedIdentity(e.target.value)}
              >
                <option value="">Select identity...</option>
                {identities.map(identity => (
                  <option key={identity.alias} value={identity.alias}>
                    {identity.alias}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graph-type">Graph Type</Label>
              <Select
                id="graph-type"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value as GraphType)}
              >
                <option value="kel">KEL (Key Event Log)</option>
                <option value="tel">TEL (Transaction Event Log)</option>
              </Select>
            </div>

            <div className="flex items-end">
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
          </div>
        </CardContent>
      </Card>

      {/* Graph Container */}
      <div className="grid grid-rows-2 gap-4 h-full">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {graphType === 'kel' ? 'Key Event Log' : 'Transaction Event Log'}
            </CardTitle>
            <CardDescription>
              {selectedIdentity
                ? `Showing ${graphType.toUpperCase()} for ${selectedIdentity}`
                : 'Select an identity to view graph'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-5rem)]">
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
                Select an identity to view the graph
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Node Details</CardTitle>
            <CardDescription>
              {selectedNode ? 'Selected node information' : 'Click a node to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100%-5rem)]">
            {selectedNode ? (
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Event Data</div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
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
