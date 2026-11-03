import {
  ACDCData, canonicalizeEvent, decodeKey, digestVerfer, encodeSignature, KELEvents, KeriKeyPairs,
  SchemaData, SchemaOps, SequenceNumber, sign, TELEvents,
} from '../../index.js';
import type {
  ACDCCredential, ACDCSchema, AID, CESREvent, IssEvent, KELEvent, KeriKeyPair, RevEvent, SAID, Signature, VcpEvent,
} from '../../index.js';

export type Controller = { aid: AID; kel: CESREvent[]; current: KeriKeyPair; next: KeriKeyPair; seed: number };
type Seal = { i: string; s: string; d: string };

export function signBytes(kp: KeriKeyPair, bytes: Uint8Array): Signature {
  return encodeSignature(sign(bytes, decodeKey(kp.privateKey).raw), true).qb64 as Signature;
}

function signed(ev: KELEvent, kps: KeriKeyPair[]): CESREvent {
  return KELEvents.assembleSignedEvent({
    event: ev,
    signatures: kps.map((k, i) => ({ keyIndex: i, ondex: i, sig: signBytes(k, canonicalizeEvent(ev)) })),
  });
}

const head = (c: Controller) => c.kel[c.kel.length - 1]!.event;
const nextSn = (c: Controller) => SequenceNumber.of(head(c).s) + 1;

export function incept(seed: number): Controller {
  const current = KeriKeyPairs.fromSeedNumber(seed);
  const next = KeriKeyPairs.fromSeedNumber(seed + 1);
  const icp = KELEvents.finalize(
    KELEvents.buildIcp({ keys: [current.publicKey], nextKeyDigests: [digestVerfer(next.publicKey)] }).unsignedEvent, true,
  ).event;
  return { aid: icp.i as AID, kel: [signed(icp, [current])], current, next, seed: seed + 1 };
}

export function anchor(c: Controller, seals: Seal[]): Controller {
  const ixn = KELEvents.finalize(
    KELEvents.buildIxn({ aid: c.aid, sequence: nextSn(c), priorEventSaid: head(c).d as SAID, anchors: seals }).unsignedEvent,
  ).event;
  return { ...c, kel: [...c.kel, signed(ixn, [c.current])] };
}

export function rotate(c: Controller): Controller {
  const after = KeriKeyPairs.fromSeedNumber(c.seed + 1);
  const rot = KELEvents.finalize(
    KELEvents.buildRot({
      aid: c.aid, sequence: nextSn(c), priorEventSaid: head(c).d as SAID, keys: [c.next.publicKey],
      nextKeyDigests: [digestVerfer(after.publicKey)], signingThreshold: '1', nextThreshold: '1',
    }).unsignedEvent,
  ).event;
  return { aid: c.aid, kel: [...c.kel, signed(rot, [c.next])], current: c.next, next: after, seed: c.seed + 1 };
}

function withSealSource(ev: CESREvent, parent: Controller): CESREvent {
  const sealing = head(parent);
  return { ...ev, attachments: [...ev.attachments, { kind: 'delegator-seal-source', s: String(sealing.s), d: String(sealing.d) }] };
}

export function delegate(parent: Controller, seed: number): { parent: Controller; child: Controller } {
  const current = KeriKeyPairs.fromSeedNumber(seed);
  const next = KeriKeyPairs.fromSeedNumber(seed + 1);
  const dip = KELEvents.finalize(
    KELEvents.buildDip({ parentAid: parent.aid, keys: [current.publicKey], nextKeyDigests: [digestVerfer(next.publicKey)] }).unsignedEvent,
    true,
  ).event;
  const sealed = anchor(parent, [{ i: dip.i, s: '0', d: dip.d }]);
  return {
    parent: sealed,
    child: { aid: dip.i as AID, kel: [withSealSource(signed(dip, [current]), sealed)], current, next, seed: seed + 1 },
  };
}

export function rotateDelegated(child: Controller, parent: Controller): { parent: Controller; child: Controller } {
  const after = KeriKeyPairs.fromSeedNumber(child.seed + 1);
  const drt = KELEvents.finalize(
    KELEvents.buildDrt({
      aid: child.aid, sequence: nextSn(child), priorEventSaid: head(child).d as SAID, keys: [child.next.publicKey],
      nextKeyDigests: [digestVerfer(after.publicKey)], signingThreshold: '1', nextThreshold: '1',
    }).unsignedEvent,
  ).event;
  const sealed = anchor(parent, [{ i: drt.i, s: String(drt.s), d: drt.d }]);
  return {
    parent: sealed,
    child: { aid: child.aid, kel: [...child.kel, withSealSource(signed(drt, [child.next]), sealed)], current: child.next, next: after, seed: child.seed + 1 },
  };
}

export const DEFAULT_SCHEMA: ACDCSchema = SchemaData.create({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: { i: { type: 'string' }, name: { type: 'string' }, age: { type: 'number' }, tags: { type: 'array', items: { type: 'string' } } },
  required: ['name'],
});

export function issue(
  issuer: Controller,
  holder: AID,
  claims: Record<string, unknown>,
  schema: ACDCSchema = DEFAULT_SCHEMA,
): { issuer: Controller; acdc: ACDCCredential; registry: VcpEvent; iss: IssEvent } {
  const { event: registry, said: rid } = TELEvents.computeSaid(TELEvents.buildVcp({ issuerAid: issuer.aid, backers: [] }).unsignedEvent, true);
  const acdc = ACDCData.create({ i: issuer.aid, ri: rid, s: SchemaOps.said(schema), a: { i: holder, ...claims } });
  const { event: iss } = TELEvents.computeSaid(
    TELEvents.buildIss({ credentialSaid: acdc.d as SAID, registryId: rid as SAID, sequence: 0, datetime: '2026-01-01T00:00:00.000Z' }).unsignedEvent,
  );
  const anchored = anchor(issuer, [{ i: rid, s: '0', d: registry.d }, { i: acdc.d, s: '0', d: iss.d }]);
  return { issuer: anchored, acdc, registry: registry as VcpEvent, iss: iss as IssEvent };
}

/** Revoke an issued credential: builds a `rev` after `iss` and anchors its SAID in the issuer KEL. */
export function revoke(
  issuer: Controller,
  acdc: ACDCCredential,
  iss: IssEvent,
): { issuer: Controller; rev: RevEvent } {
  const { event } = TELEvents.computeSaid(
    TELEvents.buildRev({
      credentialSaid: acdc.d as SAID, registryId: iss.ri as SAID, sequence: 1, priorEventSaid: iss.d as SAID,
      datetime: '2026-02-01T00:00:00.000Z',
    }).unsignedEvent,
  );
  return { issuer: anchor(issuer, [{ i: acdc.d, s: '1', d: event.d }]), rev: event as RevEvent };
}

/** Multi-key controller: `keys[i]` are the current signing keys, `nextKeys[i]` the pre-rotated ones. */
export type MultiController = { aid: AID; kel: CESREvent[]; keys: KeriKeyPair[]; nextKeys: KeriKeyPair[] };

const pairs = (seed: number, n: number) => Array.from({ length: n }, (_, i) => KeriKeyPairs.fromSeedNumber(seed + i));

export function inceptMulti(seed: number, n: number): MultiController {
  const keys = pairs(seed, n);
  const nextKeys = pairs(seed + n, n);
  const icp = KELEvents.finalize(
    KELEvents.buildIcp({
      keys: keys.map((k) => k.publicKey), nextKeyDigests: nextKeys.map((k) => digestVerfer(k.publicKey)),
      signingThreshold: String(n), nextThreshold: String(n),
    }).unsignedEvent,
    true,
  ).event;
  return { aid: icp.i as AID, kel: [signed(icp, keys)], keys, nextKeys };
}

export function rotateMulti(c: MultiController, seed: number): MultiController {
  const after = pairs(seed, c.keys.length);
  const last = c.kel[c.kel.length - 1]!.event;
  const rot = KELEvents.finalize(
    KELEvents.buildRot({
      aid: c.aid, sequence: SequenceNumber.of(last.s) + 1, priorEventSaid: last.d as SAID,
      keys: c.nextKeys.map((k) => k.publicKey), nextKeyDigests: after.map((k) => digestVerfer(k.publicKey)),
      signingThreshold: String(c.keys.length), nextThreshold: String(c.keys.length),
    }).unsignedEvent,
  ).event;
  return { aid: c.aid, kel: [...c.kel, signed(rot, c.nextKeys)], keys: c.nextKeys, nextKeys: after };
}
