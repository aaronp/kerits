/**
 * Tests for schema generator
 */

import { describe, test, expect } from 'bun:test';
import {
  generateSchemaFromJson,
  inferEnumsFromExamples,
  mergeSchemas,
  wrapInAcdcSchema,
} from './schema-generator';

describe('generateSchemaFromJson', () => {
  test('generates schema for simple object', () => {
    const data = {
      name: 'Alice',
      age: 30,
      active: true,
    };

    const schema = generateSchemaFromJson(data, {
      title: 'Person',
      description: 'A person record',
    });

    expect(schema.title).toBe('Person');
    expect(schema.description).toBe('A person record');
    expect(schema.type).toBe('object');
    expect(schema.properties.name.type).toBe('string');
    expect(schema.properties.age.type).toBe('integer');
    expect(schema.properties.active.type).toBe('boolean');
    expect(schema.required).toEqual(['name', 'age', 'active']);
  });

  test('infers nested objects', () => {
    const data = {
      name: {
        first: 'Alice',
        last: 'Jones',
      },
    };

    const schema = generateSchemaFromJson(data, { title: 'Person' });

    expect(schema.properties.name.type).toBe('object');
    expect(schema.properties.name.properties?.first.type).toBe('string');
    expect(schema.properties.name.properties?.last.type).toBe('string');
    expect(schema.properties.name.required).toEqual(['first', 'last']);
  });

  test('infers array types', () => {
    const data = {
      tags: ['engineering', 'fullstack'],
      scores: [95, 87, 92],
    };

    const schema = generateSchemaFromJson(data, { title: 'Profile' });

    expect(schema.properties.tags.type).toBe('array');
    expect(schema.properties.tags.items?.type).toBe('string');
    expect(schema.properties.scores.type).toBe('array');
    expect(schema.properties.scores.items?.type).toBe('integer');
  });

  test('infers array of objects', () => {
    const data = {
      jobs: [
        { title: 'Engineer', startDate: '2020-01-01' },
        { title: 'Architect', startDate: '2023-06-15' },
      ],
    };

    const schema = generateSchemaFromJson(data, { title: 'Profile' });

    expect(schema.properties.jobs.type).toBe('array');
    expect(schema.properties.jobs.items?.type).toBe('object');
    expect(schema.properties.jobs.items?.properties?.title.type).toBe('string');
    expect(schema.properties.jobs.items?.properties?.startDate.type).toBe('string');
    expect(schema.properties.jobs.items?.properties?.startDate.format).toBe('date');
  });

  test('infers date formats', () => {
    const data = {
      dob: '1992-05-10',
      createdAt: '2025-10-17T12:00:00Z',
      email: 'alice@example.com',
      website: 'https://example.com',
    };

    const schema = generateSchemaFromJson(data, { title: 'Person' });

    expect(schema.properties.dob.format).toBe('date');
    expect(schema.properties.createdAt.format).toBe('date-time');
    expect(schema.properties.email.format).toBe('email');
    expect(schema.properties.website.format).toBe('uri');
  });

  test('detects SAID patterns', () => {
    const data = {
      schemaId: 'ESchemaPersonMiniAAAAAAAAAAAAAA',
    };

    const schema = generateSchemaFromJson(data, { title: 'Reference' });

    expect(schema.properties.schemaId.pattern).toBe('^E[A-Za-z0-9_-]{20,}$');
    expect(schema.properties.schemaId.description).toBe('KERI SAID');
  });

  test('handles complex nested structure', () => {
    const data = {
      name: { first: 'Alice', last: 'Jones' },
      dob: '1992-05-10',
      contact: { type: 'email', value: 'alice@example.com' },
      jobs: [{ title: 'Engineer', startDate: '2020-01-01' }],
      tags: ['engineering', 'fullstack'],
      status: 'active',
      metadata: {
        createdAt: '2025-10-17T12:00:00Z',
        subSchemas: ['EContactSchemaBBBBBBBBBBBBBBBBBBBBB'],
      },
    };

    const schema = generateSchemaFromJson(data, {
      title: 'PersonMini',
      $id: 'ESchemaPersonMiniAAAAAAAAAAAAAA',
    });

    expect(schema.$id).toBe('ESchemaPersonMiniAAAAAAAAAAAAAA');
    expect(schema.properties.name.type).toBe('object');
    expect(schema.properties.dob.format).toBe('date');
    expect(schema.properties.contact.properties?.type.type).toBe('string');
    expect(schema.properties.jobs.type).toBe('array');
    expect(schema.properties.tags.type).toBe('array');
    expect(schema.properties.metadata.properties?.createdAt.format).toBe('date-time');
  });
});

describe('inferEnumsFromExamples', () => {
  test('detects enum fields from multiple examples', () => {
    const examples = [
      { status: 'active', role: 'admin', count: 5 },
      { status: 'inactive', role: 'user', count: 10 },
      { status: 'active', role: 'user', count: 3 },
      { status: 'active', role: 'admin', count: 15 },
    ];

    const enums = inferEnumsFromExamples(examples, 3);

    expect(enums.status).toEqual(['active', 'inactive']);
    expect(enums.role).toEqual(['admin', 'user']);
    expect(enums.count).toBeUndefined(); // 4 unique values > maxUniqueValues of 3
  });
});

describe('mergeSchemas', () => {
  test('merges schemas from multiple examples', () => {
    const schema1 = generateSchemaFromJson(
      { name: 'Alice', age: 30 },
      { title: 'Person' }
    );

    const schema2 = generateSchemaFromJson(
      { name: 'Bob', email: 'bob@example.com' },
      { title: 'Person' }
    );

    const merged = mergeSchemas([schema1, schema2]);

    expect(merged.properties.name).toBeDefined();
    expect(merged.properties.age).toBeDefined();
    expect(merged.properties.email).toBeDefined();

    // Only 'name' is required in both
    expect(merged.required).toEqual(['name']);
  });
});

describe('wrapInAcdcSchema', () => {
  test('wraps JSON Schema in ACDC format', () => {
    const jsonSchema = generateSchemaFromJson(
      { name: 'Alice', age: 30 },
      { title: 'Person', $id: 'EPersonSchemaAAAAAAAAAAAAAAAAAAA' }
    );

    const acdc = wrapInAcdcSchema(jsonSchema, {
      schemaId: 'ESchemaPersonAAAAAAAAAAAAAAAAAA',
      issuerId: 'EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA',
    });

    expect(acdc.v).toBe('ACDC10JSON00011c_');
    expect(acdc.d).toBe('ESchemaPersonAAAAAAAAAAAAAAAAAA');
    expect(acdc.i).toBe('EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(acdc.a).toBe(jsonSchema);
  });
});
