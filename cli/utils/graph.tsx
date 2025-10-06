/**
 * Graph visualization utilities using Ink
 */
import React, { useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import type { Graph } from '../../src/storage/index.js';
import dagre from 'dagre';

interface GraphViewProps {
  graph: Graph;
  title: string;
  onExit: () => void;
}

const NODE_COLORS: Record<string, string> = {
  AID: 'cyan',
  KEL_EVT: 'green',
  TEL_REGISTRY: 'magenta',
  TEL_EVT: 'yellow',
  ACDC: 'blue',
  SCHEMA: 'gray',
};

function computeLayout(graph: Graph, direction: 'TB' | 'LR' = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 3,
    ranksep: 2,
    marginx: 2,
    marginy: 1,
  });

  // Add nodes
  graph.nodes.forEach(node => {
    const label = node.label || node.id.substring(0, 12);
    const width = Math.max(label.length + 4, 12);
    const height = 3;
    g.setNode(node.id, { label, width, height, kind: node.kind });
  });

  // Add edges
  graph.edges.forEach(edge => {
    g.setEdge(edge.from, edge.to, { label: edge.label });
  });

  // Compute layout
  dagre.layout(g);

  // Extract layout
  const nodes = graph.nodes.map(node => {
    const n = g.node(node.id);
    return {
      ...node,
      x: Math.round(n.x),
      y: Math.round(n.y),
      width: n.width,
      height: n.height,
    };
  });

  return { nodes, edges: graph.edges };
}

function GraphView({ graph, title, onExit }: GraphViewProps) {
  useInput((input, key) => {
    onExit();
  });

  const { nodes } = computeLayout(graph);

  // Find canvas bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    const halfWidth = Math.floor(node.width! / 2);
    const halfHeight = Math.floor(node.height! / 2);
    minX = Math.min(minX, node.x! - halfWidth);
    minY = Math.min(minY, node.y! - halfHeight);
    maxX = Math.max(maxX, node.x! + halfWidth);
    maxY = Math.max(maxY, node.y! + halfHeight);
  });

  const canvasWidth = maxX - minX + 4;
  const canvasHeight = maxY - minY + 4;

  // Create canvas
  const canvas: string[][] = Array(canvasHeight)
    .fill(0)
    .map(() => Array(canvasWidth).fill(' '));

  // Draw boxes
  nodes.forEach(node => {
    const x = node.x! - minX + 2;
    const y = node.y! - minY + 2;
    const w = node.width!;
    const h = node.height!;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    const label = node.label || node.id.substring(0, 12);
    const labelPadded = label.padStart(Math.floor((w + label.length) / 2)).padEnd(w);

    // Top border
    canvas[y - halfH][x - halfW] = '╭';
    for (let i = 1; i < w - 1; i++) {
      canvas[y - halfH][x - halfW + i] = '─';
    }
    canvas[y - halfH][x + halfW - 1] = '╮';

    // Middle (label)
    canvas[y][x - halfW] = '│';
    for (let i = 0; i < labelPadded.length && i < w - 2; i++) {
      canvas[y][x - halfW + 1 + i] = labelPadded[i];
    }
    canvas[y][x + halfW - 1] = '│';

    // Bottom border
    canvas[y + halfH][x - halfW] = '╰';
    for (let i = 1; i < w - 1; i++) {
      canvas[y + halfH][x - halfW + i] = '─';
    }
    canvas[y + halfH][x + halfW - 1] = '╯';
  });

  // Render canvas
  const lines = canvas.map(row => row.join(''));

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      <Box flexDirection="column">
        {lines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press any key to return...</Text>
      </Box>
    </Box>
  );
}

/**
 * Show a graph visualization in Ink
 * Returns a promise that resolves when the user exits
 */
export async function showGraph(graph: Graph, title: string): Promise<void> {
  return new Promise(resolve => {
    const { unmount } = render(
      <GraphView graph={graph} title={title} onExit={() => {
        unmount();
        resolve();
      }} />
    );
  });
}
