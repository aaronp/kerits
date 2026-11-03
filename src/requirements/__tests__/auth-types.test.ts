import { describe, expect, test } from 'bun:test';
import { Value } from '@sinclair/typebox/value';
import { AuthOps, AuthRequestSchema, AuthResponseSchema, PolicySchema, type AuthRequest, type RequestEntry } from '../../index.js';

const said = (c: string) => 'E'.padEnd(44, c) as never;
const entry = (as: string, extra: Partial<RequestEntry> = {}): RequestEntry => ({
  policy: said('A'), as, need: 'required', purpose: 'p', ...extra,
});
const req = (entries: RequestEntry[]): AuthRequest => ({
  entries,
  nonce: 'n'.repeat(32),
  audience: 'https://rp.example',
  createdAt: '2026-10-07T00:00:00.000Z',
  expiresAt: '2026-10-08T00:00:00.000Z',
  allowTargetAid: true,
});

describe('AuthRequest / AuthResponse schemas', () => {
  test('accepts PolicyRef as SAID or inline Policy; rejects evidence on Policy', () => {
    // setup: request with a SAID entry and an inline policy entry
    const inline = { d: said('B'), requirement: { type: 'is-member', parentAID: said('C') } } as never;
    const r = req([entry('by-said'), entry('inline', { policy: inline, need: 'optional', audienceFrom: 'url', audienceIncludes: ['by-said'] })]);

    // call out our method under test
    expect(Value.Check(AuthRequestSchema, r)).toBe(true);

    // assertions: response slots are alias-keyed, controls AID-keyed; Policy rejects stray evidence
    expect(Value.Check(AuthResponseSchema, { requestNonce: r.nonce, slots: {}, controls: {} })).toBe(true);
    expect(Value.Check(AuthResponseSchema, { requestNonce: r.nonce, slots: [], controls: {} })).toBe(false);
    expect(Value.Check(AuthResponseSchema, { requestNonce: r.nonce, slots: {}, controls: {}, provideValues: {} })).toBe(false);
    expect(Value.Check(PolicySchema, { ...(inline as object), evidence: {} })).toBe(false);
  });

  test('rejects an empty entry list, a bad alias, and removed request-level disclosure', () => {
    // call out our method under test / assertions
    expect(Value.Check(AuthRequestSchema, req([]))).toBe(false);
    for (const as of ['Alpha', '1a', '', 'a'.repeat(33), 'a b', 'a.b']) {
      expect(Value.Check(AuthRequestSchema, req([entry(as)]))).toBe(false);
    }
    expect(Value.Check(AuthRequestSchema, req([entry('a'.repeat(32))]))).toBe(true);
    expect(Value.Check(AuthRequestSchema, { ...req([entry('a')]), disclosure: { fields: [] } })).toBe(false);
  });
});

describe('AuthOps.validateRequest', () => {
  test('valid request passes through', () => {
    // setup
    const r = req([entry('loc', { audienceFrom: 'url', audienceIncludes: ['email'] }), entry('email')]);

    // call out our method under test
    const out = AuthOps.validateRequest(r);

    // assertions
    expect(out.ok && out.value).toBe(r);
  });

  test('reports each RequestError kind with its alias', () => {
    // setup: one entry per failure
    const r = req([
      entry('dup'), entry('dup'),
      entry('v'), entry('policySAIDs'),
      entry('Bad Alias'),
      entry('loose', { audienceIncludes: ['dup'] }),
      entry('ghost', { audienceFrom: 'url', audienceIncludes: ['nobody'] }),
      entry('selfie', { audienceFrom: 'url', audienceIncludes: ['selfie'] }),
    ]);

    // call out our method under test
    const out = AuthOps.validateRequest(r);

    // assertions
    expect(!out.ok && out.error).toEqual([
      { kind: 'duplicate-alias', as: 'dup' },
      { kind: 'reserved-alias', as: 'v' },
      { kind: 'reserved-alias', as: 'policySAIDs' },
      { kind: 'bad-alias', as: 'Bad Alias' },
      { kind: 'includes-without-audience', as: 'loose' },
      { kind: 'unknown-include', as: 'ghost' },
      { kind: 'self-include', as: 'selfie' },
    ]);
  });
});
