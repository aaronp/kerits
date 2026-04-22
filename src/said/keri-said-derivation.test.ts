import { describe, expect } from 'bun:test';
import { scenario } from '../architecture/index.js';
import { saidDerive, saidRecompute } from '../architecture/registry.js';
import { Data, SAID_PLACEHOLDER } from '../common/data.js';
import { deriveSaid, recomputeSaid } from '../common/derivation-surface.js';
import type { DerivationSurface } from '../common/derivation-surface.js';

const UNVERSIONED: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['d', 'hello', 'n'],
  hasVersionString: false,
};

const VERSIONED: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'hello', 'n'],
  hasVersionString: true,
  versionStringField: 'v',
};

describe('keri-said-derivation: said-derive', () => {
  scenario(
    {
      id: 'derives-said-with-placeholder',
      functionality: saidDerive,
      description:
        'Preimage carries the placeholder at the said field regardless of any pre-existing value; ' +
        'sealed artifact has the derived SAID written back to that field',
      covers: ['said-field-binding', 'placeholder-at-said-field'],
    },
    () => {
      // Pre-existing value at the said field must not influence the result.
      const a = { d: 'anything-nonempty-should-not-matter', hello: 'world', n: 1 } as const;
      const b = { d: '', hello: 'world', n: 1 } as const;

      const resA = deriveSaid(a, UNVERSIONED);
      const resB = deriveSaid(b, UNVERSIONED);

      // Placeholder-independence: derivation yields the same SAID either way.
      expect(resA.said).toBe(resB.said);
      // Said field is sealed to the derived SAID.
      expect(resA.sealed.d).toBe(resA.said);
      // CESR Blake3-256 digests are 44 chars, 'E' prefix.
      expect(resA.said.startsWith('E')).toBe(true);
      expect(resA.said).toHaveLength(44);
      // Other fields are preserved.
      expect(resA.sealed.hello).toBe('world');
      expect(resA.sealed.n).toBe(1);
      // Placeholder is never returned.
      expect(resA.said).not.toBe(SAID_PLACEHOLDER);
    },
  );

  scenario(
    {
      id: 'excluded-fields-do-not-affect-said',
      functionality: saidDerive,
      description:
        'Only fields listed in derivedFieldsInOrder contribute to the SAID; excluded fields ' +
        'are preserved on the sealed artifact but do not affect the digest',
      covers: ['derivation-surface-isolates-signed-fields'],
    },
    () => {
      const base = { d: '', hello: 'world', n: 1 } as const;
      const withExcluded = { ...base, p: 'parent', dt: '2026-04-16T00:00:00Z' } as const;

      const baseRes = deriveSaid(base, UNVERSIONED);
      const extRes = deriveSaid(withExcluded, UNVERSIONED);

      expect(extRes.said).toBe(baseRes.said);
      // Excluded fields round-trip onto the sealed artifact unchanged.
      expect(extRes.sealed.p).toBe('parent');
      expect(extRes.sealed.dt).toBe('2026-04-16T00:00:00Z');
    },
  );

  scenario(
    {
      id: 'version-string-converges-on-serialized-size',
      functionality: saidDerive,
      description:
        'The version string in the sealed artifact declares the encoded byte-length of the ' +
        'final canonical serialization with the placeholder at the said field',
      covers: ['version-string-size-converges'],
    },
    () => {
      const artifact = { v: '', t: 'ixn', d: '', hello: 'world', n: 1 } as const;
      const { sealed, said } = deriveSaid(artifact, VERSIONED);

      // The sealed version string declares a size that matches the serialized preimage length.
      expect(typeof sealed.v).toBe('string');
      const sizeMatch = (sealed.v as string).match(/^KERI10JSON([0-9]{6})_$/);
      expect(sizeMatch).not.toBeNull();

      // Reconstruct the preimage and confirm its byte length equals the declared size.
      // (This mirrors the loop invariant in Data.computeVersionString.)
      const declaredSize = Number.parseInt(sizeMatch![1], 10);
      const preimage = { ...sealed, d: SAID_PLACEHOLDER };
      const { raw } = Data.fromJson(preimage).canonicalize();
      expect(raw.length).toBe(declaredSize);

      // SAID is the CESR-encoded digest of that preimage.
      expect(said.startsWith('E')).toBe(true);
      expect(said).toHaveLength(44);
    },
  );

  scenario(
    {
      id: 'version-string-converges-for-larger-artifact',
      functionality: saidDerive,
      description:
        'Convergence invariant holds for a larger artifact: the declared size in sealed.v ' +
        'equals the true byte length of the canonical serialization with the placeholder ' +
        'substituted at the said field',
      covers: ['version-string-size-converges'],
    },
    () => {
      // A larger artifact than scenario 3; exercises the same convergence loop against
      // a different size regime. The correctness claim is structural (declared size ==
      // actual serialized byte length) and independent of how many iterations
      // Data.computeVersionString took internally.
      const padding = 'x'.repeat(60);
      const artifact = { v: '', t: 'ixn', d: '', payload: padding } as const;
      const BOUNDARY: DerivationSurface = {
        saidField: 'd',
        derivedFieldsInOrder: ['v', 't', 'd', 'payload'],
        hasVersionString: true,
        versionStringField: 'v',
      };
      const { sealed } = deriveSaid(artifact, BOUNDARY);

      const sizeMatch = (sealed.v as string).match(/^KERI10JSON([0-9]{6})_$/);
      expect(sizeMatch).not.toBeNull();
      const declaredSize = Number.parseInt(sizeMatch![1], 10);
      const preimage = { ...sealed, d: SAID_PLACEHOLDER };
      const { raw } = Data.fromJson(preimage).canonicalize();
      expect(raw.length).toBe(declaredSize);

      // Also: the serialized preimage with the declared size differs from the preimage
      // with size '000000' — proof that computeVersionString is not a no-op for this
      // artifact (it changed at least the 6-digit size slot).
      const preimageWithZeroSize = {
        ...sealed,
        v: 'KERI10JSON000000_',
        d: SAID_PLACEHOLDER,
      };
      const { raw: zeroRaw } = Data.fromJson(preimageWithZeroSize).canonicalize();
      expect(zeroRaw).not.toEqual(raw);
    },
  );

  scenario.todo({
    id: 'matches-keri-reference-vector-kel-icp',
    functionality: saidDerive,
    description: 'Derives the same SAID as a KERI reference vector for an inception event',
    covers: ['keri-canonical-serialization', 'said-field-binding', 'placeholder-at-said-field'],
    annotations: [
      'Blocked by PB-012: kerits currently uses RFC 8785 key-sorted canonicalization ' +
      'rather than KERI-required insertion-order serialization.',
      'This is a spec compliance gap, not a documentation gap.',
    ],
  });
});

describe('keri-said-derivation: said-recompute', () => {
  scenario(
    {
      id: 'recomputes-equal-for-sealed-artifact',
      functionality: saidRecompute,
      description:
        'A sealed artifact produced by deriveSaid recomputes to the same SAID and matches=true; ' +
        'excluded fields on the sealed artifact do not affect the recomputed value',
      covers: ['sealed-artifact-verifies-against-preimage', 'derivation-surface-isolates-signed-fields'],
    },
    () => {
      const artifact = { d: '', hello: 'world', n: 1 } as const;
      const { sealed, said } = deriveSaid(artifact, UNVERSIONED);

      const result = recomputeSaid(sealed, UNVERSIONED);
      expect(result.matches).toBe(true);
      expect(result.declared).toBe(said);
      expect(result.recomputed).toBe(said);
    },
  );

  scenario(
    {
      id: 'rejects-tampered-included-field',
      functionality: saidRecompute,
      description:
        'Mutating a field listed in derivedFieldsInOrder after sealing causes recompute to ' +
        'return matches=false with the recomputed value differing from the declared SAID',
      covers: ['sealed-artifact-verifies-against-preimage'],
    },
    () => {
      const { sealed, said } = deriveSaid(
        { d: '', hello: 'world', n: 1 } as const,
        UNVERSIONED,
      );
      const tampered = { ...sealed, hello: 'tampered' };
      const result = recomputeSaid(tampered, UNVERSIONED);

      expect(result.matches).toBe(false);
      expect(result.declared).toBe(said);
      expect(result.recomputed).not.toBe(said);
    },
  );

  scenario(
    {
      id: 'ignores-tampered-excluded-field',
      functionality: saidRecompute,
      description:
        'Mutating a field not listed in derivedFieldsInOrder after sealing leaves matches=true; ' +
        'excluded fields are outside the signed surface',
      covers: ['derivation-surface-isolates-signed-fields'],
    },
    () => {
      const { sealed, said } = deriveSaid(
        { d: '', hello: 'world', n: 1, p: 'parent' } as const,
        UNVERSIONED,
      );
      // 'p' is not in UNVERSIONED.derivedFieldsInOrder.
      const tampered = { ...sealed, p: 'different-parent' };
      const result = recomputeSaid(tampered, UNVERSIONED);

      expect(result.matches).toBe(true);
      expect(result.declared).toBe(said);
      expect(result.recomputed).toBe(said);
    },
  );

  scenario.todo({
    id: 'matches-keri-reference-vector-tel-vcp',
    functionality: saidRecompute,
    description: 'Recomputes the SAID of a TEL vcp event matching a KERI reference vector',
    covers: ['keri-canonical-serialization'],
    annotations: [
      'Blocked by PB-012: RFC 8785 canonicalization produces a different SAID than KERI ' +
      'insertion-order serialization for the same TEL event.',
      'Swapped from ACDC: the ACDC DerivationSurface is not yet declared in ' +
      '2026-04-15-said-compliance-migration-design.md, so an ACDC reference-vector scenario ' +
      'would conflate canonicalization and projection concerns.',
    ],
  });
});
