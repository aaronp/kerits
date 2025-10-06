import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface AccountsMenuProps {
  selectedIndex: number;
  currentAccount?: string;
}

export const AccountsMenu: React.FC<AccountsMenuProps> = ({ selectedIndex, currentAccount }) => {
  const items: MenuItem[] = [
    { label: 'Create New Account', screen: 'accounts-create' },
    { label: 'Switch Account', screen: 'accounts-switch' },
  ];

  if (currentAccount) {
    items.push(
      { label: 'Rotate Keys', screen: 'accounts-rotate' },
      { label: 'Export KEL to File', screen: 'accounts-export' },
      { label: 'Show KEL Graph', screen: 'accounts-graph' }
    );
  }

  items.push({ label: 'Back', action: 'back' });

  return <Menu title="Account Management" items={items} selectedIndex={selectedIndex} />;
};
