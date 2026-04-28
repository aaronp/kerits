import { beforeAll, describe, expect, test } from 'bun:test';
import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { KeriKeyPairs } from '@kerits/core';
import { VaultAppendSchema } from '../types.js';

// Register custom CESR formats so Value.Check passes.
// In production these formats are used for documentation/typing, not strict validation.
beforeAll(() => {
  const formats = ['qb64', 'qb64-key', 'qb64-digest', 'qb64-signature', 'qb64-key-transferable'];
  for (const fmt of formats) {
    if (!FormatRegistry.Has(fmt)) {
      FormatRegistry.Set(fmt, () => true);
    }
  }
});

// AID-shaped qb64 string — NOT a public key. AIDs and public keys are
// different domain types even when they share encoding.
const FAKE_AID = 'ETestAid123456789012345678901234567890123';

describe('VaultAppend', () => {
  test('accepts next-key-commitment purpose without aid (unbound key)', () => {
    const pair = KeriKeyPairs.create();
    const append = {
      keyPair: pair,
      purpose: 'next-key-commitment',
      metadata: {},
    };
    expect(Value.Check(VaultAppendSchema, append)).toBe(true);
  });

  test('accepts inception-current purpose with AID', () => {
    const pair = KeriKeyPairs.create();
    const append = {
      aid: FAKE_AID,
      keyPair: pair,
      purpose: 'inception-current',
      metadata: {},
    };
    expect(Value.Check(VaultAppendSchema, append)).toBe(true);
  });
});
