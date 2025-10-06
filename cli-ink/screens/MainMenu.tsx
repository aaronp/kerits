import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface MainMenuProps {
  selectedIndex: number;
  currentAccount?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({ selectedIndex, currentAccount }) => {
  const accountInfo = currentAccount ? ` (${currentAccount})` : ' (none)';

  const items: MenuItem[] = [
    { label: `Accounts${accountInfo}`, screen: 'accounts' },
    { label: 'Credential Registries', screen: 'registries' },
    { label: 'Contacts', screen: 'contacts' },
    { label: 'Schemas', screen: 'schemas' },
    { label: 'Exit', action: 'exit' },
  ];

  return <Menu title="KERITS CLI" items={items} selectedIndex={selectedIndex} />;
};
