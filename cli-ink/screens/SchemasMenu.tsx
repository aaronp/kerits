import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface SchemasMenuProps {
  selectedIndex: number;
  hasAccount: boolean;
}

export const SchemasMenu: React.FC<SchemasMenuProps> = ({ selectedIndex, hasAccount }) => {
  const items: MenuItem[] = [];

  if (hasAccount) {
    items.push(
      { label: 'List Schemas', screen: 'schemas-list' },
      { label: 'Create New Schema', screen: 'schemas-create' },
      { label: 'Export Schema to File', screen: 'schemas-export' },
      { label: 'Import Schema from File', screen: 'schemas-import' }
    );
  } else {
    items.push({ label: '(No account selected - please create/switch account first)', action: 'noop' });
  }

  items.push({ label: 'Back', action: 'back' });

  return <Menu title="Schemas" items={items} selectedIndex={selectedIndex} />;
};
