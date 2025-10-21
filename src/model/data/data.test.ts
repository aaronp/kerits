/**
 * Tests for Data operations (TDD)
 */

import { describe, it, expect } from 'bun:test';
import { Data } from './data';

describe('Data Operations', () => {
    describe('Data.fromJson', () => {
        it('should create Data from JSON object', () => {
            const obj = { name: 'Alice', age: 30 };
            const data = Data.fromJson(obj);

            expect(data).toBeDefined();
            expect(data.toJson()).toEqual(obj);
        });

        it('should handle nested objects', () => {
            const obj = {
                user: {
                    name: 'Bob',
                    contact: {
                        email: 'bob@example.com',
                    },
                },
            };

            const data = Data.fromJson(obj);
            expect(data.toJson()).toEqual(obj);
        });

        it('should handle arrays', () => {
            const obj = {
                tags: ['friend', 'colleague'],
                scores: [1, 2, 3],
            };

            const data = Data.fromJson(obj);
            expect(data.toJson()).toEqual(obj);
        });
    });

    describe('Data.saidify', () => {
        it('should add SAID field to data', () => {
            const obj = { name: 'Charlie', age: 25 };
            const data = Data.fromJson(obj);

            const result = data.saidify();

            expect(result.said).toBeDefined();
            expect(typeof result.said).toBe('string');
            expect(result.said).toMatch(/^E/); // Blake3-256 CESR code

            expect(result).toEqual({
                said: "EuDhp7o8TB71MQ3NKn86fiFDd3Eyj2qwRYdoYqc7Khxk",
                data: {
                    name: "Charlie",
                    age: 25,
                    d: "EuDhp7o8TB71MQ3NKn86fiFDd3Eyj2qwRYdoYqc7Khxk",
                },
            });
        });

        it('should use custom field name for SAID', () => {
            const obj = { name: 'David' };
            const data = Data.fromJson(obj);

            const result = data.saidify('id');

            expect(result).toEqual({
                said: "EroxyFCuHRfaRrR0_FbuNsjyH-fuHBDrBFb_Q0bWY7rw",
                data: {
                    name: "David",
                    id: "EroxyFCuHRfaRrR0_FbuNsjyH-fuHBDrBFb_Q0bWY7rw",
                },
            });
        });

        it('should generate deterministic SAIDs for same data', () => {
            const obj = { name: 'Eve', value: 42 };

            const data1 = Data.fromJson(obj);
            const result1 = data1.saidify();

            const data2 = Data.fromJson(obj);
            const result2 = data2.saidify();

            expect(result1.said).toBe(result2.said);
        });

        it('should generate different SAIDs for different data', () => {
            const obj1 = { name: 'Frank' };
            const obj2 = { name: 'Grace' };

            const result1 = Data.fromJson(obj1).saidify();
            const result2 = Data.fromJson(obj2).saidify();

            expect(result1.said).not.toBe(result2.said);
        });

        it('should preserve original data fields', () => {
            const obj = { name: 'Henry', age: 35, active: true };
            const data = Data.fromJson(obj);

            const result = data.saidify();

            expect(result.data.name).toBe('Henry');
            expect(result.data.age).toBe(35);
            expect(result.data.active).toBe(true);
        });

        it('should handle nested objects in saidified data', () => {
            const obj = {
                user: { name: 'Ivy' },
                metadata: { created: '2024-01-01' },
            };

            const data = Data.fromJson(obj);
            const result = data.saidify();

            expect(result.data.user).toEqual({ name: 'Ivy' });
            expect(result.data.metadata).toEqual({ created: '2024-01-01' });
            expect(result.data.d).toBe(result.said);
        });
    });

    describe('Data.generateSchema', () => {
        it('should generate JSON Schema from data', () => {
            const obj = {
                name: 'Jack',
                age: 40,
                active: true,
            };

            const data = Data.fromJson(obj);
            const schema = data.generateSchema('User Profile');


            expect(schema).toEqual({
                $schema: "https://json-schema.org/draft-07/schema",
                title: "User Profile",
                description: undefined,
                type: "object",
                properties: {
                    name: {
                        type: "string",
                    },
                    age: {
                        type: "number",
                    },
                    active: {
                        type: "boolean",
                    },
                },
                $id: "EJmj8yzZziRo7aFjsYg_W4U5BeAhuq8aL6Sz0l5rIkwE",
            });

        });

        it('should include description in schema', () => {
            const obj = { email: 'test@example.com' };
            const data = Data.fromJson(obj);

            const schema = data.generateSchema('Email', 'A valid email address');

            expect(schema.description).toBe('A valid email address');
        });

        it('should generate schema with SAID as $id', () => {
            const obj = { value: 123 };
            const data = Data.fromJson(obj);

            const schema = data.generateSchema('Test Schema');

            expect(schema.$id).toBeDefined();
            expect(schema.$id).toMatch(/^E/); // Should be a SAID
        });

        it('should handle nested objects in schema', () => {
            const obj = {
                user: {
                    name: 'Kate',
                    email: 'kate@example.com',
                },
            };

            const data = Data.fromJson(obj);
            const schema = data.generateSchema('Nested User');

            expect(schema.properties.user).toBeDefined();
            expect(schema.properties.user.type).toBe('object');
            expect(schema.properties.user.properties).toBeDefined();
            expect(schema.properties.user.properties.name).toEqual({ type: 'string' });
            expect(schema.properties.user.properties.email).toEqual({ type: 'string' });
        });

        it('should handle arrays in schema', () => {
            const obj = {
                tags: ['tag1', 'tag2'],
                scores: [1, 2, 3],
            };

            const data = Data.fromJson(obj);
            const schema = data.generateSchema('Arrays Test');

            expect(schema.properties.tags).toEqual({ type: 'array' });
            expect(schema.properties.scores).toEqual({ type: 'array' });
        });
    });

    describe('Data.validateWith', () => {
        it('should validate data against schema using fluent API', () => {
            const obj = { name: 'Leo', age: 28 };
            const data = Data.fromJson(obj);
            const schema = data.generateSchema('Person');

            const errors = data.validateWith(schema);

            expect(errors).toEqual([]);
        });

        it('should return exact errors for invalid data types', () => {
            const validObj = { name: 'Mike', age: 30 };
            const data = Data.fromJson(validObj);
            const schema = data.generateSchema('Person');

            const invalidObj = { name: 'Mike', age: 'thirty' }; // age should be number
            const invalidData = Data.fromJson(invalidObj);

            const errors = invalidData.validateWith(schema);

            expect(errors).toEqual([
                {
                    path: 'age',
                    message: "Property 'age' should be number, got string",
                },
            ]);
        });

        it('should return exact errors for missing required fields', () => {
            const validObj = { name: 'Nina', age: 25 };
            const data = Data.fromJson(validObj);
            const schema = data.generateSchema('Person');
            schema.required = ['name', 'age'];

            const invalidObj = { name: 'Nina' }; // missing age
            const invalidData = Data.fromJson(invalidObj);

            const errors = invalidData.validateWith(schema);

            expect(errors).toEqual([
                {
                    path: 'age',
                    message: "Required property 'age' is missing",
                },
            ]);
        });

        it('should handle date type validation', () => {
            const obj = {
                name: 'Paul',
                birthdate: '1990-01-01',
            };
            const data = Data.fromJson(obj);
            const schema = data.generateSchema('Person with Date');

            // birthdate should be detected as date format
            expect(schema.properties.birthdate).toEqual({
                type: 'string',
                format: 'date',
            });

            const errors = data.validateWith(schema);
            expect(errors).toEqual([]);
        });

        it('should validate string pattern constraints', () => {
            const schema = {
                title: 'Email Schema',
                type: 'object' as const,
                properties: {
                    email: {
                        type: 'string' as const,
                        pattern: '^[^@]+@[^@]+\\.[^@]+$',
                    },
                },
            };

            const validData = Data.fromJson({ email: 'test@example.com' });
            expect(validData.validateWith(schema)).toEqual([]);

            const invalidData = Data.fromJson({ email: 'invalid-email' });
            expect(invalidData.validateWith(schema)).toEqual([
                {
                    path: 'email',
                    message: "Property 'email' does not match pattern '^[^@]+@[^@]+\\.[^@]+$'",
                },
            ]);
        });

        it('should validate number min/max constraints', () => {
            const schema = {
                title: 'Age Schema',
                type: 'object' as const,
                properties: {
                    age: {
                        type: 'number' as const,
                        minimum: 0,
                        maximum: 120,
                    },
                },
            };

            const validData = Data.fromJson({ age: 25 });
            expect(validData.validateWith(schema)).toEqual([]);

            const tooYoung = Data.fromJson({ age: -5 });
            expect(tooYoung.validateWith(schema)).toEqual([
                {
                    path: 'age',
                    message: "Property 'age' must be >= 0, got -5",
                },
            ]);

            const tooOld = Data.fromJson({ age: 150 });
            expect(tooOld.validateWith(schema)).toEqual([
                {
                    path: 'age',
                    message: "Property 'age' must be <= 120, got 150",
                },
            ]);
        });

        it('should validate string length constraints', () => {
            const schema = {
                title: 'Username Schema',
                type: 'object' as const,
                properties: {
                    username: {
                        type: 'string' as const,
                        minLength: 3,
                        maxLength: 20,
                    },
                },
            };

            const validData = Data.fromJson({ username: 'alice' });
            expect(validData.validateWith(schema)).toEqual([]);

            const tooShort = Data.fromJson({ username: 'ab' });
            expect(tooShort.validateWith(schema)).toEqual([
                {
                    path: 'username',
                    message: "Property 'username' must be at least 3 characters, got 2",
                },
            ]);

            const tooLong = Data.fromJson({ username: 'a'.repeat(25) });
            expect(tooLong.validateWith(schema)).toEqual([
                {
                    path: 'username',
                    message: "Property 'username' must be at most 20 characters, got 25",
                },
            ]);
        });
    });

    describe('Data.validate (static)', () => {
        it('should validate data against schema using static method', () => {
            const obj = { name: 'Oscar', age: 35 };
            const data = Data.fromJson(obj);
            const schema = data.generateSchema('Person');

            const errors = Data.validate(obj, schema);

            expect(errors).toEqual([]);
        });
    });

    describe('Data.canonicalize', () => {
        it('should produce deterministic canonical form', () => {
            const obj = { name: 'Alice', age: 30 };
            const data = Data.fromJson(obj);

            const result = data.canonicalize();

            expect(result.raw).toBeInstanceOf(Uint8Array);
            expect(result.text).toBe('{"age":30,"name":"Alice"}'); // Keys sorted
        });

        it('should produce same output for same input (deterministic)', () => {
            const obj = { b: 2, a: 1 };

            const result1 = Data.fromJson(obj).canonicalize();
            const result2 = Data.fromJson(obj).canonicalize();

            expect(result1.text).toBe(result2.text);
            expect(result1.raw).toEqual(result2.raw);
        });

        it('should sort nested object keys', () => {
            const obj = {
                z: { y: 1, x: 2 },
                a: { c: 3, b: 4 }
            };
            const data = Data.fromJson(obj);

            const result = data.canonicalize();

            expect(result.text).toBe('{"a":{"b":4,"c":3},"z":{"x":2,"y":1}}');
        });
    });

    describe('Data.digest', () => {
        it('should compute Blake3 digest of bytes', () => {
            const obj = { name: 'Bob' };
            const { raw } = Data.fromJson(obj).canonicalize();

            const digest = Data.digest(raw);

            expect(digest).toMatch(/^E[A-Za-z0-9_-]{43}$/); // CESR Blake3-256 format
        });

        it('should produce same digest for same bytes', () => {
            const obj = { value: 42 };
            const { raw } = Data.fromJson(obj).canonicalize();

            const digest1 = Data.digest(raw);
            const digest2 = Data.digest(raw);

            expect(digest1).toBe(digest2);
        });

        it('should produce different digests for different data', () => {
            const obj1 = { value: 1 };
            const obj2 = { value: 2 };

            const digest1 = Data.digest(Data.fromJson(obj1).canonicalize().raw);
            const digest2 = Data.digest(Data.fromJson(obj2).canonicalize().raw);

            expect(digest1).not.toBe(digest2);
        });
    });

    describe('Data byte encoding helpers', () => {
        it('should encode and decode Uint8Array as base64url', () => {
            const original = new Uint8Array([1, 2, 3, 4, 5, 255]);

            const encoded = Data.encodeBytes(original);
            const decoded = Data.decodeBytes(encoded);

            expect(decoded).toEqual(original);
        });

        it('should produce URL-safe base64', () => {
            const bytes = new Uint8Array(32).fill(255);
            const encoded = Data.encodeBytes(bytes);

            // Should not contain +, /, or =
            expect(encoded).not.toMatch(/[+/=]/);
        });
    });
});
