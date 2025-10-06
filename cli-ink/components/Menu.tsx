import React from 'react';
import { Box, Text } from 'ink';
import { MenuItem } from '../types.js';

interface MenuProps {
  title: string;
  items: MenuItem[];
  selectedIndex: number;
}

export const Menu: React.FC<MenuProps> = ({ title, items, selectedIndex }) => {
  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={index} marginLeft={1}>
            <Text color={isSelected ? 'green' : 'white'}>
              {isSelected ? '▶ ' : '  '}
              {item.label}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          Use ↑/↓ to navigate, Enter to select, ESC/q to go back
        </Text>
      </Box>
    </Box>
  );
};
