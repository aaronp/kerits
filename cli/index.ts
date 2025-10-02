#!/usr/bin/env bun
import * as clack from '@clack/prompts';
import { incept } from '../src/incept';
import { rotate } from '../src/rotate';
import { generateKeypairFromSeed } from '../src/signer';
import { diger } from '../src/diger';
import { serializeKEL, getLatestSequenceNumber } from '../src/kel';
import { schemasMenu } from './schemasMenu';
import { credentialsMenu } from './credentialsMenu';
import { registriesMenu } from './registriesMenu';
import { receiptsMenu } from './receiptsMenu';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STORAGE_DIR = process.env.KERITS_DIR || join(homedir(), '.kerits');

interface Account {
  alias: string;
  pre: string;
  said: string;
  ked: Record<string, any>;
  seed: string;
  nextSeed: string;
  kel: string;
  createdAt: string;
  updatedAt: string;
}

function ensureStorageDir(): void {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function saveAccount(account: Account): void {
  ensureStorageDir();
  const accountFile = join(STORAGE_DIR, `${account.alias}.json`);
  writeFileSync(accountFile, JSON.stringify(account, null, 2));
}

function loadAccounts(): Account[] {
  ensureStorageDir();
  const accountsFile = join(STORAGE_DIR, 'accounts.json');
  if (existsSync(accountsFile)) {
    return JSON.parse(readFileSync(accountsFile, 'utf-8'));
  }
  return [];
}

function saveAccountsList(accounts: Account[]): void {
  ensureStorageDir();
  const accountsFile = join(STORAGE_DIR, 'accounts.json');
  writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
}

async function createAccount(): Promise<void> {
  clack.intro('Create KERI Account');

  const alias = await clack.text({
    message: 'Enter account alias:',
    placeholder: 'my-account',
    validate: (value) => {
      if (!value) return 'Alias is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Alias can only contain letters, numbers, dashes, and underscores';
    },
  });

  if (clack.isCancel(alias)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  const s = clack.spinner();
  s.start('Generating keypairs...');

  // Generate current keypair from random seed
  const currentSeed = randomBytes(32);
  const currentKeypair = await generateKeypairFromSeed(currentSeed, true);

  // Generate next keypair from random seed
  const nextSeed = randomBytes(32);
  const nextKeypair = await generateKeypairFromSeed(nextSeed, true);

  // Create digest of next key
  const nextDigest = diger(nextKeypair.verfer);

  s.stop('Keypairs generated');

  s.start('Creating inception event...');

  // Create inception event
  const event = incept({
    keys: [currentKeypair.verfer],
    ndigs: [nextDigest],
  });

  s.stop('Inception event created');

  // Save account
  const now = new Date().toISOString();
  const account: Account = {
    alias: alias as string,
    pre: event.pre,
    said: event.said,
    ked: event.ked,
    seed: currentSeed.toString('hex'),
    nextSeed: nextSeed.toString('hex'),
    kel: event.raw,
    createdAt: now,
    updatedAt: now,
  };

  saveAccount(account);

  // Update accounts list
  const accounts = loadAccounts();
  accounts.push({
    alias: account.alias,
    pre: account.pre,
    said: account.said,
    ked: account.ked,
    seed: account.seed,
    nextSeed: account.nextSeed,
    kel: account.kel,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  });
  saveAccountsList(accounts);

  clack.note(
    `Prefix (AID):  ${event.pre}\nSAID:          ${event.said}\nStorage:       ${STORAGE_DIR}/${account.alias}.json`,
    'Account Created'
  );

  clack.outro('Done!');
}

async function rotateKeys(): Promise<void> {
  clack.intro('Rotate Keys');

  // Load existing accounts
  const accounts = loadAccounts();

  if (accounts.length === 0) {
    clack.outro('No accounts found. Create an account first.');
    return;
  }

  const alias = await clack.select({
    message: 'Select account to rotate:',
    options: accounts.map(acc => ({
      value: acc.alias,
      label: acc.alias,
      hint: acc.pre.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(alias)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  // Load the account
  const accountFile = join(STORAGE_DIR, `${alias}.json`);
  const account: Account = JSON.parse(readFileSync(accountFile, 'utf-8'));

  const s = clack.spinner();
  s.start('Rotating keys...');

  // Get current sequence number from KEL
  const currentSn = getLatestSequenceNumber(account.kel);
  const nextSn = currentSn + 1;

  // Current keys come from nextSeed (pre-rotated keys)
  const currentSeed = Buffer.from(account.nextSeed, 'hex');
  const currentKeypair = await generateKeypairFromSeed(currentSeed, true);

  // Generate new next keypair
  const nextSeed = randomBytes(32);
  const nextKeypair = await generateKeypairFromSeed(nextSeed, true);
  const nextDigest = diger(nextKeypair.verfer);

  s.stop('Keys generated');

  s.start('Creating rotation event...');

  // Create rotation event
  const rotationEvent = rotate({
    pre: account.pre,
    keys: [currentKeypair.verfer],
    dig: account.said,
    sn: nextSn,
    ndigs: [nextDigest],
  });

  s.stop('Rotation event created');

  // Update account
  account.seed = currentSeed.toString('hex');
  account.nextSeed = nextSeed.toString('hex');
  account.said = rotationEvent.said;
  account.ked = rotationEvent.ked;
  account.kel = account.kel + '\n' + rotationEvent.raw;
  account.updatedAt = new Date().toISOString();

  // Save account
  saveAccount(account);

  // Update accounts list
  const allAccounts = loadAccounts();
  const index = allAccounts.findIndex(a => a.alias === alias);
  if (index >= 0) {
    allAccounts[index] = account;
    saveAccountsList(allAccounts);
  }

  clack.note(
    `Prefix (AID):  ${account.pre}\nSequence:      ${nextSn}\nNew SAID:      ${rotationEvent.said}\nStorage:       ${STORAGE_DIR}/${account.alias}.json`,
    'Keys Rotated'
  );

  clack.outro('Done!');
}

async function main(): Promise<void> {
  while (true) {
    const action = await clack.select({
      message: 'What would you like to do?',
      options: [
        { value: 'create', label: 'Create Account', hint: 'Generate a new KERI identifier' },
        { value: 'rotate', label: 'Rotate Keys', hint: 'Rotate keys for an existing account' },
        { value: 'schemas', label: 'Manage Schemas', hint: 'Create and manage JSON Schemas' },
        { value: 'registries', label: 'Manage Registries', hint: 'Create and manage TEL registries' },
        { value: 'credentials', label: 'Manage Credentials', hint: 'Create and manage verifiable credentials' },
        { value: 'receipts', label: 'Manage Receipts', hint: 'Create receipts and accept credentials' },
        { value: 'exit', label: 'Exit' },
      ],
    });

    if (clack.isCancel(action)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    switch (action) {
      case 'create':
        await createAccount();
        break;
      case 'rotate':
        await rotateKeys();
        break;
      case 'schemas':
        await schemasMenu();
        break;
      case 'registries':
        await registriesMenu();
        break;
      case 'credentials':
        await credentialsMenu();
        break;
      case 'receipts':
        await receiptsMenu();
        break;
      case 'exit':
        clack.outro('Goodbye!');
        process.exit(0);
    }
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
