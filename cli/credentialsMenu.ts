import * as clack from '@clack/prompts';
import { credential, type CredentialOptions } from '../src/credential';
import { issue, type IssuanceOptions } from '../src/tel';
import { verifyCredential, getVerificationSummary } from '../src/verify';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STORAGE_DIR = process.env.KERITS_DIR || join(homedir(), '.kerits');
const CREDENTIALS_DIR = join(STORAGE_DIR, 'credentials');
const SCHEMAS_DIR = join(STORAGE_DIR, 'schemas');
const REGISTRIES_DIR = join(STORAGE_DIR, 'registries');

interface Account {
  alias: string;
  pre: string;
}

interface StoredSchema {
  name: string;
  said: string;
}

interface StoredCredential {
  name: string;
  sad: Record<string, any>;
  said: string;
  raw: string;
  createdAt: string;
  tel?: {
    regk: string;
    issEvent: Record<string, any>;
  };
}

interface StoredRegistry {
  name: string;
  regk: string;
  issuerAlias: string;
}

function ensureCredentialsDir(): void {
  if (!existsSync(CREDENTIALS_DIR)) {
    mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
}

function loadAccounts(): Account[] {
  const accountsFile = join(STORAGE_DIR, 'accounts.json');
  if (existsSync(accountsFile)) {
    return JSON.parse(readFileSync(accountsFile, 'utf-8'));
  }
  return [];
}

function listSchemas(): StoredSchema[] {
  if (!existsSync(SCHEMAS_DIR)) {
    return [];
  }
  const files = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(SCHEMAS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function listRegistries(): StoredRegistry[] {
  if (!existsSync(REGISTRIES_DIR)) {
    return [];
  }
  const files = readdirSync(REGISTRIES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(REGISTRIES_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function saveCredential(name: string, cred: { sad: Record<string, any>; raw: string; said: string }, telEvent?: { regk: string; issEvent: Record<string, any> }): void {
  ensureCredentialsDir();

  const stored: StoredCredential = {
    name,
    sad: cred.sad,
    said: cred.said,
    raw: cred.raw,
    createdAt: new Date().toISOString(),
  };

  if (telEvent) {
    stored.tel = telEvent;
  }

  const credFile = join(CREDENTIALS_DIR, `${name}.json`);
  writeFileSync(credFile, JSON.stringify(stored, null, 2));
}

function listCredentials(): StoredCredential[] {
  ensureCredentialsDir();
  const files = readdirSync(CREDENTIALS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(CREDENTIALS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function loadCredential(name: string): StoredCredential | null {
  const credFile = join(CREDENTIALS_DIR, `${name}.json`);
  if (!existsSync(credFile)) {
    return null;
  }
  return JSON.parse(readFileSync(credFile, 'utf-8'));
}

function deleteCredential(name: string): boolean {
  const credFile = join(CREDENTIALS_DIR, `${name}.json`);
  if (!existsSync(credFile)) {
    return false;
  }
  const fs = require('node:fs');
  fs.unlinkSync(credFile);
  return true;
}

async function createCredentialInteractive(): Promise<void> {
  clack.intro('Create Credential');

  const name = await clack.text({
    message: 'Credential name:',
    placeholder: 'my-credential',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Name can only contain letters, numbers, dashes, and underscores';
      if (loadCredential(value)) return 'Credential with this name already exists';
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

  // Select schema
  const schemas = listSchemas();
  if (schemas.length === 0) {
    clack.outro('No schemas found. Create a schema first.');
    return;
  }

  const schemaName = await clack.select({
    message: 'Select schema:',
    options: schemas.map(s => ({
      value: s.name,
      label: s.name,
      hint: s.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(schemaName)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const schema = schemas.find(s => s.name === schemaName);
  if (!schema) {
    clack.outro('Schema not found');
    return;
  }

  // Optional: recipient
  const addRecipient = await clack.confirm({
    message: 'Add recipient AID?',
    initialValue: false,
  });

  if (clack.isCancel(addRecipient)) {
    clack.cancel('Operation cancelled');
    return;
  }

  let recipient: string | undefined;

  if (addRecipient) {
    const recipientAlias = await clack.select({
      message: 'Select recipient account:',
      options: accounts.map(acc => ({
        value: acc.alias,
        label: acc.alias,
        hint: acc.pre.substring(0, 20) + '...'
      })),
    });

    if (clack.isCancel(recipientAlias)) {
      clack.cancel('Operation cancelled');
      return;
    }

    const recipientAccount = accounts.find(a => a.alias === recipientAlias);
    if (recipientAccount) {
      recipient = recipientAccount.pre;
    }
  }

  // Credential data
  const dataInput = await clack.text({
    message: 'Credential data (JSON format):',
    placeholder: '{"name":"John Doe","age":30}',
    validate: (value) => {
      if (!value) return 'Data is required';
      try {
        JSON.parse(value);
      } catch {
        return 'Invalid JSON';
      }
    },
  });

  if (clack.isCancel(dataInput)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const data = JSON.parse(dataInput as string);

  // Optional: TEL issuance
  const registries = listRegistries();
  let telEvent: { regk: string; issEvent: Record<string, any> } | undefined;

  if (registries.length > 0) {
    const useRegistry = await clack.confirm({
      message: 'Record issuance in TEL registry?',
      initialValue: false,
    });

    if (clack.isCancel(useRegistry)) {
      clack.cancel('Operation cancelled');
      return;
    }

    if (useRegistry) {
      const registryName = await clack.select({
        message: 'Select registry:',
        options: registries.map(r => ({
          value: r.name,
          label: r.name,
          hint: r.regk.substring(0, 20) + '...'
        })),
      });

      if (clack.isCancel(registryName)) {
        clack.cancel('Operation cancelled');
        return;
      }

      const registry = registries.find(r => r.name === registryName);
      if (!registry) {
        clack.outro('Registry not found');
        return;
      }

      // We'll create the issuance event after creating the credential
      telEvent = { regk: registry.regk, issEvent: {} };
    }
  }

  // Create credential
  const s = clack.spinner();
  s.start('Creating credential...');

  const options: CredentialOptions = {
    schema: schema.said,
    issuer: issuer.pre,
    data,
    recipient,
  };

  const cred = credential(options);

  s.stop('Credential created');

  // Create TEL issuance event if requested
  if (telEvent) {
    s.start('Creating TEL issuance event...');

    const issOptions: IssuanceOptions = {
      vcdig: cred.said,
      regk: telEvent.regk,
      dt: cred.sad.a.dt,  // Use credential's datetime
    };

    const issEvent = issue(issOptions);
    telEvent.issEvent = issEvent.sad;

    s.stop('TEL issuance event created');
  }

  // Save credential
  saveCredential(name as string, cred, telEvent);

  let noteText = `Name:     ${name}\nSAID:     ${cred.said}\nIssuer:   ${issuer.alias}\nSchema:   ${schemaName}`;
  if (telEvent) {
    noteText += `\nRegistry: ${telEvent.regk}`;
  }
  noteText += `\nStorage:  ${CREDENTIALS_DIR}/${name}.json`;

  clack.note(noteText, 'Credential Created');

  clack.outro('Done!');
}

async function listCredentialsInteractive(): Promise<void> {
  clack.intro('List Credentials');

  const credentials = listCredentials();

  if (credentials.length === 0) {
    clack.outro('No credentials found. Create one first!');
    return;
  }

  const lines = credentials.map(c => `${c.name} (${c.said.substring(0, 20)}...)`);
  clack.note(lines.join('\n'), `Found ${credentials.length} credential(s)`);

  clack.outro('Done!');
}

async function viewCredentialInteractive(): Promise<void> {
  clack.intro('View Credential');

  const credentials = listCredentials();

  if (credentials.length === 0) {
    clack.outro('No credentials found. Create one first!');
    return;
  }

  const name = await clack.select({
    message: 'Select credential to view:',
    options: credentials.map(c => ({
      value: c.name,
      label: c.name,
      hint: c.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const stored = loadCredential(name as string);
  if (!stored) {
    clack.outro('Credential not found');
    return;
  }

  clack.note(
    JSON.stringify(stored.sad, null, 2),
    `Credential: ${stored.name}`
  );

  clack.outro('Done!');
}

async function deleteCredentialInteractive(): Promise<void> {
  clack.intro('Delete Credential');

  const credentials = listCredentials();

  if (credentials.length === 0) {
    clack.outro('No credentials found.');
    return;
  }

  const name = await clack.select({
    message: 'Select credential to delete:',
    options: credentials.map(c => ({
      value: c.name,
      label: c.name,
      hint: c.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const confirm = await clack.confirm({
    message: `Delete credential "${name}"?`,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel('Operation cancelled');
    return;
  }

  if (deleteCredential(name as string)) {
    clack.outro(`Credential "${name}" deleted`);
  } else {
    clack.outro('Credential not found');
  }
}

export async function credentialsMenu(): Promise<void> {
  while (true) {
    const action = await clack.select({
      message: 'Credential Management',
      options: [
        { value: 'create', label: 'Create Credential', hint: 'Issue a new verifiable credential' },
        { value: 'list', label: 'List Credentials', hint: 'Show all credentials' },
        { value: 'view', label: 'View Credential', hint: 'View credential details' },
        { value: 'verify', label: 'Verify Credential', hint: 'Verify credential integrity' },
        { value: 'delete', label: 'Delete Credential', hint: 'Remove a credential' },
        { value: 'back', label: 'Back', hint: 'Return to main menu' },
      ],
    });

    if (clack.isCancel(action)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    switch (action) {
      case 'create':
        await createCredentialInteractive();
        break;
      case 'list':
        await listCredentialsInteractive();
        break;
      case 'view':
        await viewCredentialInteractive();
        break;
      case 'verify':
        await verifyCredentialInteractive();
        break;
      case 'delete':
        await deleteCredentialInteractive();
        break;
      case 'back':
        return;
    }
  }
}

async function verifyCredentialInteractive(): Promise<void> {
  clack.intro('Verify Credential');

  const credentials = listCredentials();

  if (credentials.length === 0) {
    clack.outro('No credentials found. Create one first!');
    return;
  }

  const name = await clack.select({
    message: 'Select credential to verify:',
    options: credentials.map(c => ({
      value: c.name,
      label: c.name,
      hint: c.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const stored = loadCredential(name as string);
  if (!stored) {
    clack.outro('Credential not found');
    return;
  }

  // Verify the credential
  const s = clack.spinner();
  s.start('Verifying credential...');

  const result = verifyCredential(stored.sad);

  s.stop(result.valid ? 'Verification completed: VALID ✓' : 'Verification completed: INVALID ✗');

  // Display detailed results
  const summary = getVerificationSummary(result);
  clack.note(summary, `Credential: ${stored.name}`);

  clack.outro('Done!');
}
