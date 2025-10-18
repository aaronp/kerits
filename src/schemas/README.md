# KERI/ACDC Schema Module

Battle-tested schema management for KERI verifiable credentials.

## Features

- ✅ **JSON Schema 2020-12** - Industry-standard schema validation via AJV
- ✅ **SAID-based identifiers** - RFC 8785 JCS canonicalization + KERI SAID derivation
- ✅ **ACDC wrappers** - Verifiable credential schema format
- ✅ **vLEI compatible** - Follows patterns used in production vLEI credentials
- ✅ **Type-safe** - Full TypeScript support with proper JSON Schema types

## Quick Start

```typescript
import { saidifySchema, validateAgainstSchema, wrapInAcdc } from './schemas';

// 1. Create a schema
const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Person',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name']
};

// 2. Add SAID (Self-Addressing IDentifier)
const keriSchema = saidifySchema(schema);
console.log(keriSchema.$id); // "EBdXt3gIXOf2BBWNHdSXCJnFJL5OuQPyM5K0neuniccM"

// 3. Validate data
const result = validateAgainstSchema(keriSchema, {
  name: 'Alice',
  age: 30
});
console.log(result.valid); // true

// 4. Wrap in ACDC format for credentials
const acdcSchema = wrapInAcdc(keriSchema, {
  issuerAid: 'EABc...'
});
```

## Core Concepts

### SAID (Self-Addressing IDentifier)

Every KERI schema has a `$id` field that is the **SAID of the schema itself**:

1. Place empty string `""` in `$id`
2. Canonicalize using JCS (RFC 8785)
3. Hash with Blake3-256
4. Encode as CESR (Base64URL with 'E' prefix)
5. Set `$id` to this SAID

This makes schemas **verifiable** - anyone can re-derive the SAID and confirm the schema hasn't been tampered with.

```typescript
import { saidifySchema, verifySchemaSaid } from './schemas';

const schema = saidifySchema({ /* ... */ });
console.log(verifySchemaSaid(schema)); // true

// Tamper with schema
const tampered = { ...schema, title: 'Hacked' };
console.log(verifySchemaSaid(tampered)); // false
```

### ACDC Schema Wrappers

For verifiable credentials, schemas are wrapped in ACDC format:

```typescript
{
  v: 'ACDC10JSON00011c_',  // Version
  d: 'EBdXt...',            // Schema SAID (same as inner $id)
  i: 'EABc...',             // Issuer AID
  s: 'ESchema...',          // Schema type
  a: {                      // The actual JSON Schema
    $id: 'EBdXt...',
    type: 'object',
    properties: { /* ... */ }
  }
}
```

## API Reference

### SAID Operations

- `deriveSchemaSaid(schema)` - Compute SAID for a schema
- `saidifySchema(schema)` - Add SAID to schema's `$id`
- `verifySchemaSaid(schema)` - Verify schema's SAID is correct

### Validation

- `validateAgainstSchema(schema, data)` - Validate data against schema
- `validateBatch(schema, dataArray)` - Validate multiple items
- `createSchemaValidator()` - Create AJV validator instance

### ACDC Utilities

- `wrapInAcdc(schema, options)` - Wrap schema in ACDC format
- `unwrapAcdc(acdcSchema)` - Extract JSON Schema from ACDC wrapper
- `verifyAcdcSchema(acdcSchema)` - Verify ACDC schema consistency
- `createCredentialSchema(options)` - Helper for vLEI-style credentials

## Real-World Examples

### vLEI Legal Entity Credential

```typescript
import { createCredentialSchema } from './schemas';

const schema = createCredentialSchema({
  title: 'Legal Entity Credential',
  description: 'vLEI Legal Entity Credential',
  issuerAid: 'ERoot...',
  properties: {
    LEI: {
      type: 'string',
      pattern: '^[0-9A-Z]{20}$',
      description: 'Legal Entity Identifier'
    },
    legalName: {
      type: 'string',
      description: 'Legal name of the entity'
    },
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        country: { type: 'string', pattern: '^[A-Z]{2}$' }
      },
      required: ['city', 'country']
    }
  },
  required: ['LEI', 'legalName']
});

// Use schema.a.$id when issuing credentials
```

### Complex Nested Structures

```typescript
const schema = saidifySchema({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Organization',
  type: 'object',
  properties: {
    name: { type: 'string' },
    employees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          personAID: { type: 'string' }
        },
        required: ['name', 'role']
      }
    }
  },
  $defs: {
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' }
      }
    }
  }
});
```

## Design Principles

1. **Use industry-standard tools** - AJV for validation, json-canonicalize for JCS
2. **Don't hand-roll types** - Use `@types/json-schema` (JSONSchema7)
3. **SAID-first** - Every schema has a verifiable identifier
4. **vLEI compatible** - Follows patterns from production credentials
5. **Type-safe** - Full TypeScript support

## Dependencies

- **ajv** - Industry-standard JSON Schema validator
- **json-canonicalize** - RFC 8785 JCS implementation
- **@types/json-schema** - TypeScript types for JSON Schema
- **cesr-ts** - KERI CESR encoding (for SAID)

## Testing

```bash
bun test src/schemas/examples.test.ts
```

All tests use real vLEI patterns and demonstrate proper schema usage.

## References

- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 8785 - JCS Canonicalization](https://www.rfc-editor.org/rfc/rfc8785.html)
- [KERI SAID Draft](https://datatracker.ietf.org/doc/html/draft-ssmith-said)
- [ACDC Specification](https://trustoverip.github.io/tswg-acdc-specification/)
- [GLEIF vLEI](https://www.gleif.org/en/lei-solutions/gleifs-digital-strategy-for-the-lei/introducing-the-verifiable-lei-vlei)
