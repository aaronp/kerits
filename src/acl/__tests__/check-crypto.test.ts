/**
 * Real Ed25519 ACL check — round trips and field tampering.
 */
import { describe, expect, it } from 'bun:test';
import type { PublicKey } from '../../common/types.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { Acl } from '../acl.js';
import { applyAdmin, check } from '../check.js';
import { signAclMessage, type SignedAclMessageV1 } from '../signed-message.js';

const writer = KeriKeyPairs.fromSeedNumber(20);
const admin = KeriKeyPairs.fromSeedNumber(21);
const stranger = KeriKeyPairs.fromSeedNumber(22);
const writerPk = writer.publicKey as PublicKey;
const adminPk = admin.publicKey as PublicKey;

const system = 'r2:membership:EFoo';
const now = 1_700_000_000_000;

function treeWithWriter(): ReturnType<typeof Acl.empty> {
  let tree = Acl.empty();
  tree = Acl.putNode(tree, Acl.node('writers', [{ kind: 'key', publicKey: writerPk }]));
  tree = Acl.putNode(tree, Acl.node('admins', [{ kind: 'key', publicKey: adminPk }]));
  tree = Acl.setPrivilege(tree, system, 'write', 'writers');
  tree = Acl.setPrivilege(tree, system, 'admin', 'admins');
  return tree;
}

function writeVersion(tree: ReturnType<typeof Acl.empty>) {
  return tree.nodes['writers']!.d;
}

function adminVersion(tree: ReturnType<typeof Acl.empty>) {
  return tree.nodes['admins']!.d;
}

describe('Acl.check crypto', () => {
  it('sign + check succeeds with writer key in snapshot', async () => {
    const tree = treeWithWriter();
    const payload = new TextEncoder().encode('body');
    const msg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: writeVersion(tree),
        messageId: 'ok-1',
        expiresAt: now + 60_000,
        signerPublicKey: writerPk,
      },
      payload,
      writer,
    );
    expect(check(tree, msg, { now }).ok).toBe(true);
  });

  it('rejects foreign signer with copied aclHash', async () => {
    const tree = treeWithWriter();
    const msg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: writeVersion(tree),
        messageId: 'bad-signer',
        expiresAt: now + 60_000,
        signerPublicKey: stranger.publicKey as PublicKey,
      },
      new TextEncoder().encode('x'),
      stranger,
    );
    const r = check(tree, msg, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('signer-not-in-snapshot');
  });

  it('rejects expired messages', async () => {
    const tree = treeWithWriter();
    const msg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: writeVersion(tree),
        messageId: 'exp',
        expiresAt: now,
        signerPublicKey: writerPk,
      },
      new TextEncoder().encode('x'),
      writer,
    );
    const r = check(tree, msg, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('expired');
  });

  async function signedWrite(): Promise<{ tree: ReturnType<typeof treeWithWriter>; msg: SignedAclMessageV1 }> {
    const tree = treeWithWriter();
    const msg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: writeVersion(tree),
        messageId: 'tamper',
        expiresAt: now + 60_000,
        signerPublicKey: writerPk,
      },
      new TextEncoder().encode('payload'),
      writer,
    );
    return { tree, msg };
  }

  it('tamper system → privilege-not-found (unknown system)', async () => {
    const { tree, msg } = await signedWrite();
    const tampered = { ...msg, system: 'other' };
    const r = check(tree, tampered, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('privilege-not-found');
  });

  it('tamper operation → signature-invalid', async () => {
    const { tree, msg } = await signedWrite();
    const tampered = { ...msg, operation: 'admin' as const };
    const r = check(tree, tampered, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(['signature-invalid', 'signer-not-in-snapshot', 'acl-hash-mismatch']).toContain(r.error.kind);
  });

  it('tamper aclHash → signature-invalid', async () => {
    const { tree, msg } = await signedWrite();
    const tampered = { ...msg, aclHash: adminVersion(tree) };
    const r = check(tree, tampered, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(['signature-invalid', 'acl-hash-mismatch']).toContain(r.error.kind);
  });

  it('tamper expiresAt → signature-invalid', async () => {
    const { tree, msg } = await signedWrite();
    const tampered = { ...msg, expiresAt: msg.expiresAt + 1 };
    const r = check(tree, tampered, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('signature-invalid');
  });

  it('tamper payload → digest-mismatch', async () => {
    const { tree, msg } = await signedWrite();
    const tampered = { ...msg, payload: new TextEncoder().encode('mutated') };
    const r = check(tree, tampered, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('digest-mismatch');
  });

  it('applyAdmin returns next tree; original unchanged', async () => {
    const tree = treeWithWriter();
    const newWriter = KeriKeyPairs.fromSeedNumber(23);
    const patch = {
      putNodes: [
        {
          nodeId: 'writers',
          children: [
            { kind: 'key' as const, publicKey: writerPk },
            { kind: 'key' as const, publicKey: newWriter.publicKey as PublicKey },
          ],
        },
      ],
    };
    const msg = await signAclMessage(
      {
        system,
        operation: 'admin',
        aclHash: adminVersion(tree),
        messageId: 'admin-1',
        expiresAt: now + 60_000,
        signerPublicKey: adminPk,
      },
      new TextEncoder().encode(JSON.stringify(patch)),
      admin,
    );

    const beforeWrite = Acl.snapshot(tree, system, 'write', 'sign');
    const result = applyAdmin(tree, msg, { now });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toBe(tree);
    const afterOrig = Acl.snapshot(tree, system, 'write', 'sign');
    const afterNext = Acl.snapshot(result.value, system, 'write', 'sign');
    expect(beforeWrite.ok && afterOrig.ok && afterNext.ok).toBe(true);
    if (!beforeWrite.ok || !afterOrig.ok || !afterNext.ok) return;
    expect(afterOrig.value.hash).toBe(beforeWrite.value.hash);
    expect(afterNext.value.hash).not.toBe(beforeWrite.value.hash);
  });

  it('rejects stale aclHash after rotate', async () => {
    const tree = treeWithWriter();
    const oldWriteVersion = writeVersion(tree);
    const onlyNew = KeriKeyPairs.fromSeedNumber(24);
    const patch = {
      putNodes: [
        { nodeId: 'writers', children: [{ kind: 'key' as const, publicKey: onlyNew.publicKey as PublicKey }] },
      ],
    };
    const adminMsg = await signAclMessage(
      {
        system,
        operation: 'admin',
        aclHash: adminVersion(tree),
        messageId: 'rot',
        expiresAt: now + 60_000,
        signerPublicKey: adminPk,
      },
      new TextEncoder().encode(JSON.stringify(patch)),
      admin,
    );
    const rotated = applyAdmin(tree, adminMsg, { now });
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;

    const stale = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: oldWriteVersion,
        messageId: 'stale',
        expiresAt: now + 60_000,
        signerPublicKey: writerPk,
      },
      new TextEncoder().encode('x'),
      writer,
    );
    const r = check(rotated.value, stale, { now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('acl-hash-mismatch');
  });
});
