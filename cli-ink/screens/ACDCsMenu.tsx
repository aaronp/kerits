import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface ACDCsMenuProps {
  selectedIndex: number;
  registryAlias: string;
}

export const ACDCsMenu: React.FC<ACDCsMenuProps> = ({ selectedIndex, registryAlias }) => {
  const items: MenuItem[] = [
    { label: 'List Credentials', screen: 'acdcs-list' },
    { label: 'Create New Credential', screen: 'acdcs-create' },
    { label: 'Show Credentials Graph', screen: 'acdcs-graph' },
    { label: 'Export Credential', screen: 'acdcs-export' },
    { label: 'Back', action: 'back' },
  ];

  return <Menu title={`Credentials - ${registryAlias}`} items={items} selectedIndex={selectedIndex} />;
};
