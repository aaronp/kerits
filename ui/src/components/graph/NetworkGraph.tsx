import { useState, useEffect, useCallback } from 'react';
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
import { getDSL } from '@/lib/dsl';
import { VisualId } from '../ui/visual-id';
import type { Graph, GraphNode, GraphEdge } from '@/../src/storage/types';

// Custom node components
function AIDNode({ data }: NodeProps) {
  return (
    <div className="px-6 py-4 rounded-lg border-2 border-primary bg-primary/10 shadow-lg min-w-[250px]">
      <div className="space-y-1 text-center">
        <div className="font-bold text-lg text-primary">{data.label || 'AID'}</div>
        <div className="text-xs text-muted-foreground font-mono break-all">
          {data.id?.substring(0, 24)}...
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-4 h-4" />
    </div>
  );
}

function EventNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-card-foreground">{data.label || data.kind}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {data.kind}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

function RegistryNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 shadow-md min-w-[220px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-green-700 dark:text-green-300">{data.label || 'Registry'}</div>
        <div className="text-xs text-muted-foreground">
          {data.kind}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

function ACDCNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md min-w-[220px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-blue-700 dark:text-blue-300">{data.label || 'Credential'}</div>
        <div className="text-xs text-muted-foreground">
          {data.kind}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

function SchemaNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950 shadow-md min-w-[220px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-purple-700 dark:text-purple-300">{data.label || 'Schema'}</div>
        <div className="text-xs text-muted-foreground">
          {data.kind}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  AID: AIDNode,
  KEL_EVT: EventNode,
  TEL_REGISTRY: RegistryNode,
  TEL_EVT: EventNode,
  ACDC: ACDCNode,
  SCHEMA: SchemaNode,
};

// Convert DSL graph to ReactFlow format
function convertGraphToReactFlow(graph: Graph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((node: GraphNode, index: number) => ({
    id: node.id,
    type: node.kind,
    data: {
      label: node.label,
      kind: node.kind,
      id: node.id,
      ...node.meta,
    },
    position: {
      x: (index % 5) * 300,
      y: Math.floor(index / 5) * 150,
    },
  }));

  const edges: Edge[] = graph.edges.map((edge: GraphEdge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: edge.label || edge.kind,
    type: 'smoothstep',
    animated: edge.kind === 'ANCHOR' || edge.kind === 'PRIOR',
    style: {
      stroke: edge.kind === 'ISSUES' ? '#10b981' :
              edge.kind === 'REVOKES' ? '#ef4444' :
              edge.kind === 'USES_SCHEMA' ? '#a855f7' :
              '#6b7280',
    },
  }));

  return { nodes, edges };
}

export function NetworkGraph() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    async function loadGraph() {
      try {
        setLoading(true);
        setError(null);

        const dsl = await getDSL();
        const graphData = await dsl.graph();

        setGraph(graphData);

        // Convert to ReactFlow format
        const { nodes: flowNodes, edges: flowEdges } = convertGraphToReactFlow(graphData);
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        console.error('Failed to load graph:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Loading graph...
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
            Error loading graph: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No data found - create an identity to view the network graph
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Graph visualization */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Network Graph</CardTitle>
          <CardDescription>
            {graph.nodes.length} nodes, {graph.edges.length} edges
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-100px)]">
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
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
          </ReactFlow>
        </CardContent>
      </Card>

      {/* Node details panel */}
      <Card className="w-96 flex-shrink-0 overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedNode ? selectedNode.data.label || selectedNode.data.kind : 'Node Details'}
          </CardTitle>
          <CardDescription>
            {selectedNode ? 'Click a different node to view its details' : 'Click a node to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-4">
              {/* Node ID */}
              <VisualId
                label="Node ID"
                value={selectedNode.id}
                size={40}
                maxCharacters={20}
              />

              {/* Node Type */}
              <div>
                <div className="text-sm font-semibold mb-1">Type</div>
                <div className="px-3 py-2 bg-secondary rounded text-sm font-mono">
                  {selectedNode.data.kind}
                </div>
              </div>

              {/* Metadata */}
              {selectedNode.data.meta && Object.keys(selectedNode.data.meta).length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Metadata</div>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.data.meta).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-xs font-semibold text-muted-foreground min-w-[100px]">
                          {key}:
                        </span>
                        <span className="text-xs font-mono flex-1 break-all">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected edges */}
              {(() => {
                const connectedEdges = edges.filter(
                  e => e.source === selectedNode.id || e.target === selectedNode.id
                );
                if (connectedEdges.length === 0) return null;

                return (
                  <div>
                    <div className="text-sm font-semibold mb-2">Connections ({connectedEdges.length})</div>
                    <div className="space-y-2">
                      {connectedEdges.map(edge => (
                        <div key={edge.id} className="p-2 bg-secondary rounded text-xs">
                          <div className="font-semibold mb-1">{edge.label || edge.id}</div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-mono">{edge.source.substring(0, 8)}...</span>
                            <span>→</span>
                            <span className="font-mono">{edge.target.substring(0, 8)}...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Click a node in the graph to view its details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
