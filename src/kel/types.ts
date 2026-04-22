/**
 * KEL-specific types
 *
 * Surgical subset of kv4 packages/kerits/src/types.ts.
 * Only types that are KEL event-specific (event schemas, attachment schemas,
 * KSN, CESREvent envelope) are included here.
 *
 * Cross-cutting KERI primitives (AID, SAID, Threshold, branded key types, etc.)
 * live in common/types.ts.
 *
 * Classification:
 *   - common/types.ts: cross-cutting KERI primitives
 *   - kel/types.ts (this file): KEL event schemas, attachment schemas, KSN,
 *     CESREvent, KelAppend, VaultAppend, KelAppends namespace, KSNs namespace
 *   - defer-to-sdk (stays in kv4): Plan/Action types, ACDC/TEL types, Contact types,
 *     messaging types, storage types
 */

import type { TSchema } from '@sinclair/typebox';
import { type Static, Type } from '@sinclair/typebox';
import {
  type AID,
  CesrAidSchema,
  CesrDigestSchema,
  CesrKeyTransferableSchema,
  CesrSignatureSchema,
  type KeriKeyPair,
  KeriKeyPairSchema,
  NonEmpty,
  type PublicKey,
  Qb64Schema,
  type SAID,
  type Threshold,
  ThresholdSchema,
  type Timestamp,
  TimestampSchema,
  VersionSchema,
} from '../common/types.js';

/* ------------------------------------------------------------------------------------------------
 * Witness field helpers (module-private)
 * ----------------------------------------------------------------------------------------------*/

const InceptionWitnessFields = {
  bt: ThresholdSchema,
  b: Type.Array(CesrAidSchema, {
    title: 'Backer Prefixes',
    description: 'Initial backer (witness) list',
  }),
};

/** Rotation/DRT witness fields: delta-based backer changes */
const RotationWitnessFields = {
  bt: ThresholdSchema,
  br: Type.Array(CesrAidSchema, {
    title: 'Backers Removed',
    description: 'Backer AIDs removed in this rotation',
  }),
  ba: Type.Array(CesrAidSchema, {
    title: 'Backers Added',
    description: 'Backer AIDs added in this rotation',
  }),
};

/* ------------------------------------------------------------------------------------------------
 * KEL Event Schemas
 * ----------------------------------------------------------------------------------------------*/

/**
 * Inception (icp) — establishes controller keys, next commitments, witnesses, traits.
 * Notes:
 *  - For inception, i === d (AID equals the event SAID)
 *  - bt/b are witness threshold/prefixes (optional; bt=0 means no witness requirement)
 *  - c holds config traits; a holds data anchors (seals)
 */
export const IcpEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('icp', {
      title: 'Event Type',
      description: 'Event type identifier for inception',
    }),
    d: CesrDigestSchema, // SAID of this event
    i: CesrAidSchema, // AID (for inception, equals d)
    s: Type.Literal('0', {
      title: 'Sequence',
      description: 'Event sequence number (always "0" for inception)',
    }),
    kt: ThresholdSchema,
    k: Type.Array(CesrKeyTransferableSchema, {
      minItems: 1,
      title: 'Current Keys',
      description: 'Array of current signing keys (transferable qb64)',
      examples: [['DAliceKey...', 'DBobKey...']],
    }),
    nt: ThresholdSchema,
    n: Type.Array(CesrDigestSchema, {
      minItems: 1,
      title: 'Next Key Digests',
      description: 'Array of next-key commitments (pre-rotation digests)',
      examples: [['EcommitA...', 'EcommitB...']],
    }),
    ...InceptionWitnessFields,
    c: Type.Array(Type.String(), {
      title: 'Configuration Traits',
      description: 'Flags like "EO" (Establishment-Only), "DND" (Do Not Delegate).',
      examples: [['EO'], ['EO', 'DND']],
    }),
    a: Type.Array(Type.Unknown(), {
      title: 'Anchors',
      description: 'External seals/anchors (opaque in this layer)',
    }),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.icp.v1.json',
    title: 'KERI Inception Event',
    description: 'KERI inception event establishing a new controller identifier (AID).',
    examples: [
      {
        v: 'KERI10JSON000156_',
        t: 'icp',
        d: 'EicpSaid...',
        i: 'EicpSaid...',
        s: '0',
        kt: '2',
        k: ['DAliceKey...', 'DBobKey...'],
        nt: '2',
        n: ['EcommitA...', 'EcommitB...'],
        bt: '0',
        b: [],
        c: ['EO'],
        a: [],
      },
    ],
  },
);

export type IcpEvent = Static<typeof IcpEventSchema>;

/**
 * Rotation (rot) — rotates to next keys; proves continuity via prior SAID.
 * Uses delta-based witness fields (br/ba) instead of a full witness list.
 */
export const RotEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('rot'),
    d: CesrDigestSchema,
    i: CesrAidSchema,
    s: NonEmpty('Sequence', 'Monotonic sequence as string', ['1', '2']),
    p: CesrDigestSchema, // prior event SAID (prev)
    kt: ThresholdSchema,
    k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
    nt: ThresholdSchema,
    n: Type.Array(CesrDigestSchema, { minItems: 1 }),
    ...RotationWitnessFields,
    c: Type.Array(Type.String(), { title: 'Configuration Traits' }),
    a: Type.Array(Type.Unknown(), { title: 'Anchors' }),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.rot.v1.json',
    title: 'KERI Rotation Event',
    description: 'Rotates to next keys; proves continuity via prior SAID. Uses delta-based witness changes (br/ba).',
  },
);
export type RotEvent = Static<typeof RotEventSchema>;

export const IxnEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('ixn'),
    d: CesrDigestSchema,
    i: CesrAidSchema,
    s: NonEmpty('Sequence', 'Monotonic sequence as string', ['1', '2']),
    p: CesrDigestSchema, // prior event SAID
    a: Type.Array(Type.Unknown(), { default: [] }), // data seals
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.ixn.v1.json',
    title: 'KERI Interaction Event',
    description: 'Interaction; attaches data seals without key changes.',
  },
);
export type IxnEvent = Static<typeof IxnEventSchema>;

/* ------------------------------------------------------------------------------------------------
 * KSN (Key State Notice)
 * ----------------------------------------------------------------------------------------------*/

/**
 * Key State Notice:
 *  - Captures controller key state at the HEAD of the KEL
 *  - Ties state to the last event (d) and prior (p)
 *  - Includes current keys & next commitments (k/n with thresholds)
 *  - Optionally records witness adds/removes and last establishment event
 *
 * Notes:
 *  - et is the last event's type; helps consumers interpret state transitions
 *  - wa/wr are deltas (add/remove); bt/b are the resulting witness set/threshold
 *  - ee can point to the most recent establishment event (icp/rot) for convenience
 *  - For delegated identifiers, parent approval lives *outside* the KSN (as evidence/anchors)
 */
export const KSNSchema = Type.Object(
  {
    v: VersionSchema,

    // Identity & linkage
    i: CesrAidSchema, // controller AID
    s: NonEmpty('Sequence', 'Current sequence number as string', ['0', '1', '2']),
    p: CesrDigestSchema, // prior SAID (prev)
    d: CesrDigestSchema, // last event SAID (current head)
    et: Type.Union(
      [Type.Literal('icp'), Type.Literal('rot'), Type.Literal('ixn'), Type.Literal('dip'), Type.Literal('drt')],
      { title: 'Last Event Type' },
    ),

    // Keys (current) and next commitments
    kt: ThresholdSchema,
    k: Type.Array(CesrKeyTransferableSchema, { minItems: 1, title: 'Current Keys' }),
    nt: ThresholdSchema,
    n: Type.Array(CesrDigestSchema, { minItems: 1, title: 'Next Key Digests' }),

    // Witnessing (resulting state)
    bt: ThresholdSchema,
    b: Type.Array(CesrAidSchema, {
      title: 'Witness AIDs (current set)',
      description:
        "A witness does not sign your event like a controller. A witness receives your event and later issues receipts, which are signed with the witness's keys — but those signatures are delivered out-of-band, not inside your KEL event.",
    }),

    // Optional deltas and conveniences
    wa: Type.Optional(Type.Array(CesrAidSchema, { title: 'Witnesses Added (delta)' })),
    wr: Type.Optional(Type.Array(CesrAidSchema, { title: 'Witnesses Removed (delta)' })),
    c: Type.Optional(Type.Array(Type.String(), { title: 'Config Traits', examples: [['EO', 'DND']] })),
    ee: Type.Optional(
      Type.Object(
        {
          s: NonEmpty('Establishment Seq'),
          d: CesrDigestSchema,
        },
        { additionalProperties: false, title: 'Last Establishment Event (icp/rot) pointer' },
      ),
    ),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.ksn.v1.json',
    title: 'Key State Notice (KSN)',
    description:
      "Summarizes the controller's current key state at the head of the KEL. Parent/delegation approvals are external evidence.",
    examples: [
      {
        v: 'KERI10JSON000180_',
        i: 'EicpSaid...',
        s: '2',
        p: 'EprevSaid...',
        d: 'EheadSaid...',
        et: 'rot',
        kt: '2',
        k: ['DAliceKey...', 'DBobKey...'],
        nt: '2',
        n: ['EnextA...', 'EnextB...'],
        bt: '0',
        b: [],
        c: ['EO'],
        ee: { s: '2', d: 'EheadSaid...' },
      },
    ],
  },
);
export type KSN = Static<typeof KSNSchema>;

/* ------------------------------------------------------------------------------------------------
 * PublishedResource
 * ----------------------------------------------------------------------------------------------*/

/**
 * PublishedResource - Signed envelope for any published KERI data
 *
 * Contains the data, its SAID, signature for verification, and publisher metadata.
 * Readers can independently verify the signature using the publisher's KEL.
 */
export const PublishedResourceSchema = <T extends TSchema>(dataSchema: T) =>
  Type.Object(
    {
      said: CesrDigestSchema,
      data: dataSchema,
      format: Type.String({ description: "Data format: 'json' | 'cesr' | etc." }),
      signature: Type.String({ description: 'Signature over SAID digest' }),
      publicKey: CesrKeyTransferableSchema,
      publisherAid: CesrAidSchema,
      publishedAt: TimestampSchema,
    },
    {
      title: 'PublishedResource',
      description: 'Signed envelope for published KERI data with verification metadata',
    },
  );

/**
 * Format for published resources
 */
export type PublishFormat = 'json' | 'cesr';

export type PublishedResource<T> = {
  said: SAID;
  data: T;
  format: PublishFormat;
  signature: string;
  publicKey: string;
  publisherAid: AID;
  publishedAt: Timestamp;
};

/* ------------------------------------------------------------------------------------------------
 * KelManifest
 * ----------------------------------------------------------------------------------------------*/

/**
 * KelManifest - Small document pointing to a KEL's events
 *
 * Provides efficient access to KEL metadata without fetching all events.
 */
export const KelManifestSchema = Type.Object(
  {
    d: CesrDigestSchema,
    aid: CesrAidSchema,
    firstEventSaid: CesrDigestSchema,
    latestSn: Type.Number({ description: 'Latest sequence number' }),
    latestEventSaid: CesrDigestSchema,
    eventSaids: Type.Array(CesrDigestSchema, { description: 'All event SAIDs in order' }),
  },
  {
    title: 'KelManifest',
    description: 'Manifest document for a published KEL',
  },
);
export type KelManifest = Static<typeof KelManifestSchema>;

/* ------------------------------------------------------------------------------------------------
 * KSNs namespace — helper functions for building KSN from KEL events
 * ----------------------------------------------------------------------------------------------*/

export namespace KSNs {
  /**
   * Create minimal KSN from CESR-encoded public key
   *
   * Used for multi-sig inception when we have a participant's public key
   * (either from their AID or extracted from their KEL) but don't need
   * their full KEL history.
   *
   * For multi-sig inception, we combine PUBLIC KEYS from multiple participants.
   * This generates a NEW multi-sig AID different from the participant AIDs.
   *
   * @param publicKey - CESR-encoded public key (e.g., from decoding an AID)
   * @param aid - Optional AID for reference (defaults to publicKey if inception)
   * @returns Minimal KSN suitable for multi-sig inception
   */
  export function fromPublicKey(publicKey: string, aid?: AID): KSN {
    // For inception, if no AID provided, use publicKey as placeholder
    // (will be replaced with actual multi-sig AID during inception)
    const identifier = aid ?? publicKey;

    return {
      v: 'KERI10JSON00011c_', // Standard version string
      i: identifier,
      s: '0', // Sequence 0 (inception state)
      p: '', // No prior for inception
      d: identifier, // For minimal KSN, d=i
      et: 'icp', // Inception event type
      kt: '1', // Single key threshold (for this participant)
      k: [publicKey], // Current signing key (CESR-encoded public key)
      nt: '1', // Next threshold
      n: ['EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'], // Placeholder next key digest
      bt: '0', // No witnesses
      b: [], // No witness list
    };
  }

  /**
   * Build KSN (Key State Notice) from KEL events
   *
   * Extracts the current key state from the head of the KEL.
   * Used to get prior event info for rotation.
   *
   * @param aid - Controller AID
   * @param events - KEL events in order
   * @returns KSN with current state or undefined if KEL is empty
   */
  export function fromKEL(aid: AID, events: CESREvent[]): KSN | undefined {
    if (events.length === 0) {
      return undefined;
    }

    const lastEvent = events[events.length - 1]?.event;
    const prevEvent = events.length > 1 ? events[events.length - 2]?.event : undefined;

    if (!lastEvent) {
      return undefined;
    }

    // Walk ALL events forward to accumulate key & witness state.
    // icp/dip set initial witnesses (b); rot/drt apply deltas (br/ba).
    let currentKeys: string[] = [];
    let nextDigests: string[] = [];
    let signingThreshold: string | string[][] = '1';
    let nextThreshold: string | string[][] = '1';
    let witnessThreshold: string | string[][] = '0';
    let witnesses: string[] = [];
    let config: string[] = [];

    for (const cesrEvt of events) {
      const evt = cesrEvt?.event;
      if (!evt) continue;

      if (evt.t === 'icp' || evt.t === 'dip') {
        currentKeys = evt.k;
        nextDigests = evt.n;
        signingThreshold = evt.kt;
        nextThreshold = evt.nt;
        witnessThreshold = evt.bt;
        witnesses = [...evt.b];
        config = evt.c;
      } else if (evt.t === 'rot' || evt.t === 'drt') {
        currentKeys = evt.k;
        nextDigests = evt.n;
        signingThreshold = evt.kt;
        nextThreshold = evt.nt;
        witnessThreshold = evt.bt;
        // Apply delta: remove br, then add ba
        const rotEvt = evt as RotEvent;
        const removed = new Set(rotEvt.br);
        witnesses = witnesses.filter((w) => !removed.has(w));
        witnesses.push(...rotEvt.ba);
        config = rotEvt.c;
      }
      // ixn events don't change establishment state — skip
    }

    // Build KSN
    const ksn: KSN = {
      v: lastEvent.v,
      i: aid,
      s: lastEvent.s,
      // For KSN: inception uses its own SAID; others use previous event SAID
      p: prevEvent ? prevEvent.d : lastEvent.t === 'icp' ? lastEvent.d : '',
      d: lastEvent.d,
      et: lastEvent.t,
      kt: signingThreshold,
      k: currentKeys,
      nt: nextThreshold,
      n: nextDigests,
      bt: witnessThreshold,
      b: witnesses,
      ...(config.length > 0 ? { c: config } : {}),
    };

    return ksn;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Delegation event schemas + unified KEL event union
 * ----------------------------------------------------------------------------------------------*/

/**
 * Delegated Inception (dip)
 *  - Structurally mirrors icp (sequence is "0"); parent approval is external evidence.
 */
export const DipEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('dip'),
    d: CesrDigestSchema,
    i: CesrAidSchema,
    s: Type.Literal('0', { title: 'Sequence' }),
    kt: ThresholdSchema,
    k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
    nt: ThresholdSchema,
    n: Type.Array(CesrDigestSchema, { minItems: 1 }),
    ...InceptionWitnessFields,
    c: Type.Array(Type.String(), { default: [] }),
    a: Type.Array(Type.Unknown(), { default: [] }),
    di: CesrAidSchema, // Delegator AID
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.dip.v1.json',
    title: 'Delegated Inception (dip)',
    description: 'Inception for a delegated identifier. Parent approval/seal is external evidence.',
  },
);
export type DipEvent = Static<typeof DipEventSchema>;

/**
 * Delegated Rotation (drt)
 *  - Structurally mirrors rot with delta-based witness fields; parent approval is external evidence.
 */
export const DrtEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('drt'),
    d: CesrDigestSchema,
    i: CesrAidSchema,
    s: NonEmpty('Sequence', 'Monotonic sequence as string', ['1', '2']),
    p: CesrDigestSchema,
    kt: ThresholdSchema,
    k: Type.Array(CesrKeyTransferableSchema, { minItems: 1 }),
    nt: ThresholdSchema,
    n: Type.Array(CesrDigestSchema, { minItems: 1 }),
    ...RotationWitnessFields,
    c: Type.Array(Type.String(), { title: 'Configuration Traits' }),
    a: Type.Array(Type.Unknown(), { title: 'Anchors' }),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.drt.v1.json',
    title: 'Delegated Rotation (drt)',
    description:
      'Rotation for a delegated identifier. Uses delta-based witness changes (br/ba). Parent approval/seal is external evidence.',
  },
);
export type DrtEvent = Static<typeof DrtEventSchema>;

/** Unified KEL event union (use this when validating/dispatching parsed events). */
export const KELEventSchema = Type.Union(
  [IcpEventSchema, RotEventSchema, IxnEventSchema, DipEventSchema, DrtEventSchema],
  {
    title: 'KEL Event',
    description: 'Any valid KEL event (icp | rot | ixn | dip | drt).',
  },
);
export type KELEvent = Static<typeof KELEventSchema>;

/* ------------------------------------------------------------------------------------------------
 * CESR Attachments (signatures & receipts)
 * ----------------------------------------------------------------------------------------------*/

/**
 *
 * KERI differentiates rct (non-transferable/witness) and vrc (transferable/validator with seal). This union covers both.
 */
export const KeyIndexSchema = Type.Union([Type.Integer({ minimum: 0 }), NonEmpty('Key Index (string)')], {
  title: 'Key Index',
  description: 'Signer key index (int or qb64 encoded index)',
});
export type KeyIndex = Static<typeof KeyIndexSchema>;

/**
 *  Controller signature over the event (indexed/non-indexed).
 *
 *
 */
export const CesrAttachment_Signature = Type.Object(
  {
    kind: Type.Literal('sig'),
    form: Type.Union([Type.Literal('indexed'), Type.Literal('nonIndexed')], {
      description: 'Indexed signatures typical for transferable controllers',
    }),
    signerAid: Type.Optional(CesrAidSchema), // helpful for provenance, not always present on-wire
    keyIndex: Type.Optional(KeyIndexSchema), // required if form=indexed
    sig: CesrSignatureSchema, // qb64 signature
  },
  {
    additionalProperties: false,
    title: 'Controller Signature Attachment',
    description: 'Signature over the serialized event bytes. When form="indexed", keyIndex MUST be present.',
  },
);

/** Non-transferable (witness) receipt: simple signature (rct). */
export const CesrAttachment_WitnessReceipt = Type.Object(
  {
    kind: Type.Literal('rct'),
    by: CesrAidSchema, // witness AID
    sig: CesrSignatureSchema, // signature over event digest
  },
  {
    additionalProperties: false,
    title: 'Witness Receipt (rct)',
    description: 'Non-transferable receipt from a witness',
  },
);

/** Transferable validator receipt (vrc) with a seal (i,s,d). */
export const CesrSealSchema = Type.Object(
  {
    i: CesrAidSchema, // validator AID
    s: NonEmpty('Sequence'), // validator's seq for the sealing event
    d: CesrDigestSchema, // SAID of the sealing event
  },
  { additionalProperties: false, title: 'CESR Seal (i,s,d)' },
);
export type CesrSeal = Static<typeof CesrSealSchema>;

/** Digest seal — references another data structure by its SAID. */
export const DigestSealSchema = Type.Object(
  {
    d: CesrDigestSchema, // SAID of the referenced data
  },
  { additionalProperties: false, title: 'Digest Seal (d)' },
);
export type DigestSeal = Static<typeof DigestSealSchema>;

/** Any KERI seal type — full event seal or digest-only seal. */
export const AnySealSchema = Type.Union([CesrSealSchema, DigestSealSchema], {
  title: 'KERI Seal',
  description: 'Full event seal (i,s,d) or digest seal (d)',
});
export type AnySeal = Static<typeof AnySealSchema>;

export const CesrAttachment_ValidatorReceipt = Type.Object(
  {
    kind: Type.Literal('vrc'),
    cid: Type.Optional(CesrDigestSchema), // Child event SAID being endorsed (not on -D wire, populated from context)
    seal: CesrSealSchema, // Seal-source pointing to validator's endorsing event
    sig: CesrSignatureSchema, // Validator signature over child SAID
    keyIndex: Type.Optional(
      Type.Number({
        title: 'Key Index',
        description:
          'Index into the parent establishment event key list. Defaults to 0 for backward compatibility with single-sig delegators.',
      }),
    ),
  },
  {
    additionalProperties: false,
    title: 'Validator Receipt (vrc)',
    description: 'Transferable validator receipt with explicit child SAID, seal-source, and signature',
  },
);

/** Generic attachment union (extend later if you add seals, anchors, etc.). */
export const CesrAttachmentSchema = Type.Union(
  [CesrAttachment_Signature, CesrAttachment_WitnessReceipt, CesrAttachment_ValidatorReceipt],
  {
    title: 'CESR Attachment',
    description: 'Signatures and receipts attached to an event',
  },
);
export type CesrAttachment = Static<typeof CesrAttachmentSchema>;

/* ------------------------------------------------------------------------------------------------
 * KelAppend
 * ----------------------------------------------------------------------------------------------*/

/**
 * Minimal representation of "what to append to the KEL":
 *  - event: strongly-typed SAD KEL event (icp/rot/ixn/dip/drt)
 *  - said: must equal event.d
 *  - kind: derived from event.t as "kel/<t>"
 *  - cesr: CESR-encoded bytes of the event envelope (e.g. base64), for exact replay
 */
export const KelAppendSchema = Type.Object(
  {
    artifactId: NonEmpty('Artifact ID', 'Local identifier within this plan', ['icp0', 'rot1']),
    said: Qb64Schema,
    kind: Type.Union(
      [
        Type.Literal('kel/icp'),
        Type.Literal('kel/rot'),
        Type.Literal('kel/ixn'),
        Type.Literal('kel/dip'),
        Type.Literal('kel/drt'),
      ],
      { description: 'KEL event kind (derived from event.t)' },
    ),
    event: KELEventSchema,
    attachments: Type.Array(CesrAttachmentSchema, {
      default: [],
      description: 'CESR attachments (signatures, receipts) for this event',
    }),
    cesr: NonEmpty('CESR Event Bytes', 'CESR-encoded representation of this KEL event envelope (e.g. base64 or qb64)'),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/kerits/kel-append.v1.json',
    title: 'KEL Append',
    description:
      'Minimal append instruction: SAD KEL event + SAID + CESR bytes. Canonical JSON is derived from event when needed.',
  },
);
export type KelAppend = Static<typeof KelAppendSchema>;

/* ------------------------------------------------------------------------------------------------
 * VaultAppend
 * ----------------------------------------------------------------------------------------------*/

// ----- Vault Append (keypair to store) -----

export const VaultAppendSchema = Type.Object(
  {
    aid: CesrAidSchema,
    keyPair: KeriKeyPairSchema,
    purpose: Type.Optional(
      Type.Union(
        [
          // Signing key purposes
          Type.Literal('inception-current'),
          Type.Literal('inception-next'),
          Type.Literal('rotation-current'),
          Type.Literal('rotation-next'),
          Type.Literal('registry-backer-current'),
          Type.Literal('registry-backer-next'),
          // Messaging DH key purposes (X25519)
          Type.Literal('messaging-dh-static'),
          Type.Literal('messaging-dh-prekey'),
          Type.Literal('messaging-dh-onetime'),
          // Generic
          Type.Literal('other'),
        ],
        {
          description:
            'Purpose/role of this keypair. Signing keys use inception/rotation purposes. X25519 DH keys use messaging-dh-* purposes.',
        },
      ),
    ),
    metadata: Type.Optional(
      Type.Record(Type.String(), Type.Unknown(), {
        description: 'Optional metadata for the key',
      }),
    ),
  },
  {
    additionalProperties: false,
    title: 'Vault Append',
    description: 'Keypair to be stored in vault during plan execution',
  },
);
export type VaultAppend = Static<typeof VaultAppendSchema>;

/* ------------------------------------------------------------------------------------------------
 * KelAppends namespace — helpers for validating and rebuilding CESR envelopes
 * ----------------------------------------------------------------------------------------------*/

/**
 * KelAppends:
 *  - helpers for validating and rebuilding CESR envelopes
 *  - kept close to the KelAppend type to avoid a separate helpers module
 */
export namespace KelAppends {
  /**
   * Validate a KelAppend:
   *  - event.d matches said
   *  - kind matches `kel/${event.t}`
   */
  export function validate(append: KelAppend): void {
    const { artifactId, said, kind, event } = append;

    if (event.d !== said) {
      throw new Error(`SAID mismatch in KelAppend[${artifactId}]: event.d=${event.d}, said=${said}`);
    }

    const expectedKind = `kel/${event.t}` as KelAppend['kind'];
    if (kind !== expectedKind) {
      throw new Error(`Kind mismatch in KelAppend[${artifactId}]: kind=${kind}, expected=${expectedKind}`);
    }
  }

  /**
   * Build a CESREvent envelope from a KelAppend.
   * Uses:
   *  - append.event as the SAD KEL event
   *  - append.cesr as bytesB64 (exact serialized bytes)
   *  - append.attachments as CESR attachments (signatures, receipts)
   */
  export function toCESREvent(append: KelAppend): CESREvent {
    validate(append);

    const env: CESREvent = {
      event: append.event,
      attachments: append.attachments || [],
      enc: 'JSON',
      bytesB64: append.cesr,
    };

    return env;
  }

  /**
   * Construct a KelAppend from a CESREvent envelope.
   *
   * - Uses env.event.d as the SAID (trust it was correctly computed during event creation)
   * - Requires env.bytesB64 (exact CESR bytes)
   *
   * Note: We don't recompute SAID here because KERI SAIDs are computed from the
   * unsigned event (with d=''), not from the final signed event. The SAID verification
   * should happen at event creation time, not when converting from CESR envelope.
   */
  export function fromCESREvent(artifactId: string, env: CESREvent): KelAppend {
    if (!env.bytesB64) {
      throw new Error(`CESREvent.bytesB64 is required to build KelAppend[${artifactId}]`);
    }

    // Trust that env.event.d was correctly set during event creation
    const said = env.event.d;

    return {
      artifactId,
      said,
      kind: `kel/${env.event.t}` as KelAppend['kind'],
      event: env.event,
      attachments: env.attachments || [],
      cesr: env.bytesB64,
    };
  }
}

/* ------------------------------------------------------------------------------------------------
 * CESR Event Envelope
 * ----------------------------------------------------------------------------------------------*/

/**
 * CESR Event Envelope:
 *  - `event`: the SAD KEL event (icp/rot/ixn/dip/drt)
 *  - `attachments`: any signatures/receipts collected for the event
 *  - `enc`: how the event bytes were serialized when signed (helps reproduce Sig verification)
 *  - `bytesB64`: optional exact serialized bytes (base64) for perfect reproducibility
 */
export const CESREventSchema = Type.Object(
  {
    event: KELEventSchema, // your union: icp | rot | ixn | dip | drt
    attachments: Type.Array(CesrAttachmentSchema, { default: [] }),
    enc: Type.Union([Type.Literal('JSON'), Type.Literal('CBOR'), Type.Literal('MGPK')], {
      title: 'Encoding',
      description: 'Serialization used to produce signed bytes',
      default: 'JSON',
    }),
    bytesB64: Type.Optional(
      NonEmpty(
        'Event Bytes (base64)',
        'Exact serialized event bytes for verification Optional but extremely handy for deterministic re-verification and tooling (export/import, replay tests). If omitted, reproduce bytes from event + enc.',
      ),
    ),
  },
  {
    additionalProperties: false,
    $id: 'https://merits.dev/schemas/keri/kel.cesr-envelope.v1.json',
    title: 'CESR Event Envelope',
    description: 'SAD event plus CESR attachments (signatures/receipts) and serialization hints',
    examples: [
      {
        event: {
          t: 'rot',
          v: 'KERI10JSON000120_',
          d: 'ErotSaid...',
          i: 'EicpSaid...',
          s: '1',
          p: 'Eprev...',
          kt: '1',
          k: ['DA...'],
          nt: '1',
          n: ['E...'],
          a: [],
        },
        attachments: [
          { kind: 'sig', form: 'indexed', signerAid: 'EicpSaid...', keyIndex: 0, sig: 'AAbb...' },
          { kind: 'rct', by: 'EwitAid...', sig: 'AA11...' },
        ],
        enc: 'JSON',
      },
    ],
  },
);
export type CESREvent = Static<typeof CESREventSchema>;

/* ------------------------------------------------------------------------------------------------
 * Re-export common types used by KEL consumers for convenience
 * (avoids import from two modules)
 * ----------------------------------------------------------------------------------------------*/
export type { AID, KeriKeyPair, PublicKey, SAID, Threshold, Timestamp };
