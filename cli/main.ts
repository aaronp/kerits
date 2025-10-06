#!/usr/bin/env bun
/**
 * KERITS CLI - Main Entry Point
 */
import * as p from '@clack/prompts';
import { getCurrentAccount } from './utils/storage.js';
import { accountsMenu } from './menus/accounts.js';
import { registriesMenu } from './menus/registries.js';
import { contactsMenu } from './menus/contacts.js';
import { schemasMenu } from './menus/schemas.js';

async function mainMenu(): Promise<void> {
  console.clear();

  const currentAccount = await getCurrentAccount();

  p.intro('KERITS CLI - KERI Transaction System');

  if (currentAccount) {
    p.note(currentAccount, 'Current Account');
  } else {
    p.note('None', 'Current Account');
  }

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'accounts', label: 'Manage Accounts' },
      { value: 'registries', label: 'Manage Registries' },
      { value: 'contacts', label: 'Manage Contacts' },
      { value: 'schemas', label: 'Manage Schemas' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (p.isCancel(action) || action === 'exit') {
    p.outro('Goodbye! 👋');
    process.exit(0);
  }

  switch (action) {
    case 'accounts':
      await accountsMenu();
      break;
    case 'registries':
      await registriesMenu();
      break;
    case 'contacts':
      await contactsMenu();
      break;
    case 'schemas':
      await schemasMenu();
      break;
  }

  // Return to main menu
  await mainMenu();
}

// Start the CLI
mainMenu().catch((error) => {
  p.log.error('An unexpected error occurred');
  console.error(error);
  process.exit(1);
});
