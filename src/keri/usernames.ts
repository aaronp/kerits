import type { Result } from '../result.js';
import { err, ok } from '../result.js';

/**
 * Public directory handles (`usernames/{name}` → `/.well-known/keri/alias/:name`).
 * Not display names (mutable) and not local wallet aliases.
 */
export namespace Usernames {
  /** Branded public username (sticky after claim). */
  export type Name = string & { readonly __brand: 'Username' };

  export type Tier = 'anonymous' | 'free' | 'paid' | 'rejected';

  export type ParseError = {
    readonly kind: 'invalid-username';
    readonly message: string;
    readonly candidate: string;
  };

  /** Exact pattern for store CEL `name.matches(...)` and {@link parse}. Length floors are separate (tiers). */
  export const PATTERN = '^[a-z0-9][a-z0-9._]{1,30}[a-z0-9]$';

  export const MIN_LEN_PAID = 3;
  /** Anonymous/free floor — same as {@link MIN_LEN_PAID} (and {@link parse} minimum). */
  export const MIN_LEN_ANON = 3;
  export const MAX_LEN = 32;

  const PATTERN_RE = new RegExp(PATTERN);

  /** Minimum length for a claim under this account tier (rejected → none). */
  export function minLengthForTier(tier: Tier): number {
    if (tier === 'paid') return MIN_LEN_PAID;
    if (tier === 'free' || tier === 'anonymous') return MIN_LEN_ANON;
    if (tier === 'rejected') return Number.POSITIVE_INFINITY;
    else {
      const _exhaustive: never = tier;
      throw new Error(`Unsupported username tier: ${_exhaustive}`);
    }
  }

  /** Validate a public username (charset, edges, no `..`, length 3–32). Tier floors are caller's job. */
  export function parse(raw: string): Result<Name, ParseError> {
    const candidate = raw.trim().toLowerCase();
    if (!PATTERN_RE.test(candidate) || candidate.includes('..')) {
      return err({
        kind: 'invalid-username',
        message: `Username must be 3–32 chars [a-z0-9._], start and end with a letter or digit, and not contain '..'. Got: '${raw}'`,
        candidate,
      });
    }
    return ok(candidate as Name);
  }

  /**
   * Signup prefill only: normalize a display name toward a username, then {@link parse}.
   * Hyphens become underscores; other illegal characters are stripped.
   */
  export function suggestFromDisplayName(displayName: string): Result<Name, ParseError> {
    const candidate = displayName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/-/g, '_')
      .replace(/[^a-z0-9._]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/_{2,}/g, '_')
      .replace(/^[._]+|[._]+$/g, '')
      .slice(0, MAX_LEN)
      .replace(/^[._]+|[._]+$/g, '');
    if (!candidate) {
      return err({
        kind: 'invalid-username',
        message: 'Enter a name that produces a valid username (letters, numbers, . or _).',
        candidate,
      });
    }
    return parse(candidate);
  }
}
