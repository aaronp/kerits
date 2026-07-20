import { describe, it, expect } from 'bun:test';
import { presentationDefinitionSaid } from '../../policy/index.js';
import type { PresentationDefinition } from '../../policy/index.js';

describe('presentationDefinitionSaid', () => {
  // setup: a minimal PresentationDefinition with one input descriptor
  const basePd: PresentationDefinition = {
    id: 'pd_test-001',
    input_descriptors: [
      {
        id: 'cred_001',
        name: 'National ID',
        purpose: 'Proof of possession',
        constraints: { fields: [{ path: ['$.credentialSchema'], filter: { const: 'ESchema123' } }] },
      },
    ],
  };

  it('returns a deterministic SAID for the same input', () => {
    // method under test: presentationDefinitionSaid produces a CESR Blake3 digest
    const said1 = presentationDefinitionSaid(basePd);
    const said2 = presentationDefinitionSaid(basePd);

    // assertions: same input yields identical SAID with correct format
    expect(said1).toBe(said2);
    expect(said1).toMatch(/^E/);
    expect(said1).toHaveLength(44);
  });

  it('returns different SAIDs for different inputs', () => {
    // setup: a second PD differing only in the schema filter value
    const pd2: PresentationDefinition = {
      ...basePd,
      input_descriptors: [
        { ...basePd.input_descriptors[0]!, constraints: { fields: [{ path: ['$.credentialSchema'], filter: { const: 'ESchemaOther' } }] } },
      ],
    };

    // method under test
    const said1 = presentationDefinitionSaid(basePd);
    const said2 = presentationDefinitionSaid(pd2);

    // assertions: different content yields different SAIDs
    expect(said1).not.toBe(said2);
  });

  it('produces the same SAID regardless of property insertion order', () => {
    // setup: two objects with identical content but different key insertion order
    const pdA = { id: 'pd_x', input_descriptors: [{ id: 'c1' }] };
    const pdB = { input_descriptors: [{ id: 'c1' }], id: 'pd_x' };

    // method under test
    const saidA = presentationDefinitionSaid(pdA as PresentationDefinition);
    const saidB = presentationDefinitionSaid(pdB as PresentationDefinition);

    // assertions: canonical ordering makes SAIDs identical
    expect(saidA).toBe(saidB);
  });

  it('produces a stable golden-vector SAID', () => {
    // setup: a fixed minimal PD for golden-vector pinning
    const goldenPd: PresentationDefinition = {
      id: 'pd_golden',
      input_descriptors: [],
    };

    // method under test
    const said = presentationDefinitionSaid(goldenPd);

    // assertions: pinned golden vector (canonical CESR Blake3-256 digest)
    expect(said).toBe('EAN2vdydV4EfQkLKonlLPwcL-fKPlQJAmiQkWe34w8rJ');
  });
});
