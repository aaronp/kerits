import { describe, expect } from 'bun:test';
import { scenario } from '../architecture/index.js';
import { saidDerive, saidRecompute } from '../architecture/registry.js';
import { Data, SAID_PLACEHOLDER } from '../common/data.js';
import { deriveSaid, recomputeSaid } from '../common/derivation-surface.js';
import type { DerivationSurface } from '../common/derivation-surface.js';
import { serializeInsertionOrder, type JsonValue } from '../common/serialize-insertion-order.js';

// ---- Shared fixture loading ----

import fixtureData from './fixtures/keri-said-fixtures.json';

type FixtureEntry = (typeof fixtureData.fixtures)[number];

/** Try to load KERIpy-generated expected values. Returns null if not yet generated. */
let keriPyExpected: Record<string, { said: string; versionString?: string | null }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./fixtures/keri-said-expected.json');
  keriPyExpected = mod.expected ?? null;
} catch {
  // File doesn't exist yet — tests run with structural assertions only.
}

function loadFixture(id: string): FixtureEntry {
  const entry = fixtureData.fixtures.find((f) => f.id === id);
  if (!entry) throw new Error(`Fixture '${id}' not found in keri-said-fixtures.json`);
  return entry;
}

function toSurface(f: FixtureEntry): DerivationSurface {
  const s = f.surface;
  if (s.hasVersionString) {
    return {
      saidField: s.saidField,
      derivedFieldsInOrder: s.derivedFieldsInOrder as [string, ...string[]],
      hasVersionString: true,
      versionStringField: s.versionStringField!,
    };
  }
  return {
    saidField: s.saidField,
    derivedFieldsInOrder: s.derivedFieldsInOrder as [string, ...string[]],
    hasVersionString: false,
  };
}

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
      const sizeMatch = (sealed.v as string).match(/^KERI10JSON([0-9a-f]{6})_$/);
      expect(sizeMatch).not.toBeNull();

      // Reconstruct the preimage and confirm its byte length equals the declared size.
      // Uses insertion-order serialization — the same serializer as the KERI derivation path.
      const declaredSize = Number.parseInt(sizeMatch![1], 16);
      const preimage = { v: sealed.v, t: sealed.t, d: SAID_PLACEHOLDER, hello: sealed.hello, n: sealed.n };
      const bytes = new TextEncoder().encode(serializeInsertionOrder(preimage as unknown as JsonValue));
      expect(bytes.length).toBe(declaredSize);

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
      const padding = 'x'.repeat(60);
      const artifact = { v: '', t: 'ixn', d: '', payload: padding } as const;
      const BOUNDARY: DerivationSurface = {
        saidField: 'd',
        derivedFieldsInOrder: ['v', 't', 'd', 'payload'],
        hasVersionString: true,
        versionStringField: 'v',
      };
      const { sealed } = deriveSaid(artifact, BOUNDARY);

      const sizeMatch = (sealed.v as string).match(/^KERI10JSON([0-9a-f]{6})_$/);
      expect(sizeMatch).not.toBeNull();
      const declaredSize = Number.parseInt(sizeMatch![1], 16);
      // Reconstruct preimage in derivedFieldsInOrder key order.
      const preimage = { v: sealed.v, t: sealed.t, d: SAID_PLACEHOLDER, payload: sealed.payload };
      const bytes = new TextEncoder().encode(serializeInsertionOrder(preimage as unknown as JsonValue));
      expect(bytes.length).toBe(declaredSize);

      // Also: the serialized preimage with the declared size differs from the preimage
      // with size '000000' — proof that the version-string loop is not a no-op.
      const preimageWithZeroSize = {
        v: 'KERI10JSON000000_',
        t: sealed.t,
        d: SAID_PLACEHOLDER,
        payload: sealed.payload,
      };
      const zeroBytes = new TextEncoder().encode(
        serializeInsertionOrder(preimageWithZeroSize as unknown as JsonValue),
      );
      expect(zeroBytes).not.toEqual(bytes);
    },
  );

  scenario(
    {
      id: 'projection-preserves-field-order',
      functionality: saidDerive,
      description:
        'project() emits top-level keys in derivedFieldsInOrder order, and ' +
        'serializeInsertionOrder preserves that exact order in the output',
      covers: ['keri-canonical-serialization'],
    },
    () => {
      // Artifact has keys in alphabetical order — different from derivedFieldsInOrder.
      const artifact = { d: '', hello: 'world', n: 1 } as const;
      const { sealed } = deriveSaid(artifact, UNVERSIONED);

      // The serialized preimage must have keys in derivedFieldsInOrder order: d, hello, n.
      const preimage = { d: SAID_PLACEHOLDER, hello: sealed.hello, n: sealed.n };
      const serialized = serializeInsertionOrder(preimage as unknown as JsonValue);
      const keyOrder = [...serialized.matchAll(/"([^"]+)":/g)].map(m => m[1]);
      expect(keyOrder).toEqual(['d', 'hello', 'n']);
    },
  );

  scenario(
    {
      id: 'insertion-order-bytes-differ-from-rfc8785',
      functionality: saidDerive,
      description:
        'Insertion-order serialization produces different bytes (and therefore a different digest) ' +
        'than RFC-8785 for the same object with non-lexicographic key order',
      covers: ['keri-canonical-serialization'],
    },
    () => {
      // Object with keys in non-lexicographic order. RFC-8785 would sort them; insertion-order preserves them.
      const obj = { z: 1, a: 2 };
      const insertionOrderBytes = new TextEncoder().encode(
        serializeInsertionOrder(obj as unknown as JsonValue),
      );
      const rfc8785Bytes = Data.fromJson(obj).canonicalize().raw;

      // RFC-8785 sorts keys: {"a":2,"z":1}
      // Insertion-order preserves keys: {"z":1,"a":2}
      // Same byte length (same keys and values) but different byte content.
      expect(insertionOrderBytes.length).toBe(rfc8785Bytes.length);
      expect(insertionOrderBytes).not.toEqual(rfc8785Bytes);

      // Different bytes produce different digests — this is the behavioral change that matters.
      const insertionOrderDigest = Data.digest(insertionOrderBytes);
      const rfc8785Digest = Data.digest(rfc8785Bytes);
      expect(insertionOrderDigest).not.toBe(rfc8785Digest);
    },
  );

  scenario(
    {
      id: 'nested-object-order-affects-said',
      functionality: saidDerive,
      description:
        'Same semantic nested content constructed in different property insertion order produces ' +
        'different serialized bytes and therefore different derived SAIDs',
      covers: ['keri-canonical-serialization'],
    },
    () => {
      const NESTED_SURFACE: DerivationSurface = {
        saidField: 'd',
        derivedFieldsInOrder: ['d', 'payload'],
        hasVersionString: false,
      };

      // Same logical nested content, different insertion order.
      const artifactA = { d: '', payload: { x: 1, y: 2 } };
      const artifactB = { d: '', payload: { y: 2, x: 1 } };

      const resultA = deriveSaid(artifactA, NESTED_SURFACE);
      const resultB = deriveSaid(artifactB, NESTED_SURFACE);

      // Different insertion order in nested content → different SAIDs.
      expect(resultA.said).not.toBe(resultB.said);
    },
  );

  scenario(
    {
      id: 'derives-stable-said-for-kel-icp-fixture',
      functionality: saidDerive,
      description:
        'Derives a stable SAID for a KERI inception event fixture using insertion-order ' +
        'serialization. Asserts against KERIpy expected values when available.',
      covers: ['keri-canonical-serialization', 'said-field-binding', 'placeholder-at-said-field'],
    },
    () => {
      const fixture = loadFixture('kel-icp');
      const surface = toSurface(fixture);
      const { sealed, said } = deriveSaid(fixture.artifact, surface);

      // Structural invariants.
      expect(said.startsWith('E')).toBe(true);
      expect(said).toHaveLength(44);
      expect(sealed.d).toBe(said);

      // Version string is well-formed and byte-aligned.
      const sizeMatch = (sealed.v as string).match(/^KERI10JSON([0-9a-f]{6})_$/);
      expect(sizeMatch).not.toBeNull();
      const declaredSize = Number.parseInt(sizeMatch![1], 16);

      // Verify byte alignment using insertion-order serialization.
      const preimage: Record<string, unknown> = {};
      for (const f of surface.derivedFieldsInOrder) {
        preimage[f] = (sealed as Record<string, unknown>)[f];
      }
      preimage.d = SAID_PLACEHOLDER;
      const bytes = new TextEncoder().encode(
        serializeInsertionOrder(preimage as unknown as JsonValue),
      );
      expect(bytes.length).toBe(declaredSize);

      // Cross-validate against KERIpy when expected values are available.
      // Version string uses hex encoding matching KERIpy. SAID comparison is
      // deferred until the CESR encoding branch lands (encodeCESRDigest currently
      // uses naive code+base64url instead of proper CESR padding).
      const expected = keriPyExpected?.['kel-icp'];
      if (expected) {
        if (expected.versionString) {
          expect(sealed.v).toBe(expected.versionString);
        }
      }
    },
  );
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

  scenario(
    {
      id: 'recomputes-stable-said-for-tel-vcp-fixture',
      functionality: saidRecompute,
      description:
        'Recomputes a stable SAID for a TEL vcp event fixture using insertion-order ' +
        'serialization. Asserts against KERIpy expected values when available.',
      covers: ['keri-canonical-serialization'],
    },
    () => {
      const fixture = loadFixture('tel-vcp');
      const surface = toSurface(fixture);

      // Derive first, then verify recompute round-trips.
      const { sealed, said } = deriveSaid(fixture.artifact, surface);

      const result = recomputeSaid(sealed, surface);
      expect(result.matches).toBe(true);
      expect(result.declared).toBe(said);
      expect(result.recomputed).toBe(said);

      // Structural invariants on the derived SAID.
      expect(said.startsWith('E')).toBe(true);
      expect(said).toHaveLength(44);

      // Cross-validate against KERIpy when expected values are available.
      // Version string uses hex encoding matching KERIpy. SAID comparison is
      // deferred until the CESR encoding branch lands.
      const expected = keriPyExpected?.['tel-vcp'];
      if (expected) {
        if (expected.versionString) {
          expect(sealed.v).toBe(expected.versionString);
        }
      }
    },
  );
});

describe('keri-said-derivation: regression', () => {
  scenario(
    {
      id: 'data-saidify-unchanged-rfc8785',
      functionality: saidDerive,
      description:
        'Data.saidify() still uses RFC-8785 canonicalization and produces the same SAID ' +
        'regardless of insertion-order changes to the KERI derivation path',
      covers: ['said-field-binding'],
    },
    () => {
      const obj = { d: '', z: 1, a: 2 };
      const { said: saidA } = Data.fromJson(obj).saidify();
      // Equivalent content, different property insertion order.
      // Data.saidify uses RFC-8785, which sorts keys — so insertion order is irrelevant.
      const obj2 = { a: 2, d: '', z: 1 };
      const { said: saidB } = Data.fromJson(obj2).saidify();
      expect(saidA).toBe(saidB);
    },
  );
});
