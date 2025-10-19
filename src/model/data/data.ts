/**
 * Data operations - SAID generation, schema generation, validation
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { canonicalize } from 'json-canonicalize';
import type { SAID } from '../types';

export interface JSONSchema {
    $id?: string;
    $schema?: string;
    title: string;
    description?: string;
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
}

export interface ValidationError {
    path: string;
    message: string;
}

/**
 * Data class for SAID generation and schema operations
 */
export class Data {
    private data: any;

    private constructor(data: any) {
        this.data = data;
    }

    /**
     * Create Data from JSON object
     */
    static fromJson(obj: any): Data {
        return new Data(structuredClone(obj));
    }

    /**
     * Get the underlying JSON data
     */
    toJson(): any {
        return structuredClone(this.data);
    }

    /**
     * Generate SAID and add it to the data
     *
     * @param fieldName - Field name for SAID (default: 'd')
     * @returns Object with SAID and updated data
     */
    saidify(fieldName: string = 'd'): { said: SAID; data: any } {
        // Clone data and add placeholder
        const dataWithPlaceholder = structuredClone(this.data);
        dataWithPlaceholder[fieldName] = '#'.repeat(44); // Blake3-256 CESR length

        // Canonicalize and hash
        const canonical = canonicalize(dataWithPlaceholder);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });

        // Encode as CESR Blake3-256 (code 'E')
        const said = encodeCESRDigest(hash, 'E') as SAID;

        // Replace placeholder with actual SAID
        const finalData = structuredClone(this.data);
        finalData[fieldName] = said;

        return { said, data: finalData };
    }

    /**
     * Generate JSON Schema from data structure
     */
    generateSchema(title: string, description?: string): JSONSchema {
        const properties = generatePropertiesFromData(this.data);

        // Create schema object
        const schemaObj = {
            $schema: 'https://json-schema.org/draft-07/schema',
            title,
            description,
            type: 'object',
            properties,
        };

        // Generate SAID for schema
        const schemaData = Data.fromJson(schemaObj);
        const { said } = schemaData.saidify('$id');

        return {
            ...schemaObj,
            $id: said,
        };
    }

    /**
     * Validate this data against a JSON Schema (instance method)
     *
     * @param schema - JSON Schema to validate against
     * @returns Array of validation errors (empty if valid)
     */
    validateWith(schema: JSONSchema): ValidationError[] {
        return validateData(this.data, schema);
    }

    /**
     * Validate data against a JSON Schema (static method for convenience)
     *
     * @param data - Data to validate
     * @param schema - JSON Schema to validate against
     * @returns Array of validation errors (empty if valid)
     */
    static validate(data: any, schema: JSONSchema): ValidationError[] {
        return validateData(data, schema);
    }
}

/**
 * Internal validation function
 */
function validateData(data: any, schema: JSONSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.type === 'object' && schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            // Check required fields
            if (data[key] === undefined) {
                if (schema.required?.includes(key)) {
                    errors.push({
                        path: key,
                        message: `Required property '${key}' is missing`,
                    });
                }
                continue;
            }

            const value = data[key];
            const expectedType = propSchema.type;

            // Type validation
            if (expectedType) {
                const actualType = getJsonType(value);
                if (actualType !== expectedType) {
                    errors.push({
                        path: key,
                        message: `Property '${key}' should be ${expectedType}, got ${actualType}`,
                    });
                    continue; // Skip further validation if type is wrong
                }
            }

            // String constraints
            if (propSchema.type === 'string' && typeof value === 'string') {
                // Pattern validation
                if (propSchema.pattern) {
                    const regex = new RegExp(propSchema.pattern);
                    if (!regex.test(value)) {
                        errors.push({
                            path: key,
                            message: `Property '${key}' does not match pattern '${propSchema.pattern}'`,
                        });
                    }
                }

                // Length constraints
                if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
                    errors.push({
                        path: key,
                        message: `Property '${key}' must be at least ${propSchema.minLength} characters, got ${value.length}`,
                    });
                }

                if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
                    errors.push({
                        path: key,
                        message: `Property '${key}' must be at most ${propSchema.maxLength} characters, got ${value.length}`,
                    });
                }
            }

            // Number constraints
            if (propSchema.type === 'number' && typeof value === 'number') {
                if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                    errors.push({
                        path: key,
                        message: `Property '${key}' must be >= ${propSchema.minimum}, got ${value}`,
                    });
                }

                if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                    errors.push({
                        path: key,
                        message: `Property '${key}' must be <= ${propSchema.maximum}, got ${value}`,
                    });
                }
            }
        }
    }

    return errors;
}

/**
 * Generate JSON Schema properties from data
 */
function generatePropertiesFromData(data: any): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        const type = getJsonType(value);

        if (type === 'object' && value !== null) {
            properties[key] = {
                type: 'object',
                properties: generatePropertiesFromData(value),
            };
        } else if (type === 'string') {
            // Check if string looks like a date (ISO 8601 format)
            const prop: any = { type };
            if (typeof value === 'string' && isDateString(value)) {
                prop.format = 'date';
            }
            properties[key] = prop;
        } else {
            properties[key] = { type };
        }
    }

    return properties;
}

/**
 * Check if a string looks like a date (ISO 8601 YYYY-MM-DD)
 */
function isDateString(value: string): boolean {
    // Simple check for ISO 8601 date format (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Get JSON type of a value
 */
function getJsonType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'object') return 'object';
    return 'unknown';
}

/**
 * Encode digest as CESR
 */
function encodeCESRDigest(digest: Uint8Array, code: string): string {
    // Base64 URL-safe encoding
    const b64 = encodeBase64Url(digest);

    // CESR encoding: code + base64 (with proper padding handling)
    return code + b64;
}

/**
 * Encode bytes to base64url without padding
 */
function encodeBase64Url(bytes: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
