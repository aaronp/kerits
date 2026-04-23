import { describe, expect, test } from 'bun:test';
import { SchemaData } from '../schema-data.js';
import type { ACDCSchema, JSONSchema } from '../types.js';

const sampleJsonSchema: JSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Test Credential',
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name'],
};

describe('SchemaData.create', () => {
  test('creates ACDC schema envelope with SAID', () => {
    const schema = SchemaData.create(sampleJsonSchema);
    expect(schema.t).toBe('sch');
    expect(schema.d).toBeTruthy();
    expect(schema.d.length).toBe(44);
    expect(schema.s.title).toBe('Test Credential');
    expect(schema.s.$id).toContain('did:keri:');
  });

  test('SAID is deterministic', () => {
    const a = SchemaData.create(sampleJsonSchema);
    const b = SchemaData.create(sampleJsonSchema);
    expect(a.d).toBe(b.d);
  });
});

describe('SchemaData.parse', () => {
  test('parses valid ACDC schema', () => {
    const schema = SchemaData.create(sampleJsonSchema);
    const result = SchemaData.parse(schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema.d).toBe(schema.d);
    }
  });

  test('rejects non-object', () => {
    expect(SchemaData.parse(null).ok).toBe(false);
    expect(SchemaData.parse('string').ok).toBe(false);
  });

  test('rejects missing required fields', () => {
    expect(SchemaData.parse({ v: '1', t: 'sch' }).ok).toBe(false);
  });

  test('rejects unknown top-level fields', () => {
    const schema = SchemaData.create(sampleJsonSchema);
    expect(SchemaData.parse({ ...schema, extra: true }).ok).toBe(false);
  });
});

describe('SchemaData.isValid', () => {
  test('returns true for valid schema', () => {
    const schema = SchemaData.create(sampleJsonSchema);
    expect(SchemaData.isValid(schema)).toBe(true);
  });

  test('returns false for invalid data', () => {
    expect(SchemaData.isValid({})).toBe(false);
  });
});

describe('SchemaData.extractJsonSchema', () => {
  test('returns inner JSON Schema', () => {
    const schema = SchemaData.create(sampleJsonSchema);
    const inner = SchemaData.extractJsonSchema(schema);
    expect(inner.title).toBe('Test Credential');
    expect(inner.type).toBe('object');
  });
});
