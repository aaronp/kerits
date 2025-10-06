/**
 * Contacts Menu
 */
import * as p from '@clack/prompts';
import { getCurrentAccount, loadAccountDSL } from '../utils/storage.js';
import { readFile } from 'fs/promises';

export async function contactsMenu(): Promise<void> {
  const currentAccount = await getCurrentAccount();

  p.intro('Contacts');

  if (!currentAccount) {
    p.note('No account selected', 'Error');
    await p.select({
      message: 'Please create or select an account first.',
      options: [{ value: 'back', label: 'Back to Main Menu' }],
    });
    return;
  }

  p.note(currentAccount, 'Account');

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'list', label: 'List Contacts' },
      { value: 'add', label: 'Add Contact from KEL File' },
      { value: 'remove', label: 'Remove Contact' },
      { value: 'back', label: 'Back to Main Menu' },
    ],
  });

  if (p.isCancel(action) || action === 'back') {
    return;
  }

  switch (action) {
    case 'list':
      await listContacts(currentAccount);
      break;
    case 'add':
      await addContact(currentAccount);
      break;
    case 'remove':
      await removeContact(currentAccount);
      break;
  }

  // Return to contacts menu
  await contactsMenu();
}

async function listContacts(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading contacts...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to load contacts');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const contacts = await accountDsl.listContacts();

    s.stop();

    if (contacts.length === 0) {
      p.note('No contacts found.', 'Info');
      return;
    }

    const table: string[] = [];
    table.push('Alias       AID');
    table.push('────────────────────────────────────');

    contacts.forEach((contact: any) => {
      const alias = contact.alias.padEnd(12);
      const aid = contact.aid.substring(0, 20) + '...';
      table.push(`${alias} ${aid}`);
    });

    p.note(table.join('\n') + `\n\nTotal: ${contacts.length} contacts`, `Contacts for ${currentAccount}`);
  } catch (error) {
    s.stop('Failed to load contacts');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function addContact(currentAccount: string): Promise<void> {
  const filePath = await p.text({
    message: 'KEL file path:',
    validate: (value) => {
      if (!value) return 'File path is required';
    },
  });

  if (p.isCancel(filePath)) return;

  const alias = await p.text({
    message: 'Contact alias:',
    validate: (value) => {
      if (!value) return 'Alias is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Alias must contain only lowercase letters, numbers, and hyphens';
    },
  });

  if (p.isCancel(alias)) return;

  const s = p.spinner();
  s.start('Importing contact...');

  try {
    const kelData = await readFile(filePath, 'utf-8');

    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to add contact');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const contact = await accountDsl.addContact(alias, kelData);

    s.stop(`Contact '${alias}' added`);
    p.note(`AID: ${contact.aid}`, 'Success');
  } catch (error) {
    s.stop('Failed to add contact');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function removeContact(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading contacts...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to load contacts');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const contacts = await accountDsl.listContacts();

    s.stop();

    if (contacts.length === 0) {
      p.note('No contacts found.', 'Info');
      return;
    }

    const options = contacts.map((contact: any) => ({
      value: contact.alias,
      label: `${contact.alias} (${contact.aid.substring(0, 16)}...)`,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select contact to remove:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    const confirm = await p.select({
      message: `Remove contact '${selected}'?`,
      options: [
        { value: 'yes', label: 'Yes, remove' },
        { value: 'no', label: 'No, cancel' },
      ],
    });

    if (p.isCancel(confirm) || confirm === 'no') return;

    const spinner = p.spinner();
    spinner.start('Removing contact...');

    await accountDsl.removeContact(selected);

    spinner.stop(`Contact '${selected}' removed successfully`);
  } catch (error) {
    s.stop('Failed to remove contact');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}
