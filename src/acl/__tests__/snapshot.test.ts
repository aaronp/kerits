/**
 * Snapshot integrity — recompute on import; immutable; key-set hash not graph.
 */
import { describe, expect, it } from 'bun:test';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { Acl } from '../acl.js';
import { importSnapshot, snapshotOf } from '../snapshot.js';
import type { PublicKey } from '../types.js';

const alice = KeriKeyPairs.fromSeedNumber(1);
const bob = KeriKeyPairs.fromSeedNumber(2);
const attacker = KeriKeyPairs.fromSeedNumber(99);
const alicePk = alice.publicKey as PublicKey;
const bobPk = bob.publicKey as PublicKey;
const attackerPk = attacker.publicKey as PublicKey;

describe('snapshotOf / importSnapshot', () => {
  it('hash is order-independent for same purpose', () => {
    const a = snapshotOf('sign', [bobPk, alicePk]);
    const b = snapshotOf('sign', [alicePk, bobPk]);
    expect(a.hash).toBe(b.hash);
    expect(a.keys).toEqual([alicePk, bobPk].sort() as PublicKey[]);
  });

  it('sign vs enc purpose yields different hashes for same keys', () => {
    const sign = snapshotOf('sign', [alicePk, bobPk]);
    const enc = snapshotOf('enc', [alicePk, bobPk]);
    expect(sign.hash).not.toBe(enc.hash);
  });

  it('rejects trusted hash paired with substituted keys', () => {
    // setup: honest snapshot hash
    const honest = snapshotOf('sign', [alicePk, bobPk]);
    const forged = { purpose: 'sign' as const, keys: [attackerPk], hash: honest.hash };

    // method under test
    const result = importSnapshot(forged);

    // assertions
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('snapshot-hash-mismatch');
  });

  it('rejects invalid CESR key encoding', () => {
    const result = importSnapshot({ purpose: 'sign', keys: ['not-a-cesr-key'] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('invalid-key');
  });

  it('returned snapshot is immutable', () => {
    const s = snapshotOf('sign', [alicePk]);
    expect(() => {
      (s as { purpose: string }).purpose = 'enc';
    }).toThrow();
  });

  it('Acl.snapshot commits to resolved keys not graph SAID', () => {
    // setup: two trees, different structure, same leaf keys
    let t1 = Acl.empty();
    t1 = Acl.putNode(t1, Acl.node('flat', [
      { kind: 'key', publicKey: alicePk },
      { kind: 'key', publicKey: bobPk },
    ]));
    t1 = Acl.setPrivilege(t1, 'sys', 'write', 'flat');

    let t2 = Acl.empty();
    t2 = Acl.putNode(t2, Acl.node('inner', [{ kind: 'key', publicKey: alicePk }]));
    t2 = Acl.putNode(t2, Acl.node('outer', [
      { kind: 'node', nodeId: 'inner' },
      { kind: 'key', publicKey: bobPk },
    ]));
    t2 = Acl.setPrivilege(t2, 'sys', 'write', 'outer');

    // method under test
    const s1 = Acl.snapshot(t1, 'sys', 'write', 'sign');
    const s2 = Acl.snapshot(t2, 'sys', 'write', 'sign');

    // assertions
    expect(s1.ok && s2.ok).toBe(true);
    if (!s1.ok || !s2.ok) return;
    expect(s1.value.hash).toBe(s2.value.hash);
    expect(t1.nodes.flat?.d).not.toBe(t2.nodes.outer?.d);
  });
});
