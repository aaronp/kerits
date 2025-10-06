#!/usr/bin/env bun
/**
 * Advanced Graph Demo - Cyclical Graph with Boxes and Lines
 *
 * Demonstrates: A→C,D,E,F  D→E  E→A (cycle)
 */
import React from 'react';
import { render, Box, Text } from 'ink';
import { AdvancedGraphView } from './components/AdvancedGraphView.js';
import type { Graph } from '../src/storage/types';

const CyclicalGraphDemo = () => {
  // Create a complex cyclical graph
  const graph: Graph = {
    nodes: [
      { id: 'A', kind: 'AID', label: 'Node A' },
      { id: 'C', kind: 'KEL_EVT', label: 'Node C' },
      { id: 'D', kind: 'TEL_REGISTRY', label: 'Node D' },
      { id: 'E', kind: 'ACDC', label: 'Node E' },
      { id: 'F', kind: 'SCHEMA', label: 'Node F' },
    ],
    edges: [
      { id: 'A-C', from: 'A', to: 'C', kind: 'ANCHOR', label: 'to C' },
      { id: 'A-D', from: 'A', to: 'D', kind: 'ANCHOR', label: 'to D' },
      { id: 'A-E', from: 'A', to: 'E', kind: 'ANCHOR', label: 'to E' },
      { id: 'A-F', from: 'A', to: 'F', kind: 'REFS', label: 'to F' },
      { id: 'D-E', from: 'D', to: 'E', kind: 'ISSUES', label: 'to E' },
      { id: 'E-A', from: 'E', to: 'A', kind: 'PRIOR', label: 'back to A' }, // Creates cycle!
    ],
  };

  React.useEffect(() => {
    // Auto-exit after 8 seconds
    setTimeout(() => process.exit(0), 8000);
  }, []);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">
          🔄 Advanced Graph Layout Demo - Cyclical Graph
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="yellow">
          Structure: A→(C,D,E,F), D→E, E→A (creates cycle)
        </Text>
      </Box>

      <AdvancedGraphView graph={graph} title="Cyclical Graph with Boxes & Lines" direction="TB" />

      <Box marginTop={1}>
        <Text dimColor>(Demo will auto-exit in 8 seconds)</Text>
      </Box>
    </Box>
  );
};

// Also show horizontal layout
const HorizontalDemo = () => {
  const graph: Graph = {
    nodes: [
      { id: 'A', kind: 'AID', label: 'Node A' },
      { id: 'C', kind: 'KEL_EVT', label: 'Node C' },
      { id: 'D', kind: 'TEL_REGISTRY', label: 'Node D' },
      { id: 'E', kind: 'ACDC', label: 'Node E' },
      { id: 'F', kind: 'SCHEMA', label: 'Node F' },
    ],
    edges: [
      { id: 'A-C', from: 'A', to: 'C', kind: 'ANCHOR', label: 'to C' },
      { id: 'A-D', from: 'A', to: 'D', kind: 'ANCHOR', label: 'to D' },
      { id: 'A-E', from: 'A', to: 'E', kind: 'ANCHOR', label: 'to E' },
      { id: 'A-F', from: 'A', to: 'F', kind: 'REFS', label: 'to F' },
      { id: 'D-E', from: 'D', to: 'E', kind: 'ISSUES', label: 'to E' },
      { id: 'E-A', from: 'E', to: 'A', kind: 'PRIOR', label: 'cycle' },
    ],
  };

  return (
    <Box flexDirection="column" marginTop={2}>
      <AdvancedGraphView graph={graph} title="Same Graph - Horizontal Layout" direction="LR" />
    </Box>
  );
};

const FullDemo = () => (
  <Box flexDirection="column">
    <CyclicalGraphDemo />
    <HorizontalDemo />
  </Box>
);

render(<FullDemo />);
