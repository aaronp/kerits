import * as clack from '@clack/prompts';
import { schema, objectSchema, parseSchema, type SchemaDefinition } from '../src/schema';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STORAGE_DIR = process.env.KERITS_DIR || join(homedir(), '.kerits');
const SCHEMAS_DIR = join(STORAGE_DIR, 'schemas');

interface StoredSchema {
  name: string;
  sed: SchemaDefinition;
  said: string;
  raw: string;
  createdAt: string;
}

function ensureSchemasDir(): void {
  if (!existsSync(SCHEMAS_DIR)) {
    mkdirSync(SCHEMAS_DIR, { recursive: true });
  }
}

function saveSchema(name: string, sch: { sed: SchemaDefinition; raw: string; said: string }): void {
  ensureSchemasDir();

  const stored: StoredSchema = {
    name,
    sed: sch.sed,
    said: sch.said,
    raw: sch.raw,
    createdAt: new Date().toISOString(),
  };

  const schemaFile = join(SCHEMAS_DIR, `${name}.json`);
  writeFileSync(schemaFile, JSON.stringify(stored, null, 2));
}

function loadSchema(name: string): StoredSchema | null {
  const schemaFile = join(SCHEMAS_DIR, `${name}.json`);
  if (!existsSync(schemaFile)) {
    return null;
  }
  return JSON.parse(readFileSync(schemaFile, 'utf-8'));
}

function listSchemas(): StoredSchema[] {
  ensureSchemasDir();
  const files = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(SCHEMAS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function deleteSchema(name: string): boolean {
  const schemaFile = join(SCHEMAS_DIR, `${name}.json`);
  if (!existsSync(schemaFile)) {
    return false;
  }
  const fs = require('node:fs');
  fs.unlinkSync(schemaFile);
  return true;
}

async function createSchemaInteractive(): Promise<void> {
  clack.intro('Create Schema');

  const name = await clack.text({
    message: 'Schema name:',
    placeholder: 'my-schema',
    validate: (value) => {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Name can only contain letters, numbers, dashes, and underscores';
      if (loadSchema(value)) return 'Schema with this name already exists';
    },
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const schemaType = await clack.select({
    message: 'Schema type:',
    options: [
      { value: 'simple', label: 'Simple Object', hint: 'Quick object schema with properties' },
      { value: 'custom', label: 'Custom JSON', hint: 'Enter full JSON Schema definition' },
    ],
  });

  if (clack.isCancel(schemaType)) {
    clack.cancel('Operation cancelled');
    return;
  }

  let sch;

  if (schemaType === 'simple') {
    const propertiesInput = await clack.text({
      message: 'Properties (format: name:string,age:number):',
      placeholder: 'name:string,age:number',
      validate: (value) => {
        if (!value) return 'At least one property is required';
      },
    });

    if (clack.isCancel(propertiesInput)) {
      clack.cancel('Operation cancelled');
      return;
    }

    // Parse properties
    const properties: Record<string, any> = {};
    const pairs = (propertiesInput as string).split(',');
    for (const pair of pairs) {
      const [propName, propType] = pair.trim().split(':');
      if (!propName || !propType) {
        clack.outro('Invalid property format');
        return;
      }
      properties[propName] = { type: propType };
    }

    sch = objectSchema(properties);
  } else {
    const jsonInput = await clack.text({
      message: 'JSON Schema (without $id):',
      placeholder: '{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{...}}',
      validate: (value) => {
        if (!value) return 'Schema is required';
        try {
          JSON.parse(value);
        } catch {
          return 'Invalid JSON';
        }
      },
    });

    if (clack.isCancel(jsonInput)) {
      clack.cancel('Operation cancelled');
      return;
    }

    const sed = JSON.parse(jsonInput as string);
    sed.$id = '';  // Will be computed
    sch = schema(sed);
  }

  saveSchema(name as string, sch);

  clack.note(
    `Name:    ${name}\nSAID:    ${sch.said}\nStorage: ${SCHEMAS_DIR}/${name}.json`,
    'Schema Created'
  );

  clack.outro('Done!');
}

async function listSchemasInteractive(): Promise<void> {
  clack.intro('List Schemas');

  const schemas = listSchemas();

  if (schemas.length === 0) {
    clack.outro('No schemas found. Create one first!');
    return;
  }

  const lines = schemas.map(s => `${s.name} (${s.said.substring(0, 20)}...)`);
  clack.note(lines.join('\n'), `Found ${schemas.length} schema(s)`);

  clack.outro('Done!');
}

async function viewSchemaInteractive(): Promise<void> {
  clack.intro('View Schema');

  const schemas = listSchemas();

  if (schemas.length === 0) {
    clack.outro('No schemas found. Create one first!');
    return;
  }

  const name = await clack.select({
    message: 'Select schema to view:',
    options: schemas.map(s => ({
      value: s.name,
      label: s.name,
      hint: s.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const stored = loadSchema(name as string);
  if (!stored) {
    clack.outro('Schema not found');
    return;
  }

  clack.note(
    JSON.stringify(stored.sed, null, 2),
    `Schema: ${stored.name}`
  );

  clack.outro('Done!');
}

async function deleteSchemaInteractive(): Promise<void> {
  clack.intro('Delete Schema');

  const schemas = listSchemas();

  if (schemas.length === 0) {
    clack.outro('No schemas found.');
    return;
  }

  const name = await clack.select({
    message: 'Select schema to delete:',
    options: schemas.map(s => ({
      value: s.name,
      label: s.name,
      hint: s.said.substring(0, 20) + '...'
    })),
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    return;
  }

  const confirm = await clack.confirm({
    message: `Delete schema "${name}"?`,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel('Operation cancelled');
    return;
  }

  if (deleteSchema(name as string)) {
    clack.outro(`Schema "${name}" deleted`);
  } else {
    clack.outro('Schema not found');
  }
}

export async function schemasMenu(): Promise<void> {
  while (true) {
    const action = await clack.select({
      message: 'Schema Management',
      options: [
        { value: 'create', label: 'Create Schema', hint: 'Define a new JSON Schema' },
        { value: 'list', label: 'List Schemas', hint: 'Show all schemas' },
        { value: 'view', label: 'View Schema', hint: 'View schema details' },
        { value: 'delete', label: 'Delete Schema', hint: 'Remove a schema' },
        { value: 'back', label: 'Back', hint: 'Return to main menu' },
      ],
    });

    if (clack.isCancel(action)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    switch (action) {
      case 'create':
        await createSchemaInteractive();
        break;
      case 'list':
        await listSchemasInteractive();
        break;
      case 'view':
        await viewSchemaInteractive();
        break;
      case 'delete':
        await deleteSchemaInteractive();
        break;
      case 'back':
        return;
    }
  }
}
