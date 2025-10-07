import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { getDSL } from '@/lib/dsl';
import { VisualId } from '../ui/visual-id';
import { GraphTableView } from './GraphTableView';
import { MermaidRenderer } from './MermaidRenderer';
import { createKeriGitGraph } from '@/../../src/app/graph/keri-git-graph';
import type { Graph, GraphNode, GraphEdge } from '@/../../src/storage/types';
import type { KeritsDSL } from '@/../../src/app/dsl/types';

// Node types for the KERI graph
export type NodeKind = 'AID' | 'KEL_EVT' | 'TEL_REGISTRY' | 'TEL_EVT' | 'ACDC' | 'SCHEMA';

export interface LayoutNode {
  id: string;
  label: string;
  kind: NodeKind;
  lane: number; // vertical lane index (0 = top)
  col: number;  // time/column index (0 = left)
  meta?: any;
}

interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  kind: string;
}

// Visual constants
const laneGap = 100;
const colGap = 240;
const padX = 60;
const padY = 50;

const colors = {
  bg: 'transparent',
  grid: 'hsl(var(--border))',
  lane: 'hsl(var(--border) / 0.3)',
  aidNode: 'hsl(var(--primary))',
  kelNode: '#58a6ff',
  regNode: '#3fb950',
  telNode: '#f59e0b',
  acdcNode: '#d29922',
  schemaNode: '#a855f7',
  edge: 'hsl(var(--muted-foreground))',
  label: 'hsl(var(--foreground))',
  subtle: 'hsl(var(--muted-foreground) / 0.5)',
};

function posOf(n: LayoutNode) {
  return { x: padX + n.col * colGap, y: padY + n.lane * laneGap };
}

// Orthogonal-with-rounded-corners Bézier path
function orthoRounded(ax: number, ay: number, bx: number, by: number, r = 16) {
  if (Math.abs(by - ay) < 0.5) {
    return `M ${ax} ${ay} L ${bx} ${by}`;
  }
  const mx = ax + (bx - ax) * 0.5;
  const sgnY = Math.sign(by - ay) || 1;
  const p1x = mx - r;
  const p2y = by - sgnY * r;

  return [
    `M ${ax} ${ay}`,
    `L ${p1x} ${ay}`,
    `C ${p1x + r} ${ay}, ${mx} ${ay + sgnY * r}, ${mx} ${ay + sgnY * r}`,
    `L ${mx} ${p2y}`,
    `C ${mx} ${by}, ${mx + r} ${by}, ${mx + r} ${by}`,
    `L ${bx} ${by}`,
  ].join(' ');
}

// Convert DSL graph to commit-graph layout
function convertToCommitGraph(graph: Graph): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Group nodes by type
  const aidNodes = graph.nodes.filter(n => n.kind === 'AID');
  const kelEvents = graph.nodes.filter(n => n.kind === 'KEL_EVT');
  const registries = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY');
  const telEvents = graph.nodes.filter(n => n.kind === 'TEL_EVT');
  const acdcs = graph.nodes.filter(n => n.kind === 'ACDC');
  const schemas = graph.nodes.filter(n => n.kind === 'SCHEMA');

  // Lane 0: Main KEL (like git main branch)
  let col = 0;
  aidNodes.forEach((aid, idx) => {
    if (idx === 0) {
      nodes.push({ id: aid.id, label: aid.label || 'AID', kind: 'AID', lane: 0, col: col++, meta: aid.meta });
    }
  });

  // KEL events follow in sequence on lane 0
  const kelByAid = new Map<string, GraphNode[]>();
  kelEvents.forEach(evt => {
    const aid = evt.meta?.eventMeta?.i || evt.meta?.i;
    if (aid) {
      if (!kelByAid.has(aid)) kelByAid.set(aid, []);
      kelByAid.get(aid)!.push(evt);
    }
  });

  kelByAid.forEach((events) => {
    events.sort((a, b) => (parseInt(a.meta?.s || '0', 16)) - (parseInt(b.meta?.s || '0', 16)));
    events.forEach(evt => {
      nodes.push({ id: evt.id, label: evt.label || evt.meta?.t || 'KEL', kind: 'KEL_EVT', lane: 0, col: col++, meta: evt.meta });
    });
  });

  // Registries branch off on separate lanes (like git branches)
  let nextLane = 1;
  const registryLanes = new Map<string, number>();

  registries.forEach((reg) => {
    const lane = nextLane++;
    registryLanes.set(reg.id, lane);

    // Find the KEL event that anchors this registry
    const anchorEdge = graph.edges.find(e => e.to === reg.id && e.kind === 'ANCHOR');
    const anchorCol = anchorEdge ? nodes.find(n => n.id === anchorEdge.from)?.col ?? col : col;

    nodes.push({ id: reg.id, label: reg.label || 'Registry', kind: 'TEL_REGISTRY', lane, col: anchorCol + 1, meta: reg.meta });
  });

  // TEL events follow registries
  const telByRegistry = new Map<string, GraphNode[]>();
  telEvents.forEach(evt => {
    const ri = evt.meta?.ri;
    if (ri) {
      if (!telByRegistry.has(ri)) telByRegistry.set(ri, []);
      telByRegistry.get(ri)!.push(evt);
    }
  });

  telByRegistry.forEach((events, regId) => {
    const lane = registryLanes.get(regId) ?? nextLane++;
    const regNode = nodes.find(n => n.id === regId);
    const startCol = regNode?.col ?? col;

    events.sort((a, b) => (parseInt(a.meta?.s || '0', 16)) - (parseInt(b.meta?.s || '0', 16)));
    events.forEach((evt, idx) => {
      nodes.push({ id: evt.id, label: evt.label || evt.meta?.t || 'TEL', kind: 'TEL_EVT', lane, col: startCol + idx + 1, meta: evt.meta });
    });
  });

  // ACDCs branch off from TEL events
  acdcs.forEach((acdc) => {
    const issEdge = graph.edges.find(e => e.to === acdc.id && e.kind === 'ISSUES');
    if (issEdge) {
      const telNode = nodes.find(n => n.id === issEdge.from);
      if (telNode) {
        nodes.push({ id: acdc.id, label: acdc.label || 'ACDC', kind: 'ACDC', lane: telNode.lane, col: telNode.col + 1, meta: acdc.meta });
      }
    }
  });

  // Schemas at the end
  schemas.forEach((schema, idx) => {
    const maxCol = Math.max(...nodes.map(n => n.col));
    nodes.push({ id: schema.id, label: schema.label || 'Schema', kind: 'SCHEMA', lane: nextLane + idx, col: maxCol + 1, meta: schema.meta });
  });

  // Convert edges
  graph.edges.forEach(e => {
    edges.push({ id: e.id, from: e.from, to: e.to, kind: e.kind });
  });

  return { nodes, edges };
}

// Compute ACDC stacks for overlapping nodes
function useAcdcStacks(nodes: LayoutNode[], edges: LayoutEdge[]) {
  return useMemo(() => {
    const groups = new Map<string, LayoutNode[]>();
    nodes.filter(n => n.kind === 'ACDC').forEach(n => {
      const key = `${n.lane}|${n.col}`;
      const arr = groups.get(key) ?? [];
      arr.push(n);
      groups.set(key, arr);
    });

    const offsetMap = new Map<string, number>();
    const spines: Array<{ x: number; y1: number; y2: number }> = [];

    groups.forEach((list) => {
      list.sort((a, b) => a.id.localeCompare(b.id));
      const baseY = padY + list[0].lane * laneGap;
      const colX = padX + list[0].col * colGap;
      const sep = 32;
      const startY = baseY - ((list.length - 1) * sep) / 2;
      list.forEach((n, i) => offsetMap.set(n.id, startY + i * sep - baseY));

      const busX = colX - 100;
      spines.push({ x: busX, y1: startY, y2: startY + sep * Math.max(0, list.length - 1) });
    });

    return { offsetMap, spines };
  }, [nodes, edges]);
}

// Node rendering component
function NodeGlyph({ n, onClick }: { n: LayoutNode; onClick: () => void }) {
  const { x, y } = posOf(n);
  const fontSize = 13;

  if (n.kind === 'AID') {
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <circle cx={x} cy={y} r={16} fill={colors.aidNode} stroke={colors.aidNode} strokeWidth={4} />
        <text x={x + 24} y={y + 6} fontSize={fontSize + 2} fill={colors.label} fontWeight="700">{n.label}</text>
      </g>
    );
  }

  if (n.kind === 'KEL_EVT') {
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <circle cx={x} cy={y} r={12} fill={colors.kelNode} stroke="#1f6feb" strokeWidth={2.5} />
        <text x={x + 18} y={y + 5} fontSize={fontSize} fill={colors.label} fontWeight="600">{n.label}</text>
      </g>
    );
  }

  if (n.kind === 'TEL_REGISTRY') {
    const w = 200, h = 44, rx = 10;
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={rx} fill="#f0fdf4" stroke={colors.regNode} strokeWidth={3} className="dark:fill-green-950" />
        <text x={x} y={y + 6} fontSize={fontSize + 1} fill={colors.label} textAnchor="middle" fontWeight="600">{n.label}</text>
      </g>
    );
  }

  if (n.kind === 'TEL_EVT') {
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <circle cx={x} cy={y} r={11} fill={colors.telNode} stroke="#f59e0b" strokeWidth={2.5} />
        <text x={x + 18} y={y + 5} fontSize={fontSize} fill={colors.label} fontWeight="600">{n.label}</text>
      </g>
    );
  }

  if (n.kind === 'ACDC') {
    const w = 190, h = 36, rx = 18;
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={rx} fill="#fef3c7" stroke={colors.acdcNode} strokeWidth={2.5} className="dark:fill-yellow-950" />
        <text x={x} y={y + 6} fontSize={fontSize} fill={colors.label} textAnchor="middle" fontWeight="600">{n.label}</text>
      </g>
    );
  }

  // Schema
  const w = 180, h = 36, rx = 10;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x - w/2} y={y - h/2} width={w} height={h} rx={rx} fill="#faf5ff" stroke={colors.schemaNode} strokeWidth={2.5} className="dark:fill-purple-950" />
      <text x={x} y={y + 6} fontSize={fontSize} fill={colors.label} textAnchor="middle" fontWeight="600">{n.label}</text>
    </g>
  );
}

export function NetworkGraph() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [mermaidChart, setMermaidChart] = useState<string>('');

  useEffect(() => {
    async function loadGraph() {
      try {
        setLoading(true);
        setError(null);

        const dslInstance = await getDSL();
        setDsl(dslInstance);
        const graphData = await dslInstance.graph();

        // Build alias map from DSL
        const aliasMap = new Map<string, string>();

        // Resolve account aliases
        const accountNames = await dslInstance.accountNames();
        for (const alias of accountNames) {
          const account = await dslInstance.getAccount(alias);
          if (account) {
            aliasMap.set(account.aid, alias);
          }
        }

        // Resolve registry aliases
        for (const accountAlias of accountNames) {
          const accountDsl = await dslInstance.account(accountAlias);
          if (accountDsl) {
            const registryAliases = await accountDsl.listRegistries();
            for (const regAlias of registryAliases) {
              const registryDsl = await accountDsl.registry(regAlias);
              if (registryDsl) {
                aliasMap.set(registryDsl.registry.registryId, regAlias);

                // Resolve ACDC aliases within this registry
                const acdcAliases = await registryDsl.listACDCs();
                for (const acdcAlias of acdcAliases) {
                  const acdcDsl = await registryDsl.acdc(acdcAlias);
                  if (acdcDsl) {
                    aliasMap.set(acdcDsl.acdc.credentialId, acdcAlias);
                  }
                }
              }
            }
          }
        }

        // Resolve schema aliases
        const schemaAliases = await dslInstance.listSchemas();
        for (const schemaAlias of schemaAliases) {
          const schemaDsl = await dslInstance.schema(schemaAlias);
          if (schemaDsl) {
            aliasMap.set(schemaDsl.schema.schemaSaid, schemaAlias);
          }
        }

        // Enhance graph nodes with aliases
        graphData.nodes = graphData.nodes.map(node => ({
          ...node,
          label: aliasMap.get(node.id) || node.label || node.id.substring(0, 12),
        }));

        setGraph(graphData);

        // Generate Mermaid gitGraph
        const store = dslInstance.getStore();
        const gitGraph = createKeriGitGraph(store, dslInstance);
        const mermaid = await gitGraph.toMermaid({ includeTel: true });
        setMermaidChart(mermaid);
      } catch (err) {
        console.error('Failed to load graph:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return convertToCommitGraph(graph);
  }, [graph]);

  const { offsetMap, spines } = useAcdcStacks(nodes, edges);

  const lanes = Math.max(...nodes.map(n => n.lane), 0) + 1;
  const cols = Math.max(...nodes.map(n => n.col), 0) + 1;
  const width = padX * 2 + (cols - 1) * colGap + 200;
  const height = padY * 2 + (lanes - 1) * laneGap + 100;

  // Build position map with ACDC offsets
  const pos = new Map<string, { x: number; y: number }>(
    nodes.map(n => {
      const p = posOf(n);
      const dy = offsetMap.get(n.id) ?? 0;
      return [n.id, { x: p.x, y: p.y + dy }];
    })
  );

  // Node sizes for port calculation
  const sizes = new Map<NodeKind, { w: number; h: number }>([
    ['AID', { w: 16, h: 16 }],
    ['KEL_EVT', { w: 12, h: 12 }],
    ['TEL_REGISTRY', { w: 200, h: 44 }],
    ['TEL_EVT', { w: 11, h: 11 }],
    ['ACDC', { w: 190, h: 36 }],
    ['SCHEMA', { w: 180, h: 36 }],
  ]);

  function rightPort(n: LayoutNode) {
    const p = pos.get(n.id)!;
    const sz = sizes.get(n.kind)!;
    return { x: p.x + sz.w / 2 + 6, y: p.y };
  }

  function leftPort(n: LayoutNode) {
    const p = pos.get(n.id)!;
    const sz = sizes.get(n.kind)!;
    return { x: p.x - sz.w / 2 - 6, y: p.y };
  }

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.3), 3));
  };

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

  if (!graph || nodes.length === 0) {
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
    <Tabs defaultValue="graph" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="graph">Graph View</TabsTrigger>
        <TabsTrigger value="gitgraph">Git Graph</TabsTrigger>
        <TabsTrigger value="table">Table View</TabsTrigger>
      </TabsList>

      <TabsContent value="graph">
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Graph visualization */}
          <Card className="flex-1 overflow-hidden relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Network Graph</CardTitle>
                  <CardDescription>
                    {nodes.length} nodes, {edges.length} edges • Git-style commit graph
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetView}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
        <CardContent className="h-[calc(100%-100px)] overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            style={{ minHeight: '500px', cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Grid columns */}
              {Array.from({ length: cols }, (_, c) => (
                <line
                  key={`col-${c}`}
                  x1={padX + c * colGap}
                  y1={padY - 30}
                  x2={padX + c * colGap}
                  y2={padY + (lanes - 1) * laneGap + 30}
                  stroke={colors.grid}
                  strokeWidth={0.5}
                />
              ))}

              {/* Swim lanes */}
              {Array.from({ length: lanes }, (_, l) => (
                <line
                  key={`lane-${l}`}
                  x1={padX - 30}
                  y1={padY + l * laneGap}
                  x2={width - 30}
                  y2={padY + l * laneGap}
                  stroke={colors.lane}
                  strokeDasharray="6 8"
                  strokeWidth={1}
                />
              ))}

              {/* Edges */}
              {edges.map(e => {
                const src = nodes.find(n => n.id === e.from);
                const dst = nodes.find(n => n.id === e.to);
                if (!src || !dst) return null;

                const a = rightPort(src);
                const b = leftPort(dst);
                const d = orthoRounded(a.x, a.y, b.x, b.y, 16);

                const edgeColor =
                  e.kind === 'ISSUES' ? colors.regNode :
                  e.kind === 'REVOKES' ? '#ef4444' :
                  e.kind === 'USES_SCHEMA' ? colors.schemaNode :
                  e.kind === 'ANCHOR' ? colors.telNode :
                  e.kind === 'PRIOR' ? colors.kelNode :
                  colors.edge;

                return (
                  <path
                    key={e.id}
                    d={d}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={e.kind === 'PRIOR' ? 2.5 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.7}
                  />
                );
              })}

              {/* ACDC spines */}
              {spines.map((s, i) => (
                <line
                  key={`spine-${i}`}
                  x1={s.x}
                  y1={s.y1}
                  x2={s.x}
                  y2={s.y2}
                  stroke={colors.subtle}
                  strokeWidth={1.5}
                />
              ))}

              {/* Nodes */}
              {nodes.map(n => (
                <NodeGlyph key={n.id} n={n} onClick={() => setSelectedNode(n)} />
              ))}
            </g>
          </svg>
        </CardContent>
      </Card>

      {/* Node details panel */}
      <Card className="w-96 flex-shrink-0 overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedNode ? selectedNode.label : 'Node Details'}
          </CardTitle>
          <CardDescription>
            {selectedNode ? 'Click a different node to view its details' : 'Click a node to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-4">
              <VisualId
                label="Node ID"
                value={selectedNode.id}
                size={40}
                maxCharacters={20}
              />

              <div>
                <div className="text-sm font-semibold mb-1">Type</div>
                <div className="px-3 py-2 bg-secondary rounded text-sm font-mono">
                  {selectedNode.kind}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Position</div>
                <div className="px-3 py-2 bg-secondary rounded text-sm">
                  Lane {selectedNode.lane}, Column {selectedNode.col}
                </div>
              </div>

              {selectedNode.meta && Object.keys(selectedNode.meta).length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Metadata</div>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.meta).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-xs font-semibold text-muted-foreground min-w-[80px]">
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
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Click a node in the graph to view its details
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </TabsContent>

      <TabsContent value="gitgraph">
        <Card>
          <CardHeader>
            <CardTitle>Git Graph View</CardTitle>
            <CardDescription>
              KERI event chains visualized as git-style commit graphs
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[600px]">
            {mermaidChart ? (
              <MermaidRenderer chart={mermaidChart} className="w-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available - create identities and registries to view the git graph
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="table">
        <GraphTableView />
      </TabsContent>
    </Tabs>
  );
}
