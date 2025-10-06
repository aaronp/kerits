/**
 * Tests for SchemaDSL
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKerStore } from '../../../storage/core';
import { MemoryKv } from '../../../storage/adapters/memory';
import { createKeritsDSL } from '../';

describe('SchemaDSL', () => {
  let dsl: ReturnType<typeof createKeritsDSL>;

  beforeEach(async () => {
    // Create a fresh in-memory store for each test
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    dsl = createKeritsDSL(store);
  });

  test('should create and delete a schema', async () => {
    // Create a schema
    const schema = await dsl.createSchema('test-schema', {
      title: 'Test Schema',
      description: 'A test schema',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    });

    expect(schema).toBeDefined();
    expect(schema.schema.alias).toBe('test-schema');

    // Verify schema exists
    const schemas = await dsl.listSchemas();
    expect(schemas).toContain('test-schema');

    // Delete the schema
    await schema.delete();

    // Verify schema is deleted
    const schemasAfterDelete = await dsl.listSchemas();
    expect(schemasAfterDelete).not.toContain('test-schema');

    // Verify we can't retrieve it anymore
    const deletedSchema = await dsl.schema('test-schema');
    expect(deletedSchema).toBeNull();
  });

  test('should delete a schema using deleteSchema method', async () => {
    // Create a schema
    await dsl.createSchema('test-schema-2', {
      title: 'Test Schema 2',
      properties: {
        field: { type: 'string' },
      },
    });

    // Verify schema exists
    const schemas = await dsl.listSchemas();
    expect(schemas).toContain('test-schema-2');

    // Delete using KeritsDSL method
    await dsl.deleteSchema('test-schema-2');

    // Verify schema is deleted
    const schemasAfterDelete = await dsl.listSchemas();
    expect(schemasAfterDelete).not.toContain('test-schema-2');
  });

  test('should export schema in KERI SAD format', async () => {
    // Create a schema
    const schema = await dsl.createSchema('export-test', {
      title: 'Export Test Schema',
      description: 'Testing export/import',
      properties: {
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['username', 'email'],
    });

    // Export the schema
    const exported = schema.export();
    expect(exported).toBeDefined();
    expect(exported.alias).toBe('export-test');
    expect(exported.sed.$id).toBeDefined();
    expect(exported.said).toBe(exported.sed.$id);
    expect(exported.sed.title).toBe('Export Test Schema');
    expect(exported.sed.description).toBe('Testing export/import');
    expect(exported.sed.$schema).toBe('http://json-schema.org/draft-07/schema#');

    // Clean up
    await schema.delete();
  });

  test('should export and import schema with matching SAID', async () => {
    // Create a schema
    const schema = await dsl.createSchema('roundtrip-test', {
      title: 'Round Trip Test',
      description: 'Testing export/import round trip',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    });

    const originalSaid = schema.schema.schemaId;

    // Export the schema
    const exported = schema.export();
    expect(exported.said).toBe(originalSaid);

    // Delete the original
    await schema.delete();

    // Import it back
    const imported = await dsl.importSchema(exported);

    // Verify SAID matches
    expect(imported.schema.schemaId).toBe(originalSaid);
    expect(imported.schema.alias).toBe('roundtrip-test');

    // Clean up
    await imported.delete();
  });

  test('should reject import when SAID does not match', async () => {
    // Create a valid schema export
    const schema = await dsl.createSchema('valid-schema', {
      title: 'Valid Schema',
      properties: {
        field1: { type: 'string' },
      },
    });

    const exported = schema.export();
    await schema.delete();

    // Tamper with the schema content to make SAID mismatch
    const tamperedExport = {
      ...exported,
      sed: {
        ...exported.sed,
        title: 'Tampered Schema', // Change content but keep same SAID
      },
    };

    // Import should fail with SAID verification error
    await expect(dsl.importSchema(tamperedExport)).rejects.toThrow('SAID verification failed');

    // Verify nothing was stored
    const schemas = await dsl.listSchemas();
    expect(schemas).not.toContain('valid-schema');
  });
});
