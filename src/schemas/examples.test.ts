/**
 * Schema examples and tests
 *
 * Demonstrates KERI/ACDC schema patterns using vLEI-style schemas
 */

import { describe, test, expect } from 'bun:test';
import {
  saidifySchema,
  verifySchemaSaid,
  validateAgainstSchema,
  wrapInAcdc,
  verifyAcdcSchema,
  createCredentialSchema,
} from './index';
import type { KeriSchema } from './types';

describe('KERI Schema SAID', () => {
  test('should compute SAID for a simple schema', () => {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Person',
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        age: { type: 'number' as const },
      },
      required: ['name'],
    };

    const keriSchema = saidifySchema(schema);

    expect(keriSchema.$id).toBeDefined();
    expect(keriSchema.$id).toMatch(/^E[A-Za-z0-9_-]{43}$/);
    expect(keriSchema.title).toBe('Person');
  });

  test('should verify SAID correctly', () => {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Test',
      type: 'object' as const,
      properties: {},
    };

    const keriSchema = saidifySchema(schema);
    expect(verifySchemaSaid(keriSchema)).toBe(true);

    // Tamper with schema
    const tampered = { ...keriSchema, title: 'Tampered' };
    expect(verifySchemaSaid(tampered)).toBe(false);
  });

  test('should be deterministic - same input produces same SAID', () => {
    const schema1 = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Test',
      type: 'object' as const,
    };

    const schema2 = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Test',
      type: 'object' as const,
    };

    const said1 = saidifySchema(schema1).$id;
    const said2 = saidifySchema(schema2).$id;

    expect(said1).toBe(said2);
  });
});

describe('Schema Validation', () => {
  test('should validate data against schema', () => {
    const schema: KeriSchema = saidifySchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Person',
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, minLength: 1 },
        age: { type: 'number' as const, minimum: 0 },
        email: { type: 'string' as const, format: 'email' },
      },
      required: ['name'],
    });

    // Valid data
    const validData = { name: 'Alice', age: 30, email: 'alice@example.com' };
    const result1 = validateAgainstSchema(schema, validData);
    expect(result1.valid).toBe(true);

    // Invalid data - missing required field
    const invalidData1 = { age: 30 };
    const result2 = validateAgainstSchema(schema, invalidData1);
    expect(result2.valid).toBe(false);
    expect(result2.errors).toBeDefined();

    // Invalid data - wrong type
    const invalidData2 = { name: 'Bob', age: 'thirty' };
    const result3 = validateAgainstSchema(schema, invalidData2);
    expect(result3.valid).toBe(false);
  });

  test('should validate against schema with $defs', () => {
    const schema: KeriSchema = saidifySchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Organization',
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        address: { $ref: '#/$defs/address' },
      },
      $defs: {
        address: {
          type: 'object' as const,
          properties: {
            street: { type: 'string' as const },
            city: { type: 'string' as const },
          },
          required: ['city'],
        },
      },
    });

    const validData = {
      name: 'ACME Corp',
      address: { city: 'New York', street: '123 Main St' },
    };

    const result = validateAgainstSchema(schema, validData);
    expect(result.valid).toBe(true);
  });
});

describe('ACDC Schema Wrappers', () => {
  test('should wrap schema in ACDC format', () => {
    const jsonSchema = saidifySchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Credential Schema',
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
      },
    });

    const issuerAid = 'EABcdEFghIJklMNopQRstUVwxYZ0123456789abcdefg';
    const acdcSchema = wrapInAcdc(jsonSchema, { issuerAid });

    expect(acdcSchema.v).toBe('ACDC10JSON00011c_');
    expect(acdcSchema.d).toBe(jsonSchema.$id);
    expect(acdcSchema.i).toBe(issuerAid);
    expect(acdcSchema.a).toEqual(jsonSchema);
    expect(verifyAcdcSchema(acdcSchema)).toBe(true);
  });

  test('should create vLEI-style credential schema', () => {
    const issuerAid = 'EABcdEFghIJklMNopQRstUVwxYZ0123456789abcdefg';

    const acdcSchema = createCredentialSchema({
      title: 'Legal Entity Credential',
      description: 'vLEI Legal Entity Credential',
      issuerAid,
      properties: {
        legalName: {
          type: 'string',
          description: 'Legal name of the entity',
        },
        lei: {
          type: 'string',
          pattern: '^[0-9A-Z]{20}$',
          description: 'Legal Entity Identifier (LEI)',
        },
      },
      required: ['legalName', 'lei'],
    });

    expect(acdcSchema.a.$id).toMatch(/^E[A-Za-z0-9_-]{43}$/);
    expect(acdcSchema.d).toBe(acdcSchema.a.$id);
    expect(verifyAcdcSchema(acdcSchema)).toBe(true);

    // Validate example credential attributes against the credential schema
    const credentialAttributes = {
      legalName: 'Example Corporation',
      lei: '5493001KJTIIGC8Y1R12',
    };

    // The attributes should validate against the inner credential schema's 'a.properties'
    // Since our schema defines properties for the whole credential (v,d,i,s,a),
    // we need to validate the full credential structure
    const fullCredential = {
      v: 'ACDC10JSON000197_',
      d: 'ECredABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc', // 44 chars: E + 43 base64url chars
      i: issuerAid,
      s: acdcSchema.d,
      a: credentialAttributes,
    };

    const result = validateAgainstSchema(acdcSchema.a, fullCredential);
    if (!result.valid) {
      console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });
});

describe('Real-world vLEI patterns', () => {
  test('should create QVI credential schema', () => {
    const rootAid = 'ERoot123456789abcdefghijklmnopqrstuvwxyzABC';

    const qviSchema = createCredentialSchema({
      title: 'Qualified vLEI Issuer Credential',
      description: 'Authorizes an entity to issue vLEI credentials',
      issuerAid: rootAid,
      properties: {
        LEI: {
          type: 'string',
          pattern: '^[0-9A-Z]{20}$',
          description: 'Legal Entity Identifier',
        },
        gracePeriod: {
          type: 'number',
          description: 'Grace period in days',
        },
      },
      required: ['LEI'],
    });

    expect(qviSchema.a.title).toBe('Qualified vLEI Issuer Credential');
    expect(qviSchema.i).toBe(rootAid);
    expect(verifyAcdcSchema(qviSchema)).toBe(true);
  });

  test('should handle schema with complex nested structures', () => {
    const schema: KeriSchema = saidifySchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Legal Entity vLEI Credential',
      type: 'object' as const,
      properties: {
        LEI: { type: 'string' as const, pattern: '^[0-9A-Z]{20}$' },
        legalName: { type: 'string' as const },
        address: {
          type: 'object' as const,
          properties: {
            street: { type: 'string' as const },
            city: { type: 'string' as const },
            country: { type: 'string' as const, pattern: '^[A-Z]{2}$' },
          },
          required: ['city', 'country'],
        },
        officers: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string' as const },
              role: { type: 'string' as const },
              personAID: { type: 'string' as const },
            },
            required: ['name', 'role'],
          },
        },
      },
      required: ['LEI', 'legalName'],
    });

    const exampleData = {
      LEI: '5493001KJTIIGC8Y1R12',
      legalName: 'Example Corporation',
      address: {
        street: '123 Main Street',
        city: 'New York',
        country: 'US',
      },
      officers: [
        { name: 'Alice Smith', role: 'CEO', personAID: 'EAlice123...' },
        { name: 'Bob Jones', role: 'CFO' },
      ],
    };

    const result = validateAgainstSchema(schema, exampleData);
    expect(result.valid).toBe(true);
  });
});
