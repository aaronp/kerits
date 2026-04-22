import type { ScenarioDefinition } from '@kerits/architecture';
import {
  validateCatalog as _validateCatalog,
  type CatalogReport,
  type ValidationError,
  type ValidationWarning,
} from '@kerits/architecture';
import { capabilities, domains, functionality, layers } from './registry.js';

export type { CatalogReport, ValidationError, ValidationWarning };

const coreRegistry = { layers, domains, capabilities, functionality };

export function validateCatalog(defs: readonly ScenarioDefinition[]): CatalogReport {
  return _validateCatalog(coreRegistry, defs);
}
