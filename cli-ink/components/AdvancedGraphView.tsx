import React from 'react';
import { Box, Text } from 'ink';
import dagre from 'dagre';
import type { Graph, GraphNode, GraphEdge } from '../../src/storage/types';

interface AdvancedGraphViewProps {
  graph: Graph;
  title?: string;
  direction?: 'TB' | 'LR'; // Top-to-bottom or Left-to-right
}

interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface LayoutEdge {
  from: string;
  to: string;
  label?: string;
  points: Array<{ x: number; y: number }>;
}

// Node colors
const NODE_COLORS: Record<string, string> = {
  AID: 'cyan',
  KEL_EVT: 'green',
  TEL_REGISTRY: 'magenta',
  TEL_EVT: 'yellow',
  ACDC: 'blue',
  SCHEMA: 'gray',
};

export const AdvancedGraphView: React.FC<AdvancedGraphViewProps> = ({
  graph,
  title = 'Graph Layout',
  direction = 'TB',
}) => {
  const layout = React.useMemo(() => computeLayout(graph, direction), [graph, direction]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {/* Render the graph */}
      <Box flexDirection="column" borderStyle="round" borderColor="gray">
        <GraphCanvas layout={layout} />
      </Box>

      {/* Legend */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          Legend: {Object.entries(NODE_COLORS)
            .map(([kind, color]) => `${kind}`)
            .join(' | ')}
        </Text>
      </Box>
    </Box>
  );
};

function computeLayout(graph: Graph, direction: 'TB' | 'LR'): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
} {
  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 3,
    ranksep: 2,
    marginx: 2,
    marginy: 1,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  graph.nodes.forEach(node => {
    const label = node.label || node.id.substring(0, 12);
    const width = Math.max(label.length + 4, 12);
    const height = 3;

    g.setNode(node.id, {
      label,
      width,
      height,
      kind: node.kind,
    });
  });

  // Add edges
  graph.edges.forEach(edge => {
    g.setEdge(edge.from, edge.to, {
      label: edge.label,
    });
  });

  // Compute layout
  dagre.layout(g);

  // Extract layout
  const nodes: LayoutNode[] = g.nodes().map(nodeId => {
    const node = g.node(nodeId);
    const originalNode = graph.nodes.find(n => n.id === nodeId)!;

    return {
      id: nodeId,
      label: node.label,
      x: Math.round(node.x - node.width / 2),
      y: Math.round(node.y - node.height / 2),
      width: node.width,
      height: node.height,
      color: NODE_COLORS[originalNode.kind || 'UNKNOWN'] || 'white',
    };
  });

  const edges: LayoutEdge[] = g.edges().map(e => {
    const edge = g.edge(e);
    return {
      from: e.v,
      to: e.w,
      label: edge.label,
      points: edge.points || [],
    };
  });

  // Compute canvas size
  const maxX = Math.max(...nodes.map(n => n.x + n.width)) + 2;
  const maxY = Math.max(...nodes.map(n => n.y + n.height)) + 2;

  return {
    nodes,
    edges,
    width: maxX,
    height: maxY,
  };
}

interface GraphCanvasProps {
  layout: ReturnType<typeof computeLayout>;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ layout }) => {
  const { nodes, edges, width, height } = layout;

  // Create ASCII canvas
  const canvas: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(' '));

  // Draw edges first (so they appear behind nodes)
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (fromNode && toNode) {
      // Draw simple line from center of from node to center of to node
      const x1 = Math.round(fromNode.x + fromNode.width / 2);
      const y1 = Math.round(fromNode.y + fromNode.height / 2);
      const x2 = Math.round(toNode.x + toNode.width / 2);
      const y2 = Math.round(toNode.y + toNode.height / 2);

      drawLine(canvas, x1, y1, x2, y2);
    }
  });

  // Draw nodes
  nodes.forEach(node => {
    drawBox(canvas, node.x, node.y, node.width, node.height, node.label);
  });

  // Render canvas
  return (
    <Box flexDirection="column" padding={1}>
      {canvas.map((row, y) => (
        <Text key={y}>{row.join('')}</Text>
      ))}
    </Box>
  );
};

function drawBox(
  canvas: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  label: string
) {
  if (y < 0 || y >= canvas.length) return;

  // Top border
  if (y >= 0 && y < canvas.length) {
    for (let i = 0; i < width && x + i < canvas[y].length; i++) {
      canvas[y][x + i] = i === 0 ? '╭' : i === width - 1 ? '╮' : '─';
    }
  }

  // Middle with label
  const midY = y + Math.floor(height / 2);
  if (midY >= 0 && midY < canvas.length) {
    const labelPadded = label.padStart(Math.floor(width / 2) + Math.floor(label.length / 2)).padEnd(width - 2);
    for (let i = 0; i < width && x + i < canvas[midY].length; i++) {
      if (i === 0) {
        canvas[midY][x + i] = '│';
      } else if (i === width - 1) {
        canvas[midY][x + i] = '│';
      } else {
        canvas[midY][x + i] = labelPadded[i - 1] || ' ';
      }
    }
  }

  // Bottom border
  const bottomY = y + height - 1;
  if (bottomY >= 0 && bottomY < canvas.length) {
    for (let i = 0; i < width && x + i < canvas[bottomY].length; i++) {
      canvas[bottomY][x + i] = i === 0 ? '╰' : i === width - 1 ? '╯' : '─';
    }
  }

  // Sides
  for (let row = y + 1; row < y + height - 1 && row < canvas.length; row++) {
    if (row >= 0 && row !== midY) {
      if (x >= 0 && x < canvas[row].length) canvas[row][x] = '│';
      if (x + width - 1 >= 0 && x + width - 1 < canvas[row].length)
        canvas[row][x + width - 1] = '│';
    }
  }
}

function drawLine(canvas: string[][], x1: number, y1: number, x2: number, y2: number) {
  // Bresenham's line algorithm
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  while (true) {
    // Draw point (avoid overwriting boxes)
    if (y >= 0 && y < canvas.length && x >= 0 && x < canvas[y].length) {
      if (canvas[y][x] === ' ') {
        // Determine line character based on direction
        if (dx > dy) {
          canvas[y][x] = '─';
        } else {
          canvas[y][x] = '│';
        }
      }
    }

    if (x === x2 && y === y2) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  // Add arrow at end
  if (y2 >= 0 && y2 < canvas.length && x2 >= 0 && x2 < canvas[y2].length) {
    if (canvas[y2][x2] === ' ') {
      canvas[y2][x2] = '▶';
    }
  }
}
