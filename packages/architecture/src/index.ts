// @kerits/architecture — shared architecture evidence toolkit

export { captureSource, parseStackLine, type SourceLocation } from './capture-source.js';
export { isCatalogOnly, resolveEvidenceDir, resolveEvidenceFilename, resolveRunId } from './evidence-paths.js';
export { mergeObservations } from './merge-evidence-lib.js';
export { renderCapabilitiesMdx, renderDomainMdx, renderStatusMdx, type SourceLinkConfig } from './render-mdx.js';
export { type ArchitectureReport, deriveArchitectureReport, type RegistryData } from './report.js';
export { rollupStatus } from './rollup.js';
export { __appendObservation, __getRegisteredDefinitions, __resetForTests, scenario } from './scenario.js';
export * from './scenario-types.js';
export * from './types.js';
export { type CatalogReport, type ValidationError, type ValidationWarning, validateCatalog } from './validate.js';
