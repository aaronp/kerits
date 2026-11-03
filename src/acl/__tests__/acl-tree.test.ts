/**
 * AclTree + Acl namespace — key leaves only (no AidKeyLookup).
 */
import { describe, expect, it } from 'bun:test';
import { Acl } from '../acl.js';
import type { PublicKey } from '../types.js';

const kAlice = 'DAlice' as PublicKey;
const kBob = 'DBob' as PublicKey;

describe('Acl namespace', () => {
  it('putNode / setPrivilege / resolve nested keys without AidKeyLookup', () => {
    // setup: friends → keys; known → friends; write privilege
    let tree = Acl.empty();
    tree = Acl.putNode(
      tree,
      Acl.node('friends', [
        { kind: 'key', publicKey: kAlice },
        { kind: 'key', publicKey: kBob },
      ]),
    );
    tree = Acl.putNode(tree, Acl.node('known', [{ kind: 'node', nodeId: 'friends' }]));
    tree = Acl.setPrivilege(tree, 'demo', 'write', 'known');

    // method under test
    const keys = Acl.resolve(tree, 'known');

    // assertions
    expect(keys.ok).toBe(true);
    if (!keys.ok) return;
    expect(keys.value.has(kAlice)).toBe(true);
    expect(keys.value.has(kBob)).toBe(true);
    expect(tree.privileges.demo?.write).toBe('known');
  });

  it('fromTree Ops: putNode / accessControls', () => {
    // setup
    let tree = Acl.empty();
    tree = Acl.fromTree(tree).putNode(
      Acl.node('friends', [
        { kind: 'key', publicKey: kAlice },
        { kind: 'key', publicKey: kBob },
      ]),
    );
    tree = Acl.fromTree(tree).setPrivilege('demo', 'write', 'friends');
    tree = Acl.fromTree(tree).setPrivilege('demo', 'read', 'friends');
    tree = Acl.fromTree(tree).setPrivilege('demo', 'admin', 'friends');

    // method under test
    const ac = Acl.fromTree(tree).accessControls('demo');
    const keys = Acl.fromTree(tree).resolve('friends');

    // assertions
    expect(keys.ok && keys.value.has(kAlice)).toBe(true);
    expect(ac.ok).toBe(true);
    if (!ac.ok) return;
    expect(ac.value.write.keys).toContain(kAlice);
    expect(ac.value.write.keys).toContain(kBob);
    expect(ac.value.write.version).toBe(ac.value.admin.version);
  });

  it('updates return new trees; inputs unchanged', () => {
    const t0 = Acl.empty();
    const t1 = Acl.fromTree(t0).putNode(Acl.node('n', []));
    expect(t0.nodes).toEqual({});
    expect(t1.nodes['n']).toBeDefined();
    expect(t0).not.toBe(t1);
  });
});
