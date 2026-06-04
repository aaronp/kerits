import { describe, expect, test } from 'bun:test';
import { normalizeDisplayNameToProfileUsername, profileUsernameFromDisplayName } from '../profile-username.js';

describe('normalizeDisplayNameToProfileUsername', () => {
  test('lowercases and replaces spaces with dots', () => {
    expect(normalizeDisplayNameToProfileUsername('Alice Smith')).toBe('alice.smith');
  });

  test('strips invalid characters', () => {
    expect(normalizeDisplayNameToProfileUsername('Alice @ Home!')).toBe('alice.home');
  });

  test('returns empty when nothing valid remains', () => {
    expect(normalizeDisplayNameToProfileUsername('   @@@   ')).toBe('');
  });
});

describe('profileUsernameFromDisplayName', () => {
  test('returns parsed profile alias for valid candidate', () => {
    const result = profileUsernameFromDisplayName('Alice');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe('alice');
  });

  test('returns invalid-username when candidate is empty', () => {
    const result = profileUsernameFromDisplayName('!!!');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('invalid-username');
  });
});
