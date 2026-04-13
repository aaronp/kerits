export class Saider {
  constructor(args: { qb64: string });
  qb64: string;
  verify(value: unknown, pref?: boolean): boolean;

  static saidify(value: Record<string, any>, code: string, serial: string, label?: string): [Saider, unknown];
}
