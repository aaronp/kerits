/**
 * Child and key normalization for canonical SAID encoding.
 */
import { canonical } from '../common/canonical.js';
import type { AclRef, PublicKey } from './types.js';

export function canonicalAclRef(ref: AclRef): string {
  return canonical(ref);
}

/** @deprecated Use canonicalAclRef */
export const canonicalIdentifier = canonicalAclRef;

export function normalizeChildren(children: AclRef[]): AclRef[] {
  const seen = new Set<string>();
  const deduped: AclRef[] = [];
  for (const c of children) {
    const key = canonicalAclRef(c);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }
  return deduped.sort((a, b) => canonicalAclRef(a).localeCompare(canonicalAclRef(b)));
}

/** @deprecated Use normalizeChildren */
export const normalizeMembers = normalizeChildren;

export function normalizeKeys(keys: Iterable<PublicKey>): PublicKey[] {
  return [...new Set(keys)].sort() as PublicKey[];
}
