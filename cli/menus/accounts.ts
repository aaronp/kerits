/**
 * Accounts Menu
 */
import * as p from '@clack/prompts';
import { getCurrentAccount, setCurrentAccount, listAccounts, loadAccountDSL, getAccountDataDir } from '../utils/storage.js';
import { writeFile, mkdir } from 'fs/promises';
import { mnemonicToSeed, seedToMnemonic } from '../../src/app/dsl/utils/index.js';

export async function accountsMenu(): Promise<void> {
  const currentAccount = await getCurrentAccount();

  p.intro('Account Management');

  if (currentAccount) {
    p.note(currentAccount, 'Current Account');
  } else {
    p.note('No account currently selected', 'Status');
  }

  const options: Array<{ value: string; label: string }> = [
    { value: 'create', label: 'Create New Account' },
    { value: 'switch', label: 'Switch Account' },
  ];

  if (currentAccount) {
    options.push(
      { value: 'rotate', label: 'Rotate Keys' },
      { value: 'export', label: 'Export KEL to File' },
      { value: 'graph', label: 'Show KEL Graph' }
    );
  }

  options.push({ value: 'back', label: 'Back to Main Menu' });

  const action = await p.select({
    message: 'What would you like to do?',
    options,
  });

  if (p.isCancel(action) || action === 'back') {
    return;
  }

  switch (action) {
    case 'create':
      await createAccount();
      break;
    case 'switch':
      await switchAccount();
      break;
    case 'rotate':
      if (currentAccount) await rotateKeys(currentAccount);
      break;
    case 'export':
      if (currentAccount) await exportKel(currentAccount);
      break;
    case 'graph':
      if (currentAccount) await showKelGraph(currentAccount);
      break;
  }

  // Return to accounts menu
  await accountsMenu();
}

async function createAccount(): Promise<void> {
  const alias = await p.text({
    message: 'Enter account alias:',
    validate: (value) => {
      if (!value) return 'Alias is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Alias must contain only lowercase letters, numbers, and hyphens';
    },
  });

  if (p.isCancel(alias)) return;

  const mnemonicChoice = await p.select({
    message: 'Mnemonic:',
    options: [
      { value: 'generate', label: 'Generate new mnemonic (recommended)' },
      { value: 'existing', label: 'Enter existing mnemonic' },
    ],
  });

  if (p.isCancel(mnemonicChoice)) return;

  let mnemonic: string;

  if (mnemonicChoice === 'generate') {
    // Generate random seed
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    mnemonic = seedToMnemonic(seed);

    p.note(
      `IMPORTANT: Save this mnemonic securely!\n\n${mnemonic}\n\nThis is the ONLY time you'll see this mnemonic.\nYou'll need it to recover your account.`,
      'Generated Mnemonic'
    );

    const confirmed = await p.select({
      message: 'Have you saved the mnemonic?',
      options: [
        { value: 'yes', label: 'Yes, I\'ve saved it' },
        { value: 'no', label: 'No, cancel account creation' },
      ],
    });

    if (p.isCancel(confirmed) || confirmed === 'no') {
      p.cancel('Account creation cancelled');
      return;
    }
  } else {
    const mnemonicInput = await p.text({
      message: 'Enter 24-word mnemonic:',
      validate: (value) => {
        const words = value.trim().split(/\s+/);
        if (words.length !== 24) return 'Mnemonic must be exactly 24 words';
      },
    });

    if (p.isCancel(mnemonicInput)) return;
    mnemonic = mnemonicInput;
  }

  const s = p.spinner();
  s.start('Creating account...');

  try {
    // Create data directory
    const dataDir = getAccountDataDir(alias);
    await mkdir(dataDir, { recursive: true });

    // Load DSL and create account
    const { dsl } = await loadAccountDSL(alias);
    const account = await dsl.newAccount(alias, mnemonic);

    // Set as current account
    await setCurrentAccount(alias);

    s.stop(`Account '${alias}' created successfully`);
    p.note(`AID: ${account.aid}`, 'Success');
  } catch (error) {
    s.stop('Failed to create account');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function switchAccount(): Promise<void> {
  const accounts = await listAccounts();

  if (accounts.length === 0) {
    p.note('No accounts found. Create an account first.', 'Info');
    return;
  }

  const options = accounts.map(account => ({
    value: account,
    label: account,
  }));
  options.push({ value: 'cancel', label: 'Cancel' });

  const selected = await p.select({
    message: 'Select account:',
    options,
  });

  if (p.isCancel(selected) || selected === 'cancel') return;

  await setCurrentAccount(selected);
  p.note(`Switched to account '${selected}'`, 'Success');
}

async function rotateKeys(currentAccount: string): Promise<void> {
  const { dsl } = await loadAccountDSL(currentAccount);
  const accountDsl = await dsl.account(currentAccount);

  if (!accountDsl) {
    p.log.error(`Account '${currentAccount}' not found`);
    return;
  }

  // Get current key info
  const aid = accountDsl.account.aid;
  const events = await accountDsl.getKel();
  const sequenceNumber = events.length - 1;

  p.note(
    `Current Account: ${currentAccount}\nAID: ${aid}\nSequence Number: ${sequenceNumber}`,
    'Rotate Keys'
  );

  const rotationType = await p.select({
    message: 'Key Rotation:',
    options: [
      { value: 'generate', label: 'Generate new mnemonic (recommended)' },
      { value: 'existing', label: 'Use existing mnemonic' },
      { value: 'cancel', label: 'Cancel' },
    ],
  });

  if (p.isCancel(rotationType) || rotationType === 'cancel') return;

  let newMnemonic: string;

  if (rotationType === 'generate') {
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    newMnemonic = seedToMnemonic(seed);

    p.note(
      `IMPORTANT: Save this mnemonic securely!\n\n${newMnemonic}\n\nThis is the ONLY time you'll see this mnemonic.`,
      'Generated Mnemonic'
    );

    const confirmed = await p.select({
      message: 'Have you saved the mnemonic?',
      options: [
        { value: 'yes', label: 'Yes, I\'ve saved it' },
        { value: 'no', label: 'No, cancel rotation' },
      ],
    });

    if (p.isCancel(confirmed) || confirmed === 'no') {
      p.cancel('Key rotation cancelled');
      return;
    }
  } else {
    const mnemonicInput = await p.text({
      message: 'Enter 24-word mnemonic:',
      validate: (value) => {
        const words = value.trim().split(/\s+/);
        if (words.length !== 24) return 'Mnemonic must be exactly 24 words';
      },
    });

    if (p.isCancel(mnemonicInput)) return;
    newMnemonic = mnemonicInput;
  }

  const s = p.spinner();
  s.start('Rotating keys...');

  try {
    await accountDsl.rotateKeys(newMnemonic);
    const newEvents = await accountDsl.getKel();

    s.stop('Keys rotated successfully');
    p.note(
      `AID: ${aid}\nNew Sequence Number: ${newEvents.length - 1}`,
      'Success'
    );
  } catch (error) {
    s.stop('Failed to rotate keys');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function exportKel(currentAccount: string): Promise<void> {
  const format = await p.select({
    message: 'Export format:',
    options: [
      { value: 'cesr', label: 'CESR (raw, standard KERI format)' },
      { value: 'json', label: 'JSON (with metadata)' },
    ],
  }) as 'cesr' | 'json';

  if (p.isCancel(format)) return;

  const extension = format === 'json' ? 'json' : 'cesr';
  const defaultPath = `./${currentAccount}-kel.${extension}`;

  const filePathInput = await p.text({
    message: 'Export KEL to file:',
    placeholder: defaultPath,
    defaultValue: defaultPath,
  });

  if (p.isCancel(filePathInput)) return;

  // Use default if user just pressed enter
  const filePath = filePathInput.trim() || defaultPath;

  const s = p.spinner();
  s.start('Exporting KEL...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to export KEL');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const exportDsl = await accountDsl.export();

    // Create parent directories if needed
    const { dirname } = await import('path');
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });

    // Export with specified format
    await exportDsl.toFile(filePath, format);

    const events = await accountDsl.getKel();

    // Get file size after writing
    const { stat } = await import('fs/promises');
    const stats = await stat(filePath);
    const fileSize = stats.size;

    s.stop(`KEL exported to '${filePath}'`);
    p.note(
      `Format: ${format.toUpperCase()}\nEvents exported: ${events.length}\nFile size: ${(fileSize / 1024).toFixed(1)} KB`,
      'Success'
    );
  } catch (error) {
    s.stop('Failed to export KEL');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function showKelGraph(currentAccount: string): Promise<void> {
  p.log.warn('Graph functionality has been removed');
  // Graph building has been removed from the DSL
  // This function is kept for backwards compatibility but does nothing
}
