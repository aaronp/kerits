/**
 * A signed key state assessment: a KERI `rpy` on route `/ksa` whose `a` is a {@link KeyStateAssessment}, followed by one
 * `-C` receipt couple (signer public key qb64 + Ed25519 signature over the exact `rpy` JSON bytes).
 */

import { FormatRegistry, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { decodeAttachmentGroups, encodeAttachmentGroups } from '../cesr/attachments.js';
import { decodeKey } from '../cesr/keys.js';
import { decodeSig, encodeSig } from '../cesr/sigs.js';
import {
  type DerivationSurface,
  deriveSaid,
  recomputeSaid,
  serializeForSigning,
} from '../common/derivation-surface.js';
import { type SAID, SequenceNumber, Threshold, TimestampSchema } from '../common/types.js';
import { type KSN, KSNSchema } from '../kel/types.js';
import { err, ok, type Result } from '../result.js';
import { verify } from '../signature/primitives.js';

// Core registers no CESR format checkers, so Value.Check rejects any schema using them.
// Shape-check only here; the parser decodes the signer key it verifies with.
for (const f of ['qb64', 'qb64-key', 'qb64-digest', 'qb64-signature', 'qb64-key-transferable']) {
  if (!FormatRegistry.Has(f)) FormatRegistry.Set(f, () => true);
}

export type KeyStateAssessment = {
  ksn: KSN; // always the real head the store holds
  validation:
    | { status: 'valid' }
    | {
        status: 'pending';
        outstanding: (
          | { type: 'insufficient-signatures'; eventSaid: string }
          | { type: 'delegation-approval'; eventSaid: string; delegatorAid: string }
        )[];
      };
  // newest fully valid event and the signing keys/threshold in force at it; null while the inception is pending
  validatedHead: { s: string; d: string; k: string[]; kt: string } | null;
  assessedAt: string;
};

const closed = { additionalProperties: false } as const;
const KeyStateAssessmentSchema = Type.Object(
  {
    ksn: KSNSchema,
    validation: Type.Union([
      Type.Object({ status: Type.Literal('valid') }, closed),
      Type.Object(
        {
          status: Type.Literal('pending'),
          outstanding: Type.Array(
            Type.Union([
              Type.Object({ type: Type.Literal('insufficient-signatures'), eventSaid: Type.String() }, closed),
              Type.Object(
                { type: Type.Literal('delegation-approval'), eventSaid: Type.String(), delegatorAid: Type.String() },
                closed,
              ),
            ]),
            { minItems: 1 },
          ),
        },
        closed,
      ),
    ]),
    validatedHead: Type.Union([
      Type.Object(
        { s: Type.String(), d: Type.String(), k: Type.Array(Type.String(), { minItems: 1 }), kt: Type.String() },
        closed,
      ),
      Type.Null(),
    ]),
    assessedAt: TimestampSchema,
  },
  closed,
);

/** A parsed `rpy /ksa`: its exact bytes, its own SAID (the rpy `d`, unique per signing), the assessment and its signer. */
export type SignedAssessment = {
  readonly bytes: Uint8Array;
  readonly said: SAID;
  readonly assessment: KeyStateAssessment;
  readonly signer: string;
};

/** keripy `rpy` field order. */
const RPY_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'dt', 'r', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
};
const ROUTE = '/ksa';
const VERSION_HEAD = /^\{"v":"KERI10JSON([0-9a-f]{6})_"/;

export namespace RpyKsa {
  /** The SAIDified `rpy /ksa` JSON bytes for `assessment` at `dt`. */
  export function build(assessment: KeyStateAssessment, dt: Date): { readonly body: Uint8Array; readonly said: SAID } {
    const rpy = { v: 'KERI10JSON000000_', t: 'rpy', d: '', dt: dt.toISOString(), r: ROUTE, a: assessment };
    const { sealed, said } = deriveSaid(rpy, RPY_SURFACE);
    return { body: serializeForSigning(sealed, RPY_SURFACE).raw, said: said as SAID };
  }

  /** `body` followed by one `-C` couple: `signer` (qb64) + the Ed25519 `signature` over `body`. */
  export function attach(body: Uint8Array, signer: string, signature: Uint8Array): Uint8Array {
    const couple = encodeAttachmentGroups([{ kind: 'rct', by: signer, sig: encodeSig(signature, 'ed25519').qb64 }]);
    const out = new Uint8Array(body.length + couple.length);
    out.set(body);
    out.set(couple, body.length);
    return out;
  }

  /**
   * A canonical, SAID-valid `rpy /ksa` plus one `-C` couple whose signature verifies over the body under its signer.
   * The caller decides whether it trusts `signer`.
   */
  export function parse(bytes: Uint8Array): Result<SignedAssessment, string> {
    const head = VERSION_HEAD.exec(new TextDecoder().decode(bytes.subarray(0, 32)));
    const size = head ? Number.parseInt(head[1]!, 16) : 0;
    if (size === 0 || size >= bytes.length) return err('no rpy body and attachment');
    const body = bytes.subarray(0, size);
    const bodyText = new TextDecoder().decode(body);

    const rpy = parseJsonObject(bodyText);
    if (rpy === undefined) return err('body is not a JSON object');
    const { t, dt, r, a } = rpy;
    if (t !== 'rpy' || r !== ROUTE) return err('not an rpy /ksa');
    if (typeof dt !== 'string' || !Value.Check(TimestampSchema, dt) || Number.isNaN(Date.parse(dt)))
      return err('bad dt');
    if (!Value.Check(KeyStateAssessmentSchema, a)) return err('body is not a KeyStateAssessment');
    const vh = a.validatedHead;
    const vhSn = vh === null ? undefined : SequenceNumber.parse(vh.s);
    if (vhSn !== undefined && !vhSn.ok) return err('bad validatedHead.s');
    if (vh !== null && !Threshold.parse(vh.kt, vh.k.length).ok) return err('bad validatedHead.kt');
    // valid means the head itself validated, at the head's keys
    if (a.validation.status === 'valid' && !(vh !== null && isHead(vh, a.ksn))) {
      return err('valid but validatedHead is not the head');
    }
    // Canonical form: no extra fields, surface field order, and d is the body's SAID.
    if (serializeForSigning(rpy, RPY_SURFACE).text !== bodyText) return err('body is not canonical');
    if (!recomputeSaid(rpy, RPY_SURFACE).matches) return err('SAID mismatch');

    const threshold = Threshold.parse(a.ksn.kt, a.ksn.k.length);
    const sn = SequenceNumber.parse(a.ksn.s);
    // ponytail: weighted kt is refused here; consumers take a numeric threshold. Add a weighted form when needed.
    if (!sn.ok || !threshold.ok || threshold.value.kind !== 'numeric') {
      return err('key state not supported');
    }
    // pending means a later event awaits: validatedHead precedes the head
    if (a.validation.status === 'pending' && vhSn?.ok && vhSn.value >= sn.value) {
      return err('pending but validatedHead is not before the head');
    }

    const couple = singleCouple(bytes.subarray(size));
    if (couple === undefined) return err('not exactly one Ed25519 -C couple');
    if (!verifies(couple.signature, body, couple.signer)) return err('signature does not verify under its signer');
    return ok({ bytes, said: String(rpy.d) as SAID, assessment: a, signer: couple.signer });
  }
}

function isHead(vh: NonNullable<KeyStateAssessment['validatedHead']>, ksn: KSN): boolean {
  return (
    vh.s === ksn.s &&
    vh.d === ksn.d &&
    vh.kt === ksn.kt &&
    vh.k.length === ksn.k.length &&
    vh.k.every((key, i) => key === ksn.k[i])
  );
}

function verifies(signature: Uint8Array, body: Uint8Array, signer: string): boolean {
  try {
    const key = decodeKey(signer);
    return key.algo === 'ed25519' && verify(signature, body, key.raw);
  } catch {
    return false;
  }
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** Exactly one `-C` couple with a 64-byte Ed25519 signature, or undefined. */
function singleCouple(attachment: Uint8Array): { signer: string; signature: Uint8Array } | undefined {
  try {
    const groups = decodeAttachmentGroups(attachment);
    const only = groups.length === 1 ? groups[0] : undefined;
    if (only === undefined || only.kind !== 'rct') return undefined;
    const sig = decodeSig(only.sig);
    return sig.algo === 'ed25519' && sig.raw.length === 64 ? { signer: only.by, signature: sig.raw } : undefined;
  } catch {
    return undefined;
  }
}
