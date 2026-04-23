import { describe, expect, test } from 'bun:test';
import { SchemaOps } from '../ops.js';
import { SchemaData } from '../schema-data.js';
import type { JSONSchema } from '../types.js';

const sampleJsonSchema: JSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Test',
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name'],
};

const schema = SchemaData.create(sampleJsonSchema);

describe('SchemaOps SAID operations', () => {
  test('said returns schema SAID', () => {
    expect(SchemaOps.said(schema)).toBe(schema.d);
  });

  test('verifySaid returns true for valid schema', () => {
    expect(SchemaOps.verifySaid(schema)).toBe(true);
  });

  test('verifySaid returns false for tampered schema', () => {
    const tampered = { ...schema, d: 'Etampered00000000000000000000000000000000' };
    expect(SchemaOps.verifySaid(tampered)).toBe(false);
  });

  test('validateSaid returns expected/actual details', () => {
    const result = SchemaOps.validateSaid(schema);
    expect(result.valid).toBe(true);
    expect(result.expected).toBe(schema.d);
    expect(result.actual).toBe(schema.d);
  });

  test('parseAndVerifySaid succeeds for valid schema', () => {
    const result = SchemaOps.parseAndVerifySaid(schema);
    expect(result.ok).toBe(true);
  });

  test('parseAndVerifySaid fails for tampered SAID', () => {
    const tampered = { ...schema, d: 'Etampered00000000000000000000000000000000' };
    const result = SchemaOps.parseAndVerifySaid(tampered);
    expect(result.ok).toBe(false);
  });
});

describe('SchemaOps.validate', () => {
  test('valid data passes', () => {
    const result = SchemaOps.validate(schema, { name: 'Alice', age: 30 });
    expect(result.valid).toBe(true);
  });

  test('missing required field fails', () => {
    const result = SchemaOps.validate(schema, { age: 30 });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]!.keyword).toBe('required');
  });

  test('wrong type fails', () => {
    const result = SchemaOps.validate(schema, 'not an object');
    expect(result.valid).toBe(false);
  });
});

describe('SchemaOps.flattenSchemaFields', () => {
  test('flattens top-level properties', () => {
    const fields = SchemaOps.flattenSchemaFields(schema);
    expect(fields).toContainEqual({ path: '/name', type: 'string' });
    expect(fields).toContainEqual({ path: '/age', type: 'number' });
  });

  test('flattens nested object properties', () => {
    const nested = SchemaData.create({
      ...sampleJsonSchema,
      properties: {
        address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            zip: { type: 'string' },
          },
        },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(nested);
    expect(fields).toContainEqual({ path: '/address/city', type: 'string' });
    expect(fields).toContainEqual({ path: '/address/zip', type: 'string' });
  });

  test('flattens array items', () => {
    const withArray = SchemaData.create({
      ...sampleJsonSchema,
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(withArray);
    expect(fields).toContainEqual({ path: '/tags/items', type: 'string' });
  });

  test('returns empty for schema with no properties', () => {
    const empty = SchemaData.create({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
    });
    expect(SchemaOps.flattenSchemaFields(empty)).toEqual([]);
  });

  test('returns ref leaf for schemaSaid property', () => {
    const withRef = SchemaData.create({
      ...sampleJsonSchema,
      properties: {
        nested: { type: 'schemaSaid', schemaSaid: 'Eref00000000000000000000000000000000000000' },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(withRef);
    expect(fields).toContainEqual({
      path: '/nested',
      type: 'ref',
      target: 'Eref00000000000000000000000000000000000000',
    });
  });

  test('treats oneOf/anyOf/allOf as opaque (falls to leaf)', () => {
    const withCombinator = SchemaData.create({
      ...sampleJsonSchema,
      properties: {
        flexible: { oneOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(withCombinator);
    // No type field on combinator → type: 'unknown'
    expect(fields).toContainEqual({ path: '/flexible', type: 'unknown' });
  });

  test('resolves local $ref to $defs', () => {
    const withDefs = SchemaData.create({
      ...sampleJsonSchema,
      $defs: {
        Address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            zip: { type: 'string' },
          },
        },
      },
      properties: {
        home: { $ref: '#/$defs/Address' },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(withDefs);
    expect(fields).toContainEqual({ path: '/home/city', type: 'string' });
    expect(fields).toContainEqual({ path: '/home/zip', type: 'string' });
  });

  test('unresolvable $ref treated as opaque leaf', () => {
    const withBadRef = SchemaData.create({
      ...sampleJsonSchema,
      properties: {
        broken: { $ref: '#/$defs/NonExistent' },
      },
    });
    const fields = SchemaOps.flattenSchemaFields(withBadRef);
    expect(fields).toContainEqual({ path: '/broken', type: 'unknown' });
  });
});
