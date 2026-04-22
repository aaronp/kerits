export class IndexerCodex {
  Ed25519_Sig: 'A';
  Ed25519_Crt_Sig: 'B';
  ECDSA_256k1_Sig: 'C';
  ECDSA_256k1_Crt_Sig: 'D';
  ECDSA_256r1_Sig: 'E';
  ECDSA_256r1_Crt_Sig: 'F';
  Ed448_Sig: '0A';
  Ed448_Crt_Sig: '0B';
  Ed25519_Big_Sig: '2A';
  Ed25519_Big_Crt_Sig: '2B';
  ECDSA_256k1_Big_Sig: '2C';
  ECDSA_256k1_Big_Crt_Sig: '2D';
  ECDSA_256r1_Big_Sig: '2E';
  ECDSA_256r1_Big_Crt_Sig: '2F';
  Ed448_Big_Sig: '3A';
  Ed448_Big_Crt_Sig: '3B';
}

export const IdrDex: IndexerCodex;

export class Indexer {
  constructor(args: {
    raw?: Uint8Array;
    code?: string;
    index?: number;
    ondex?: number;
    qb64?: string;
  });

  code: string;
  raw: Uint8Array;
  index: number;
  ondex: number;
  qb64: string;

  static Sizes: {
    get(code: string): { hs: number; ss: number; os: number; fs?: number; ls: number } | undefined;
  };
}

export class Siger extends Indexer {
  constructor(
    args: {
      raw?: Uint8Array;
      code?: string;
      index?: number;
      ondex?: number;
      qb64?: string;
    },
    verfer?: unknown,
  );
}
