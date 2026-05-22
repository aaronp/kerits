import { describe, test, expect } from 'bun:test';
import { parseProfileAlias } from '../keri/profile-alias.js';

describe('parseProfileAlias', () => {
  test('accepts valid alias', () => {
    const result = parseProfileAlias('alice');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('alice');
  });

  test('accepts dots, hyphens, underscores', () => {
    const result = parseProfileAlias('my-name_v2.0');
    expect(result.ok).toBe(true);
  });

  test('accepts max length (64 chars)', () => {
    const result = parseProfileAlias('a'.repeat(64));
    expect(result.ok).toBe(true);
  });

  test('rejects empty string', () => {
    const result = parseProfileAlias('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('invalid-alias');
  });

  test('rejects string over 64 chars', () => {
    const result = parseProfileAlias('a'.repeat(65));
    expect(result.ok).toBe(false);
  });

  test('rejects slashes', () => {
    const result = parseProfileAlias('foo/bar');
    expect(result.ok).toBe(false);
  });

  test('rejects spaces', () => {
    const result = parseProfileAlias('foo bar');
    expect(result.ok).toBe(false);
  });

  test('rejects path traversal', () => {
    expect(parseProfileAlias('.').ok).toBe(false);
    expect(parseProfileAlias('..').ok).toBe(false);
  });

  test('rejects percent encoding', () => {
    const result = parseProfileAlias('foo%00bar');
    expect(result.ok).toBe(false);
  });
});
