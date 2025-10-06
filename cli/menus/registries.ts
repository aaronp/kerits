/**
 * Registries Menu
 */
import * as p from '@clack/prompts';
import { getCurrentAccount, loadAccountDSL } from '../utils/storage.js';
import { showGraph } from '../utils/graph.js';
import { writeFile } from 'fs/promises';

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
    const accountDsl = dsl.account(currentAccount);
    const registryDsl = await accountDsl.createRegistry(alias);

    const registryId = await registryDsl.getRegistryId();

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
    const accountDsl = dsl.account(currentAccount);
    const registries = await accountDsl.listRegistries();

    s.stop();

    if (registries.length === 0) {
      p.note('No registries found. Create a registry first.', 'Info');
      return;
    }

    const options = registries.map(reg => ({
      value: reg.alias,
      label: `${reg.alias} (${reg.id.substring(0, 16)}...)`,
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
  const accountDsl = dsl.account(accountAlias);
  const registryDsl = accountDsl.registry(registryAlias);
  const registryId = await registryDsl.getRegistryId();

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

    const schemaOptions = schemas.map((schema: any) => ({
      value: schema.name,
      label: schema.name,
    }));
    schemaOptions.push({ value: 'cancel', label: 'Cancel' });

    const selectedSchema = await p.select({
      message: 'Select schema:',
      options: schemaOptions,
    });

    if (p.isCancel(selectedSchema) || selectedSchema === 'cancel') return;

    // Get schema details
    const schemaDsl = dsl.schema(selectedSchema);
    const schemaData = await schemaDsl.get();

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
      const contacts = await accountDsl.listContacts();
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

    const spinner = p.spinner();
    spinner.start('Creating credential...');

    const acdcDsl = await registryDsl.issue({
      schema: selectedSchema,
      data: credentialData,
      recipient: recipientAid,
    });

    const said = await acdcDsl.getSaid();
    const issued = new Date().toISOString();

    spinner.stop('Credential created');
    p.note(`SAID: ${said}\nSchema: ${selectedSchema}\nIssued: ${issued}`, 'Success');
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

    const defaultPath = `./${registryAlias}-credential.cesr`;
    const filePath = await p.text({
      message: 'Export to file:',
      placeholder: defaultPath,
      defaultValue: defaultPath,
    });

    if (p.isCancel(filePath)) return;

    const spinner = p.spinner();
    spinner.start('Exporting credential...');

    const acdcDsl = registryDsl.credential(selected);
    const acdcCesr = await acdcDsl.export();

    await writeFile(filePath, acdcCesr);

    spinner.stop(`Credential exported to '${filePath}'`);
  } catch (error) {
    s.stop('Failed to export credential');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}
