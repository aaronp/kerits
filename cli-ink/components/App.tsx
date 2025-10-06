import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { GraphView, CompactGraphView } from './GraphView.js';
import { generateSampleData } from '../utils/sampleData.js';
import type { Graph } from '../../src/storage/types';
import type { KeritsDSL } from '../../src/app/dsl';

type Screen = 'menu' | 'graph' | 'compact-graph' | 'loading';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>('loading');
  const [graph, setGraph] = useState<Graph | null>(null);
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [selectedMenu, setSelectedMenu] = useState(0);

  const menuItems = [
    { label: 'View Full Graph', screen: 'graph' as const },
    { label: 'View Compact Graph', screen: 'compact-graph' as const },
    { label: 'Refresh Data', action: 'refresh' as const },
    { label: 'Exit', action: 'exit' as const },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setScreen('loading');
    const data = await generateSampleData();
    setGraph(data.graph);
    setDsl(data.dsl);
    setScreen('menu');
  };

  useInput((input, key) => {
    if (screen === 'menu') {
      if (key.upArrow) {
        setSelectedMenu(prev => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } else if (key.downArrow) {
        setSelectedMenu(prev => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        const selected = menuItems[selectedMenu];
        if ('screen' in selected) {
          setScreen(selected.screen);
        } else if (selected.action === 'refresh') {
          loadData();
        } else if (selected.action === 'exit') {
          exit();
        }
      }
    } else if (screen !== 'loading') {
      if (key.escape || input === 'q' || input === 'b') {
        setScreen('menu');
      } else if (key.return) {
        setScreen('menu');
      }
    }
  });

  if (screen === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> Loading sample KERI data...</Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'menu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="green">
            🔐 KERITS CLI - Ink Prototype
          </Text>
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
          <Text bold color="cyan" marginBottom={1}>
            Main Menu
          </Text>
          {menuItems.map((item, idx) => (
            <Box key={idx}>
              <Text color={idx === selectedMenu ? 'green' : 'white'}>
                {idx === selectedMenu ? '▶ ' : '  '}
                {item.label}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Use ↑↓ arrows to navigate, Enter to select
          </Text>
        </Box>

        {graph && (
          <Box marginTop={1}>
            <CompactGraphView graph={graph} title="Current Graph Summary:" />
          </Box>
        )}
      </Box>
    );
  }

  if (screen === 'graph' && graph) {
    return (
      <Box flexDirection="column" padding={1}>
        <GraphView graph={graph} title="🔐 KERI Graph Visualization" />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press ESC, 'q', or 'b' to go back to menu
          </Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'compact-graph' && graph) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            📊 Compact Graph View
          </Text>
        </Box>
        <CompactGraphView graph={graph} />

        <Box marginTop={2} flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
          <Text bold>Node Breakdown:</Text>
          {Object.entries(
            graph.nodes.reduce((acc, n) => {
              acc[n.kind || 'UNKNOWN'] = (acc[n.kind || 'UNKNOWN'] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([kind, count]) => (
            <Box key={kind} marginLeft={2}>
              <Text>
                • {kind}: <Text color="cyan">{count}</Text>
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press ESC, 'q', or 'b' to go back to menu
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
