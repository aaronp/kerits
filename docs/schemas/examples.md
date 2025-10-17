# KERI Schema Examples

This document provides practical examples of using KERITS schema generation and validation.

## Example 1: Simple Person Schema

### Input Data

```json
{
  "name": "Alice Jones",
  "age": 30,
  "email": "alice@example.com",
  "active": true
}
```

### Generated Schema

```typescript
import { generateSchemaFromJson } from './lib/schema-generator';

const schema = generateSchemaFromJson(data, {
  title: "Person",
  description: "A simple person record",
  $id: "EPersonSchemaSimpleAAAAAAAAAAAAAAA"
});
```

Result:

```json
{
  "$id": "EPersonSchemaSimpleAAAAAAAAAAAAAAA",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Person",
  "description": "A simple person record",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "email": { "type": "string", "format": "email" },
    "active": { "type": "boolean" }
  },
  "required": ["name", "age", "email", "active"]
}
```

## Example 2: Nested Objects and Arrays

### Input Data

```json
{
  "name": {
    "first": "Alice",
    "last": "Jones"
  },
  "dob": "1992-05-10",
  "contact": {
    "type": "email",
    "value": "alice@example.com"
  },
  "jobs": [
    {
      "title": "Engineer",
      "company": "Tech Corp",
      "startDate": "2020-01-01"
    },
    {
      "title": "Architect",
      "company": "Design Co",
      "startDate": "2023-06-15"
    }
  ],
  "tags": ["engineering", "fullstack", "leadership"]
}
```

### Generated Schema

```typescript
const schema = generateSchemaFromJson(data, {
  title: "PersonDetailed",
  $id: "EPersonDetailedAAAAAAAAAAAAAAAAAAA"
});
```

Result includes:
- Nested `name` object with `first` and `last`
- Date format detection for `dob`
- Nested `contact` object
- Array of objects for `jobs`
- Simple string array for `tags`

## Example 3: Enums and Metadata

### Input Data

```json
{
  "status": "active",
  "role": "admin",
  "permissions": ["read", "write", "delete"],
  "metadata": {
    "createdAt": "2025-10-17T12:00:00Z",
    "subSchemas": [
      "EContactSchemaBBBBBBBBBBBBBBBBBBBBB",
      "EAddressSchemaCCCCCCCCCCCCCCCCCCCCC"
    ]
  }
}
```

### Detecting Enums from Multiple Examples

```typescript
const examples = [
  { status: "active", role: "admin" },
  { status: "inactive", role: "user" },
  { status: "active", role: "user" },
  { status: "pending", role: "admin" }
];

const enums = inferEnumsFromExamples(examples);
// Result: { status: ["active", "inactive", "pending"], role: ["admin", "user"] }

// Generate schema with enum hints
const schema = generateSchemaFromJson(examples[0], { title: "User" });
// Manually add enums to schema
schema.properties.status.enum = enums.status;
schema.properties.role.enum = enums.role;
```

## Example 4: Complete ACDC Schema with Sub-Schemas

```typescript
import { generateSchemaFromJson, wrapInAcdcSchema } from './lib/schema-generator';

const personData = {
  name: { first: "Alice", last: "Jones" },
  dob: "1992-05-10",
  contact: { type: "email", value: "alice@example.com" },
  jobs: [{ title: "Engineer", startDate: "2020-01-01" }],
  status: "active",
  metadata: {
    createdAt: "2025-10-17T12:00:00Z",
    subSchemas: ["EContactSchemaBBBBBBBBBBBBBBBBBBBBB"]
  }
};

// Generate JSON Schema
const jsonSchema = generateSchemaFromJson(personData, {
  title: "PersonMini",
  $id: "ESchemaPersonMiniAAAAAAAAAAAAAA"
});

// Wrap in ACDC format
const acdcSchema = wrapInAcdcSchema(jsonSchema, {
  schemaId: "ESchemaPersonMiniAAAAAAAAAAAAAA",
  issuerId: "EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA",
  schemaType: "ESchemaDefTypeAAAAAAAAAAAAAAAAAA"
});
```

Result:

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
    "properties": { ... }
  }
}
```

## Example 5: Validation

### Validate Payload Against Schema

```typescript
import { validateAcdcPayload, formatValidationErrors } from './lib/schema-validator';

const payload = {
  "v": "ACDC10JSON00011c_",
  "d": "EPayloadAAAAAAAAAAAAAAAAAAAAAAAA",
  "i": "EIssuerAAAAAAAAAAAAAAAAAAAAAAAAA",
  "s": "ESchemaPersonMiniAAAAAAAAAAAAAA",
  "a": {
    "name": { "first": "Alice", "last": "Jones" },
    "dob": "1992-05-10",
    "contact": { "type": "email", "value": "alice@example.com" },
    "jobs": [{ "title": "Engineer", "startDate": "2020-01-01" }],
    "status": "active",
    "metadata": {
      "createdAt": "2025-10-17T12:00:00Z",
      "subSchemas": ["EContactSchemaBBBBBBBBBBBBBBBBBBBBB"]
    }
  }
};

const result = validateAcdcPayload(payload, acdcSchema);

if (result.valid) {
  console.log('✓ Payload is valid');
} else {
  console.error('✗ Validation failed:');
  console.error(formatValidationErrors(result));
}
```

### Common Validation Errors

```typescript
// Missing required field
{
  "name": { "first": "Alice" }
  // Missing: name.last
}
// Error: name.last: Required property is missing

// Wrong type
{
  "age": "thirty"
  // Should be: number
}
// Error: age: Expected type integer, got string

// Invalid format
{
  "dob": "05/10/1992"
  // Should be: "1992-05-10"
}
// Error: dob: Invalid date format

// Invalid enum value
{
  "status": "deleted"
  // Allowed: ["active", "inactive", "pending"]
}
// Error: status: Value must be one of: active, inactive, pending

// Array item validation
{
  "jobs": [
    { "title": "Engineer" }
    // Missing: startDate
  ]
}
// Error: jobs[0].startDate: Required property is missing
```

## Example 6: Merging Schemas from Multiple Examples

```typescript
import { generateSchemaFromJson, mergeSchemas } from './lib/schema-generator';

// Example 1: Basic user
const user1 = {
  name: "Alice",
  email: "alice@example.com",
  role: "admin"
};

// Example 2: User with phone
const user2 = {
  name: "Bob",
  email: "bob@example.com",
  phone: "+1234567890"
};

// Example 3: User with department
const user3 = {
  name: "Charlie",
  email: "charlie@example.com",
  department: "Engineering"
};

// Generate individual schemas
const schema1 = generateSchemaFromJson(user1, { title: "User" });
const schema2 = generateSchemaFromJson(user2, { title: "User" });
const schema3 = generateSchemaFromJson(user3, { title: "User" });

// Merge into comprehensive schema
const mergedSchema = mergeSchemas([schema1, schema2, schema3]);

// Result: Schema with all fields, only name + email required
console.log(mergedSchema.properties);
// { name, email, role, phone, department }
console.log(mergedSchema.required);
// ["name", "email"] - only fields present in ALL examples
```

## Example 7: Complex Nested Structure

```json
{
  "organization": {
    "name": "Tech Corp",
    "founded": "2010-01-01",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102",
      "country": "US"
    },
    "employees": [
      {
        "name": { "first": "Alice", "last": "Jones" },
        "title": "CTO",
        "department": "Engineering",
        "startDate": "2015-06-01"
      }
    ],
    "departments": ["Engineering", "Sales", "Marketing"],
    "status": "active",
    "metadata": {
      "lastUpdated": "2025-10-17T12:00:00Z",
      "certifications": ["ISO9001", "SOC2"]
    }
  }
}
```

This example demonstrates:
- ✅ Triple-nested objects (`organization.address.city`)
- ✅ Array of complex objects (`employees`)
- ✅ Simple arrays (`departments`, `certifications`)
- ✅ Date formats (`founded`, `startDate`, `lastUpdated`)
- ✅ Enum candidates (`status`, `state`, `country`)

## Tips for Schema Generation

### 1. Provide Representative Examples
Use data that covers all edge cases and optional fields.

### 2. Add Constraints After Generation
```typescript
const schema = generateSchemaFromJson(data, { title: "User" });

// Add custom constraints
schema.properties.age.minimum = 0;
schema.properties.age.maximum = 150;
schema.properties.email.maxLength = 255;
```

### 3. Mark Optional Fields
```typescript
const schema = generateSchemaFromJson(data, {
  title: "User",
  markAllRequired: false
});

// Manually specify required fields
schema.required = ["name", "email"];
```

### 4. Detect Enums from Multiple Examples
```typescript
const examples = [/* ... */];
const enums = inferEnumsFromExamples(examples, 5);

// Apply detected enums to schema
Object.entries(enums).forEach(([field, values]) => {
  if (schema.properties[field]) {
    schema.properties[field].enum = values;
  }
});
```

### 5. Add Descriptions
```typescript
schema.properties.email.description = "User's primary email address";
schema.properties.status.description = "Account status (active/inactive/pending)";
```
