# KERI Schemas for ACDCs

KERI schemas define the structure of Authentic Chained Data Containers (ACDCs). This document describes the full capabilities of KERI schemas and how KERITS supports them.

## Schema Capabilities

KERI schemas support the full JSON Schema specification (draft 2020-12) with additional KERI-specific metadata:

### Basic Types

```typescript
type: "string" | "number" | "integer" | "boolean" | "object" | "array" | "null"
```

### Nested Objects

Schemas can define deeply nested object structures:

```json
{
  "properties": {
    "name": {
      "type": "object",
      "properties": {
        "first": { "type": "string" },
        "last": { "type": "string" }
      },
      "required": ["first", "last"]
    }
  }
}
```

### Arrays

Arrays can contain primitives or complex objects:

```json
{
  "tags": {
    "type": "array",
    "items": { "type": "string" }
  },
  "jobs": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "startDate": { "type": "string", "format": "date" }
      }
    }
  }
}
```

### Enums

Enums constrain values to a specific set:

```json
{
  "status": {
    "type": "string",
    "enum": ["active", "inactive", "pending"]
  },
  "contactType": {
    "type": "string",
    "enum": ["email", "phone", "address"]
  }
}
```

### Formats

Common string formats for validation:

- `date` - ISO 8601 date (e.g., "2025-10-17")
- `date-time` - ISO 8601 date-time (e.g., "2025-10-17T12:00:00Z")
- `email` - Email address
- `uri` - URI
- `uuid` - UUID
- `ipv4` / `ipv6` - IP addresses

```json
{
  "dob": { "type": "string", "format": "date" },
  "createdAt": { "type": "string", "format": "date-time" },
  "email": { "type": "string", "format": "email" }
}
```

### Pattern Matching

Regular expressions for string validation:

```json
{
  "said": {
    "type": "string",
    "pattern": "^E[A-Za-z0-9_-]{20,}$"
  }
}
```

### Sub-Schemas

Schemas can reference other published schemas by their SAID:

```json
{
  "metadata": {
    "type": "object",
    "properties": {
      "subSchemas": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^E[A-Za-z0-9_-]{20,}$"
        }
      }
    }
  }
}
```

## Complete Example

Here's a comprehensive example demonstrating all features:

### Schema Definition

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
          "type": { "type": "string", "enum": ["email", "phone"] },
          "value": { "type": "string" }
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
      "tags": {
        "type": "array",
        "items": { "type": "string" }
      },
      "status": {
        "type": "string",
        "enum": ["active", "inactive"]
      },
      "metadata": {
        "type": "object",
        "properties": {
          "createdAt": { "type": "string", "format": "date-time" },
          "subSchemas": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^E[A-Za-z0-9_-]{20,}$"
            },
            "minItems": 1
          }
        },
        "required": ["createdAt", "subSchemas"]
      }
    },
    "required": ["name", "dob", "contact", "metadata"]
  }
}
```

### Conforming ACDC Payload

```json
{
  "v": "ACDC10JSON00011c_",
  "d": "EPayloadAAAAAAAAAAAAAAAAAAAAAAAA",
  "i": "EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA",
  "s": "ESchemaPersonMiniAAAAAAAAAAAAAA",
  "a": {
    "name": { "first": "Alice", "last": "Jones" },
    "dob": "1992-05-10",
    "contact": { "type": "email", "value": "alice@example.com" },
    "jobs": [
      { "title": "Engineer", "startDate": "2020-01-01" },
      { "title": "Architect", "startDate": "2023-06-15" }
    ],
    "tags": ["engineering", "fullstack"],
    "status": "active",
    "metadata": {
      "createdAt": "2025-10-17T12:00:00Z",
      "subSchemas": [
        "EContactSchemaBBBBBBBBBBBBBBBBBBBBB",
        "EAddressSchemaCCCCCCCCCCCCCCCCCCCCC"
      ]
    }
  }
}
```

## Schema Generation from JSON

KERITS provides utilities to automatically generate KERI schemas from example JSON objects:

```typescript
import { generateSchemaFromJson } from './lib/schema-generator';

const exampleData = {
  name: { first: "Alice", last: "Jones" },
  dob: "1992-05-10",
  status: "active"
};

const schema = generateSchemaFromJson(exampleData, {
  title: "Person",
  description: "A person record"
});
```

The generator:
- Infers types from values
- Detects date/date-time formats
- Identifies array types
- Handles nested objects
- Marks all present fields as required (can be customized)

## Schema Validation

Validate ACDC payloads against schemas:

```typescript
import { validateAcdcPayload } from './lib/schema-validator';

const result = validateAcdcPayload(payload, schema);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Best Practices

### 1. Use Descriptive Titles
```json
{
  "title": "EmploymentRecord",
  "description": "Record of employment history"
}
```

### 2. Add Constraints
```json
{
  "age": {
    "type": "integer",
    "minimum": 0,
    "maximum": 150
  },
  "email": {
    "type": "string",
    "format": "email",
    "maxLength": 255
  }
}
```

### 3. Document Sub-Schemas
```json
{
  "metadata": {
    "type": "object",
    "properties": {
      "subSchemas": {
        "description": "SAIDs of referenced schemas (Contact, Address)",
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}
```

### 4. Use Enums for Finite Sets
```json
{
  "country": {
    "type": "string",
    "enum": ["US", "CA", "MX", "UK", "DE", "FR"]
  }
}
```

### 5. Nest Related Data
```json
{
  "address": {
    "type": "object",
    "properties": {
      "street": { "type": "string" },
      "city": { "type": "string" },
      "zip": { "type": "string" }
    }
  }
}
```

## Schema Versioning

When updating schemas:

1. **Minor changes** (adding optional fields) - Update version in place
2. **Breaking changes** (removing fields, changing types) - Create new schema with new SAID
3. **Reference old schemas** - Include old SAID in `subSchemas` for backwards compatibility

## Integration with KERITS UI

The KERITS schema creator supports:

- ✅ Visual field builder
- ✅ Nested object editor
- ✅ Array configuration
- ✅ Enum management
- ✅ Format selection
- ✅ JSON import (generates schema from example)
- ✅ Schema preview and validation
- ✅ One-click publish to KEL

## References

- [JSON Schema Specification](https://json-schema.org/draft/2020-12/schema)
- [ACDC Specification](https://github.com/trustoverip/tswg-acdc-specification)
- [KERI Specification](https://github.com/WebOfTrust/keri)
