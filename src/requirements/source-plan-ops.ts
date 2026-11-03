// packages/core/src/requirements/source-plan-ops.ts
import type { CredentialArtifact, Requirement, Source } from './types.js';

/** What the validator could use for one artifact: held/configured, a supplied OOBI, supplied events. */
export type SourceAvailability = { expected: boolean; oobi: boolean; inLine: boolean };

const FALLBACK_ORDER: readonly Source[] = ['expected', 'oobi', 'in-line'];

function isAvailable(s: Source, a: SourceAvailability): boolean {
  switch (s) {
    case 'expected':
      return a.expected;
    case 'oobi':
      return a.oobi;
    case 'in-line':
      return a.inLine;
    default: {
      const unknownSource: never = s;
      throw new Error(`Unsupported source: ${JSON.stringify(unknownSource)}`);
    }
  }
}

function leafAt(r: Requirement, path: readonly string[]): Requirement | undefined {
  let node: Requirement | undefined = r;
  for (const key of path) {
    if (node === undefined || (node.type !== 'and' && node.type !== 'or')) return undefined;
    node = Object.hasOwn(node.requirements, key) ? node.requirements[key] : undefined;
  }
  return node;
}

export const SourcePlanOps = {
  /**
   * Channels to try, in order. `allowed` undefined = ANY channel, no restriction and no preference; the fallback
   * order expected → oobi → in-line is an implementation choice, not a policy preference. Otherwise the policy's
   * list order, filtered to what is available. Pure.
   */
  plan(allowed: readonly Source[] | undefined, available: SourceAvailability): readonly Source[] {
    return (allowed ?? FALLBACK_ORDER).filter((s) => isAvailable(s, available));
  },

  /**
   * The channels every directive allows, in the first restricting directive's order. An undefined directive allows any
   * channel, so all undefined → undefined (any). `[]` → no channel may serve the artifact. Pure.
   */
  intersect(directives: readonly (readonly Source[] | undefined)[]): readonly Source[] | undefined {
    const restricting = directives.filter((d): d is readonly Source[] => d !== undefined);
    const [first, ...rest] = restricting;
    return first?.filter((s) => rest.every((d) => d.includes(s)));
  },

  /** `r`'s directive for one artifact at a leaf path; undefined when absent. */
  allowedAt(r: Requirement, path: readonly string[], artifact: CredentialArtifact): readonly Source[] | undefined {
    const leaf = leafAt(r, path);
    if (leaf === undefined) return undefined;
    switch (leaf.type) {
      case 'and':
      case 'or':
        return undefined;
      case 'is-member':
        switch (artifact) {
          case 'lineageKels':
            return leaf.sources?.lineageKels;
          case 'issuerKel':
          case 'delegatorKels':
          case 'registryTel':
          case 'credentialTel':
          case 'acdc':
            return undefined;
          default: {
            const unknownArtifact: never = artifact;
            throw new Error(`Unsupported artifact: ${JSON.stringify(unknownArtifact)}`);
          }
        }
      case 'has-credential':
        switch (artifact) {
          case 'issuerKel':
          case 'delegatorKels':
          case 'registryTel':
          case 'credentialTel':
          case 'acdc':
          case 'lineageKels':
            return leaf.sources?.[artifact];
          default: {
            const unknownArtifact: never = artifact;
            throw new Error(`Unsupported artifact: ${JSON.stringify(unknownArtifact)}`);
          }
        }
      default: {
        const unknownRequirement: never = leaf;
        throw new Error(`Unsupported requirement: ${JSON.stringify(unknownRequirement)}`);
      }
    }
  },
} as const;
