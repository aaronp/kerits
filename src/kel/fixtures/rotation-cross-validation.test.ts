import { describe, expect, test } from 'bun:test';
import { encodeAttachmentGroups } from '../../cesr/attachments.js';
import { digestVerfer } from '../../cesr/digest.js';
import { decodeCesrStream, encodeCesrEvent } from '../../cesr/event-codec.js';
import { encodeSig } from '../../cesr/sigs.js';
import { type AID, type PublicKey, type SAID, SequenceNumber, type Threshold } from '../../common/types.js';
import { TestKeys } from '../../keys/test-keys.js';
import { sign } from '../../signature/primitives.js';
import { canonicalizeEvent } from '../event-crypto.js';
import { encodeEventBytes } from '../event-signing.js';
import { KELEvents } from '../events.js';
import { planRotation, type RotationChange, type RotationSigner } from '../rotation.js';
import type { CesrAttachment, CESREvent, KELEvent } from '../types.js';
import { type RichValidationResult, validateKelChain } from '../validation.js';
import expectedJson from './rotation-expected.json';
import scenarioJson from './rotation-scenarios.json';
import verdictJson from './rotation-validation-expected.json';

type Ref = string; // "alice[3]"
type Signer = { key: Ref; index: number; ondex: number | null };
type Establishment = { k: Ref[]; kt: Threshold; n: Ref[]; nt: Threshold };
type Scenario = {
  id: string;
  delegator?: string;
  inception: Establishment;
  /** a rotation, or an interaction step (t "ixn": signers only); "mutate" edits the built event (verdict only) */
  rotations: (Establishment & { signers: Signer[]; t?: 'ixn'; mutate?: Record<string, unknown> })[];
  expectValid: boolean;
};
/** As stored: a "keripy-default" rotation omits kt/nt; "mutate" (invalid scenarios) edits the built event in the generator. */
type RawRotation = Omit<Establishment, 'kt' | 'nt'> & {
  kt?: Threshold;
  nt?: Threshold;
  thresholds?: 'keripy-default';
  /** an interaction step: signers only, no k/n */
  t?: 'ixn';
  signers: Signer[];
};
type RawScenario = Omit<Scenario, 'rotations'> & { rotations: RawRotation[] };

/** keripy Hab.rotate defaults (keri/app/habbing.py): kt = the prior nt, nt = the new kt. */
function withKeripyDefaults(s: RawScenario): Scenario {
  let priorNt = s.inception.nt;
  const rotations = s.rotations.map((r) => {
    if (r.t === 'ixn') {
      return { ...r, k: [], n: [], kt: priorNt, nt: priorNt }; // never planned; thresholds unchanged
    } else {
      /* a rotation */
    }
    const kt = r.kt ?? priorNt;
    const nt = r.nt ?? kt;
    priorNt = nt;
    return { ...r, kt, nt };
  });
  return { ...s, rotations };
}
type ExpectedEvent = { said: string; bodyHex: string; sigs: string[]; streamHex: string };
type Expected = { keys: Record<Ref, string>; events: ExpectedEvent[]; delegatorEvents?: ExpectedEvent[] };

const scenarios = (scenarioJson.scenarios as RawScenario[]).map(withKeripyDefaults);
const expected = expectedJson as Record<string, Expected>;
const verdicts = verdictJson as Record<string, { accepted: boolean; acceptedThroughSn: number }>;

/**
 * The only scenarios where kerits deliberately differs from keripy (spec §4f). The verdict test asserts kerits'
 * value, and that keripy's recorded verdict is still `keripyAccepted`, so a keripy change is flagged.
 */
const KNOWN_DIVERGENCES: Record<
  string,
  { kerits: { accepted: boolean; acceptedThroughSn: number }; keripyAccepted: boolean; reason: string }
> = {
  'duplicate-sig-a-and-b': {
    kerits: { accepted: false, acceptedThroughSn: 0 },
    keripyAccepted: true,
    reason: 'kerits counts each key once toward a threshold; keripy counts A and B encodings of one key separately',
  },
  'sn-0x-prefix': {
    kerits: { accepted: false, acceptedThroughSn: 0 },
    keripyAccepted: true,
    reason: 'kerits parses s as hex digits only (SequenceNumber); keripy int(s, 16) also takes a 0x prefix',
  },
};

const hexToBytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex, 'hex'));
const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

function testKey(ref: Ref) {
  const m = /^(\w+)\[(\d+)\]$/.exec(ref);
  if (m) {
    return TestKeys.iterator(m[1]!).at(Number(m[2]));
  } else {
    throw new Error(`bad key ref ${ref}`);
  }
}
const pub = (ref: Ref): PublicKey => testKey(ref).cesr;
const dig = (ref: Ref): string => digestVerfer(pub(ref));

const sigOf = (event: KELEvent, ref: Ref): string =>
  encodeSig(sign(canonicalizeEvent(event), testKey(ref).privateKey), true).qb64;

/** A signature attached outside the planner (a forged extra, or a kept key claiming an ondex). */
function signAttachment(event: KELEvent, ref: Ref, keyIndex: number, ondex: number | undefined): CesrAttachment {
  const sig = sigOf(event, ref);
  return ondex === undefined
    ? { kind: 'sig', form: 'indexed', keyIndex, sig }
    : { kind: 'sig', form: 'indexed', keyIndex, ondex, sig };
}

/** One siger qb64 as keripy lists it: the attachment group minus its 4-char -A counter. */
const sigerQb64 = (att: CesrAttachment): string => new TextDecoder().decode(encodeAttachmentGroups([att])).slice(4);

/**
 * Derive the planner input from the scenario's target layout: a k ref committed in the prior n
 * is revealed, one in the prior k is kept, else added; an n ref still committed and unrevealed
 * is carried, else new.
 */
function changeFor(prior: Establishment, rot: Establishment): RotationChange {
  const reveal = rot.k.filter((r) => prior.n.includes(r));
  return {
    keep: rot.k.filter((r) => !prior.n.includes(r) && prior.k.includes(r)).map(pub),
    reveal: reveal.map(pub),
    add: rot.k.filter((r) => !prior.n.includes(r) && !prior.k.includes(r)).map(pub),
    carryNext: rot.n.filter((r) => prior.n.includes(r) && !reveal.includes(r)).map(dig),
    nextDigests: rot.n.filter((r) => !(prior.n.includes(r) && !reveal.includes(r))).map(dig),
    kt: rot.kt,
    nt: rot.nt,
  };
}

const sealSource = (delegatorEvents: ExpectedEvent[], sn: number): CesrAttachment => ({
  kind: 'delegator-seal-source',
  s: SequenceNumber.encode(sn),
  d: delegatorEvents[sn]!.said,
});

/** keripy-accepted prefix: the sn before the first rejected event (all events share one KEL, so sn = index). */
function acceptedThroughSn(result: RichValidationResult, eventCount: number): number {
  if (result.valid) {
    return eventCount - 1;
  } else if (result.firstError?.eventIndex !== undefined) {
    return result.firstError.eventIndex - 1;
  } else {
    throw new Error('invalid result without a first error index');
  }
}

describe('rotation matches keripy 1.3.4', () => {
  for (const s of scenarios) {
    const exp = expected[s.id];
    if (exp === undefined) {
      test(`${s.id}: has keripy vectors`, () => {
        throw new Error(`no keripy vectors for ${s.id}: ./scripts/run-keripy.sh scripts/generate-keripy-rotation.py`);
      });
      continue;
    } else {
      /* vectors present */
    }
    const parentKel = exp.delegatorEvents
      ? decodeCesrStream(hexToBytes(exp.delegatorEvents.map((e) => e.streamHex).join('')))
      : undefined;

    test(`${s.id}: validator verdict equals keripy Kevery`, () => {
      // setup: keripy's own stream bytes for this scenario
      const events = decodeCesrStream(hexToBytes(exp.events.map((e) => e.streamHex).join('')));
      // call our method under test
      const result = validateKelChain(events, parentKel ? { parentKel } : undefined);
      // assertions: same accept/reject and the same last accepted sn as keripy, except a documented divergence
      const verdict = { accepted: result.valid, acceptedThroughSn: acceptedThroughSn(result, events.length) };
      const divergence = KNOWN_DIVERGENCES[s.id];
      if (divergence === undefined) {
        expect(verdict).toEqual(verdicts[s.id]!);
      } else {
        expect(verdict).toEqual(divergence.kerits);
        expect(verdicts[s.id]!.accepted).toBe(divergence.keripyAccepted);
      }
    });

    if (s.expectValid && KNOWN_DIVERGENCES[s.id] === undefined && s.rotations.every((r) => r.mutate === undefined)) {
      test(`${s.id}: planned + signed + encoded bytes equal keripy`, () => {
        // setup: the inception (dip under the delegator when delegated), every key signing through
        // assembleSignedEvent with no ondex given (its default, index == ondex, is under test too)
        const delegatorEvents = exp.delegatorEvents;
        const icpParams = {
          keys: s.inception.k.map(pub),
          nextKeyDigests: s.inception.n.map(dig),
          signingThreshold: s.inception.kt,
          nextThreshold: s.inception.nt,
        };
        const { event: icp } = delegatorEvents
          ? KELEvents.finalize(
              KELEvents.buildDip({ ...icpParams, parentAid: delegatorEvents[0]!.said as AID }).unsignedEvent,
              true,
            )
          : KELEvents.finalize(KELEvents.buildIcp(icpParams).unsignedEvent, true);
        const signedIcp = KELEvents.assembleSignedEvent({
          event: icp,
          signatures: s.inception.k.map((r, i) => ({ keyIndex: i, sig: sigOf(icp, r) })),
        });
        const built: CESREvent[] = [
          {
            ...signedIcp,
            attachments: [...signedIcp.attachments, ...(delegatorEvents ? [sealSource(delegatorEvents, 1)] : [])],
          },
        ];

        let prior: Establishment = s.inception;
        let priorEvent = icp;
        s.rotations.forEach((rot, r) => {
          if (rot.t === 'ixn') {
            // an interaction: the current keys sign (default ondex == index); thresholds and commitments unchanged
            const { event } = KELEvents.finalize(
              KELEvents.buildIxn({ aid: icp.i as AID, sequence: r + 1, priorEventSaid: priorEvent.d as SAID })
                .unsignedEvent,
              false,
            );
            const signedIxn = KELEvents.assembleSignedEvent({
              event,
              signatures: rot.signers.map((x) => ({ keyIndex: x.index, sig: sigOf(event, x.key) })),
            });
            built.push({
              ...signedIxn,
              attachments: [...signedIxn.attachments, ...(delegatorEvents ? [sealSource(delegatorEvents, r + 2)] : [])],
            });
            priorEvent = event;
            return;
          } else {
            /* a rotation */
          }
          // a listed signer is planned when its key is k[index] and its ondex (if any) names its own
          // commitment; anything else (forged, or a kept key claiming an ondex) is attached as an extra
          const planned = (x: Signer) =>
            rot.k[x.index] === x.key && (x.ondex === null || prior.n[x.ondex] === x.key);
          const extras = rot.signers.filter((x) => !planned(x));

          // call our method under test: plan with the genuine signers as `available`
          const result = planRotation(
            { k: prior.k.map(pub), kt: prior.kt, n: prior.n.map(dig), nt: prior.nt },
            changeFor(prior, rot),
            rot.signers.filter(planned).map((x) => pub(x.key)),
          );

          // assertions: planned k, n and signers equal the keripy layout exactly
          const signers: RotationSigner[] = rot.signers
            .filter(planned)
            .map((x) => (x.ondex === null ? { kIndex: x.index } : { kIndex: x.index, ondex: x.ondex }));
          const plan = { value: { k: rot.k.map(pub), kt: rot.kt, n: rot.n.map(dig), nt: rot.nt, signers } };
          expect(result).toEqual({ ok: true, value: plan.value }); // so plan.value is the planner's output

          const rotParams = {
            aid: icp.i as AID,
            sequence: r + 1,
            priorEventSaid: priorEvent.d as SAID,
            keys: plan.value.k,
            nextKeyDigests: plan.value.n,
            signingThreshold: plan.value.kt,
            nextThreshold: plan.value.nt,
          };
          const { event } = KELEvents.finalize(
            delegatorEvents ? KELEvents.buildDrt(rotParams).unsignedEvent : KELEvents.buildRot(rotParams).unsignedEvent,
            false,
          );
          // sign through the production path with the planner's signers, then append the extras
          const signedRot = KELEvents.assembleSignedEvent({
            event,
            signatures: plan.value.signers.map((x) => ({
              keyIndex: x.kIndex,
              ...(x.ondex === undefined ? {} : { ondex: x.ondex }),
              sig: sigOf(event, rot.k[x.kIndex]!),
            })),
          });
          built.push({
            ...signedRot,
            attachments: [
              ...signedRot.attachments,
              ...extras.map((x) => signAttachment(event, x.key, x.index, x.ondex ?? undefined)),
              ...(delegatorEvents ? [sealSource(delegatorEvents, r + 2)] : []),
            ],
          });
          prior = rot;
          priorEvent = event;
        });

        // assertions: per event, said, body, sigers (incl. ondex codes) and stream bytes equal keripy
        expect(
          built.map((e) => ({
            said: e.event.d,
            bodyHex: toHex(encodeEventBytes(e.event)),
            sigs: e.attachments.filter((a) => a.kind === 'sig').map(sigerQb64),
            streamHex: toHex(encodeCesrEvent(e)),
          })),
        ).toEqual(exp.events);
      });
    } else {
      /* invalid, mutated and divergent scenarios: verdict only (built with deliberately wrong signers or fields) */
    }
  }
});
