#!/usr/bin/env bun
/**
 * Static demo showing the CLI menu structure
 */
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { Breadcrumbs } from './components/Breadcrumbs.js';
import { MainMenu } from './screens/MainMenu.js';
import { AccountsMenu } from './screens/AccountsMenu.js';
import { RegistriesMenu } from './screens/RegistriesMenu.js';
import { ContactsMenu } from './screens/ContactsMenu.js';
import { SchemasMenu } from './screens/SchemasMenu.js';
import { ACDCsMenu } from './screens/ACDCsMenu.js';
import type { Screen, Breadcrumb } from './types.js';

const Demo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev >= 5) {
          process.exit(0);
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const demos: Array<{ title: string; screen: React.ReactNode; breadcrumbs: Breadcrumb[] }> = [
    {
      title: 'Main Menu',
      screen: <MainMenu selectedIndex={0} currentAccount={undefined} />,
      breadcrumbs: [],
    },
    {
      title: 'Accounts Menu',
      screen: <AccountsMenu selectedIndex={0} currentAccount={undefined} />,
      breadcrumbs: [{ label: 'Accounts', screen: 'accounts' }],
    },
    {
      title: 'Accounts Menu (with account)',
      screen: <AccountsMenu selectedIndex={2} currentAccount="alice" />,
      breadcrumbs: [{ label: 'Accounts', screen: 'accounts' }],
    },
    {
      title: 'Registries Menu',
      screen: <RegistriesMenu selectedIndex={0} hasAccount={true} />,
      breadcrumbs: [{ label: 'Credential Registries', screen: 'registries' }],
    },
    {
      title: 'ACDCs Menu (nested under registry)',
      screen: <ACDCsMenu selectedIndex={0} registryAlias="health-records" />,
      breadcrumbs: [
        { label: 'Credential Registries', screen: 'registries' },
        { label: 'health-records', screen: 'registries-acdcs' },
      ],
    },
    {
      title: 'Schemas Menu',
      screen: <SchemasMenu selectedIndex={0} hasAccount={true} />,
      breadcrumbs: [{ label: 'Schemas', screen: 'schemas' }],
    },
  ];

  const currentDemo = demos[step];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} paddingX={2} paddingY={1}>
        <Text bold color="magenta">
          🔐 KERITS CLI - Demo ({step + 1}/{demos.length})
        </Text>
      </Box>

      <Box marginBottom={1} paddingX={2}>
        <Text color="cyan">{currentDemo.title}</Text>
      </Box>

      <Breadcrumbs breadcrumbs={currentDemo.breadcrumbs} />

      {currentDemo.screen}

      <Box marginTop={1} paddingX={2}>
        <Text dimColor>Auto-advancing every 2 seconds...</Text>
      </Box>
    </Box>
  );
};

render(<Demo />);
