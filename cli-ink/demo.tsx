#!/usr/bin/env bun
/**
 * Static demo of Ink graph visualization
 * (non-interactive version for demonstration)
 */
import React from 'react';
import { render, Box, Text } from 'ink';
import { GraphView } from './components/GraphView.js';
import { generateSampleData } from './utils/sampleData.js';

const Demo = () => {
  const [graph, setGraph] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    generateSampleData().then(data => {
      setGraph(data.graph);
      setLoading(false);

      // Auto-exit after 5 seconds
      setTimeout(() => process.exit(0), 5000);
    });
  }, []);

  if (loading) {
    return (
      <Box>
        <Text color="cyan">⏳ Loading sample KERI data...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">🔐 KERITS Ink Prototype - Graph Visualization Demo</Text>
      </Box>

      {graph && <GraphView graph={graph} title="Sample KERI Graph" />}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          (Demo will auto-exit in 5 seconds)
        </Text>
      </Box>
    </Box>
  );
};

render(<Demo />);
