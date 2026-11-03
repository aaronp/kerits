/**
 * AccessControls projection: version = node SAID; tip = key-set commitment.
 */
import { describe, expect, it } from 'bun:test';
import type { AID, PublicKey, SAID } from '../../common/types.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { Acl } from '../acl.js';
import {
  accessControlsTip,
  importAccessControls,
  projectAccessControls,
  slotKeysSaid,
} from '../access-controls.js';
import { isValid } from '../check.js';
import { signAclMessage } from '../signed-message.js';

const alice = 'EAliceAID_ac_proj_00000000000000000000000000000000' as AID;
const phone = KeriKeyPairs.fromSeedNumber(30);
const watch = KeriKeyPairs.fromSeedNumber(31);
const phonePk = phone.publicKey as PublicKey;
const watchPk = watch.publicKey as PublicKey;
const system = 'entities';
const now = 1_700_000_000_000;

function entityTree() {
  let tree = Acl.empty();
  tree = Acl.putNode(tree, Acl.node(`entities:${alice}`, [{ kind: 'aid', aid: alice }]));
  for (const op of ['read', 'write', 'admin'] as const) {
    tree = Acl.setPrivilege(tree, system, op, `entities:${alice}`);
  }
  return tree;
}

describe('projectAccessControls', () => {
  it('shared privilege node → same version across ops + tip', () => {
    const tree = entityTree();
    const ac = projectAccessControls(tree, system, () => [phonePk]);
    expect(ac.ok).toBe(true);
    if (!ac.ok) return;
    expect(ac.value.read.version).toBe(ac.value.write.version);
    expect(ac.value.write.version).toBe(ac.value.admin.version);
    expect(ac.value.write.keys).toEqual([phonePk]);
    expect(ac.value.tip).toBe(accessControlsTip(ac.value));
  });

  it('key rotation (same aid children) keeps version; tip changes', () => {
    const tree = entityTree();
    const before = projectAccessControls(tree, system, () => [phonePk]);
    const after = projectAccessControls(tree, system, () => [phonePk, watchPk]);
    expect(before.ok && after.ok).toBe(true);
    if (!before.ok || !after.ok) return;
    expect(after.value.write.version).toBe(before.value.write.version);
    expect(after.value.write.keys).not.toEqual(before.value.write.keys);
    expect(after.value.tip).not.toBe(before.value.tip);
  });

  it('graph edit changes version; tip usually changes', () => {
    const tree = entityTree();
    const before = projectAccessControls(tree, system, () => [phonePk]);
    const next = Acl.putNode(
      tree,
      Acl.node(`entities:${alice}`, [
        { kind: 'aid', aid: alice },
        { kind: 'key', publicKey: watchPk },
      ]),
    );
    const after = projectAccessControls(next, system, () => [phonePk]);
    expect(before.ok && after.ok).toBe(true);
    if (!before.ok || !after.ok) return;
    expect(after.value.write.version).not.toBe(before.value.write.version);
    expect(after.value.tip).not.toBe(before.value.tip);
  });

  it('tip stable under key reorder', () => {
    const tree = entityTree();
    const a = projectAccessControls(tree, system, () => [phonePk, watchPk]);
    const b = projectAccessControls(tree, system, () => [watchPk, phonePk]);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.value.tip).toBe(b.value.tip);
    expect(slotKeysSaid(a.value.write.keys)).toBe(slotKeysSaid(b.value.write.keys));
  });

  it('isValid rejects stranger; accepts writer', async () => {
    const tree = entityTree();
    const projected = projectAccessControls(tree, system, () => [phonePk]);
    expect(projected.ok).toBe(true);
    if (!projected.ok) return;
    const write = projected.value.write;

    const okMsg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: write.version,
        messageId: 'w-ok',
        expiresAt: now + 60_000,
        signerPublicKey: phonePk,
      },
      new TextEncoder().encode('blob'),
      phone,
    );
    expect(isValid(write, okMsg, { now }).ok).toBe(true);

    const stranger = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: write.version,
        messageId: 'w-bad',
        expiresAt: now + 60_000,
        signerPublicKey: watchPk,
      },
      new TextEncoder().encode('blob'),
      watch,
    );
    const bad = isValid(write, stranger, { now });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe('signer-not-in-snapshot');
  });

  it('importAccessControls round-trips tip; ignores tampered tip', () => {
    const tree = entityTree();
    const projected = projectAccessControls(tree, system, () => [phonePk]);
    expect(projected.ok).toBe(true);
    if (!projected.ok) return;
    const imported = importAccessControls(projected.value);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.value.write.version).toBe(projected.value.write.version);
    expect(imported.value.write.keys).toEqual(projected.value.write.keys);
    expect(imported.value.tip).toBe(projected.value.tip);

    const tampered = importAccessControls({
      ...projected.value,
      tip: 'ETamperedTip00000000000000000000000000000000' as SAID,
    });
    expect(tampered.ok).toBe(true);
    if (!tampered.ok) return;
    expect(tampered.value.tip).toBe(projected.value.tip);
    expect(tampered.value.tip).not.toBe('ETamperedTip00000000000000000000000000000000');
  });

  it('golden: fixed keys → fixed tip SAID', () => {
    // setup: known keys from seeds 30/31
    const tree = entityTree();
    const ac = projectAccessControls(tree, system, () => [phonePk, watchPk]);
    expect(ac.ok).toBe(true);
    if (!ac.ok) return;

    // method under test
    const tip = accessControlsTip(ac.value);
    const readSaid = slotKeysSaid(ac.value.read.keys);

    // assertions: deterministic; tip commits to slot digests not raw keys
    expect(tip).toBe(ac.value.tip);
    expect(typeof tip).toBe('string');
    expect(tip.length).toBeGreaterThan(40);
    expect(tip).toBe(
      accessControlsTip({
        read: { keys: [watchPk, phonePk], version: ac.value.read.version },
        write: { keys: [watchPk, phonePk], version: ac.value.write.version },
        admin: { keys: [watchPk, phonePk], version: ac.value.admin.version },
      }),
    );
    expect(readSaid).toBe(slotKeysSaid([watchPk, phonePk]));
    expect(tip).toBe('EG1ayrrAFl6ZC7ASVAUlKdsNqpgInFamUKIET9Q9sYlq');
    expect(readSaid).toBe('EIjm1RwKAuNuLLhJicOsZ6XvF1ZRHXRPf1x8Vmn5ykFz');
  });
});
