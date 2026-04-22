import { describe, expect, it } from 'bun:test';
import {
  capabilities,
  coreLayer,
  domains,
  functionality,
  layers,
  saidComputation,
  saidDomain,
  saidEncode,
  saidVerify,
} from './registry.js';

describe('architecture registry', () => {
  it('saidComputation.domain references saidDomain by identity', () => {
    expect(saidComputation.domain).toBe(saidDomain);
  });

  it('saidComputation.layers contains coreLayer by identity', () => {
    expect(saidComputation.layers).toContain(coreLayer);
  });

  it('saidEncode.capability references saidComputation by identity', () => {
    expect(saidEncode.capability).toBe(saidComputation);
  });

  it('saidVerify.capability references saidComputation by identity', () => {
    expect(saidVerify.capability).toBe(saidComputation);
  });

  it('lookup records expose the same objects as the named constants', () => {
    expect(layers.core).toBe(coreLayer);
    expect(domains.SAID).toBe(saidDomain);
    expect(capabilities['said-computation']).toBe(saidComputation);
    expect(functionality['said-encode']).toBe(saidEncode);
    expect(functionality['said-verify']).toBe(saidVerify);
  });

  it('lookup records are frozen-shape (compile-checked via satisfies)', () => {
    // Presence check — the satisfies clauses in registry.ts give us
    // compile-time exhaustiveness; this is a runtime safety net.
    expect(Object.keys(layers).sort()).toEqual(['core']);
    expect(Object.keys(domains).sort()).toEqual(['KEL', 'SAID']);
    expect(Object.keys(capabilities).sort()).toEqual(['kel-validation', 'keri-said-derivation', 'said-computation']);
    expect(Object.keys(functionality).sort()).toEqual([
      'said-derive', 'said-encode', 'said-recompute', 'said-verify',
      'validate-aid-rules', 'validate-chain', 'validate-chain-linkage',
      'validate-config-traits', 'validate-delegation', 'validate-key-rotation',
      'validate-key-uniqueness', 'validate-required-fields', 'validate-said',
      'validate-sequence', 'validate-signatures', 'validate-threshold',
      'validate-witnesses',
    ]);
  });
});
