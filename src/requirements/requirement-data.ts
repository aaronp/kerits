// packages/core/src/requirements/requirement-data.ts

import { Data } from '../common/data.js';
import type { AID, SAID } from '../common/types.js';
import type { Expression, HasCredential, IsMember, OnboardingResource, Policy, Requirement } from './types.js';

/** Drop `undefined` optionals so the digest depends only on present fields. */
function normalized<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function said(r: Requirement): SAID {
  return Data.digestFor(normalized(r)) as SAID;
}

function isMember(parentAID: AID, opts: { maxDepth?: number } = {}): IsMember {
  return opts.maxDepth === undefined
    ? { type: 'is-member', parentAID }
    : { type: 'is-member', parentAID, maxDepth: opts.maxDepth };
}

function hasCredential(
  input: Omit<HasCredential, 'type' | 'disclosure'> & { disclosure?: HasCredential['disclosure'] },
): HasCredential {
  return normalized({ type: 'has-credential', ...input, disclosure: input.disclosure ?? { fields: [], metadata: [] } });
}

export const RequirementData = {
  said,
  isMember,
  hasCredential,
  /** Children keyed by readable name (`[a-z][a-z0-9_-]{0,31}`); names namespace their claims in the token. */
  and: (requirements: Record<string, Requirement>): Expression => ({ type: 'and', requirements }),
  or: (requirements: Record<string, Requirement>): Expression => ({ type: 'or', requirements }),
} as const;

function policyDigest(requirement: Requirement, purpose?: string, onboarding?: readonly OnboardingResource[]): SAID {
  // key order is the digest: purpose, then onboarding, then requirement. Omitting an absent field keeps old ids.
  return Data.digestFor(
    normalized({
      ...(purpose !== undefined ? { purpose } : {}),
      ...(onboarding !== undefined && onboarding.length > 0 ? { onboarding: [...onboarding] } : {}),
      requirement,
    }),
  ) as SAID;
}

export const PolicyData = {
  /** An empty `purpose` counts as none. An empty onboarding list counts as none. */
  create: (requirement: Requirement, purpose?: string, onboarding?: readonly OnboardingResource[]): Policy => {
    const p = purpose === '' ? undefined : purpose;
    const list = onboarding !== undefined && onboarding.length > 0 ? [...onboarding] : undefined;
    return normalized({ d: policyDigest(requirement, p, list), purpose: p, onboarding: list, requirement });
  },
  digest: policyDigest,
} as const;
