import React from 'react';
import { Menu } from '../components/Menu.js';
import { MenuItem } from '../types.js';

interface ContactsMenuProps {
  selectedIndex: number;
  hasAccount: boolean;
}

export const ContactsMenu: React.FC<ContactsMenuProps> = ({ selectedIndex, hasAccount }) => {
  const items: MenuItem[] = [];

  if (hasAccount) {
    items.push(
      { label: 'List Contacts', screen: 'contacts-list' },
      { label: 'Add Contact from KEL File', screen: 'contacts-add' }
    );
  } else {
    items.push({ label: '(No account selected - please create/switch account first)', action: 'noop' });
  }

  items.push({ label: 'Back', action: 'back' });

  return <Menu title="Contacts" items={items} selectedIndex={selectedIndex} />;
};
