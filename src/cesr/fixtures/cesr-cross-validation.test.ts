import { describe, expect, test } from 'bun:test';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { Siger } from 'cesr-ts/src/siger';
import { IdrDex } from 'cesr-ts/src/indexer';
import { encodeAttachmentGroups, decodeAttachmentGroupsFromStream } from '../attachments.js';
import { hexToBytes } from '../../signature/primitives.js';
import type { CesrAttachment } from '../../kel/types.js';

// ---- Fixture loading ----

import fixtureData from './cesr-fixtures.json';

type Fixture = (typeof fixtureData.fixtures)[number];

// Gracefully load keripy-generated expected values. Returns null if not yet generated.
// Uses require() for optional loading — same pattern as the existing SAID cross-validation
// tests in keri-said-derivation.test.ts. This is intentional: import would fail at parse
// time if the file is missing, but require() fails at runtime and can be caught.
//
// Expected-file policy:
//   - Missing cesr-expected.json → cross-validation assertions are skipped;
//     structural tests still run.
//   - Present cesr-expected.json with any "error" entry → registry guard fails
//     fast. Cross-validation only runs against fully generated output.
//
// Counter code table note:
//   keripy 1.3.4 uses the KERI v2 counter code table (CtrDex_2_0), while cesr-ts
//   uses the KERI v1 table. Counter codes differ (-J vs -A for ControllerIdxSigs, etc.)
//   but per-item primitive encoding (Matter, Siger, Indexer) is identical across versions.
//   Cross-validation targets per-item encoding, not full wire including counter prefix.
let expectedData: {
  expected: Record<string, {
    wireQb64: string;
    wireHex: string;
    counterCode: string;
    count: number;
    items: Array<Record<string, unknown>>;
  } | { error: string }>;
} | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expectedData = require('./cesr-expected.json');
} catch {
  // File doesn't exist yet — cross-validation tests will be skipped.
}

// ---- Implemented families ----

const IMPLEMENTED_FAMILIES: ReadonlySet<string> = new Set(['controllerIndexedSigs']);

// ---- Family mapper: converts neutral fixture items to CesrAttachment[] ----

function mapControllerIndexedSigs(
  items: Array<{ sigAlg: string; keyIndex: number; sigRaw: string }>,
): CesrAttachment[] {
  return items.map((item) => {
    const raw = hexToBytes(item.sigRaw);
    const matter = new Matter({ raw, code: MtrDex.Ed25519_Sig });
    return {
      kind: 'sig' as const,
      form: 'indexed' as const,
      keyIndex: item.keyIndex,
      sig: matter.qb64,
    };
  });
}

function mapFixtureToAttachments(fixture: Fixture): CesrAttachment[] {
  switch (fixture.family) {
    case 'controllerIndexedSigs':
      return mapControllerIndexedSigs(fixture.items as Array<{ sigAlg: string; keyIndex: number; sigRaw: string }>);
    default:
      throw new Error(`No mapper for family: ${fixture.family}`);
  }
}

// ---- Per-item encoding helpers ----

/**
 * Encode a single indexed signature the same way kerits does, returning
 * the Siger qb64 (indexed wire encoding) for comparison with keripy.
 */
function encodeIndexedSigToSigerQb64(sigRaw: string, keyIndex: number): string {
  const raw = hexToBytes(sigRaw);
  const indexerCode = keyIndex < 64 ? IdrDex.Ed25519_Sig : IdrDex.Ed25519_Big_Sig;
  const siger = new Siger({ raw, code: indexerCode, index: keyIndex, ondex: keyIndex });
  return siger.qb64;
}

/**
 * Encode a single signature to Matter qb64 (non-indexed, what kerits stores in att.sig).
 */
function encodeToMatterQb64(sigRaw: string): string {
  const raw = hexToBytes(sigRaw);
  const matter = new Matter({ raw, code: MtrDex.Ed25519_Sig });
  return matter.qb64;
}

// ---- Tests ----

describe('CESR cross-validation against keripy', () => {
  // ---- Registry integrity guard ----

  test('all fixture IDs are unique', () => {
    const ids = fixtureData.fixtures.map((f) => f.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  if (expectedData) {
    const expected = expectedData.expected;

    test('every fixture ID has a corresponding expected entry', () => {
      for (const fixture of fixtureData.fixtures) {
        expect(expected).toHaveProperty(fixture.id);
      }
    });

    test('every expected entry corresponds to a fixture ID', () => {
      const fixtureIds = new Set(fixtureData.fixtures.map((f) => f.id));
      for (const key of Object.keys(expected)) {
        expect(fixtureIds.has(key)).toBe(true);
      }
    });

    test('no expected entry contains an error field', () => {
      for (const [id, entry] of Object.entries(expected)) {
        expect('error' in entry).toBe(false);
      }
    });

    // Order preservation protects stable diffs and confirms the generator
    // processes fixtures in the same order as the input file.
    test('expected entry order matches fixture order', () => {
      const expectedIds = Object.keys(expected);
      const fixtureIds = fixtureData.fixtures.map((f) => f.id);
      expect(expectedIds).toEqual(fixtureIds);
    });
  }

  // ---- Per-fixture data-driven tests ----

  for (const fixture of fixtureData.fixtures) {
    if (!IMPLEMENTED_FAMILIES.has(fixture.family)) {
      test.todo(`per-item encoding: ${fixture.id}`);
      test.todo(`round-trip: ${fixture.id}`);
      continue;
    }

    const exp = expectedData?.expected?.[fixture.id];

    describe(fixture.id, () => {
      // Cross-validate per-item primitive encoding against keripy.
      // This is the high-value comparison: per-item encoding (Siger qb64,
      // Matter qb64) is identical across KERI v1/v2 counter code tables.
      test(`per-item encoding: ${fixture.id}`, () => {
        if (!exp || 'error' in exp) return;

        const items = fixture.items as Array<{ sigAlg: string; keyIndex: number; sigRaw: string }>;
        expect(exp.count).toBe(items.length);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const expectedItem = exp.items[i];

          // Siger qb64 (indexed wire encoding) matches keripy
          if ('sigerQb64' in expectedItem) {
            const sigerQb64 = encodeIndexedSigToSigerQb64(item.sigRaw, item.keyIndex);
            expect(sigerQb64).toBe(expectedItem.sigerQb64);
          }

          // Matter qb64 (non-indexed, what kerits stores in att.sig) matches keripy
          if ('sigMatterQb64' in expectedItem) {
            const matterQb64 = encodeToMatterQb64(item.sigRaw);
            expect(matterQb64).toBe(expectedItem.sigMatterQb64);
          }
        }
      });

      // Round-trip: encode via kerits → decode → verify semantic fields match fixture.
      // Uses kerits counter codes (KERI v1), not keripy codes (KERI v2).
      test(`round-trip: ${fixture.id}`, () => {
        const attachments = mapFixtureToAttachments(fixture);
        const wireBytes = encodeAttachmentGroups(attachments);

        // Structural: non-empty, starts with counter prefix
        expect(wireBytes.length).toBeGreaterThan(0);

        const { attachments: decoded, bytesConsumed } = decodeAttachmentGroupsFromStream(wireBytes);

        // Full wire consumption
        expect(bytesConsumed).toBe(wireBytes.length);

        // Item count matches
        expect(decoded.length).toBe(fixture.items.length);

        // Per-item semantic assertions
        const items = fixture.items as Array<{ keyIndex: number; sigRaw: string }>;
        for (let i = 0; i < decoded.length; i++) {
          const att = decoded[i];
          const fixtureItem = items[i];

          expect(att.kind).toBe('sig');
          if (att.kind === 'sig') {
            expect(att.form).toBe('indexed');
            if (att.form === 'indexed') {
              expect(att.keyIndex).toBe(fixtureItem.keyIndex);
            }

            // Decoded sig (Matter qb64) matches keripy expected
            const expItem = exp && !('error' in exp) ? exp.items[i] : undefined;
            if (expItem && 'sigMatterQb64' in expItem) {
              expect(att.sig).toBe(expItem.sigMatterQb64);
            }
          }
        }
      });
    });
  }
});
