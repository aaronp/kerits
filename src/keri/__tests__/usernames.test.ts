import { describe, expect, test } from 'bun:test';
import { Usernames } from '../usernames.js';

describe('Usernames.parse', () => {
  test('accepts dots and underscores inside', () => {
    expect(Usernames.parse('alice.w').ok).toBe(true);
    expect(Usernames.parse('alice_dev').ok).toBe(true);
  });

  test('rejects hyphens, short edges, and double dots', () => {
    expect(Usernames.parse('alice-w').ok).toBe(false);
    expect(Usernames.parse('ab').ok).toBe(false);
    expect(Usernames.parse('.alice').ok).toBe(false);
    expect(Usernames.parse('alice.').ok).toBe(false);
    expect(Usernames.parse('a..b').ok).toBe(false);
  });

  test('lowercases and trims', () => {
    const r = Usernames.parse('  Alice.W  ');
    expect(r).toEqual({ ok: true, value: 'alice.w' });
  });
});

describe('Usernames.suggestFromDisplayName', () => {
  test('spaces to dots; hyphens to underscores', () => {
    expect(Usernames.suggestFromDisplayName('Alice Smith')).toEqual({ ok: true, value: 'alice.smith' });
    expect(Usernames.suggestFromDisplayName('cli-del-parent')).toEqual({ ok: true, value: 'cli_del_parent' });
  });

  test('rejects empty residue', () => {
    const r = Usernames.suggestFromDisplayName('!!!');
    expect(r.ok).toBe(false);
  });
});

describe('Usernames.minLengthForTier', () => {
  test('paid/anon/free 3; rejected unsatisfiable', () => {
    expect(Usernames.minLengthForTier('paid')).toBe(3);
    expect(Usernames.minLengthForTier('anonymous')).toBe(3);
    expect(Usernames.minLengthForTier('free')).toBe(3);
    expect(Usernames.minLengthForTier('rejected')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('Usernames.PATTERN', () => {
  test('is the regex body parse uses', () => {
    expect(new RegExp(Usernames.PATTERN).test('alice.w')).toBe(true);
    expect(new RegExp(Usernames.PATTERN).test('alice-w')).toBe(false);
  });
});
