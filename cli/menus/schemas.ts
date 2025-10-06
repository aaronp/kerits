/**
 * Schemas Menu
 */
import * as p from '@clack/prompts';
import { getCurrentAccount, loadAccountDSL } from '../utils/storage.js';
import { readFile, writeFile } from 'fs/promises';

export async function schemasMenu(): Promise<void> {
  const currentAccount = await getCurrentAccount();

  p.intro('Schemas');

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
      { value: 'list', label: 'List Schemas' },
      { value: 'create', label: 'Create New Schema' },
      { value: 'view', label: 'View Schema' },
      { value: 'export', label: 'Export Schema to File' },
      { value: 'import', label: 'Import Schema from File' },
      { value: 'back', label: 'Back to Main Menu' },
    ],
  });

  if (p.isCancel(action) || action === 'back') {
    return;
  }

  switch (action) {
    case 'list':
      await listSchemas(currentAccount);
      break;
    case 'create':
      await createSchema(currentAccount);
      break;
    case 'view':
      await viewSchema(currentAccount);
      break;
    case 'export':
      await exportSchema(currentAccount);
      break;
    case 'import':
      await importSchema(currentAccount);
      break;
  }

  // Return to schemas menu
  await schemasMenu();
}

async function listSchemas(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading schemas...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const schemaAliases = await dsl.listSchemas();

    s.stop();

    if (schemaAliases.length === 0) {
      p.note('No schemas found.', 'Info');
      return;
    }

    const table: string[] = [];
    table.push('Name              Schema ID         Fields');
    table.push('──────────────────────────────────────────────');

    // Fetch details for each schema
    for (const alias of schemaAliases) {
      const schemaDsl = await dsl.schema(alias);
      if (!schemaDsl) continue;

      const name = alias.padEnd(18);
      const schemaId = schemaDsl.schema.schemaId.substring(0, 16) + '...';
      const schemaData = schemaDsl.getSchema();
      const fieldsCount = schemaData.properties ? Object.keys(schemaData.properties).length : 0;

      table.push(`${name} ${schemaId.padEnd(18)} ${fieldsCount}`);
    }

    p.note(table.join('\n') + `\n\nTotal: ${schemaAliases.length} schemas`, `Schemas for ${currentAccount}`);
  } catch (error) {
    s.stop('Failed to load schemas');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function createSchema(currentAccount: string): Promise<void> {
  const name = await p.text({
    message: 'Schema name:',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Name must contain only lowercase letters, numbers, and hyphens';
    },
  });

  if (p.isCancel(name)) return;

  const method = await p.select({
    message: 'How would you like to create the schema?',
    options: [
      { value: 'interactive', label: 'Interactive (prompt for each field)' },
      { value: 'json', label: 'JSON input (paste JSON)' },
      { value: 'file', label: 'From file' },
    ],
  });

  if (p.isCancel(method)) return;

  let schemaDefinition: any;

  if (method === 'interactive') {
    schemaDefinition = await createSchemaInteractive();
  } else if (method === 'json') {
    const jsonInput = await p.text({
      message: 'Paste JSON schema definition:',
    });

    if (p.isCancel(jsonInput)) return;

    try {
      schemaDefinition = JSON.parse(jsonInput);
    } catch (error) {
      p.log.error('Invalid JSON');
      return;
    }
  } else if (method === 'file') {
    const filePath = await p.text({
      message: 'Schema file path:',
    });

    if (p.isCancel(filePath)) return;

    try {
      const fileContent = await readFile(filePath, 'utf-8');
      schemaDefinition = JSON.parse(fileContent);
    } catch (error) {
      p.log.error('Failed to read or parse file');
      return;
    }
  }

  if (!schemaDefinition) return;

  const s = p.spinner();
  s.start('Creating schema...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const schemaDsl = await dsl.createSchema(name, schemaDefinition);

    const schemaId = schemaDsl.schema.schemaId;
    const fieldsCount = schemaDefinition.properties ? Object.keys(schemaDefinition.properties).length : 0;

    s.stop(`Schema '${name}' created`);
    p.note(`Schema ID: ${schemaId}\nFields: ${fieldsCount}`, 'Success');
  } catch (error) {
    s.stop('Failed to create schema');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function createSchemaInteractive(): Promise<any> {
  const properties: any = {};
  const required: string[] = [];

  let addAnother = true;

  while (addAnother) {
    const fieldName = await p.text({
      message: 'Field name:',
      validate: (value) => {
        if (!value) return 'Field name is required';
      },
    });

    if (p.isCancel(fieldName)) return null;

    const fieldType = await p.select({
      message: `Field type for '${fieldName}':`,
      options: [
        { value: 'string', label: 'string' },
        { value: 'number', label: 'number' },
        { value: 'boolean', label: 'boolean' },
        { value: 'object', label: 'object' },
        { value: 'array', label: 'array' },
      ],
    });

    if (p.isCancel(fieldType)) return null;

    const isRequired = await p.select({
      message: `Is '${fieldName}' required?`,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    });

    if (p.isCancel(isRequired)) return null;

    properties[fieldName] = { type: fieldType };
    if (isRequired === 'yes') {
      required.push(fieldName);
    }

    const continueAdding = await p.select({
      message: 'Add another field?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No, create schema' },
      ],
    });

    if (p.isCancel(continueAdding) || continueAdding === 'no') {
      addAnother = false;
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

async function viewSchema(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading schemas...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const schemas = await dsl.listSchemas();

    s.stop();

    if (schemas.length === 0) {
      p.note('No schemas found.', 'Info');
      return;
    }

    // schemas is an array of aliases (strings)
    const options = schemas.map((alias: string) => ({
      value: alias,
      label: alias,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select schema:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    const schemaDsl = await dsl.schema(selected);

    if (!schemaDsl) {
      p.log.error(`Schema '${selected}' not found`);
      return;
    }

    const schemaData = schemaDsl.getSchema();
    const schemaId = schemaDsl.schema.schemaId;

    p.note(
      `Schema ID: ${schemaId}\n\n${JSON.stringify(schemaData, null, 2)}\n\nPress any key to continue`,
      `Schema: ${selected}`
    );

    // Wait for keypress (simulate)
    await p.select({
      message: '',
      options: [{ value: 'ok', label: 'Continue' }],
    });
  } catch (error) {
    s.stop('Failed to view schema');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function exportSchema(currentAccount: string): Promise<void> {
  const s = p.spinner();
  s.start('Loading schemas...');

  try {
    const { dsl } = await loadAccountDSL(currentAccount);
    const schemas = await dsl.listSchemas();

    s.stop();

    if (schemas.length === 0) {
      p.note('No schemas found.', 'Info');
      return;
    }

    // schemas is an array of aliases (strings)
    const options = schemas.map((alias: string) => ({
      value: alias,
      label: alias,
    }));
    options.push({ value: 'cancel', label: 'Cancel' });

    const selected = await p.select({
      message: 'Select schema to export:',
      options,
    });

    if (p.isCancel(selected) || selected === 'cancel') return;

    const defaultPath = `./${selected}.json`;
    const filePathInput = await p.text({
      message: 'Export to file:',
      placeholder: defaultPath,
      defaultValue: defaultPath,
    });

    if (p.isCancel(filePathInput)) return;

    // Use default if user just pressed enter
    const filePath = filePathInput.trim() || defaultPath;

    const spinner = p.spinner();
    spinner.start('Exporting schema...');

    const schemaDsl = await dsl.schema(selected);

    if (!schemaDsl) {
      spinner.stop('Failed to export schema');
      p.log.error(`Schema '${selected}' not found`);
      return;
    }

    const schemaData = schemaDsl.getSchema();

    // Create parent directories if needed
    const { mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });

    await writeFile(filePath, JSON.stringify(schemaData, null, 2));

    spinner.stop(`Schema exported to '${filePath}'`);
  } catch (error) {
    s.stop('Failed to export schema');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}

async function importSchema(currentAccount: string): Promise<void> {
  const filePath = await p.text({
    message: 'Schema file path:',
    validate: (value) => {
      if (!value) return 'File path is required';
    },
  });

  if (p.isCancel(filePath)) return;

  const alias = await p.text({
    message: 'Schema name/alias:',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Name must contain only lowercase letters, numbers, and hyphens';
    },
  });

  if (p.isCancel(alias)) return;

  const s = p.spinner();
  s.start('Importing schema...');

  try {
    const schemaJson = await readFile(filePath, 'utf-8');
    const schemaData = JSON.parse(schemaJson);

    const { dsl } = await loadAccountDSL(currentAccount);
    const schemaDsl = await dsl.createSchema(alias, schemaData);

    const schemaId = schemaDsl.schema.schemaId;

    s.stop(`Schema '${alias}' imported`);
    p.note(`Schema ID: ${schemaId}\nFile: ${filePath}`, 'Success');
  } catch (error) {
    s.stop('Failed to import schema');
    p.log.error(error instanceof Error ? error.message : String(error));
  }
}
