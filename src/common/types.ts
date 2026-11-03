/**
 * Pure cross-cutting KERI primitive types
 *
 * Surgical subset of kv4 packages/kerits/src/types.ts.
 * Only types that are pure KERI protocol-level concepts with no coupling to
 * storage, messaging, DSL, or UI concerns are included here.
 *
 * Classification:
 *   - common/types.ts (this file): cross-cutting KERI primitives — CESR scalars,
 *     branded key/digest/sig types, Threshold, KeyRef, parsers, KeriKeyPair
 *   - kel/types.ts (Chunk 6): KEL event-specific types (IcpEvent, RotEvent, etc.)
 *   - defer-to-sdk (stays in kv4): Aliases namespace, KeriKeyPairs namespace,
 *     messaging types, Plan/Action types, Contact/OOBI types, ACDC/TEL types,
 *     SignatureState, delegation types, storage types
 */

import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { err, ok, type Result } from '../result.js';
import type { Brand } from './brand.js';

/* ------------------------------------------------------------------------------------------------
 * Core primitive branded types (AID, SAID)
 * kv4 re-exports these from packages/kerits/src/storage/types.ts; defined inline in kv5.
 * ----------------------------------------------------------------------------------------------*/

/** Autonomic Identifier (CESR qb64 encoded) */
export type AID = string & { __brand: 'AID' };

/** Lightweight check: does the string look like a CESR qb64 AID (`E` prefix, 44 chars)? */
export function isAid(input: string): input is AID {
  return /^E[A-Za-z0-9_-]{43}$/.test(input);
}

/** Self-Addressing Identifier (CESR qb64 digest) */
export type SAID = string & { __brand: 'SAID' };

/* ------------------------------------------------------------------------------------------------
 * CESR / Common scalars
 * ----------------------------------------------------------------------------------------------*/

export const Qb64Schema = Type.String({
  minLength: 4,
  title: 'CESR qb64',
  description: 'qb64-encoded CESR value (AID/SAID/key/digest)',
  examples: ['EicpSaid...', 'DBobKey...', 'Esha3Digest...'],
});
export type Qb64 = Static<typeof Qb64Schema>;

export const TimestampSchema = Type.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$',
  title: 'Timestamp (UTC)',
  description: 'UTC ISO-8601 timestamp, e.g., 2025-11-04T16:20:00Z',
  examples: ['2025-11-04T16:20:00Z'],
});
export type Timestamp = Static<typeof TimestampSchema>;

export const NonEmpty = (title?: string, description?: string, eg?: string[]) =>
  Type.String({
    minLength: 1,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(eg ? { examples: eg } : {}),
  });

/** Helper to declare CESR-typed strings with UI-friendly title/format. */
export function CesrType(title: string, format: string) {
  return Type.String({ title, description: title, format });
}

/** KERI version: KERI<major><minor><KIND><size>_ (size is 6-digit lowercase hex) */
export const KeriVersionPattern = '^KERI[0-9]{2}[A-Z]{4}[0-9a-f]{6}_$';
export const VersionSchema = Type.String({
  title: 'KERI Version',
  description: 'KERI version string with encoding + embedded size. Example: "KERI10JSON000156_"',
  pattern: KeriVersionPattern,
  examples: ['KERI10JSON000156_'],
});

/**
 * Thresholds (kt, nt) as keripy 1.3.4 `Tholder` serialises them (spec §4f; keripy is the reference where the
 * KERI spec is silent):
 * - a plain M-of-N threshold is a hex string ("1", "a" is 10, "10" is 16);
 * - fractions appear only as weights inside weighted lists (a bare "1/2" is rejected);
 * - a weighted threshold is a list of weights (one clause) or a list of clauses (ANDed).
 * The `Threshold` namespace below is the only reader and writer of kt/nt/bt.
 */
export const ThresholdExpressionPattern = '^[0-9a-fA-F]+$';
export const ThresholdExpressionSchema = Type.String({
  title: 'Threshold Expression',
  description: 'Number of signatures required, as a hex string. Examples: "1", "2", "a" (10).',
  pattern: ThresholdExpressionPattern,
  examples: ['1', '2', 'a'],
});

/**
 * Weighted Threshold Schema
 * Array of arrays of fractional strings representing weighted threshold clauses.
 */
export const WeightedThresholdSchema = Type.Array(Type.Array(Type.String()), {
  title: 'Weighted Threshold',
  description:
    'Weighted threshold clauses with rational fractions. Each inner array is a clause. Example: [["1/2", "1/2"], ["1", "1"]]',
  examples: [
    [['1/2', '1/2']],
    [
      ['1/2', '1/2'],
      ['1', '1'],
    ],
  ],
});

/**
 * Flat (single-clause) Weighted Threshold Schema: keripy's canonical serialisation of one clause,
 * e.g. ["1/2", "1/2"] for [["1/2", "1/2"]]. Same meaning as the one-clause nested form.
 */
export const FlatWeightedThresholdSchema = Type.Array(Type.String(), {
  title: 'Flat Weighted Threshold',
  description: 'A single weighted clause, as keripy serialises it. Example: ["1/2", "1/2"]',
  examples: [['1/2', '1/2']],
});

/**
 * Threshold Schema - union of ThresholdExpression and WeightedThreshold (nested, or flat single clause)
 */
export const ThresholdSchema = Type.Union(
  [ThresholdExpressionSchema, WeightedThresholdSchema, FlatWeightedThresholdSchema],
  {
    title: 'Threshold',
    description: 'A hex M-of-N threshold (string), weighted clauses (array of arrays), or one flat weighted clause.',
  },
);

/**
 * Threshold Type - the wire form of kt/nt. Read and write it only through the `Threshold` namespace.
 */
export type Threshold = Static<typeof ThresholdSchema>;

/**
 * The only reader and writer of kt/nt/bt, following keripy 1.3.4 `Tholder`:
 * - `parse` validates a wire threshold for a key list of `keyCount` and returns its parsed form;
 * - `numeric` / `weighted` / `encode` produce the keripy wire form (hex; one clause flat);
 * - `satisfied` evaluates signed key indices. Weighted clauses partition the key list in order
 *   (clause 0 weighs keys 0..len0-1, clause 1 the next ones, ...), as keripy.
 * Documented divergences (spec §4f), kerits strict: each index counts once (keripy counts a duplicate
 * signature twice toward a numeric threshold); only keripy's canonical encoding parses (no `0x`, spaces or
 * `_` in hex; no decimal, exponent or spaced weights; no weight maps); a negative index never satisfies.
 * Mirrored keripy behaviour (candidate upstream report): an index past the weights fails a weighted check.
 */
export namespace Threshold {
  /** A weight 0 <= numerator/denominator <= 1, reduced. */
  export type Fraction = { readonly numerator: number; readonly denominator: number };
  export type Parsed =
    | { readonly kind: 'numeric'; readonly m: number }
    | { readonly kind: 'weighted'; readonly clauses: readonly (readonly Fraction[])[] };
  export type ErrorKind =
    | 'empty'
    | 'malformed'
    | 'bare-fraction'
    | 'out-of-range'
    | 'clause-under-one'
    | 'size-mismatch';
  export type Error = { readonly kind: ErrorKind; readonly message: string };

  const HEX = /^[0-9a-fA-F]+$/;
  const INT = /^[0-9]+$/;
  const RATIO = /^([0-9]+)\/([0-9]+)$/;

  function fail(kind: ErrorKind, message: string): Result<never, Error> {
    return err({ kind, message });
  }

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  /** A hex count (kt/nt numeric form, bt). */
  function parseHex(raw: string, field: string): Result<number, Error> {
    if (raw === '') {
      return fail('empty', `${field}: empty threshold`);
    } else if (raw.includes('/')) {
      return fail('bare-fraction', `${field}: "${raw}" is a bare fraction; fractions belong only in weighted lists`);
    } else if (!HEX.test(raw)) {
      return fail('malformed', `${field}: "${raw}" is not a hex number`);
    } else {
      return ok(Number.parseInt(raw, 16));
    }
  }

  /** keripy `Tholder.weight`: "0", "1", or a ratio of integers within [0, 1]. */
  function parseWeight(w: unknown): Result<Fraction, Error> {
    if (typeof w !== 'string') {
      return fail('malformed', `weight ${JSON.stringify(w)} is not a string`);
    } else if (INT.test(w)) {
      const n = Number.parseInt(w, 10);
      return n <= 1 ? ok({ numerator: n, denominator: 1 }) : fail('out-of-range', `weight "${w}" is not within [0, 1]`);
    } else {
      const match = RATIO.exec(w);
      if (match === null) {
        return fail('malformed', `weight "${w}" is not an integer or a ratio of integers`);
      } else {
        const numerator = Number.parseInt(match[1]!, 10);
        const denominator = Number.parseInt(match[2]!, 10);
        if (denominator === 0) {
          return fail('malformed', `weight "${w}" has a zero denominator`);
        } else if (numerator > denominator) {
          return fail('out-of-range', `weight "${w}" is not within [0, 1]`);
        } else {
          const g = gcd(numerator, denominator);
          return ok({ numerator: numerator / g, denominator: denominator / g });
        }
      }
    }
  }

  /** a + b, reduced. */
  function add(a: Fraction, b: Fraction): Fraction {
    const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
    const denominator = a.denominator * b.denominator;
    const g = gcd(numerator, denominator);
    return { numerator: numerator / g, denominator: denominator / g };
  }

  function sum(weights: readonly Fraction[]): Fraction {
    return weights.reduce(add, { numerator: 0, denominator: 1 });
  }

  function atLeastOne(f: Fraction): boolean {
    return f.numerator >= f.denominator;
  }

  /** A list of clauses: an all-string list is one clause (keripy's flat form); anything mixed is malformed. */
  function clausesOf(raw: readonly unknown[]): Result<unknown[][], Error> {
    const nested = raw.filter((x) => Array.isArray(x)).length;
    if (nested === raw.length) {
      return ok(raw as unknown[][]);
    } else if (nested === 0) {
      return ok([[...raw]]);
    } else {
      return fail('malformed', `weighted threshold mixes weights and clauses: ${JSON.stringify(raw)}`);
    }
  }

  function parseWeighted(raw: readonly unknown[], keyCount: number): Result<Parsed, Error> {
    if (raw.length === 0) {
      return fail('empty', 'empty weighted threshold');
    } else {
      const clausesResult = clausesOf(raw);
      if (!clausesResult.ok) {
        return clausesResult;
      } else {
        const clauses: Fraction[][] = [];
        for (const rawClause of clausesResult.value) {
          const clause: Fraction[] = [];
          for (const w of rawClause) {
            const weight = parseWeight(w);
            if (!weight.ok) {
              return weight;
            } else {
              clause.push(weight.value);
            }
          }
          if (!atLeastOne(sum(clause))) {
            return fail('clause-under-one', `clause ${JSON.stringify(rawClause)} weighs less than 1`);
          } else {
            clauses.push(clause);
          }
        }
        const size = clauses.reduce((n, c) => n + c.length, 0);
        if (size > keyCount) {
          return fail('size-mismatch', `weighted threshold has ${size} weights for ${keyCount} keys`);
        } else {
          return ok({ kind: 'weighted', clauses });
        }
      }
    }
  }

  /** Parse a wire kt/nt for a list of `keyCount` keys (or digests), as keripy `Tholder` + Kever size check. */
  export function parse(raw: Threshold, keyCount: number): Result<Parsed, Error> {
    const value: unknown = raw;
    if (typeof value === 'string') {
      const m = parseHex(value, 'threshold');
      if (!m.ok) {
        return m;
      } else if (m.value > keyCount) {
        return fail('out-of-range', `threshold "${value}" (${m.value}) exceeds the key count ${keyCount}`);
      } else {
        return ok({ kind: 'numeric', m: m.value });
      }
    } else if (Array.isArray(value)) {
      return parseWeighted(value, keyCount);
    } else {
      return fail('malformed', `threshold ${JSON.stringify(value)} is neither a hex string nor a weighted list`);
    }
  }

  /**
   * Parse a witness threshold bt (hex, keripy `Number(numh=...)`) for `witnessCount` witnesses, with keripy's
   * bounds (Kever / incept): 1 <= bt <= witnessCount when there are witnesses, bt == 0 when there are none.
   */
  export function witness(bt: Threshold, witnessCount: number): Result<number, Error> {
    const value: unknown = bt;
    const m =
      typeof value === 'string'
        ? parseHex(value, 'bt')
        : fail('malformed', `bt ${JSON.stringify(value)} is not a hex string`);
    if (!m.ok) {
      return m;
    } else if (witnessCount > 0 && (m.value < 1 || m.value > witnessCount)) {
      return fail('out-of-range', `witness threshold ${m.value} is not within [1, ${witnessCount}] witnesses`);
    } else if (witnessCount === 0 && m.value !== 0) {
      return fail('out-of-range', `witness threshold ${m.value} with no witnesses (must be 0)`);
    } else {
      return ok(m.value);
    }
  }

  /** Number of keys a threshold weighs: m for numeric (keripy `Tholder.size`), the weight count for weighted. */
  export function size(parsed: Parsed): number {
    if (parsed.kind === 'numeric') {
      return parsed.m;
    } else if (parsed.kind === 'weighted') {
      return parsed.clauses.reduce((n, c) => n + c.length, 0);
    } else {
      const unknown: never = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }

  /** A plain M-of-N threshold, hex (keripy `f"{m:x}"`). */
  export function numeric(m: number): Threshold {
    if (!Number.isInteger(m) || m < 0) {
      throw new globalThis.Error(`Threshold.numeric: ${m} is not a non-negative integer`);
    } else {
      return m.toString(16);
    }
  }

  /** A weighted threshold; one clause is serialised flat, as keripy. */
  export function weighted(clauses: readonly (readonly string[])[]): Threshold {
    return clauses.length === 1 ? [...clauses[0]!] : clauses.map((c) => [...c]);
  }

  function weightString(f: Fraction): string {
    return f.numerator === 0 ? '0' : f.numerator === f.denominator ? '1' : `${f.numerator}/${f.denominator}`;
  }

  /** keripy's wire form (`Tholder.sith`) of a parsed threshold. */
  export function encode(parsed: Parsed): Threshold {
    if (parsed.kind === 'numeric') {
      return numeric(parsed.m);
    } else if (parsed.kind === 'weighted') {
      return weighted(parsed.clauses.map((c) => c.map(weightString)));
    } else {
      const unknown: never = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }

  /** keripy's wire form of `raw` when it parses for `keyCount`; an unparseable one unchanged, for validation to reject. */
  export function canonical(raw: Threshold, keyCount: number): Threshold {
    const parsed = parse(raw, keyCount);
    return parsed.ok ? encode(parsed.value) : raw;
  }

  /**
   * Whether signatures at these key indices satisfy the threshold. Each index counts once (documented
   * divergence, spec §4f). Numeric: m > 0 and at least m distinct indices. Weighted (as keripy): no
   * indices, or an index outside the weighted keys, is unsatisfied; otherwise every clause's signed
   * weights sum to at least 1.
   */
  export function satisfied(parsed: Parsed, signedIndices: Iterable<number>): boolean {
    const indices = new Set(signedIndices);
    if (parsed.kind === 'numeric') {
      return parsed.m > 0 && indices.size >= parsed.m;
    } else if (parsed.kind === 'weighted') {
      const total = size(parsed);
      if (indices.size === 0 || [...indices].some((i) => !Number.isInteger(i) || i < 0 || i >= total)) {
        return false;
      } else {
        let offset = 0;
        return parsed.clauses.every((clause) => {
          const signed = clause.filter((_, j) => indices.has(offset + j));
          offset += clause.length;
          return atLeastOne(sum(signed));
        });
      }
    } else {
      const unknown: never = parsed;
      throw new globalThis.Error(`Unknown threshold kind: ${JSON.stringify(unknown)}`);
    }
  }
}

/**
 * The only reader and writer of a KERI sequence number `s` (KEL and TEL events, seals, KSNs), following keripy
 * 1.3.4 `Number`: `s` is hex. keripy writes `numh` (lowercase, no leading zeros) and reads `int(s, 16)`.
 * Documented divergence (spec §4f), kerits strict: only hex digits parse (no `0x`, spaces, `_` or sign, and no
 * empty string, which keripy reads as 0); upper case and leading zeros parse, as keripy.
 */
export namespace SequenceNumber {
  export type Error = { readonly kind: 'malformed' | 'out-of-range'; readonly message: string };

  const HEX = /^[0-9a-fA-F]+$/;

  /** Parse a wire `s` (keripy `Number(numh=s).num`). */
  export function parse(s: string): Result<number, Error> {
    const value: unknown = s;
    if (typeof value !== 'string' || !HEX.test(value)) {
      return err({ kind: 'malformed', message: `sequence number ${JSON.stringify(value)} is not a hex string` });
    } else {
      const n = Number.parseInt(value, 16);
      return Number.isSafeInteger(n)
        ? ok(n)
        : err({ kind: 'out-of-range', message: `sequence number "${value}" exceeds ${Number.MAX_SAFE_INTEGER}` });
    }
  }

  /** The `s` of an event that already passed validation (stored, or KSN-derived); a malformed one is corruption. */
  export function of(s: string): number {
    const n = parse(s);
    if (n.ok) {
      return n.value;
    } else {
      throw new globalThis.Error(`SequenceNumber.of: ${n.error.message}`);
    }
  }

  /** keripy's wire form (`numh`): lowercase hex, no leading zeros. */
  export function encode(n: number): string {
    if (Number.isSafeInteger(n) && n >= 0) {
      return n.toString(16);
    } else {
      throw new globalThis.Error(`SequenceNumber.encode: ${n} is not a non-negative integer`);
    }
  }
}

/* ------------------------------------------------------------------------------------------------
 * KERI KEL Event Schemas (focused, with strong docs). Add ROT/IXN as needed.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Transferable public key (current keys).
 * Use qb64 transferable prefix (e.g., Ed25519 verkey).
 */
export const CesrKeyTransferableSchema = CesrType('CESR Public Key (transferable)', 'qb64-key-transferable');
export type CesrKeyTransferable = Static<typeof CesrKeyTransferableSchema>;

/** Generic CESR digest (qb64) */
export const CesrDigestSchema = CesrType('CESR Digest', 'qb64-digest');
export type CesrDigest = Static<typeof CesrDigestSchema>;

/** CESR AID (Autonomic Identifier) */
export const CesrAidSchema = CesrType('CESR AID', 'qb64');
export type CesrAid = Static<typeof CesrAidSchema>;

export const KeriPublicKeySchema = CesrType('KERI Public Key', 'qb64-key');
export type KeriPublicKey = Static<typeof KeriPublicKeySchema>;
export type PublicKey = KeriPublicKey;

export const KeriPrivateKeySchema = Type.String({
  title: 'Private Key (qb64)',
  description: 'CESR qb64-encoded private key seed/material',
  minLength: 44,
  maxLength: 88,
  pattern: '^[A-Za-z0-9_-]{43,}$',
  examples: ['0AAc4d6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7A8B9C0D'],
});
export type KeriPrivateKey = Static<typeof KeriPrivateKeySchema>;
export type PrivateKey = KeriPrivateKey;

/* ------------------------------------------------------------------------------------------------
 * Branded Crypto Types
 *
 * Opaque branded types to prevent mixing different encodings (CESR/QB64, raw, hex, base64url)
 * at compile time. Use constructor functions (asX / parseX) to create instances.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Ed25519 Public Key - CESR/QB64 encoded (transferable, with derivation code)
 * Example: "DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA" (44 chars, starts with 'D')
 */
export type Ed25519PublicQb64 = Brand<'Ed25519PublicQb64', KeriPublicKey>;

/**
 * Ed25519 Private Key - CESR/QB64 encoded
 * Example: "A..." (88 chars for transferable seed)
 */
export type Ed25519PrivateQb64 = Brand<'Ed25519PrivateQb64', KeriPrivateKey>;

/**
 * Ed25519 Public Key - Raw bytes (32 bytes)
 */
export type Ed25519PublicRaw = Brand<'Ed25519PublicRaw', Uint8Array>;

/**
 * Ed25519 Private Key - Raw bytes (32 bytes seed)
 */
export type Ed25519PrivateRaw = Brand<'Ed25519PrivateRaw', Uint8Array>;

/**
 * SHA-256 Digest - Hexadecimal encoding (64 hex chars)
 */
export type Sha256Hex = Brand<'Sha256Hex'>;

/**
 * SHA-256 Digest - CESR/QB64 encoding
 * Example: "EL1L4Hhk..." (44 chars, starts with 'E')
 */
export type Sha256Qb64 = Brand<'Sha256Qb64', CesrDigest>;

/**
 * Blake3 Digest - Hexadecimal encoding (64 hex chars)
 */
export type Blake3Hex = Brand<'Blake3Hex'>;

/**
 * Blake3 Digest - CESR/QB64 encoding
 */
export type Blake3Qb64 = Brand<'Blake3Qb64', CesrDigest>;

/**
 * Ed25519 Signature - CESR/QB64 encoding
 * Example: "0B..." (88 chars)
 */
export type Ed25519SignatureQb64 = Brand<'Ed25519SignatureQb64', CesrSignature>;

/**
 * AID - CESR/QB64 encoded Autonomic Identifier
 */
export type AidQb64 = AID;

/**
 * SAID - CESR/QB64 encoded Self-Addressing Identifier
 */
export type SaidQb64 = SAID;

/**
 * X25519 Public Key (32 bytes) - Used for ECDH key agreement
 */
export type X25519PublicKey = Brand<'X25519PublicKey', Uint8Array>;

/**
 * X25519 Private Key (32 bytes) - Used for ECDH key agreement
 */
export type X25519PrivateKey = Brand<'X25519PrivateKey', Uint8Array>;

/**
 * ECDH Shared Secret (32 bytes) - Derived from X25519 key agreement
 */
export type SharedSecret = Brand<'SharedSecret', Uint8Array>;

/**
 * Cryptographic Nonce - Typically 12 bytes for AES-GCM
 */
export type Nonce = Brand<'Nonce', Uint8Array>;

/**
 * AES-256 Key (32 bytes) - For symmetric encryption
 */
export type AESKey = Brand<'AESKey', Uint8Array>;

/**
 * Base64URL encoded string (URL-safe, no padding)
 */
export type Base64UrlString = Brand<'Base64UrlString', string>;

/* ------------------------------------------------------------------------------------------------
 * Key Reference (KERI-native)
 *
 * References a specific key in a controller's KEL for encryption/decryption.
 * Used in encrypted messages to identify which key was used for wrapping.
 * ----------------------------------------------------------------------------------------------*/

/**
 * KeyRef - KERI-native reference to a specific key in a controller's KEL
 *
 * This allows encrypted messages to specify exactly which key version was used,
 * enabling decryption even after key rotation by looking up historical keys.
 *
 * Fields align with KERI event structure:
 * - aid: Controller's Autonomic Identifier
 * - s: Key event sequence number (when this key was established)
 * - kidx: Key index within the event (for multi-key thresholds)
 * - d: Optional event digest for exact pinning
 */
export const KeyRefSchema = Type.Object(
  {
    aid: CesrAidSchema,
    s: Type.String({
      title: 'Sequence Number',
      description: 'Key event sequence number where this key was established',
      examples: ['0', '1', '2'],
    }),
    kidx: Type.Integer({
      minimum: 0,
      title: 'Key Index',
      description: 'Index of the key within the event (for multi-key thresholds)',
      examples: [0, 1],
    }),
    d: Type.Optional(
      Type.String({
        title: 'Event Digest',
        description: 'Optional SAID of the key event for exact pinning',
        format: 'qb64-digest',
      }),
    ),
  },
  {
    additionalProperties: false,
    title: 'Key Reference',
    description:
      'KERI-native reference to a specific key in a controller KEL. Used to identify which key was used for encryption, enabling decryption after key rotation.',
  },
);
export type KeyRef = Static<typeof KeyRefSchema>;

/**
 * Create a KeyRef from components
 */
export function keyRef(aid: AID, s: string, kidx: number, d?: SAID): KeyRef {
  if (d !== undefined) {
    return { aid, s, kidx, d };
  }
  return { aid, s, kidx };
}

/**
 * Compare two KeyRefs for equality
 *
 * Used to validate that the recipient key in a wrapped message matches
 * the unwrapper's key reference.
 */
export function keyRefEquals(a: KeyRef, b: KeyRef): boolean {
  return a.aid === b.aid && a.s === b.s && a.kidx === b.kidx && a.d === b.d;
}

/* ------------------------------------------------------------------------------------------------
 * Branded Type Constructors / Parsers
 *
 * Validate and cast strings to branded types. Use these instead of `as` casts.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Parse and validate an Ed25519 public key in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded public key string
 * @returns Branded Ed25519PublicQb64 type
 * @throws Error if validation fails
 */
export function parseEd25519PublicQb64(qb64: string): Ed25519PublicQb64 {
  if (!Value.Check(KeriPublicKeySchema, qb64)) {
    throw new Error(`Invalid Ed25519 public key QB64: ${qb64}`);
  }
  // Additional Ed25519-specific checks: should start with 'D' for transferable
  if (!qb64.startsWith('D')) {
    throw new Error(`Invalid Ed25519 public key prefix: expected 'D', got '${qb64[0]}'`);
  }
  if (qb64.length !== 44) {
    throw new Error(`Invalid Ed25519 public key length: expected 44 chars, got ${qb64.length}`);
  }
  return qb64 as Ed25519PublicQb64;
}

/**
 * Parse and validate an Ed25519 private key in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded private key string
 * @returns Branded Ed25519PrivateQb64 type
 * @throws Error if validation fails
 */
export function parseEd25519PrivateQb64(qb64: string): Ed25519PrivateQb64 {
  if (!Value.Check(KeriPrivateKeySchema, qb64)) {
    throw new Error(`Invalid Ed25519 private key QB64: ${qb64}`);
  }
  return qb64 as Ed25519PrivateQb64;
}

/**
 * Validate raw Ed25519 public key bytes
 *
 * @param raw - Raw public key bytes
 * @returns Branded Ed25519PublicRaw type
 * @throws Error if validation fails
 */
export function asEd25519PublicRaw(raw: Uint8Array): Ed25519PublicRaw {
  if (raw.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${raw.length}`);
  }
  return raw as Ed25519PublicRaw;
}

/**
 * Validate raw Ed25519 private key bytes
 *
 * @param raw - Raw private key seed bytes
 * @returns Branded Ed25519PrivateRaw type
 * @throws Error if validation fails
 */
export function asEd25519PrivateRaw(raw: Uint8Array): Ed25519PrivateRaw {
  if (raw.length !== 32) {
    throw new Error(`Invalid Ed25519 private key length: expected 32 bytes, got ${raw.length}`);
  }
  return raw as Ed25519PrivateRaw;
}

/**
 * Parse and validate a SHA-256 digest in hexadecimal format
 *
 * @param hex - Hexadecimal digest string
 * @returns Branded Sha256Hex type
 * @throws Error if validation fails
 */
export function parseSha256Hex(hex: string): Sha256Hex {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Invalid SHA-256 hex: expected 64 hex chars, got ${hex.length}`);
  }
  return hex.toLowerCase() as Sha256Hex;
}

/**
 * Parse and validate a Blake3-256 digest in CESR/QB64 format, returning as Sha256Qb64.
 *
 * Note: 'E' is the CESR derivation code for Blake3-256. This function validates that
 * prefix and returns the value branded as Sha256Qb64 (kept for compatibility with
 * the wider codebase which uses Sha256Qb64 for 'E'-prefixed digests).
 *
 * @param qb64 - QB64-encoded Blake3-256 digest string (CESR prefix 'E')
 * @returns Branded Sha256Qb64 type
 * @throws Error if validation fails
 */
export function parseBlake3Qb64Digest(qb64: string): Sha256Qb64 {
  if (!Value.Check(CesrDigestSchema, qb64)) {
    throw new Error(`Invalid Blake3-256 QB64: ${qb64}`);
  }
  if (!qb64.startsWith('E')) {
    throw new Error(`Invalid Blake3-256 QB64 prefix: expected 'E', got '${qb64[0]}'`);
  }
  return qb64 as Sha256Qb64;
}

/**
 * Parse and validate a Blake3 digest in hexadecimal format
 *
 * @param hex - Hexadecimal digest string
 * @returns Branded Blake3Hex type
 * @throws Error if validation fails
 */
export function parseBlake3Hex(hex: string): Blake3Hex {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Invalid Blake3 hex: expected 64 hex chars, got ${hex.length}`);
  }
  return hex.toLowerCase() as Blake3Hex;
}

/**
 * Parse and validate a Blake3 digest in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded digest string
 * @returns Branded Blake3Qb64 type
 * @throws Error if validation fails
 */
export function parseBlake3Qb64(qb64: string): Blake3Qb64 {
  if (!Value.Check(CesrDigestSchema, qb64)) {
    throw new Error(`Invalid Blake3 QB64: ${qb64}`);
  }
  return qb64 as Blake3Qb64;
}

/**
 * Parse and validate an Ed25519 signature in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded signature string
 * @returns Branded Ed25519SignatureQb64 type
 * @throws Error if validation fails
 */
export function parseEd25519SignatureQb64(qb64: string): Ed25519SignatureQb64 {
  if (!Value.Check(CesrSignatureSchema, qb64)) {
    throw new Error(`Invalid Ed25519 signature QB64: ${qb64}`);
  }
  // Ed25519 signatures in CESR typically start with '0B'
  if (!qb64.startsWith('0B')) {
    throw new Error(`Invalid Ed25519 signature prefix: expected '0B', got '${qb64.substring(0, 2)}'`);
  }
  return qb64 as Ed25519SignatureQb64;
}

/**
 * Parse and validate an AID in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded AID string
 * @returns Branded AidQb64 type
 * @throws Error if validation fails
 */
export function parseAidQb64(qb64: string): AidQb64 {
  return qb64 as AID;
}

/**
 * Parse and validate a SAID in CESR/QB64 format
 *
 * @param qb64 - QB64-encoded SAID string
 * @returns Branded SaidQb64 type
 * @throws Error if validation fails
 */
export function parseSaidQb64(qb64: string): SaidQb64 {
  return qb64 as SAID;
}

export const KeriKeyPairSchema = Type.Object({
  publicKey: KeriPublicKeySchema,
  privateKey: KeriPrivateKeySchema,
  transferable: Type.Boolean({ default: true }),
  algo: Type.Optional(
    Type.Union([Type.Literal('ed25519'), Type.Literal('x25519'), Type.Literal('bls12381'), Type.Literal('secp256k1')]),
  ),
});
export type KeriKeyPair = Static<typeof KeriKeyPairSchema>;

/**
 * Branded Ed25519 Key Pair
 *
 * Same structure as KeriKeyPair but with branded key types for compile-time safety.
 * Use this in API boundaries to ensure keys are properly validated.
 */
export interface Ed25519KeyPairBranded {
  publicKey: Ed25519PublicQb64;
  privateKey: Ed25519PrivateQb64;
  transferable: boolean;
  algo?: 'ed25519' | 'x25519' | 'bls12381' | 'secp256k1';
}

/**
 * Convert a KeriKeyPair to a branded Ed25519KeyPairBranded
 *
 * Validates the keys and brands them for type safety.
 */
export function toEd25519KeyPairBranded(keyPair: KeriKeyPair): Ed25519KeyPairBranded {
  return {
    publicKey: parseEd25519PublicQb64(keyPair.publicKey),
    privateKey: parseEd25519PrivateQb64(keyPair.privateKey),
    transferable: keyPair.transferable,
    algo: keyPair.algo,
  };
}

export const CesrSignatureSchema = CesrType('CESR Signature', 'qb64-signature');
export type CesrSignature = Static<typeof CesrSignatureSchema>;
export type Signature = CesrSignature;
