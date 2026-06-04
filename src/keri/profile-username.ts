import type { Result } from '../result.js';
import { err, ok } from '../result.js';
import { type ProfileAlias, parseProfileAlias } from './profile-alias.js';

/**
 * Normalize a human display name into a candidate public profile username.
 * Further validation uses {@link parseProfileAlias}.
 */
export function normalizeDisplayNameToProfileUsername(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 64);
}

export function profileUsernameFromDisplayName(
  displayName: string,
): Result<ProfileAlias, { kind: 'invalid-username'; message: string; candidate: string }> {
  const candidate = normalizeDisplayNameToProfileUsername(displayName);
  if (!candidate) {
    return err({
      kind: 'invalid-username',
      message: 'Enter a display name that produces a valid username (letters, numbers, . _ -).',
      candidate,
    });
  }
  const parsed = parseProfileAlias(candidate);
  if (!parsed.ok) {
    return err({ kind: 'invalid-username', message: parsed.error.message, candidate });
  }
  return ok(parsed.value);
}
