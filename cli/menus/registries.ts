/**
 * Registries Menu
 */
import * as p from '@clack/prompts';
import { getCurrentAccount, loadAccountDSL } from '../utils/storage.js';
import { showGraph } from '../utils/graph.js';
import { writeFile } from 'fs/promises';
import { selectRegistryToExplore } from './explorer.js';

export async function registriesMenu(): Promise<void> {
  const currentAccount = await getCurrentAccount();

  p.intro('Credential Registries');

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
      { value: 'create', label: 'Create New Registry' },
      { value: 'select', label: 'Select Registry (manage credentials)' },
      { value: 'explore', label: '🔍 Explore Registry (tree view)' },
      { value: 'back', label: 'Back to Main Menu' },
    ],
  });

  if (p.isCancel(action) || action === 'back') {
    return;
  }

  switch (action) {
    case 'create':
      await createRegistry(currentAccount);
      break;
    case 'select':
      await selectRegistry(currentAccount);
      break;
    case 'explore':
      await selectRegistryToExplore(currentAccount);
      break;
  }

  // Return to registries menu
  await registriesMenu();
}

async function createRegistry(currentAccount: string): Promise<void> {
  const alias = await p.text({
    message: 'Enter registry alias:',
    validate: (value) => {
      if (!value) return 'Alias is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Alias must contain only lowercase letters, numbers, and hyphens';
    },
  });

  if (p.isCancel(alias)) return;

  const s = p.spinner();
  s.start('Creating registry...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to create registry');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const registryDsl = await accountDsl.createRegistry(alias);
    const registryId = registryDsl.registry.registryId;

    s.stop(`Registry '${alias}' created`);
    p.note(`Registry ID: ${registryId}`, 'Success');
  } catch (error) {
    s.stop('Failed to create registry');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function selectRegistry(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading registries...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const accountDsl = await dsl.account(currentAccount);

    if (!accountDsl) {
      s.stop('Failed to load registries');
      p.log.error(`Account '${currentAccount}' not found`);
      return;
    }

    const registries = await accountDsl.listRegistries();

    s.stop();

    if (registries.length === 0) {
      p.note('No registries found. Create a registry first.', 'Info');
      return;
    }

    // registries is an array of aliases (strings)
    const options = registries.map(alias => ({
      value: alias,
      label: alias,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select registry:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    // Go to credentials menu for this registry
    await credentialsMenu(currentAccount, selected);
  } catch (error) {
    s.stop('Failed to load registries');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function credentialsMenu(accountAlias: string, registryAlias: string): Promise<void> {
  const { dsl } = await loadAccountDSL(accountAlias);
  const accountDsl = await dsl.account(accountAlias);

  if (!accountDsl) {
    p.log.error(`Account '${accountAlias}' not found`);
    return;
  }

  const registryDsl = await accountDsl.registry(registryAlias);

  if (!registryDsl) {
    p.log.error(`Registry '${registryAlias}' not found`);
    return;
  }

  const registryId = registryDsl.registry.registryId;

  p.intro(`Credentials - ${registryAlias}`);
  p.note(registryId, 'Registry ID');

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'list', label: 'List Credentials' },
      { value: 'create', label: 'Create New Credential' },
      { value: 'revoke', label: 'Revoke Credential' },
      { value: 'graph', label: 'Show Credentials Graph' },
      { value: 'export', label: 'Export Credential' },
      { value: 'back', label: 'Back to Registries' },
    ],
  });

  if (p.isCancel(action) || action === 'back') {
    return;
  }

  switch (action) {
    case 'list':
      await listCredentials(registryDsl, registryAlias);
      break;
    case 'create':
      await createCredential(dsl, accountDsl, registryDsl, registryAlias);
      break;
    case 'revoke':
      await revokeCredential(registryDsl, registryAlias);
      break;
    case 'graph':
      await showCredentialsGraph(registryDsl, registryAlias);
      break;
    case 'export':
      await exportCredential(registryDsl, registryAlias);
      break;
  }

  // Return to credentials menu
  await credentialsMenu(accountAlias, registryAlias);
}

async function listCredentials(registryDsl: any, registryAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading credentials...');

  try {
    const credentials = await registryDsl.listCredentials();
    s.stop();

    if (credentials.length === 0) {
      p.note('No credentials found.', 'Info');
      return;
    }

    const table: string[] = [];
    table.push('SAID              Schema          Issued      Status');
    table.push('───────────────────────────────────────────────────────');

    credentials.forEach((cred: any) => {
      const said = cred.said.substring(0, 16) + '...';
      const schema = cred.schema || 'unknown';
      const issued = cred.issued ? new Date(cred.issued).toISOString().split('T')[0] : 'unknown';
      const status = cred.revoked ? 'revoked' : 'active';

      table.push(`${said.padEnd(18)} ${schema.padEnd(16)} ${issued.padEnd(12)} ${status}`);
    });

    p.note(table.join('\n') + `\n\nTotal: ${credentials.length} credentials`, `Credentials in ${registryAlias}`);
  } catch (error) {
    s.stop('Failed to load credentials');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function createCredential(dsl: any, accountDsl: any, registryDsl: any, registryAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading schemas...');

  try {
    const schemas = await dsl.listSchemas();
    s.stop();

    if (schemas.length === 0) {
      p.note('No schemas found. Create a schema first.', 'Info');
      return;
    }

    // schemas is an array of aliases (strings)
    const schemaOptions = schemas.map((alias: string) => ({
      value: alias,
      label: alias,
    }));
    schemaOptions.push({ value: 'cancel', label: 'Cancel' });

    const selectedSchema = await p.select({
      message: 'Select schema:',
      options: schemaOptions,
    });

    if (p.isCancel(selectedSchema) || selectedSchema === 'cancel') return;

    // Get schema details
    const schemaDsl = await dsl.schema(selectedSchema);

    if (!schemaDsl) {
      p.log.error(`Schema '${selectedSchema}' not found`);
      return;
    }

    const schemaData = schemaDsl.getSchema();

    p.note(selectedSchema, 'Schema');

    // Prompt for each field
    const credentialData: any = {};

    if (schemaData.properties) {
      for (const [fieldName, fieldDef] of Object.entries(schemaData.properties)) {
        const fieldType = (fieldDef as any).type || 'string';
        const value = await p.text({
          message: `${fieldName} (${fieldType}):`,
        });

        if (p.isCancel(value)) return;

        // Convert to appropriate type
        if (fieldType === 'number') {
          credentialData[fieldName] = parseFloat(value);
        } else if (fieldType === 'boolean') {
          credentialData[fieldName] = value.toLowerCase() === 'true';
        } else {
          credentialData[fieldName] = value;
        }
      }
    }

    // Prompt for recipient
    const recipientChoice = await p.select({
      message: 'Recipient (optional):',
      options: [
        { value: 'contacts', label: 'Select from contacts' },
        { value: 'manual', label: 'Enter AID manually' },
        { value: 'none', label: 'No recipient (self-signed)' },
      ],
    });

    if (p.isCancel(recipientChoice)) return;

    let recipientAid: string | undefined;

    if (recipientChoice === 'contacts') {
      const contactsDsl = accountDsl.contacts();
      const contacts = await contactsDsl.getAll();
      if (contacts.length === 0) {
        p.note('No contacts found.', 'Info');
      } else {
        const contactOptions = contacts.map((contact: any) => ({
          value: contact.aid,
          label: `${contact.alias} (${contact.aid.substring(0, 16)}...)`,
        }));
        contactOptions.push({ value: 'cancel', label: 'Cancel' });

        const selectedContact = await p.select({
          message: 'Select contact:',
          options: contactOptions,
        });

        if (!p.isCancel(selectedContact) && selectedContact !== 'cancel') {
          recipientAid = selectedContact;
        }
      }
    } else if (recipientChoice === 'manual') {
      const aidInput = await p.text({
        message: 'Enter recipient AID:',
      });

      if (!p.isCancel(aidInput)) {
        recipientAid = aidInput;
      }
    }

    // If no recipient was selected, use self-signed (account's own AID)
    const holder = recipientAid || accountDsl.account.aid;

    const spinner = p.spinner();
    spinner.start('Creating credential...');

    try {
      const acdcDsl = await registryDsl.issue({
        schema: selectedSchema,
        holder: holder,
        data: credentialData,
      });

      const credentialId = acdcDsl.acdc.credentialId;
      const issued = new Date().toISOString();

      spinner.stop('Credential created');
      p.note(`Credential ID: ${credentialId}\nSchema: ${selectedSchema}\nIssued: ${issued}`, 'Success');
    } catch (error) {
      spinner.stop('Failed to create credential');
      throw error;
    }
  } catch (error) {
    s.stop('Failed to create credential');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function revokeCredential(registryDsl: any, registryAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading credentials...');

  try {
    const credentials = await registryDsl.listCredentials();
    s.stop();

    if (credentials.length === 0) {
      p.note('No credentials found.', 'Info');
      return;
    }

    const options = credentials.map((cred: any) => ({
      value: cred.said,
      label: `${cred.said.substring(0, 16)}... (${cred.schema}, ${cred.issued ? new Date(cred.issued).toISOString().split('T')[0] : 'unknown'})`,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select credential to revoke:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    const confirm = await p.select({
      message: `Are you sure you want to revoke this credential?\nSAID: ${selected}`,
      options: [
        { value: 'yes', label: 'Yes, revoke it' },
        { value: 'no', label: 'No, cancel' },
      ],
    });

    if (p.isCancel(confirm) || confirm === 'no') return;

    const spinner = p.spinner();
    spinner.start('Revoking credential...');

    const acdcDsl = registryDsl.credential(selected);
    await acdcDsl.revoke();

    spinner.stop('Credential revoked successfully');
  } catch (error) {
    s.stop('Failed to revoke credential');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function showCredentialsGraph(registryDsl: any, registryAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading graph...');

  try {
    const graph = await registryDsl.graph();
    s.stop();

    await showGraph(graph, `Credentials Graph - ${registryAlias}`);
  } catch (error) {
    s.stop('Failed to load graph');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function exportCredential(registryDsl: any, registryAlias: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading credentials...');

  try {
    const credentials = await registryDsl.listCredentials();
    s.stop();

    if (credentials.length === 0) {
      p.note('No credentials found.', 'Info');
      return;
    }

    const options = credentials.map((cred: any) => ({
      value: cred.said,
      label: `${cred.said.substring(0, 16)}... (${cred.schema})`,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select credential to export:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    const format = await p.select({
      message: 'Export format:',
      options: [
        { value: 'cesr', label: 'CESR (raw, standard KERI format)' },
        { value: 'json', label: 'JSON (with metadata)' },
      ],
    }) as 'cesr' | 'json';

    if (p.isCancel(format)) return;

    const extension = format === 'json' ? 'json' : 'cesr';
    const defaultPath = `./${registryAlias}-credential.${extension}`;
    const filePathInput = await p.text({
      message: 'Export to file:',
      placeholder: defaultPath,
      defaultValue: defaultPath,
    });

    if (p.isCancel(filePathInput)) return;

    // Use default if user just pressed enter
    const filePath = filePathInput.trim() || defaultPath;

    const spinner = p.spinner();
    spinner.start('Exporting credential...');

    const acdcDsl = registryDsl.credential(selected);
    const exportDsl = await acdcDsl.export();

    // Create parent directories if needed
    const { mkdir, stat } = await import('fs/promises');
    const { dirname } = await import('path');
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });

    // Export with specified format
    await exportDsl.toFile(filePath, format);

    // Get file size
    const stats = await stat(filePath);

    spinner.stop(`Credential exported to '${filePath}'`);
    p.note(`Format: ${format.toUpperCase()}\nFile size: ${(stats.size / 1024).toFixed(1)} KB`, 'Success');
  } catch (error) {
    s.stop('Failed to export credential');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}
