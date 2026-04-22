// Constrained string-literal vocabularies — the only place new architecture names
// are introduced. Every id here MUST have a corresponding named constant in
// registry.ts; the satisfies-Record clauses there enforce this at compile time.

export type LayerId = 'core';
export type DomainId = 'SAID' | 'KEL';
export type CapabilityId = 'said-computation' | 'keri-said-derivation' | 'kel-validation';
export type FunctionalityId =
  | 'said-encode'
  | 'said-verify'
  | 'said-derive'
  | 'said-recompute'
  | 'validate-said'
  | 'validate-required-fields'
  | 'validate-aid-rules'
  | 'validate-sequence'
  | 'validate-chain-linkage'
  | 'validate-signatures'
  | 'validate-threshold'
  | 'validate-key-rotation'
  | 'validate-delegation'
  | 'validate-witnesses'
  | 'validate-config-traits'
  | 'validate-key-uniqueness'
  | 'validate-chain';
