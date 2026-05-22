import type { Result } from '../result.js';
import { err, ok } from '../result.js';

export type ProfileAlias = string & { readonly __brand: 'ProfileAlias' };

const ALIAS_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

export function parseProfileAlias(raw: string): Result<ProfileAlias, { kind: 'invalid-alias'; message: string }> {
  if (!ALIAS_PATTERN.test(raw) || raw === '.' || raw === '..') {
    return err({
      kind: 'invalid-alias',
      message: `Profile alias must match ${ALIAS_PATTERN} and not be '.' or '..' (1-64 alphanumeric, dot, hyphen, underscore). Got: '${raw}'`,
    });
  }
  return ok(raw as ProfileAlias);
}
