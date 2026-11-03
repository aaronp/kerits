// open union — autocomplete for known algos, accepts arbitrary strings for custom plugins.
// AlgoPlugin registration (not this type) is the real gate for supported algos.
export type Algo = 'ed25519' | 'secp256k1' | (string & {});

/** Known signing algorithm constants. */
export namespace Algos {
  export const Ed25519: Algo = 'ed25519';
  export const Secp256k1: Algo = 'secp256k1';
}
