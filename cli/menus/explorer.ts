/**
 * Registry Explorer - Tree navigation for ACDCs
 */
import * as p from '@clack/prompts';
import { loadAccountDSL } from '../utils/storage.js';
import type { IndexedACDC } from '../../src/app/indexer/types.js';

/**
 * Explore a registry with tree navigation
 */
export async function exploreRegistry(
  accountAlias: string,
  registryAlias: string
): Promise<void> {
  const s = p.spinner();
  s.start('Loading registry...');

  try {
    const { dsl } = await loadAccountDSL(accountAlias);
    const accountDsl = await dsl.account(accountAlias);
    if (!accountDsl) {
      s.stop('Account not found');
      return;
    }

    const registryDsl = await accountDsl.registry(registryAlias);
    if (!registryDsl) {
      s.stop('Registry not found');
      return;
    }

    // Get indexed view
    const indexed = await registryDsl.index();
    s.stop();

    p.intro(`Explore Registry: ${registryAlias}`);
    p.note(
      `Credentials: ${indexed.credentialCount}\n` +
      `Issued: ${indexed.issuedCount}\n` +
      `Revoked: ${indexed.revokedCount}\n` +
      `Registry ID: ${indexed.registryId.substring(0, 20)}...`,
      'Registry Stats'
    );

    if (indexed.credentials.length === 0) {
      p.note('No credentials found in this registry.', 'Info');
      return;
    }

    // Show credentials as tree
    const credOptions = indexed.credentials.map(cred => ({
      value: cred.credentialId,
      label: `${cred.credentialId.substring(0, 16)}... (${cred.status}) - Issued: ${new Date(cred.issuedAt).toLocaleDateString()}`,
    }));
    credOptions.push({ value: 'back', label: 'Back to Registries' });

    const selected = await p.select({
      message: 'Select credential to explore:',
      options: credOptions,
    });

    if (p.isCancel(selected) || selected === 'back') return;

    const credential = indexed.credentials.find(c => c.credentialId === selected);
    if (credential) {
      await exploreCredential(accountAlias, registryAlias, credential);
    }

    // Loop back to registry explorer
    await exploreRegistry(accountAlias, registryAlias);

  } catch (error) {
    s.stop('Failed to load registry');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Explore a specific credential with all its details
 */
async function exploreCredential(
  accountAlias: string,
  registryAlias: string,
  indexed: IndexedACDC
): Promise<void> {
  p.intro(`Credential: ${indexed.credentialId.substring(0, 20)}...`);

  p.note(
    `Status: ${indexed.status}\n` +
    `Issued: ${new Date(indexed.issuedAt).toLocaleString()}\n` +
    `Issuer: ${indexed.issuerAid.substring(0, 20)}...\n` +
    `Holder: ${indexed.holderAid ? indexed.holderAid.substring(0, 20) + '...' : '(self-signed)'}` +
    (indexed.revokedAt ? `\nRevoked: ${new Date(indexed.revokedAt).toLocaleString()}` : ''),
    'Overview'
  );

  const action = await p.select({
    message: 'What would you like to view?',
    options: [
      { value: 'data', label: '📋 View Latest Data (Fields & Values)' },
      { value: 'schemas', label: '📐 View Schemas' },
      { value: 'counterparties', label: '👥 View Counterparties' },
      { value: 'history', label: '📜 View TEL History' },
      { value: 'export', label: '💾 Export Credential' },
      { value: 'back', label: 'Back to Credentials' },
    ],
  });

  if (p.isCancel(action) || action === 'back') return;

  switch (action) {
    case 'data':
      await viewCredentialData(indexed);
      break;

    case 'schemas':
      await viewSchemas(indexed);
      break;

    case 'counterparties':
      await viewCounterparties(indexed);
      break;

    case 'history':
      await viewHistory(indexed);
      break;

    case 'export':
      await exportCredential(accountAlias, registryAlias, indexed);
      break;
  }

  // Loop back to credential explorer
  await exploreCredential(accountAlias, registryAlias, indexed);
}

/**
 * View credential data fields and values
 */
async function viewCredentialData(indexed: IndexedACDC): Promise<void> {
  const fields = Object.entries(indexed.latestData);

  if (fields.length === 0) {
    p.note('No data fields found.', 'Credential Data');
  } else {
    const dataLines = fields.map(([key, value]) => {
      const valueStr = typeof value === 'object'
        ? JSON.stringify(value, null, 2).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n')
        : String(value);
      return `${key}: ${valueStr}`;
    }).join('\n\n');

    p.note(dataLines, 'Credential Data');
  }

  await p.select({
    message: '',
    options: [{ value: 'ok', label: 'Continue' }],
  });
}

/**
 * View schemas used by the credential
 */
async function viewSchemas(indexed: IndexedACDC): Promise<void> {
  if (indexed.schemas.length === 0) {
    p.note('No schemas found.', 'Schemas');
  } else {
    const schemaLines = indexed.schemas.map(s =>
      `SAID: ${s.schemaSaid}\n` +
      `First used: ${new Date(s.firstUsedAt).toLocaleString()}\n` +
      `Event: ${s.eventSaid.substring(0, 20)}...`
    ).join('\n\n');

    p.note(schemaLines, `Schemas (${indexed.schemas.length})`);
  }

  await p.select({
    message: '',
    options: [{ value: 'ok', label: 'Continue' }],
  });
}

/**
 * View counterparties (all parties that interacted with the credential)
 */
async function viewCounterparties(indexed: IndexedACDC): Promise<void> {
  if (indexed.counterparties.length === 0) {
    p.note('No counterparties found.', 'Counterparties');
  } else {
    const partyLines = indexed.counterparties.map(cp =>
      `AID: ${cp.aid.substring(0, 20)}...\n` +
      `Role: ${cp.role}\n` +
      `First interaction: ${new Date(cp.firstInteractionAt).toLocaleString()}\n` +
      `Events: ${cp.eventSaids.length}`
    ).join('\n\n');

    p.note(partyLines, `Counterparties (${indexed.counterparties.length})`);
  }

  await p.select({
    message: '',
    options: [{ value: 'ok', label: 'Continue' }],
  });
}

/**
 * View TEL event history
 */
async function viewHistory(indexed: IndexedACDC): Promise<void> {
  if (indexed.telEvents.length === 0) {
    p.note('No events found.', 'TEL History');
  } else {
    const historyLines = indexed.telEvents.map(evt =>
      `[${evt.sequenceNumber}] ${evt.eventType.toUpperCase()} - ${new Date(evt.timestamp).toLocaleString()}\n` +
      `  ${evt.summary}\n` +
      `  Event: ${evt.eventSaid.substring(0, 20)}...`
    ).join('\n\n');

    p.note(historyLines, `TEL History (${indexed.telEvents.length} events)`);
  }

  await p.select({
    message: '',
    options: [{ value: 'ok', label: 'Continue' }],
  });
}

/**
 * Export credential to file
 */
async function exportCredential(
  accountAlias: string,
  registryAlias: string,
  indexed: IndexedACDC
): Promise<void> {
  const format = await p.select({
    message: 'Export format:',
    options: [
      { value: 'cesr', label: 'CESR (raw, standard KERI format)' },
      { value: 'json', label: 'JSON (with metadata)' },
    ],
  }) as 'cesr' | 'json';

  if (p.isCancel(format)) return;

  const extension = format === 'json' ? 'json' : 'cesr';
  const defaultPath = `./${registryAlias}-${indexed.credentialId.substring(0, 8)}.${extension}`;

  const filePathInput = await p.text({
    message: 'Export to file:',
    placeholder: defaultPath,
    defaultValue: defaultPath,
  });

  if (p.isCancel(filePathInput)) return;

  // Use default if user just pressed enter
  const filePath = filePathInput.trim() || defaultPath;

  const s = p.spinner();
  s.start('Exporting credential...');

  try {
    const { dsl } = await loadAccountDSL(accountAlias);
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.registry(registryAlias);
    const acdcDsl = await registryDsl!.acdc(indexed.credentialId);

    if (!acdcDsl) {
      s.stop('Credential not found');
      return;
    }

    const exportDsl = await acdcDsl.export();

    // Create parent directories if needed
    const { mkdir, stat } = await import('fs/promises');
    const { dirname } = await import('path');
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });

    // Export with specified format
    await exportDsl.toFile(filePath, format);

    // Get file size after writing
    const stats = await stat(filePath);

    s.stop(`Credential exported to '${filePath}'`);
    p.note(`Format: ${format.toUpperCase()}\nFile size: ${(stats.size / 1024).toFixed(1)} KB`, 'Success');
  } catch (error) {
    s.stop('Failed to export credential');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Select a registry to explore
 */
export async function selectRegistryToExplore(accountAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading registries...');

  try {
    const { dsl } = await loadAccountDSL(accountAlias);
    const accountDsl = await dsl.account(accountAlias);
    if (!accountDsl) {
      s.stop('Account not found');
      return;
    }

    const registries = await accountDsl.listRegistries();
    s.stop();

    if (registries.length === 0) {
      p.note('No registries found. Create a registry first.', 'Info');
      return;
    }

    const options = registries.map(alias => ({
      value: alias,
      label: alias,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select registry to explore:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    await exploreRegistry(accountAlias, selected);
  } catch (error) {
    s.stop('Failed to load registries');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}
