/**
 * KERI DSL - High-level API for KERI operations
 *
 * Hierarchical DSL for account, registry, credential, and schema management
 */

// Export all types
export * from './types';

// Export main builder
export { createKeritsDSL } from './builders/kerits';

// Export individual builders (for advanced usage)
export { createAccountDSL } from './builders/account';
export { createRegistryDSL } from './builders/registry';
export { createACDCDSL } from './builders/acdc';
export { createSchemaDSL } from './builders/schema';
export { createContactsDSL } from './builders/contacts';
export { createImportDSL } from './builders/import';
export { createContactSyncDSL } from './builders/contact-sync';

// Export export/import functions
export {
  exportKel,
  exportTel,
  exportAcdc,
  exportMixed,
  exportKelIncremental,
  exportTelIncremental,
} from './builders/export';

// Export utilities
export { seedToMnemonic, mnemonicToSeed } from './utils';
