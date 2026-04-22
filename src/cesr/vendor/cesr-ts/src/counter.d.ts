export class CounterCodex {
  ControllerIdxSigs: '-A';
  WitnessIdxSigs: '-B';
  NonTransReceiptCouples: '-C';
  TransReceiptQuadruples: '-D';
  FirstSeenReplayCouples: '-E';
  TransIdxSigGroups: '-F';
  SealSourceCouples: '-G';
  TransLastIdxSigGroups: '-H';
  SealSourceTriples: '-I';
  SadPathSig: '-J';
  SadPathSigGroup: '-K';
  PathedMaterialQuadlets: '-L';
  AttachedMaterialQuadlets: '-V';
  BigAttachedMaterialQuadlets: '-0V';
  KERIProtocolStack: '--AAA';
}

export const CtrDex: CounterCodex;

export class Counter {
  constructor(args: { code?: string; count?: number; qb64?: string });

  code: string;
  count: number;
  qb64: string;

  static Sizes: {
    get(code: string): { hs: number; ss: number; fs: number; ls: number } | undefined;
  };
}
