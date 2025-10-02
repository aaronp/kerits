import * as clack from '@clack/prompts';
import { receipt, type ReceiptOptions } from '../src/receipt';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STORAGE_DIR = process.env.KERITS_DIR || join(homedir(), '.kerits');
const RECEIPTS_DIR = join(STORAGE_DIR, 'receipts');
const CREDENTIALS_DIR = join(STORAGE_DIR, 'credentials');

interface Account {
  alias: string;
  pre: string;
  said: string;
  ked: Record<string, any>;
}

interface StoredCredential {
  name: string;
  sad: Record<string, any>;
  said: string;
}

interface StoredReceipt {
  name: string;
  eventType: string;  // 'kel' or 'credential'
  eventSaid: string;
  eventPre: string;
  eventSn: number;
  receiptor: string;  // Alias of the receipting account
  sad: Record<string, any>;
  raw: string;
  said: string;
  createdAt: string;
}

function ensureReceiptsDir(): void {
  if (!existsSync(RECEIPTS_DIR)) {
    mkdirSync(RECEIPTS_DIR, { recursive: true });
  }
}

function loadAccounts(): Account[] {
  const accountsFile = join(STORAGE_DIR, 'accounts.json');
  if (existsSync(accountsFile)) {
    return JSON.parse(readFileSync(accountsFile, 'utf-8'));
  }
  return [];
}

function listCredentials(): StoredCredential[] {
  if (!existsSync(CREDENTIALS_DIR)) {
    return [];
  }
  const files = readdirSync(CREDENTIALS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(CREDENTIALS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function saveReceipt(name: string, rct: { sad: Record<string, any>; raw: string; said: string }, eventType: string, eventSaid: string, eventPre: string, eventSn: number, receiptor: string): void {
  ensureReceiptsDir();

  const stored: StoredReceipt = {
    name,
    eventType,
    eventSaid,
    eventPre,
    eventSn,
    receiptor,
    sad: rct.sad,
    raw: rct.raw,
    said: rct.said,
    createdAt: new Date().toISOString(),
  };

  const receiptFile = join(RECEIPTS_DIR, `${name}.json`);
  writeFileSync(receiptFile, JSON.stringify(stored, null, 2));
}

function listReceipts(): StoredReceipt[] {
  ensureReceiptsDir();
  const files = readdirSync(RECEIPTS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(RECEIPTS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function loadReceipt(name: string): StoredReceipt | null {
  const receiptFile = join(RECEIPTS_DIR, `${name}.json`);
  if (!existsSync(receiptFile)) {
    return null;
  }
  return JSON.parse(readFileSync(receiptFile, 'utf-8'));
}

function deleteReceipt(name: string): boolean {
  const receiptFile = join(RECEIPTS_DIR, `${name}.json`);
  if (!existsSync(receiptFile)) {
    return false;
  }
  const fs = require('node:fs');
  fs.unlinkSync(receiptFile);
  return true;
}

async function createReceiptForKELEventInteractive(): Promise<void> {
  clack.intro('Create Receipt for KEL Event');

  const name = await clack.text({
    message: 'Receipt name:',
    placeholder: 'my-receipt',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Name can only contain letters, numbers, dashes, and underscores';
      if (loadReceipt(value)) return 'Receipt with this name already exists';
    },
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  // Select receipting account
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    clack.outro('No accounts found. Create an account first.');
    return;
  }

  const receiptorAlias = await clack.select({
    message: 'Select account to create receipt:',
    options: accounts.map(acc => ({
      value: acc.alias,
      label: acc.alias,
      hint: acc.pre.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(receiptorAlias)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const receiptor = accounts.find(a => a.alias === receiptorAlias);
  if (!receiptor) {
    clack.outro('Receiptor account not found');
    return;
  }

  // Select event to receipt
  const eventAccount = await clack.select({
    message: 'Select account whose event to receipt:',
    options: accounts.map(acc => ({
      value: acc.alias,
      label: acc.alias,
      hint: acc.pre.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(eventAccount)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const eventAcc = accounts.find(a => a.alias === eventAccount);
  if (!eventAcc) {
    clack.outro('Event account not found');
    return;
  }

  // Get sequence number
  const snInput = await clack.text({
    message: 'Sequence number of event (0 for inception):',
    placeholder: '0',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        return 'Sequence number must be >= 0';
      }
    },
  });

  if (clack.isCancel(snInput)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const sn = parseInt(snInput as string);

  // Create receipt
  const s = clack.spinner();
  s.start('Creating receipt...');

  const options: ReceiptOptions = {
    pre: eventAcc.pre,
    sn: sn,
    said: eventAcc.said,  // For inception, this is the same as pre
  };

  const rct = receipt(options);

  s.stop('Receipt created');

  // Save receipt
  saveReceipt(name as string, rct, 'kel', eventAcc.said, eventAcc.pre, sn, receiptor.alias);

  clack.note(
    `Name:       ${name}\nEvent:      ${eventAccount} (sn=${sn})\nReceipted:  ${eventAcc.pre}\nReceipting: ${receiptor.alias}\nStorage:    ${RECEIPTS_DIR}/${name}.json`,
    'Receipt Created'
  );

  clack.outro('Done!');
}

async function acceptCredentialInteractive(): Promise<void> {
  clack.intro('Accept Credential');

  const name = await clack.text({
    message: 'Receipt name:',
    placeholder: 'credential-acceptance',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Name can only contain letters, numbers, dashes, and underscores';
      if (loadReceipt(value)) return 'Receipt with this name already exists';
    },
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  // Select receipting account (recipient)
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    clack.outro('No accounts found. Create an account first.');
    return;
  }

  const receiptorAlias = await clack.select({
    message: 'Select recipient account (accepting credential):',
    options: accounts.map(acc => ({
      value: acc.alias,
      label: acc.alias,
      hint: acc.pre.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(receiptorAlias)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const receiptor = accounts.find(a => a.alias === receiptorAlias);
  if (!receiptor) {
    clack.outro('Receiptor account not found');
    return;
  }

  // Select credential to accept
  const credentials = listCredentials();
  if (credentials.length === 0) {
    clack.outro('No credentials found.');
    return;
  }

  const credName = await clack.select({
    message: 'Select credential to accept:',
    options: credentials.map(c => ({
      value: c.name,
      label: c.name,
      hint: c.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(credName)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const cred = credentials.find(c => c.name === credName);
  if (!cred) {
    clack.outro('Credential not found');
    return;
  }

  // Verify recipient matches (if credential has recipient field)
  const credRecipient = cred.sad.a?.i;
  if (credRecipient && credRecipient !== receiptor.pre) {
    const confirm = await clack.confirm({
      message: `Warning: This credential is issued to ${credRecipient}, but you are accepting it as ${receiptor.pre}. Continue?`,
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel('Operation cancelled');
      return;
    }
  }

  // Create receipt
  const s = clack.spinner();
  s.start('Creating acceptance receipt...');

  const options: ReceiptOptions = {
    pre: cred.sad.i,  // Issuer's prefix
    sn: 0,            // Credentials don't have sequence numbers in their receipt
    said: cred.said,  // Credential SAID
  };

  const rct = receipt(options);

  s.stop('Acceptance receipt created');

  // Save receipt
  saveReceipt(name as string, rct, 'credential', cred.said, cred.sad.i, 0, receiptor.alias);

  clack.note(
    `Name:       ${name}\nCredential: ${credName}\nIssuer:     ${cred.sad.i}\nRecipient:  ${receiptor.alias}\nStorage:    ${RECEIPTS_DIR}/${name}.json`,
    'Credential Accepted'
  );

  clack.outro('Done!');
}

async function listReceiptsInteractive(): Promise<void> {
  clack.intro('List Receipts');

  const receipts = listReceipts();

  if (receipts.length === 0) {
    clack.outro('No receipts found. Create one first!');
    return;
  }

  const lines = receipts.map(r => {
    const type = r.eventType === 'kel' ? 'KEL' : 'Credential';
    return `${r.name} (${type}, by ${r.receiptor})`;
  });
  clack.note(lines.join('\n'), `Found ${receipts.length} receipt(s)`);

  clack.outro('Done!');
}

async function viewReceiptInteractive(): Promise<void> {
  clack.intro('View Receipt');

  const receipts = listReceipts();

  if (receipts.length === 0) {
    clack.outro('No receipts found. Create one first!');
    return;
  }

  const name = await clack.select({
    message: 'Select receipt to view:',
    options: receipts.map(r => ({
      value: r.name,
      label: r.name,
      hint: `${r.eventType} by ${r.receiptor}`
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const stored = loadReceipt(name as string);
  if (!stored) {
    clack.outro('Receipt not found');
    return;
  }

  clack.note(
    JSON.stringify(stored.sad, null, 2),
    `Receipt: ${stored.name}`
  );

  clack.outro('Done!');
}

async function deleteReceiptInteractive(): Promise<void> {
  clack.intro('Delete Receipt');

  const receipts = listReceipts();

  if (receipts.length === 0) {
    clack.outro('No receipts found.');
    return;
  }

  const name = await clack.select({
    message: 'Select receipt to delete:',
    options: receipts.map(r => ({
      value: r.name,
      label: r.name,
      hint: `${r.eventType} by ${r.receiptor}`
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const confirm = await clack.confirm({
    message: `Delete receipt "${name}"?`,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel('Operation cancelled');
    return;
  }

  if (deleteReceipt(name as string)) {
    clack.outro(`Receipt "${name}" deleted`);
  } else {
    clack.outro('Receipt not found');
  }
}

export async function receiptsMenu(): Promise<void> {
  while (true) {
    const action = await clack.select({
      message: 'Receipt Management',
      options: [
        { value: 'accept-credential', label: 'Accept Credential', hint: 'Create receipt for received credential' },
        { value: 'receipt-kel', label: 'Receipt KEL Event', hint: 'Create receipt for KEL event' },
        { value: 'list', label: 'List Receipts', hint: 'Show all receipts' },
        { value: 'view', label: 'View Receipt', hint: 'View receipt details' },
        { value: 'delete', label: 'Delete Receipt', hint: 'Remove a receipt' },
        { value: 'back', label: 'Back', hint: 'Return to main menu' },
      ],
    });

    if (clack.isCancel(action)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    switch (action) {
      case 'accept-credential':
        await acceptCredentialInteractive();
        break;
      case 'receipt-kel':
        await createReceiptForKELEventInteractive();
        break;
      case 'list':
        await listReceiptsInteractive();
        break;
      case 'view':
        await viewReceiptInteractive();
        break;
      case 'delete':
        await deleteReceiptInteractive();
        break;
      case 'back':
        return;
    }
  }
}
