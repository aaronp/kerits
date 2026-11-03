/**
 * Golden vectors for kerits-acl-msg/1 — real Ed25519 signatures for Rust ports.
 */
import { describe, expect, it } from 'bun:test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PublicKey } from '../../common/types.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { Acl } from '../acl.js';
import { check } from '../check.js';
import { snapshotOf } from '../snapshot.js';
import {
  canonicalSignedAclBytes,
  signAclMessage,
  verifyAclMessageSignature,
  type SignedAclMessageV1,
} from '../signed-message.js';

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function msgForJson(msg: SignedAclMessageV1) {
  return {
    ...msg,
    payload: undefined,
    payloadHex: toHex(msg.payload),
  };
}

describe('acl-msg golden vectors', () => {
  it('generates and verifies real-signature fixtures', async () => {
    const writer = KeriKeyPairs.fromSeedNumber(50);
    const writerPk = writer.publicKey as PublicKey;
    const system = 'r2:membership:EFoo';
    const now = 1_700_000_000_000;
    let tree = Acl.empty();
    tree = Acl.putNode(tree, Acl.node('writers', [{ kind: 'key', publicKey: writerPk }]));
    tree = Acl.setPrivilege(tree, system, 'write', 'writers');
    const snap = snapshotOf('sign', [writerPk]);
    const writeNode = tree.nodes['writers']!;
    const payload = new TextEncoder().encode('golden-body');
    const okMsg = await signAclMessage(
      {
        system,
        operation: 'write',
        aclHash: writeNode.d,
        messageId: 'golden-ok',
        expiresAt: now + 60_000,
        signerPublicKey: writerPk,
      },
      payload,
      writer,
    );

    expect(verifyAclMessageSignature(okMsg)).toBe(true);
    expect(check(tree, okMsg, { now }).ok).toBe(true);
    void snap; // legacy hash still useful for key-set docs

    const tampered = { ...okMsg, system: 'evil' };
    expect(verifyAclMessageSignature(tampered)).toBe(false);

    const fixture = {
      v: 'kerits-acl-msg/1',
      cases: [
        {
          name: 'write-ok',
          privateKey: writer.privateKey,
          publicKey: writer.publicKey,
          message: msgForJson(okMsg),
          payloadHex: toHex(payload),
          canonicalUtf8Hex: toHex(canonicalSignedAclBytes(okMsg)),
          expect: 'ok',
        },
        {
          name: 'tamper-system',
          message: msgForJson(tampered),
          payloadHex: toHex(tampered.payload),
          expect: 'signature-invalid',
        },
      ],
    };

    const outPath = join(import.meta.dir, 'fixtures', 'acl-msg-golden.json');
    writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    // reload-style assert without re-sign
    expect(fixture.cases[0].expect).toBe('ok');
    expect(fixture.cases[1].expect).toBe('signature-invalid');
  });
});
