export class Matter {
  constructor(args: { qb64?: string; raw?: Uint8Array; code?: string });
  qb64: string;
  raw: Uint8Array;
  code: string;

  static Sizes: {
    get(code: string): { fs: number; hs: number; ss: number; ls?: number } | undefined;
  };
}

export const MtrDex: Record<string, string> & {
  Ed25519: string;
  Ed25519N: string;
  Ed25519_Sig: string;
  ECDSA_256k1_Sig: string;
  ECDSA_256r1_Sig: string;
  X25519: string;
  Blake3_256: string;
};

export const DigiDex: {
  has(code: string): boolean;
};
