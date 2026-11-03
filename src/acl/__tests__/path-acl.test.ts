/**
 * Hierarchical path ACL: closest prefix, install modes, accept write/put.
 */
import { describe, expect, it } from 'bun:test';
import type { PublicKey, SAID } from '../../common/types.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { accessControlsTip } from '../access-controls.js';
import {
  acceptAclPut,
  acceptPathWrite,
  aclInstallMode,
  ancestorPrefixes,
  joinPathSegments,
  kvsAclSystemId,
  resolveClosestAclPrefix,
  resolveParentAclPrefix,
} from '../path-acl.js';
import { aclPayloadOf, signAclMessage } from '../signed-message.js';

const aid = 'EAidHierarchicalKvs000000000000000000000000';
const owner = KeriKeyPairs.fromSeedNumber(40);
const stranger = KeriKeyPairs.fromSeedNumber(41);
const ownerPk = owner.publicKey as PublicKey;
const strangerPk = stranger.publicKey as PublicKey;
const ver = 'ENodeVersionHierarchical00000000000000000000' as SAID;
const now = 1_700_000_000_000;

function ac(keys: PublicKey[]) {
  const slot = { keys, version: ver };
  const base = { read: slot, write: slot, admin: slot };
  return { ...base, tip: accessControlsTip(base) };
}

describe('path ACL resolve', () => {
  it('ancestorPrefixes longest first', () => {
    expect(ancestorPrefixes(['rkvs', 'entity-graph', 'x'])).toEqual([
      ['rkvs', 'entity-graph', 'x'],
      ['rkvs', 'entity-graph'],
      ['rkvs'],
    ]);
  });

  it('resolveClosestAclPrefix picks deepest registered', () => {
    const registered = new Set(['rkvs', 'rkvs/entity-graph']);
    expect(resolveClosestAclPrefix(['rkvs', 'entity-graph', 'a', 'b'], registered)).toEqual([
      'rkvs',
      'entity-graph',
    ]);
    expect(resolveClosestAclPrefix(['rkvs', 'other'], registered)).toEqual(['rkvs']);
    expect(resolveClosestAclPrefix(['nope'], registered)).toBeUndefined();
  });

  it('resolveParentAclPrefix skips self', () => {
    const registered = new Set(['rkvs', 'rkvs/entity-graph']);
    expect(resolveParentAclPrefix(['rkvs', 'entity-graph'], registered)).toEqual(['rkvs']);
    expect(resolveParentAclPrefix(['rkvs'], registered)).toBeUndefined();
  });

  it('aclInstallMode bootstrap / parent / self', () => {
    const empty = new Set<string>();
    expect(aclInstallMode(['rkvs', 'entity-graph'], empty).value?.mode).toBe('bootstrap');

    const withParent = new Set(['rkvs']);
    const parentMode = aclInstallMode(['rkvs', 'entity-graph'], withParent);
    expect(parentMode.value?.mode).toBe('parent-admin');
    expect(parentMode.value?.parentPrefix).toEqual(['rkvs']);

    const withSelf = new Set(['rkvs/entity-graph']);
    expect(aclInstallMode(['rkvs', 'entity-graph'], withSelf).value?.mode).toBe('self-admin');
  });

  it('kvsAclSystemId', () => {
    expect(kvsAclSystemId(aid, ['rkvs', 'entity-graph'])).toBe(`kvs:${aid}/rkvs/entity-graph`);
  });
});

describe('acceptPathWrite / acceptAclPut', () => {
  it('write rejected without covering ACL', async () => {
    const msg = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs', 'entity-graph']),
        operation: 'write',
        aclHash: ver,
        messageId: 'w1',
        expiresAt: now + 60_000,
        signerPublicKey: ownerPk,
      },
      new TextEncoder().encode('body'),
      owner,
    );
    const r = acceptPathWrite({
      aid,
      pathSegments: ['rkvs', 'entity-graph', 'k'],
      acls: new Map(),
      msg,
      opts: { now },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('no-covering-acl');
  });

  it('write ok for writer; stranger rejected', async () => {
    const acls = new Map([[joinPathSegments(['rkvs', 'entity-graph']), ac([ownerPk])]]);
    const body = new TextEncoder().encode('body');
    const okMsg = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs', 'entity-graph']),
        operation: 'write',
        aclHash: ver,
        messageId: 'w-ok',
        expiresAt: now + 60_000,
        signerPublicKey: ownerPk,
      },
      body,
      owner,
    );
    expect(
      acceptPathWrite({
        aid,
        pathSegments: ['rkvs', 'entity-graph', 'k'],
        acls,
        msg: okMsg,
        opts: { now },
      }).ok,
    ).toBe(true);

    const bad = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs', 'entity-graph']),
        operation: 'write',
        aclHash: ver,
        messageId: 'w-bad',
        expiresAt: now + 60_000,
        signerPublicKey: strangerPk,
      },
      body,
      stranger,
    );
    const badR = acceptPathWrite({
      aid,
      pathSegments: ['rkvs', 'entity-graph', 'k'],
      acls,
      msg: bad,
      opts: { now },
    });
    expect(badR.ok).toBe(false);
  });

  it('bootstrap ACL install with KSN key; stranger rejected', async () => {
    const next = ac([ownerPk]);
    const payload = aclPayloadOf(next);
    const msg = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs', 'entity-graph']),
        operation: 'admin',
        aclHash: ver,
        messageId: 'boot',
        expiresAt: now + 60_000,
        signerPublicKey: ownerPk,
      },
      payload,
      owner,
    );
    const okR = acceptAclPut({
      aid,
      prefixSegments: ['rkvs', 'entity-graph'],
      acls: new Map(),
      nextRaw: next,
      msg,
      opts: { now },
      bootstrapKeys: [ownerPk],
    });
    expect(okR.ok).toBe(true);
    if (okR.ok) expect(okR.value.mode).toBe('bootstrap');

    const bad = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs', 'entity-graph']),
        operation: 'admin',
        aclHash: ver,
        messageId: 'boot-bad',
        expiresAt: now + 60_000,
        signerPublicKey: strangerPk,
      },
      payload,
      stranger,
    );
    const badR = acceptAclPut({
      aid,
      prefixSegments: ['rkvs', 'entity-graph'],
      acls: new Map(),
      nextRaw: next,
      msg: bad,
      opts: { now },
      bootstrapKeys: [ownerPk],
    });
    expect(badR.ok).toBe(false);
  });

  it('nested ACL install requires parent admin', async () => {
    const parent = ac([ownerPk]);
    const acls = new Map([['rkvs', parent]]);
    const child = ac([ownerPk, strangerPk]);
    const payload = aclPayloadOf(child);
    const msg = await signAclMessage(
      {
        system: kvsAclSystemId(aid, ['rkvs']),
        operation: 'admin',
        aclHash: ver,
        messageId: 'nest',
        expiresAt: now + 60_000,
        signerPublicKey: ownerPk,
      },
      payload,
      owner,
    );
    const r = acceptAclPut({
      aid,
      prefixSegments: ['rkvs', 'entity-graph'],
      acls,
      nextRaw: child,
      msg,
      opts: { now },
      bootstrapKeys: [ownerPk],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.mode).toBe('parent-admin');
  });
});
