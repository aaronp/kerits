import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { useStore } from '@/store/useStore';
import { getTELRegistriesByIssuer } from '@/lib/storage';
import type { StoredIdentity, TELRegistry } from '@/lib/storage';
import { useUser } from '@/lib/user-provider';

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

export function NetworkGraph() {
  const { said: saidParam } = useParams<{ said?: string }>();
  const { identities, credentials, telRefreshTrigger } = useStore();
  const { currentUser, users } = useUser();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [telRegistries, setTelRegistries] = useState<TELRegistry[]>([]);

  // Determine which SAID to display - prefer current user's identity
  const currentUserIdentity = identities.find(i =>
    i.alias.toLowerCase() === users.find(u => u.id === currentUser?.id)?.name.toLowerCase()
  );
  const displaySAID = saidParam || currentUserIdentity?.prefix || (identities.length > 0 ? identities[0].prefix : '');
  const identity = identities.find(i => i.prefix === displaySAID);

  // Load TEL registries for the displayed SAID
  useEffect(() => {
    if (!displaySAID) return;

    const loadRegistries = async () => {
      try {
        const registries = await getTELRegistriesByIssuer(displaySAID);
        console.log('NetworkGraph: Loaded TEL registries for', displaySAID, ':', registries);
        setTelRegistries(registries);
      } catch (error) {
        console.error('Failed to load TEL registries:', error);
      }
    };

    loadRegistries();
  }, [displaySAID, telRefreshTrigger]);

  // Build unified graph with SAID root, KEL, and TELs
  const unifiedGraph = useMemo(() => {
    if (!identity || !displaySAID) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root SAID node
    nodes.push({
      id: 'root-said',
      type: 'said',
      position: { x: 50, y: 400 },
      data: {
        label: identity.alias,
        prefix: identity.prefix,
      },
    });

    // KEL branch (to the right of SAID)
    const kelY = 400;
    const kelXStart = 400;

    // Inception event
    nodes.push({
      id: 'kel-inception',
      type: 'event',
      position: { x: kelXStart, y: kelY },
      data: {
        label: `Inception`,
        type: identity.inceptionEvent.ked?.t || 'icp',
        sn: 0,
        event: identity.inceptionEvent,
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

    // Rotation events
    identity.kel.forEach((event: any, index: number) => {
      const eventId = `kel-${index}`;
      const prevId = index === 0 ? 'kel-inception' : `kel-${index - 1}`;

      nodes.push({
        id: eventId,
        type: 'event',
        position: { x: kelXStart + 300 + (index * 300), y: kelY },
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

    // TEL branches (distributed above and below KEL)
    const telXStart = 400;
    const telSpacing = 250;

    console.log('NetworkGraph: Building graph with', telRegistries.length, 'TEL registries');

    telRegistries.forEach((registry, regIndex) => {
      console.log(`NetworkGraph: Processing registry ${regIndex}:`, registry.alias, 'with', registry.tel.length, 'events');
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
      // This is the source of truth - not from credentials
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

    return { nodes, edges };
  }, [identity, displaySAID, telRegistries, credentials]);

  const [nodes, setNodes, onNodesChange] = useNodesState(unifiedGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(unifiedGraph.edges);

  // Update nodes/edges when graph changes
  useMemo(() => {
    setNodes(unifiedGraph.nodes);
    setEdges(unifiedGraph.edges);
  }, [unifiedGraph, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (!identity || !displaySAID) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No identity found - create an identity to view the network graph
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-12rem)]">
      {/* Graph Container */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">
              Network Graph: {identity.alias}
            </CardTitle>
            <CardDescription>
              Showing KEL and TELs for {identity.prefix.substring(0, 32)}...
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

        {/* Detail Panel */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0 max-h-96">
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

                  {selectedNode.data.type && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Type</div>
                      <div className="text-sm text-muted-foreground">{selectedNode.data.type}</div>
                    </div>
                  )}

                  {selectedNode.data.sn !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Sequence Number</div>
                      <div className="text-sm text-muted-foreground">{selectedNode.data.sn}</div>
                    </div>
                  )}

                  {selectedNode.data.prefix && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-semibold">Prefix (AID)</div>
                      <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                        {selectedNode.data.prefix}
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Data */}
                {selectedNode.data.event && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="text-sm font-semibold">Raw Event Data</div>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                      {JSON.stringify(selectedNode.data.event, null, 2)}
                    </pre>
                  </div>
                )}
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
