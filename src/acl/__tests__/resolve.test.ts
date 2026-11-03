/**
 * Recursive group resolution (core AclNode).
 */
import { describe, expect, it } from 'bun:test';
import type { AID, SAID } from '../../common/types.js';
import { resolve } from '../resolve.js';
import type { AclNode, AclRef, PublicKey, ResolutionLimits } from '../types.js';
import { DEFAULT_RESOLUTION_LIMITS } from '../types.js';

const STUB_SAID = 'Estub000000000000000000000000000000000000000' as SAID;
const k1 = 'DKEY_ALICE_1' as PublicKey;
const k2 = 'DKEY_BOB_1' as PublicKey;

function makeNode(id: string, children: AclRef[]): AclNode {
  return { nodeId: id, children, d: STUB_SAID };
}

describe('core resolve', () => {
  it('resolves direct key children', () => {
    const node = makeNode('n1', [
      { kind: 'key', publicKey: k1 },
      { kind: 'key', publicKey: k2 },
    ]);
    const result = resolve(node, () => undefined, () => []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.size).toBe(2);
    expect(result.value.has(k1)).toBe(true);
  });

  it('resolves AID children via lookup', () => {
    const alice = 'EALICE' as AID;
    const node = makeNode('n1', [{ kind: 'aid', aid: alice }]);
    const result = resolve(node, () => undefined, (aid) => (aid === alice ? [k1] : []));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.has(k1)).toBe(true);
  });

  it('rejects cycles', () => {
    const a = makeNode('a', [{ kind: 'node', nodeId: 'b' }]);
    const b = makeNode('b', [{ kind: 'node', nodeId: 'a' }]);
    const nodes = new Map([
      ['a', a],
      ['b', b],
    ]);
    const result = resolve(a, (id) => nodes.get(id), () => []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('cycle-detected');
  });

  it('rejects max depth', () => {
    const limits: ResolutionLimits = { ...DEFAULT_RESOLUTION_LIMITS, maxDepth: 2 };
    const n3 = makeNode('n3', [{ kind: 'key', publicKey: k1 }]);
    const n2 = makeNode('n2', [{ kind: 'node', nodeId: 'n3' }]);
    const n1 = makeNode('n1', [{ kind: 'node', nodeId: 'n2' }]);
    const n0 = makeNode('n0', [{ kind: 'node', nodeId: 'n1' }]);
    const nodes = new Map([
      ['n1', n1],
      ['n2', n2],
      ['n3', n3],
    ]);
    const result = resolve(n0, (id) => nodes.get(id), () => [], limits);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('node-too-deep');
  });

  it('returns node-not-found', () => {
    const node = makeNode('outer', [{ kind: 'node', nodeId: 'missing' }]);
    const result = resolve(node, () => undefined, () => []);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('node-not-found');
      if (result.error.kind === 'node-not-found') expect(result.error.nodeId).toBe('missing');
    }
  });
});
