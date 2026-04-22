/**
 * Architecture model types — generic over ID parameters.
 *
 * Consumer packages (core, sdk) narrow these via their own legend.ts
 * string-literal unions and use `satisfies Record<LayerId, Layer<LayerId>>`
 * for compile-time coverage.
 */

export interface Layer<L extends string = string> {
  readonly id: L;
  readonly description: string;
  readonly rules?: readonly string[];
}

export interface Domain<D extends string = string> {
  readonly id: D;
  readonly description: string;
  readonly rules?: readonly string[];
}

/**
 * A capability-level correctness claim. The `id` is a stable handle referenced
 * by `ScenarioDefinition.covers`; the `statement` is the human-readable claim
 * rendered in the generated capability page.
 */
export interface Invariant {
  readonly id: string;
  readonly statement: string;
}

export interface Capability<C extends string = string, D extends string = string, L extends string = string> {
  readonly id: C;
  readonly domain: Domain<D>;
  readonly layers: readonly Layer<L>[];
  readonly purpose: string;
  readonly invariants?: readonly Invariant[];
}

export interface Functionality<
  F extends string = string,
  C extends string = string,
  D extends string = string,
  L extends string = string,
> {
  readonly id: F;
  readonly capability: Capability<C, D, L>;
  readonly description: string;
  readonly invariants?: readonly string[];
}
