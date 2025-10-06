import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Screen, Breadcrumb, MenuItem } from '../types.js';
import { Breadcrumbs } from './Breadcrumbs.js';
import { MainMenu } from '../screens/MainMenu.js';
import { AccountsMenu } from '../screens/AccountsMenu.js';
import { RegistriesMenu } from '../screens/RegistriesMenu.js';
import { ContactsMenu } from '../screens/ContactsMenu.js';
import { SchemasMenu } from '../screens/SchemasMenu.js';
import { ACDCsMenu } from '../screens/ACDCsMenu.js';
import { getCurrentAccount, listAccounts } from '../utils/storage.js';

export const KeritsApp: React.FC = () => {
  const { exit } = useApp();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentAccount, setCurrentAccount] = useState<string | undefined>();
  const [selectedRegistry, setSelectedRegistry] = useState<string | undefined>();
  const [accounts, setAccounts] = useState<string[]>([]);

  // Load current account on mount
  useEffect(() => {
    (async () => {
      const account = await getCurrentAccount();
      if (account) {
        setCurrentAccount(account);
      }
      const accountList = await listAccounts();
      setAccounts(accountList);
    })();
  }, []);

  // Get menu items for current screen
  const getMenuItems = (): MenuItem[] => {
    switch (currentScreen) {
      case 'main':
        return [
          { label: `Accounts${currentAccount ? ` (${currentAccount})` : ' (none)'}`, screen: 'accounts' },
          { label: 'Credential Registries', screen: 'registries' },
          { label: 'Contacts', screen: 'contacts' },
          { label: 'Schemas', screen: 'schemas' },
          { label: 'Exit', action: 'exit' },
        ];
      case 'accounts':
        const accountItems: MenuItem[] = [
          { label: 'Create New Account', screen: 'accounts-create' },
          { label: 'Switch Account', screen: 'accounts-switch' },
        ];
        if (currentAccount) {
          accountItems.push(
            { label: 'Rotate Keys', screen: 'accounts-rotate' },
            { label: 'Export KEL to File', screen: 'accounts-export' },
            { label: 'Show KEL Graph', screen: 'accounts-graph' }
          );
        }
        accountItems.push({ label: 'Back', action: 'back' });
        return accountItems;
      case 'registries':
        const registryItems: MenuItem[] = [];
        if (currentAccount) {
          registryItems.push(
            { label: 'List Registries', screen: 'registries-list' },
            { label: 'Create New Registry', screen: 'registries-add' },
            { label: 'Export Registry CESR', screen: 'registries-export' }
          );
        } else {
          registryItems.push({ label: '(No account selected)', action: 'noop' });
        }
        registryItems.push({ label: 'Back', action: 'back' });
        return registryItems;
      case 'contacts':
        const contactItems: MenuItem[] = [];
        if (currentAccount) {
          contactItems.push(
            { label: 'List Contacts', screen: 'contacts-list' },
            { label: 'Add Contact from KEL File', screen: 'contacts-add' }
          );
        } else {
          contactItems.push({ label: '(No account selected)', action: 'noop' });
        }
        contactItems.push({ label: 'Back', action: 'back' });
        return contactItems;
      case 'schemas':
        const schemaItems: MenuItem[] = [];
        if (currentAccount) {
          schemaItems.push(
            { label: 'List Schemas', screen: 'schemas-list' },
            { label: 'Create New Schema', screen: 'schemas-create' },
            { label: 'Export Schema to File', screen: 'schemas-export' },
            { label: 'Import Schema from File', screen: 'schemas-import' }
          );
        } else {
          schemaItems.push({ label: '(No account selected)', action: 'noop' });
        }
        schemaItems.push({ label: 'Back', action: 'back' });
        return schemaItems;
      case 'registries-acdcs':
        return [
          { label: 'List Credentials', screen: 'acdcs-list' },
          { label: 'Create New Credential', screen: 'acdcs-create' },
          { label: 'Show Credentials Graph', screen: 'acdcs-graph' },
          { label: 'Export Credential', screen: 'acdcs-export' },
          { label: 'Back', action: 'back' },
        ];
      default:
        return [{ label: 'Back', action: 'back' }];
    }
  };

  // Navigate to a new screen
  const navigateTo = (screen: Screen, label: string) => {
    setCurrentScreen(screen);
    setSelectedIndex(0);
    setBreadcrumbs([...breadcrumbs, { label, screen }]);
  };

  // Go back to previous screen
  const goBack = () => {
    if (breadcrumbs.length === 0) {
      setCurrentScreen('main');
      return;
    }

    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);

    if (newBreadcrumbs.length === 0) {
      setCurrentScreen('main');
    } else {
      setCurrentScreen(newBreadcrumbs[newBreadcrumbs.length - 1].screen);
    }
    setSelectedIndex(0);
  };

  // Handle menu selection
  const handleSelection = () => {
    const items = getMenuItems();
    const selected = items[selectedIndex];

    if (!selected) return;

    if (selected.action === 'exit') {
      exit();
      return;
    }

    if (selected.action === 'back') {
      goBack();
      return;
    }

    if (selected.action === 'noop') {
      return;
    }

    if (selected.screen) {
      navigateTo(selected.screen, selected.label);
    }
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => {
        const items = getMenuItems();
        return prev > 0 ? prev - 1 : items.length - 1;
      });
    } else if (key.downArrow) {
      setSelectedIndex(prev => {
        const items = getMenuItems();
        return prev < items.length - 1 ? prev + 1 : 0;
      });
    } else if (key.return) {
      handleSelection();
    } else if (key.escape || input === 'q') {
      if (currentScreen === 'main') {
        exit();
      } else {
        goBack();
      }
    }
  });

  // Render appropriate screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return <MainMenu selectedIndex={selectedIndex} currentAccount={currentAccount} />;
      case 'accounts':
        return <AccountsMenu selectedIndex={selectedIndex} currentAccount={currentAccount} />;
      case 'registries':
        return <RegistriesMenu selectedIndex={selectedIndex} hasAccount={!!currentAccount} />;
      case 'contacts':
        return <ContactsMenu selectedIndex={selectedIndex} hasAccount={!!currentAccount} />;
      case 'schemas':
        return <SchemasMenu selectedIndex={selectedIndex} hasAccount={!!currentAccount} />;
      case 'registries-acdcs':
        return <ACDCsMenu selectedIndex={selectedIndex} registryAlias={selectedRegistry || 'Unknown'} />;
      default:
        return (
          <Box flexDirection="column" paddingX={2}>
            <Text color="yellow">Screen: {currentScreen}</Text>
            <Text dimColor>(Implementation pending)</Text>
            <Box marginTop={1}>
              <Text dimColor>Press ESC or q to go back</Text>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} paddingX={2} paddingY={1}>
        <Text bold color="magenta">
          🔐 KERITS CLI - KERI Transaction System
        </Text>
      </Box>

      <Breadcrumbs breadcrumbs={breadcrumbs} />

      {renderScreen()}
    </Box>
  );
};
