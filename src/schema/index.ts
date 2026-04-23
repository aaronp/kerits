import { SchemaOps } from './ops.js';
import { SchemaData } from './schema-data.js';

export const Schema = {
  ...SchemaData,
  ...SchemaOps,
} as const;

export type { SchemaVerifyResult } from './ops.js';
export { SchemaOps } from './ops.js';
export type { SchemaParseResult } from './schema-data.js';
export { SchemaData } from './schema-data.js';
export * from './types.js';
