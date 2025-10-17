# KERI Schemas - Documentation

## Overview

KERITS now supports robust KERI schema generation and validation for ACDCs, including:

- ✅ Nested objects and arrays
- ✅ Enum types
- ✅ Date and date-time formats
- ✅ Pattern matching (e.g., SAIDs)
- ✅ Sub-schema references
- ✅ Automatic schema generation from JSON
- ✅ Schema validation with detailed error reporting
- ✅ Schema merging from multiple examples

## Documentation Files

### [keri-schemas.md](./keri-schemas.md)
Complete reference for KERI schema capabilities:
- All supported types and formats
- Nested objects and arrays
- Enums and constraints
- Sub-schema references
- Best practices
- Integration with KERITS UI

### [examples.md](./examples.md)
Practical examples showing:
- Simple schemas
- Complex nested structures
- Enum detection from multiple examples
- Schema merging
- Validation with error handling
- Real-world use cases

## Quick Start

### 1. Generate Schema from JSON

```typescript
import { generateSchemaFromJson } from './lib/schema-generator';

const exampleData = {
  name: { first: "Alice", last: "Jones" },
  dob: "1992-05-10",
  email: "alice@example.com",
  status: "active"
};

const schema = generateSchemaFromJson(exampleData, {
  title: "Person",
  description: "A person record",
  $id: "EPersonSchemaAAAAAAAAAAAAAAAAAAA"
});
```

### 2. Wrap in ACDC Format

```typescript
import { wrapInAcdcSchema } from './lib/schema-generator';

const acdcSchema = wrapInAcdcSchema(schema, {
  schemaId: "ESchemaPersonAAAAAAAAAAAAAAAAAA",
  issuerId: "EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA"
});
```

### 3. Validate Payload

```typescript
import { validateAcdcPayload } from './lib/schema-validator';

const result = validateAcdcPayload(payload, acdcSchema);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Features

### Automatic Type Inference

The schema generator automatically infers:
- **Primitives**: string, number, integer, boolean
- **Formats**: date, date-time, email, uri, uuid, ipv4/ipv6
- **Patterns**: KERI SAIDs (E-prefixed identifiers)
- **Arrays**: Simple arrays and arrays of objects
- **Nested Objects**: Arbitrary nesting depth

### Enum Detection

Detect potential enums from multiple examples:

```typescript
import { inferEnumsFromExamples } from './lib/schema-generator';

const examples = [
  { status: "active", role: "admin" },
  { status: "inactive", role: "user" },
  { status: "active", role: "user" }
];

const enums = inferEnumsFromExamples(examples);
// Result: { status: ["active", "inactive"], role: ["admin", "user"] }
```

### Schema Merging

Combine schemas from multiple examples to create comprehensive schemas:

```typescript
import { mergeSchemas } from './lib/schema-generator';

const schemas = [schema1, schema2, schema3];
const merged = mergeSchemas(schemas);
```

### Validation

Comprehensive validation with detailed error messages:

```typescript
const result = validateAcdcPayload(payload, schema);

if (!result.valid) {
  result.errors.forEach(err => {
    console.log(`${err.path}: ${err.message}`);
  });
}
```

Error types include:
- Type mismatches
- Missing required fields
- Invalid formats (date, email, etc.)
- Enum constraint violations
- Pattern matching failures
- Array length constraints
- Nested validation errors

## Implementation Files

### Core Libraries

- **`/ui/src/lib/schema-generator.ts`** - Schema generation from JSON
  - `generateSchemaFromJson()` - Main generation function
  - `inferEnumsFromExamples()` - Enum detection
  - `mergeSchemas()` - Schema merging
  - `wrapInAcdcSchema()` - ACDC wrapper

- **`/ui/src/lib/schema-validator.ts`** - Schema validation
  - `validateAcdcPayload()` - Validate payloads
  - `validateSchema()` - Validate schema structure
  - `formatValidationErrors()` - Error formatting

### Tests

- **`/ui/src/lib/schema-generator.test.ts`** - Comprehensive test suite
  - ✅ 10 passing tests
  - Covers all generation features
  - Tests merging and wrapping
  - Validates enum detection

## Example Schema

### Input JSON

```json
{
  "name": { "first": "Alice", "last": "Jones" },
  "dob": "1992-05-10",
  "contact": {
    "type": "email",
    "value": "alice@example.com"
  },
  "jobs": [
    { "title": "Engineer", "startDate": "2020-01-01" }
  ],
  "status": "active",
  "metadata": {
    "createdAt": "2025-10-17T12:00:00Z",
    "subSchemas": ["EContactSchemaBBBBBBBBBBBBBBBBBBBBB"]
  }
}
```

### Generated ACDC Schema

```json
{
  "v": "ACDC10JSON00011c_",
  "d": "ESchemaPersonMiniAAAAAAAAAAAAAA",
  "i": "EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA",
  "s": "ESchemaDefTypeAAAAAAAAAAAAAAAAAA",
  "a": {
    "$id": "ESchemaPersonMiniAAAAAAAAAAAAAA",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "PersonMini",
    "type": "object",
    "properties": {
      "name": {
        "type": "object",
        "properties": {
          "first": { "type": "string" },
          "last": { "type": "string" }
        },
        "required": ["first", "last"]
      },
      "dob": { "type": "string", "format": "date" },
      "contact": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "value": { "type": "string", "format": "email" }
        },
        "required": ["type", "value"]
      },
      "jobs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "startDate": { "type": "string", "format": "date" }
          },
          "required": ["title", "startDate"]
        }
      },
      "status": { "type": "string" },
      "metadata": {
        "type": "object",
        "properties": {
          "createdAt": { "type": "string", "format": "date-time" },
          "subSchemas": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^E[A-Za-z0-9_-]{20,}$",
              "description": "KERI SAID"
            }
          }
        },
        "required": ["createdAt", "subSchemas"]
      }
    },
    "required": ["name", "dob", "contact", "jobs", "status", "metadata"]
  }
}
```

## Next Steps

### UI Integration

The schema generator and validator can be integrated into the KERITS schema creator UI:

1. **JSON Import** - Allow users to paste example JSON
2. **Auto-generate** - Click button to generate schema
3. **Review & Edit** - Modify generated schema as needed
4. **Add Enums** - Manually add or auto-detect enums
5. **Validate** - Test with example payloads
6. **Publish** - Publish to KEL

### Future Enhancements

- [ ] Support for `$ref` to reference other schemas
- [ ] Support for `oneOf`, `anyOf`, `allOf`
- [ ] Advanced pattern library for common formats
- [ ] Schema evolution tracking
- [ ] Visual schema builder with drag-and-drop
- [ ] Import from TypeScript interfaces
- [ ] Export to TypeScript types

## References

- [JSON Schema Specification](https://json-schema.org/draft/2020-12/schema)
- [ACDC Specification](https://github.com/trustoverip/tswg-acdc-specification)
- [KERI Specification](https://github.com/WebOfTrust/keri)

## Contributing

To add new features:

1. Update `/ui/src/lib/schema-generator.ts` or `/ui/src/lib/schema-validator.ts`
2. Add tests to `/ui/src/lib/schema-generator.test.ts`
3. Update documentation in `/docs/schemas/`
4. Run tests: `bun test src/lib/schema-generator.test.ts`
5. Build: `npm run build`
