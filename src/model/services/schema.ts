/**
 * Schema and Data services
 * 
 * Provides services for JSON Schema management and ACDC (Authentic Chained Data Container) operations.
 */

import type { SAID } from '../io/types';

/**
 * Schema Service interface
 * 
 * Manages JSON Schema generation and validation
 */
export interface SchemaService {
    /**
     * Ensure a schema exists for the given data and return its SAID
     */
    ensureSchemaFor(data: unknown): Promise<SAID>;     // generate+store JSON Schema, return SAID

    /**
     * Validate data against a schema SAID
     */
    validate(data: unknown, schemaSaid: SAID): Promise<void>;
}

/**
 * ACDC Service interface
 * 
 * Manages Authentic Chained Data Container operations
 */
export interface ACDCService {
    /**
     * Issue an ACDC for the given payload and schema
     */
    issue(payload: unknown, schemaSaid: SAID): Promise<SAID>; // returns ACDC SAID
}
