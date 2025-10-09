import { useEffect, useRef, useState } from 'react';
import type { VisualizationData } from '@/lib/indexer-to-graph';

interface SocialGraphProps {
  data: VisualizationData;
  filter?: string;
  selectedNode?: string | null;
  hoveredNode?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

interface Node {
  id: string;
  identity: string;
  registry: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  sn?: number;
}

interface Edge {
  from: string;
  to: string;
  type: 'parent' | 'cross-identity';
}

interface Lane {
  identity: string;
  registry: string;
  yOffset: number;
}

interface IdentityGroup {
  identity: string;
  startY: number;
  endY: number;
  color: string;
}

const EVENT_COLORS = {
  icp: '#40c057', // inception - green
  rot: '#fab005', // rotation - yellow
  vcp: '#5c7cfa', // TEL creation - blue
  iss: '#ff6b6b', // issuance - red
  rev: '#868e96', // revocation - gray
  ixn: '#4dabf7', // interaction - light blue
  default: '#4dabf7'
};

const LANE_HEIGHT = 80;
const NODE_SPACING = 120;
const HEADER_HEIGHT = 40;
const USER_SIDEBAR_WIDTH = 80;

// Generate a color from a string (identity name)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return hslToHex(hue, 65, 92);
}

// Convert HSL to hex color
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Load custom colors from localStorage
function loadCustomColors(): Map<string, string> {
  const stored = localStorage.getItem('keri-identity-colors');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    } catch (e) {
      console.error('Failed to parse stored colors:', e);
    }
  }
  return new Map();
}

// Save custom colors to localStorage
function saveCustomColors(colors: Map<string, string>) {
  const obj = Object.fromEntries(colors);
  localStorage.setItem('keri-identity-colors', JSON.stringify(obj));
}

// Get color for identity (custom or generated)
function getIdentityColor(identity: string, customColors: Map<string, string>): string {
  return customColors.get(identity) || stringToColor(identity);
}

export default function SocialGraph({ data, filter = '', selectedNode, hoveredNode, onNodeSelect, onNodeHover }: SocialGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [collapsedIdentities, setCollapsedIdentities] = useState<Set<string>>(new Set());
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<Map<string, string>>(() => loadCustomColors());
  const [colorPickerIdentity, setColorPickerIdentity] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { nodes, edges, lanes } = parseKeriData(data);
    const { filteredNodes, filteredEdges, matchingNodeIds } = applyFilter(nodes, edges, filter);

    // Filter out lanes that have no visible nodes
    let filteredLanes = lanes.filter(lane =>
      filteredNodes.some(node => node.identity === lane.identity && node.registry === lane.registry)
    );

    // Filter out lanes for collapsed identities
    filteredLanes = filteredLanes.filter(lane => !collapsedIdentities.has(lane.identity));

    // Filter out nodes for collapsed identities
    const visibleNodes = filteredNodes.filter(node => !collapsedIdentities.has(node.identity));
    const visibleEdges = filteredEdges.filter(edge => {
      const fromNode = visibleNodes.find(n => n.id === edge.from);
      const toNode = visibleNodes.find(n => n.id === edge.to);
      return fromNode && toNode;
    });

    // Recalculate lane positions after filtering
    const reindexedLanes = filteredLanes.map((lane, idx) => ({
      ...lane,
      yOffset: HEADER_HEIGHT + idx * LANE_HEIGHT
    }));

    // Update node Y positions based on new lane positions
    const reindexedNodes = visibleNodes.map(node => {
      const newLane = reindexedLanes.find(l => l.identity === node.identity && l.registry === node.registry);
      return {
        ...node,
        y: newLane ? newLane.yOffset + LANE_HEIGHT * 0.35 : node.y
      };
    });

    // Create identity groups for the sidebar and add collapsed lanes
    const identityGroups: IdentityGroup[] = [];
    const displayLanes: Lane[] = [];
    const identities = [...new Set(lanes.map(l => l.identity))]; // Use original lanes to show all identities

    let currentY = HEADER_HEIGHT;
    identities.forEach(identity => {
      const identityLanes = reindexedLanes.filter(l => l.identity === identity);
      if (identityLanes.length > 0) {
        // Expanded - add all lanes
        identityLanes.forEach(lane => {
          displayLanes.push({ ...lane, yOffset: currentY });
          currentY += LANE_HEIGHT;
        });
        identityGroups.push({
          identity,
          startY: displayLanes[displayLanes.length - identityLanes.length].yOffset,
          endY: currentY,
          color: getIdentityColor(identity, customColors)
        });
      } else if (collapsedIdentities.has(identity)) {
        // Collapsed - add a single slim lane
        const collapsedLane: Lane = {
          identity,
          registry: '(collapsed)',
          yOffset: currentY
        };
        displayLanes.push(collapsedLane);
        identityGroups.push({
          identity,
          startY: currentY,
          endY: currentY + 40, // Collapsed height
          color: getIdentityColor(identity, customColors)
        });
        currentY += 40;
      }
    });

    // Update node positions based on display lanes
    const finalNodes = reindexedNodes.map(node => {
      const displayLane = displayLanes.find(l => l.identity === node.identity && l.registry === node.registry);
      return {
        ...node,
        y: displayLane ? displayLane.yOffset + LANE_HEIGHT * 0.35 : node.y
      };
    });

    renderGraph(canvasRef.current, finalNodes, visibleEdges, displayLanes, identityGroups, selectedNode, hoveredNode, hoveredLane, matchingNodeIds, collapsedIdentities, customColors, setCollapsedIdentities, setCustomColors, setHoveredLane, setColorPickerIdentity, onNodeSelect, onNodeHover);
  }, [data, filter, selectedNode, hoveredNode, hoveredLane, collapsedIdentities, customColors, onNodeSelect, onNodeHover]);

  // Handle color picker change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (colorPickerIdentity) {
      const newColor = e.target.value;
      const newColors = new Map(customColors);
      newColors.set(colorPickerIdentity, newColor);
      setCustomColors(newColors);
      saveCustomColors(newColors);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: 'hsl(var(--background))', position: 'relative' }}>
      <div ref={canvasRef} />

      {/* Hidden color picker */}
      {colorPickerIdentity && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'hsl(var(--background))',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          border: '1px solid hsl(var(--border))'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Choose color for {colorPickerIdentity}
          </div>
          <input
            ref={colorPickerRef}
            type="color"
            value={getIdentityColor(colorPickerIdentity, customColors)}
            onChange={handleColorChange}
            style={{ width: '100%', height: '50px', cursor: 'pointer' }}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setColorPickerIdentity(null)}
              style={{
                flex: 1,
                padding: '8px',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
            <button
              onClick={() => {
                if (colorPickerIdentity) {
                  const newColors = new Map(customColors);
                  newColors.delete(colorPickerIdentity);
                  setCustomColors(newColors);
                  saveCustomColors(newColors);
                  setColorPickerIdentity(null);
                }
              }}
              style={{
                flex: 1,
                padding: '8px',
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {colorPickerIdentity && (
        <div
          onClick={() => setColorPickerIdentity(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

function applyFilter(
  nodes: Node[],
  edges: Edge[],
  filter: string
): {
  filteredNodes: Node[];
  filteredEdges: Edge[];
  matchingNodeIds: Set<string>;
} {
  if (!filter.trim()) {
    return { filteredNodes: nodes, filteredEdges: edges, matchingNodeIds: new Set() };
  }

  const filterLower = filter.toLowerCase();
  const matchingNodes = new Set<string>();
  const nodesToInclude = new Set<string>();

  // Find nodes matching the filter
  nodes.forEach(node => {
    const matches =
      node.id.toLowerCase().includes(filterLower) ||
      node.label?.toLowerCase().includes(filterLower) ||
      node.type.toLowerCase().includes(filterLower) ||
      node.registry.toLowerCase().includes(filterLower);

    if (matches) {
      matchingNodes.add(node.id);
      nodesToInclude.add(node.id);
    }
  });

  // Include all ancestors (parents) of matching nodes
  const addAncestors = (nodeId: string) => {
    const parentEdges = edges.filter(e => e.to === nodeId && e.type === 'parent');
    parentEdges.forEach(edge => {
      if (!nodesToInclude.has(edge.from)) {
        nodesToInclude.add(edge.from);
        addAncestors(edge.from);
      }
    });
  };

  matchingNodes.forEach(nodeId => addAncestors(nodeId));

  const filteredNodes = nodes.filter(n => nodesToInclude.has(n.id));
  const filteredEdges = edges.filter(e => nodesToInclude.has(e.from) && nodesToInclude.has(e.to));

  return { filteredNodes, filteredEdges, matchingNodeIds: matchingNodes };
}

function parseKeriData(data: VisualizationData): { nodes: Node[]; edges: Edge[]; lanes: Lane[] } {
  if (!data || !data.identities || !Array.isArray(data.identities)) {
    return { nodes: [], edges: [], lanes: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lanes: Lane[] = [];

  let currentYOffset = HEADER_HEIGHT;

  data.identities.forEach((identity) => {
    const identityName = identity.alias || identity.prefix?.substring(0, 8) || 'Unknown';
    const events = identity.events || [];

    // Track x position for this identity (all events move forward in time)
    let identityXPosition = 200;

    // Group events by registry
    const registryGroups = new Map<string, any[]>();
    events.forEach((event) => {
      const registry = event.registry || 'KEL';
      if (!registryGroups.has(registry)) {
        registryGroups.set(registry, []);
      }
      registryGroups.get(registry)!.push(event);
    });

    // Create lanes for each registry
    const sortedRegistries = Array.from(registryGroups.keys()).sort((a, b) => {
      // KEL always first
      if (a === 'KEL') return -1;
      if (b === 'KEL') return 1;

      // Sort by hierarchical path (lexicographic)
      return a.localeCompare(b);
    });

    sortedRegistries.forEach(registry => {
      lanes.push({
        identity: identityName,
        registry,
        yOffset: currentYOffset
      });

      const registryEvents = registryGroups.get(registry)!;
      registryEvents.forEach((event) => {
        const node: Node = {
          id: event.id,
          identity: identityName,
          registry,
          type: event.type || 'unknown',
          x: identityXPosition,
          y: currentYOffset + LANE_HEIGHT * 0.35,
          label: event.label || event.type,
          sn: event.sn
        };
        nodes.push(node);

        // Advance x position for next event
        identityXPosition += NODE_SPACING;

        // Add parent edge
        if (event.parent) {
          edges.push({
            from: event.parent,
            to: node.id,
            type: 'parent'
          });
        }

        // Add links (cross-identity or registry creation links)
        if (event.links && Array.isArray(event.links)) {
          event.links.forEach((linkId: string) => {
            // Check if the target node belongs to the same identity
            const targetEvent = data.identities
              .flatMap((id) => id.events || [])
              .find((e) => e.id === linkId);

            const isSameIdentity = targetEvent &&
              data.identities.some((id) =>
                id.events?.some((e) => e.id === node.id) &&
                id.events?.some((e) => e.id === linkId)
              );

            edges.push({
              from: node.id,
              to: linkId,
              type: isSameIdentity ? 'parent' : 'cross-identity'
            });
          });
        }
      });

      currentYOffset += LANE_HEIGHT;
    });
  });

  return { nodes, edges, lanes };
}

function renderGraph(
  container: HTMLDivElement,
  nodes: Node[],
  edges: Edge[],
  lanes: Lane[],
  identityGroups: IdentityGroup[],
  selectedNode?: string | null,
  hoveredNode?: string | null,
  hoveredLane?: string | null,
  matchingNodeIds?: Set<string>,
  collapsedIdentities?: Set<string>,
  customColors?: Map<string, string>,
  setCollapsedIdentities?: (fn: (prev: Set<string>) => Set<string>) => void,
  setCustomColors?: (colors: Map<string, string>) => void,
  setHoveredLane?: (laneKey: string | null) => void,
  setColorPickerIdentity?: (identity: string | null) => void,
  onNodeSelect?: (nodeId: string | null) => void,
  onNodeHover?: (nodeId: string | null) => void
) {
  // Check if we have any data at all
  if (nodes.length === 0 && lanes.length === 0 && identityGroups.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; color: hsl(var(--muted-foreground));">No valid data. Expected format: { identities: [{ prefix, alias, events: [...] }] }</div>';
    return;
  }

  const width = Math.max(1400, nodes.length > 0 ? Math.max(...nodes.map(n => n.x)) + 200 + USER_SIDEBAR_WIDTH : 800);
  const height = lanes.length > 0 ? lanes[lanes.length - 1].yOffset + (lanes[lanes.length - 1].registry === '(collapsed)' ? 40 : LANE_HEIGHT) + 20 : 200;

  const svg = `
    <svg width="${width}" height="${height}" style="font-family: system-ui, sans-serif; cursor: default;">
      <!-- User sidebar sections -->
      ${identityGroups.map(group => {
        const isCollapsed = collapsedIdentities?.has(group.identity);
        const height = group.endY - group.startY;
        return `
        <g class="user-sidebar" data-identity="${group.identity}" style="cursor: pointer;">
          <rect x="0" y="${group.startY}" width="${USER_SIDEBAR_WIDTH}" height="${height}"
                fill="${group.color}"
                stroke="hsl(var(--border))"
                stroke-width="1" />
          <text x="${USER_SIDEBAR_WIDTH / 2}" y="${group.startY + height / 2}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="13"
                font-weight="600"
                fill="hsl(var(--foreground))">
            ${group.identity}
          </text>
          <text x="${USER_SIDEBAR_WIDTH - 10}" y="${group.startY + 15}"
                text-anchor="end"
                font-size="10"
                fill="hsl(var(--muted-foreground))">
            ${isCollapsed ? '▶' : '▼'}
          </text>
        </g>
      `;
      }).join('')}

      <!-- Lane backgrounds and labels -->
      ${lanes.map((lane, idx) => {
        const isCollapsed = lane.registry === '(collapsed)';
        const laneKey = `${lane.identity}-${lane.registry}`;
        const isHovered = hoveredLane === laneKey;

        const identityGroup = identityGroups.find(g => g.identity === lane.identity);
        const baseColor = identityGroup?.color || '#e0e0e0';

        // Adjust lightness for alternating rows
        const lightnessAdjust = idx % 2 === 0 ? 0 : -0.04;
        const laneHeight = isCollapsed ? 40 : LANE_HEIGHT;

        const indent = lane.registry === 'KEL' ? 0 : 10 + (lane.registry.split('/').length - 1) * 15;

        if (isCollapsed) {
          return `
          <g class="lane-group" data-lane-key="${laneKey}" style="cursor: default;">
            <rect x="${USER_SIDEBAR_WIDTH}" y="${lane.yOffset}" width="${width - USER_SIDEBAR_WIDTH}" height="${laneHeight}"
                  fill="${baseColor}"
                  stroke="hsl(var(--border))" stroke-width="1"
                  opacity="0.6" />
            <text x="${USER_SIDEBAR_WIDTH + 10}" y="${lane.yOffset + laneHeight / 2}"
                  font-size="11"
                  dominant-baseline="middle"
                  fill="hsl(var(--muted-foreground))"
                  font-style="italic"
                  pointer-events="none">
              (${lane.identity} collapsed - click sidebar to expand)
            </text>
          </g>
        `;
        }

        return `
        <g class="lane-group" data-lane-key="${laneKey}" style="cursor: default;">
          <rect x="${USER_SIDEBAR_WIDTH}" y="${lane.yOffset}" width="${width - USER_SIDEBAR_WIDTH}" height="${laneHeight}"
                fill="${baseColor}"
                stroke="hsl(var(--border))" stroke-width="1"
                opacity="${isHovered ? 0.9 : 0.7}" />
          <text x="${USER_SIDEBAR_WIDTH + 10 + indent}" y="${lane.yOffset + laneHeight / 2}"
                font-size="10"
                dominant-baseline="middle"
                fill="hsl(var(--foreground))"
                font-family="monospace"
                pointer-events="none">
            ${lane.registry}
          </text>
        </g>
      `;
      }).join('')}

      <!-- Edges -->
      ${(() => {
        // Deduplicate cross-identity edges (keep only one direction)
        const seenCrossEdges = new Set<string>();
        return edges.map(edge => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return '';

          const isCrossIdentity = edge.type === 'cross-identity' || fromNode.identity !== toNode.identity;

          // For cross-identity edges, deduplicate by creating a canonical key
          if (isCrossIdentity) {
            const edgeKey = [edge.from, edge.to].sort().join('->');
            if (seenCrossEdges.has(edgeKey)) {
              return ''; // Skip duplicate
            }
            seenCrossEdges.add(edgeKey);
          }

          const color = isCrossIdentity ? '#ff6b6b' : '#868e96';
          const strokeWidth = isCrossIdentity ? 2.5 : 2;
          const dashArray = isCrossIdentity ? '5,3' : 'none';

          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;

          const controlPointOffset = Math.max(Math.abs(dx) / 2, 60);
          const cp1x = fromNode.x + controlPointOffset;
          const cp1y = fromNode.y;
          const cp2x = toNode.x - controlPointOffset;
          const cp2y = toNode.y;

          const path = `M ${fromNode.x} ${fromNode.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toNode.x} ${toNode.y}`;

          return `
            <path d="${path}"
                  stroke="${color}"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${dashArray}"
                  fill="none"
                  opacity="${isCrossIdentity ? 0.7 : 0.5}"
                  marker-end="url(#arrowhead-${isCrossIdentity ? 'cross' : 'normal'})" />
          `;
        }).join('');
      })()}

      <!-- Arrow markers -->
      <defs>
        <marker id="arrowhead-normal" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#868e96" opacity="0.4" />
        </marker>
        <marker id="arrowhead-cross" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#ff6b6b" opacity="0.7" />
        </marker>
      </defs>

      <!-- Nodes -->
      ${nodes.map(node => {
        const color = EVENT_COLORS[node.type as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const isMatching = matchingNodeIds?.has(node.id) || false;
        const radius = isSelected ? 12 : (isHovered ? 11 : 10);
        const strokeWidth = isSelected ? 3 : 2;

        return `
        <g class="node-group" data-node-id="${node.id}" style="cursor: pointer;">
          ${isMatching ? `<rect x="${node.x - 40}" y="${node.y - 35}" width="80" height="70"
                  fill="#fff3cd"
                  stroke="#ffc107"
                  stroke-width="2"
                  rx="4"
                  opacity="0.8" />` : ''}

          ${isSelected && !isMatching ? `<rect x="${node.x - 45}" y="${node.y - 40}" width="90" height="80"
                  fill="transparent"
                  stroke="hsl(var(--primary))"
                  stroke-width="3"
                  rx="6"
                  opacity="0.6"
                  stroke-dasharray="8,4" />` : ''}

          <circle cx="${node.x}" cy="${node.y}" r="${radius + 8}"
                  fill="transparent"
                  stroke="none" />

          <circle cx="${node.x}" cy="${node.y}" r="${radius}"
                  fill="${color}"
                  stroke="${isSelected ? 'hsl(var(--primary))' : (isMatching ? '#ffc107' : color)}"
                  stroke-width="${isMatching ? 3 : strokeWidth}"
                  opacity="${isHovered && !isSelected ? 1 : 0.9}" />

          ${isSelected ? `<circle cx="${node.x}" cy="${node.y}" r="${radius + 4}"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  stroke-width="2"
                  opacity="0.5" />` : ''}

          ${isHovered && !isSelected ? `<circle cx="${node.x}" cy="${node.y}" r="${radius + 3}"
                  fill="none"
                  stroke="${color}"
                  stroke-width="1.5"
                  opacity="0.5" />` : ''}

          <text x="${node.x}" y="${node.y + radius + 14}"
                text-anchor="middle"
                font-size="10"
                fill="hsl(var(--foreground))"
                font-weight="${isHovered || isSelected ? '600' : 'normal'}"
                pointer-events="none">
            ${node.label || node.type}
          </text>

          <text x="${node.x}" y="${node.y + radius + 26}"
                text-anchor="middle"
                font-size="9"
                fill="hsl(var(--muted-foreground))"
                pointer-events="none">
            sn:${node.sn ?? '?'}
          </text>
        </g>
      `;
      }).join('')}
    </svg>
  `;

  container.innerHTML = svg;

  // Add event handlers
  const userSidebars = container.querySelectorAll('.user-sidebar');
  userSidebars.forEach(sidebar => {
    const identity = sidebar.getAttribute('data-identity');
    if (identity) {
      if (setCollapsedIdentities) {
        sidebar.addEventListener('click', (e) => {
          e.stopPropagation();
          setCollapsedIdentities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(identity)) {
              newSet.delete(identity);
            } else {
              newSet.add(identity);
            }
            return newSet;
          });
        });
      }

      if (setColorPickerIdentity) {
        sidebar.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setColorPickerIdentity(identity);
        });
      }
    }
  });

  const laneGroups = container.querySelectorAll('.lane-group');
  laneGroups.forEach(lane => {
    const laneKey = lane.getAttribute('data-lane-key');
    if (laneKey && setHoveredLane) {
      lane.addEventListener('mouseenter', () => {
        setHoveredLane(laneKey);
      });
      lane.addEventListener('mouseleave', () => {
        setHoveredLane(null);
      });
    }
  });

  const nodeGroups = container.querySelectorAll('.node-group');
  nodeGroups.forEach(group => {
    const nodeId = group.getAttribute('data-node-id');
    if (nodeId) {
      if (onNodeSelect) {
        group.addEventListener('click', (e) => {
          e.stopPropagation();
          onNodeSelect(nodeId === selectedNode ? null : nodeId);
        });
      }

      if (onNodeHover) {
        group.addEventListener('mouseenter', () => {
          onNodeHover(nodeId);
        });
        group.addEventListener('mouseleave', () => {
          onNodeHover(null);
        });
      }
    }
  });

  const svgElement = container.querySelector('svg');
  if (svgElement && onNodeSelect) {
    svgElement.addEventListener('click', () => {
      onNodeSelect(null);
    });
  }
}
