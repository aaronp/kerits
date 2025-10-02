import * as clack from '@clack/prompts';
import { registryIncept, type RegistryInceptionOptions } from '../src/tel';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STORAGE_DIR = process.env.KERITS_DIR || join(homedir(), '.kerits');
const REGISTRIES_DIR = join(STORAGE_DIR, 'registries');

interface Account {
  alias: string;
  pre: string;
}

interface StoredRegistry {
  name: string;
  issuer: string;
  issuerAlias: string;
  regk: string;
  sad: Record<string, any>;
  said: string;
  raw: string;
  nonce: string;
  baks: string[];
  toad: number;
  createdAt: string;
}

function ensureRegistriesDir(): void {
  if (!existsSync(REGISTRIES_DIR)) {
    mkdirSync(REGISTRIES_DIR, { recursive: true });
  }
}

function loadAccounts(): Account[] {
  const accountsFile = join(STORAGE_DIR, 'accounts.json');
  if (existsSync(accountsFile)) {
    return JSON.parse(readFileSync(accountsFile, 'utf-8'));
  }
  return [];
}

function saveRegistry(name: string, reg: { sad: Record<string, any>; raw: string; said: string; regk: string }, issuer: string, issuerAlias: string, nonce: string, baks: string[], toad: number): void {
  ensureRegistriesDir();

  const stored: StoredRegistry = {
    name,
    issuer,
    issuerAlias,
    regk: reg.regk,
    sad: reg.sad,
    said: reg.said,
    raw: reg.raw,
    nonce,
    baks,
    toad,
    createdAt: new Date().toISOString(),
  };

  const regFile = join(REGISTRIES_DIR, `${name}.json`);
  writeFileSync(regFile, JSON.stringify(stored, null, 2));
}

function listRegistries(): StoredRegistry[] {
  ensureRegistriesDir();
  const files = readdirSync(REGISTRIES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(REGISTRIES_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function loadRegistry(name: string): StoredRegistry | null {
  const regFile = join(REGISTRIES_DIR, `${name}.json`);
  if (!existsSync(regFile)) {
    return null;
  }
  return JSON.parse(readFileSync(regFile, 'utf-8'));
}

function deleteRegistry(name: string): boolean {
  const regFile = join(REGISTRIES_DIR, `${name}.json`);
  if (!existsSync(regFile)) {
    return false;
  }
  const fs = require('node:fs');
  fs.unlinkSync(regFile);
  return true;
}

async function createRegistryInteractive(): Promise<void> {
  clack.intro('Create Registry');

  const name = await clack.text({
    message: 'Registry name:',
    placeholder: 'my-registry',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Name can only contain letters, numbers, dashes, and underscores';
      if (loadRegistry(value)) return 'Registry with this name already exists';
    },
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  // Select issuer account
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    clack.outro('No accounts found. Create an account first.');
    return;
  }

  const issuerAlias = await clack.select({
    message: 'Select issuer account:',
    options: accounts.map(acc => ({
      value: acc.alias,
      label: acc.alias,
      hint: acc.pre.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(issuerAlias)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const issuer = accounts.find(a => a.alias === issuerAlias);
  if (!issuer) {
    clack.outro('Issuer account not found');
    return;
  }

  // Optional: backers
  const addBackers = await clack.confirm({
    message: 'Add backers (witnesses)?',
    initialValue: false,
  });

  if (clack.isCancel(addBackers)) {
    clack.cancel('Operation cancelled');
    return;
  }

  let baks: string[] = [];
  let toad: number | undefined;

  if (addBackers) {
    const bakersInput = await clack.text({
      message: 'Backer AIDs (comma-separated):',
      placeholder: 'BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8,...',
      validate: (value) => {
        if (!value) return 'At least one backer is required';
      },
    });

    if (clack.isCancel(bakersInput)) {
      clack.cancel('Operation cancelled');
      return;
    }

    baks = (bakersInput as string).split(',').map(b => b.trim());

    const toadInput = await clack.text({
      message: `Backer threshold (1-${baks.length}, default: auto):`,
      placeholder: 'auto',
      validate: (value) => {
        if (value && value !== 'auto') {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > baks.length) {
            return `Threshold must be between 1 and ${baks.length}`;
          }
        }
      },
    });

    if (clack.isCancel(toadInput)) {
      clack.cancel('Operation cancelled');
      return;
    }

    if (toadInput && toadInput !== 'auto') {
      toad = parseInt(toadInput as string);
    }
  }

  // Create registry
  const s = clack.spinner();
  s.start('Creating registry...');

  const options: RegistryInceptionOptions = {
    issuer: issuer.pre,
    baks,
  };

  if (toad !== undefined) {
    options.toad = toad;
  }

  const reg = registryIncept(options);

  s.stop('Registry created');

  // Save registry
  saveRegistry(name as string, reg, issuer.pre, issuer.alias, options.nonce || '', baks, toad || 0);

  clack.note(
    `Name:     ${name}\nIssuer:   ${issuer.alias}\nRegistry: ${reg.regk}\nSAID:     ${reg.said}\nStorage:  ${REGISTRIES_DIR}/${name}.json`,
    'Registry Created'
  );

  clack.outro('Done!');
}

async function listRegistriesInteractive(): Promise<void> {
  clack.intro('List Registries');

  const registries = listRegistries();

  if (registries.length === 0) {
    clack.outro('No registries found. Create one first!');
    return;
  }

  const lines = registries.map(r => `${r.name} (${r.issuerAlias}, ${r.regk.substring(0, 20)}...)`);
  clack.note(lines.join('\n'), `Found ${registries.length} registr${registries.length === 1 ? 'y' : 'ies'}`);

  clack.outro('Done!');
}

async function viewRegistryInteractive(): Promise<void> {
  clack.intro('View Registry');

  const registries = listRegistries();

  if (registries.length === 0) {
    clack.outro('No registries found. Create one first!');
    return;
  }

  const name = await clack.select({
    message: 'Select registry to view:',
    options: registries.map(r => ({
      value: r.name,
      label: r.name,
      hint: r.regk.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const stored = loadRegistry(name as string);
  if (!stored) {
    clack.outro('Registry not found');
    return;
  }

  clack.note(
    JSON.stringify(stored.sad, null, 2),
    `Registry: ${stored.name}`
  );

  clack.outro('Done!');
}

async function deleteRegistryInteractive(): Promise<void> {
  clack.intro('Delete Registry');

  const registries = listRegistries();

  if (registries.length === 0) {
    clack.outro('No registries found.');
    return;
  }

  const name = await clack.select({
    message: 'Select registry to delete:',
    options: registries.map(r => ({
      value: r.name,
      label: r.name,
      hint: r.regk.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const confirm = await clack.confirm({
    message: `Delete registry "${name}"?`,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel('Operation cancelled');
    return;
  }

  if (deleteRegistry(name as string)) {
    clack.outro(`Registry "${name}" deleted`);
  } else {
    clack.outro('Registry not found');
  }
}

export async function registriesMenu(): Promise<void> {
  while (true) {
    const action = await clack.select({
      message: 'Registry Management',
      options: [
        { value: 'create', label: 'Create Registry', hint: 'Create a new TEL registry' },
        { value: 'list', label: 'List Registries', hint: 'Show all registries' },
        { value: 'view', label: 'View Registry', hint: 'View registry details' },
        { value: 'delete', label: 'Delete Registry', hint: 'Remove a registry' },
        { value: 'back', label: 'Back', hint: 'Return to main menu' },
      ],
    });

    if (clack.isCancel(action)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    switch (action) {
      case 'create':
        await createRegistryInteractive();
        break;
      case 'list':
        await listRegistriesInteractive();
        break;
      case 'view':
        await viewRegistryInteractive();
        break;
      case 'delete':
        await deleteRegistryInteractive();
        break;
      case 'back':
        return;
    }
  }
}
