import React from 'react';
import { Box, Text } from 'ink';
import { Breadcrumb } from '../types.js';

interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs }) => {
  if (breadcrumbs.length === 0) return null;

  return (
    <Box marginBottom={1} paddingX={1} borderStyle="single" borderColor="gray">
      <Text dimColor>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Text color="gray"> › </Text>}
            <Text color={index === breadcrumbs.length - 1 ? 'cyan' : 'gray'}>
              {crumb.label}
            </Text>
          </React.Fragment>
        ))}
      </Text>
    </Box>
  );
};
