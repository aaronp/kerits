import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface RegistriesMenuProps {
  selectedIndex: number;
  hasAccount: boolean;
}

export const RegistriesMenu: React.FC<RegistriesMenuProps> = ({ selectedIndex, hasAccount }) => {
  const items: MenuItem[] = [];

  if (hasAccount) {
    items.push(
      { label: 'List Registries', screen: 'registries-list' },
      { label: 'Create New Registry', screen: 'registries-add' },
      { label: 'Export Registry CESR', screen: 'registries-export' }
    );
  } else {
    items.push({ label: '(No account selected - please create/switch account first)', action: 'noop' });
  }

  items.push({ label: 'Back', action: 'back' });

  return <Menu title="Credential Registries" items={items} selectedIndex={selectedIndex} />;
};
