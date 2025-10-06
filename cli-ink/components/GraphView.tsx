import React from 'react';
import { Box, Text } from 'ink';
import type { Graph, GraphNode, GraphEdge } from '../../src/storage/types';

interface GraphViewProps {
  graph: Graph;
  title?: string;
}

// Node type colors
const NODE_COLORS: Record<string, string> = {
  AID: 'cyan',
  KEL_EVT: 'green',
  TEL_REGISTRY: 'magenta',
  TEL_EVT: 'yellow',
  ACDC: 'blue',
  SCHEMA: 'gray',
};

// Edge type symbols
const EDGE_SYMBOLS: Record<string, string> = {
  PRIOR: '→',
  ANCHOR: '⚓',
  ISSUES: '📜',
  REVOKES: '❌',
  REFS: '🔗',
  USES_SCHEMA: '📋',
};

export const GraphView: React.FC<GraphViewProps> = ({ graph, title = 'KERI Graph' }) => {
  // Group nodes by kind
  const nodesByKind = graph.nodes.reduce((acc, node) => {
    const kind = node.kind || 'UNKNOWN';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(node);
    return acc;
  }, {} as Record<string, GraphNode[]>);

  // Group edges by kind
  const edgesByKind = graph.edges.reduce((acc, edge) => {
    const kind = edge.kind || 'UNKNOWN';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(edge);
    return acc;
  }, {} as Record<string, GraphEdge[]>);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="white">
          {title}
        </Text>
      </Box>

      {/* Node Summary */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Nodes ({graph.nodes.length}):
        </Text>
        {Object.entries(nodesByKind).map(([kind, nodes]) => (
          <Box key={kind} marginLeft={2}>
            <Text color={NODE_COLORS[kind] || 'white'}>
              • {kind}: {nodes.length}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Edge Summary */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Edges ({graph.edges.length}):
        </Text>
        {Object.entries(edgesByKind).map(([kind, edges]) => (
          <Box key={kind} marginLeft={2}>
            <Text color="gray">
              {EDGE_SYMBOLS[kind] || '→'} {kind}: {edges.length}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Visual Graph Representation */}
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" padding={1}>
        <Text bold color="cyan">
          Graph Structure:
        </Text>
        {renderGraphStructure(graph)}
      </Box>
    </Box>
  );
};

function renderGraphStructure(graph: Graph): JSX.Element {
  const { nodes, edges } = graph;

  // Find root nodes (nodes with no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.to));
  const rootNodes = nodes.filter(n => !incomingEdges.has(n.id));

  if (rootNodes.length === 0 && nodes.length > 0) {
    // No clear root, use first node
    rootNodes.push(nodes[0]);
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      {rootNodes.map((root, idx) => (
        <Box key={root.id} flexDirection="column">
          {renderNode(root, graph, new Set(), 0)}
          {idx < rootNodes.length - 1 && <Text> </Text>}
        </Box>
      ))}
    </Box>
  );
}

function renderNode(
  node: GraphNode,
  graph: Graph,
  visited: Set<string>,
  depth: number,
  maxDepth: number = 3
): JSX.Element | null {
  if (visited.has(node.id) || depth > maxDepth) {
    return null;
  }

  visited.add(node.id);
  const indent = '  '.repeat(depth);
  const color = NODE_COLORS[node.kind || 'UNKNOWN'] || 'white';

  // Find outgoing edges
  const outgoingEdges = graph.edges.filter(e => e.from === node.id);

  return (
    <Box key={node.id} flexDirection="column">
      <Text color={color}>
        {indent}
        {depth > 0 ? '└─ ' : ''}
        {node.kind} {node.label ? `"${node.label}"` : node.id.substring(0, 12)}
      </Text>
      {outgoingEdges.map(edge => {
        const targetNode = graph.nodes.find(n => n.id === edge.to);
        if (!targetNode) return null;

        const symbol = EDGE_SYMBOLS[edge.kind || 'UNKNOWN'] || '→';
        return (
          <Box key={edge.id} flexDirection="column">
            <Text color="gray">
              {indent}  {symbol} {edge.label || edge.kind}
            </Text>
            {renderNode(targetNode, graph, new Set(visited), depth + 1, maxDepth)}
          </Box>
        );
      })}
    </Box>
  );
}

// Compact tree view
export const CompactGraphView: React.FC<GraphViewProps> = ({ graph, title }) => {
  const aidCount = graph.nodes.filter(n => n.kind === 'AID').length;
  const kelCount = graph.nodes.filter(n => n.kind === 'KEL_EVT').length;
  const registryCount = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY').length;
  const credCount = graph.nodes.filter(n => n.kind === 'ACDC').length;

  return (
    <Box flexDirection="column">
      <Text bold>{title || 'Graph'}</Text>
      <Box marginLeft={2}>
        <Text color="cyan">
          {aidCount} AIDs | {kelCount} KEL events | {registryCount} registries | {credCount} credentials
        </Text>
      </Box>
    </Box>
  );
};
