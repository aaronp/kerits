import { deriveSaid } from '../common/derivation-surface.js';
import type { AID, SAID } from '../common/types.js';
import { buildACDCCredentialSurface } from '../said/surfaces.js';
import type { ACDCCredential, ACDCProof } from './types.js';

function isACDC(obj: unknown): obj is ACDCCredential {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.v === 'string' &&
    o.v.startsWith('ACDC') &&
    typeof o.d === 'string' &&
    typeof o.i === 'string' &&
    typeof o.s === 'string'
  );
}

function createProof(signerAid: AID, signature: string, keyRef?: string, dt?: string): ACDCProof {
  return {
    t: 'Ed25519',
    i: signerAid,
    s: signature,
    ...(keyRef !== undefined ? { k: keyRef } : {}),
    ...(dt !== undefined ? { dt } : {}),
  };
}

/**
 * Parameters for creating an ACDC credential.
 * Required: i (issuer), s (schema SAID), and either a (inline attributes) or A (attribute SAIDs).
 * Optional: u (nonce), ri (registry SAID), rd (registry digest, v2), e (edges), r (rules).
 */
interface CreateCredentialParams {
  i: AID;
  s: SAID;
  a?: Record<string, unknown>;
  A?: SAID[];
  u?: string;
  ri?: SAID;
  rd?: SAID;
  e?: Record<string, unknown>;
  r?: Record<string, unknown>;
}

function create(params: CreateCredentialParams): ACDCCredential {
  // Build the artifact in keripy canonical order: v, d, u, i, ri, s, a, A, e, r
  // Only include fields that are provided.
  const artifact: Record<string, unknown> = {
    v: '', // placeholder — deriveSaid will compute
    d: '', // placeholder — deriveSaid will compute
  };
  if (params.u !== undefined) artifact.u = params.u;
  artifact.i = params.i;
  if (params.ri !== undefined) artifact.ri = params.ri;
  if (params.rd !== undefined) artifact.rd = params.rd;
  artifact.s = params.s;
  if (params.a !== undefined) artifact.a = params.a;
  if (params.A !== undefined) artifact.A = params.A;
  if (params.e !== undefined) artifact.e = params.e;
  if (params.r !== undefined) artifact.r = params.r;

  const surface = buildACDCCredentialSurface(artifact);
  const { sealed } = deriveSaid(artifact, surface);
  return sealed as ACDCCredential;
}

export const ACDCData = {
  isACDC,
  createProof,
  create,
} as const;
