export type Qb64 = string; // CESR-encoded value

export type SaidAlgo = 'blake3-256'; // extend later if needed

export type KeyAlgo = 'ed25519';
export interface EncodedKey {
  algo: KeyAlgo;
  qb64: Qb64;
  raw: Uint8Array;
}

export type SigAlgo = 'ed25519';
export interface EncodedSig {
  algo: SigAlgo;
  qb64: Qb64;
  raw: Uint8Array;
}
