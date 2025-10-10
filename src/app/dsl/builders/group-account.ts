/**
 * DSL Builder for Group Accounts
 *
 * Provides fluent API for creating and managing group multi-sig identifiers
 */

import { incept, type InceptionEvent } from '../../../incept';
import { rotate, type RotationEvent } from '../../../rotate';
import type {
  GroupAccount,
  GroupInceptOptions,
  GroupRotateOptions,
  PartiallySignedEvent,
  ExchangeMessage,
} from '../../group-account';
import { Counselor } from '../../counselor';
import { MemoryGroupEscrow } from '../../memory-group-escrow';
import type { Threshold } from '../../../tholder';

/**
 * Group account builder with fluent API
 */
export class GroupAccountBuilder {
  private counselor: Counselor;
  private groups: Map<string, GroupAccount> = new Map();

  constructor(counselor?: Counselor) {
    this.counselor =
      counselor ?? new Counselor({ escrow: new MemoryGroupEscrow() });
  }

  /**
   * Create a new group identifier
   *
   * @example
   * const group = await builder
   *   .group()
   *   .members(['Alice', 'Bob', 'Carol'])
   *   .threshold('2')
   *   .incept({
   *     keys: ['Dkey1...', 'Dkey2...', 'Dkey3...'],
   *     ndigs: ['Edig1...', 'Edig2...', 'Edig3...']
   *   });
   */
  group(): GroupInceptBuilder {
    return new GroupInceptBuilder(this.counselor, this.groups);
  }

  /**
   * Get existing group account
   */
  getGroup(pre: string): GroupAccount | undefined {
    return this.groups.get(pre);
  }

  /**
   * List all group accounts
   */
  listGroups(): GroupAccount[] {
    return Array.from(this.groups.values());
  }
}

/**
 * Fluent builder for group inception
 */
export class GroupInceptBuilder {
  private smids?: string[];
  private rmids?: string[];
  private mhab?: string;
  private isith?: Threshold;
  private nsith?: Threshold;
  private witnesses?: { b: string[]; bt: number };
  private delpre?: string;

  constructor(
    private counselor: Counselor,
    private groups: Map<string, GroupAccount>
  ) {}

  /**
   * Set signing members
   */
  members(smids: string[]): this {
    this.smids = smids;
    return this;
  }

  /**
   * Set rotating members (optional, defaults to signing members)
   */
  rotatingMembers(rmids: string[]): this {
    this.rmids = rmids;
    return this;
  }

  /**
   * Set local member identifier
   */
  localMember(mhab: string): this {
    this.mhab = mhab;
    return this;
  }

  /**
   * Set signing threshold
   */
  threshold(isith: Threshold): this {
    this.isith = isith;
    return this;
  }

  /**
   * Set next threshold
   */
  nextThreshold(nsith: Threshold): this {
    this.nsith = nsith;
    return this;
  }

  /**
   * Configure witnesses
   */
  withWitnesses(b: string[], bt: number): this {
    this.witnesses = { b, bt };
    return this;
  }

  /**
   * Make this a delegated group
   */
  delegatedBy(delpre: string): this {
    this.delpre = delpre;
    return this;
  }

  /**
   * Create the group inception event
   */
  async incept(options: {
    keys: string[];
    ndigs?: string[];
  }): Promise<{ group: GroupAccount; event: InceptionEvent }> {
    if (!this.smids || this.smids.length === 0) {
      throw new Error('Group members are required');
    }

    if (!this.mhab) {
      throw new Error('Local member identifier is required');
    }

    // Create inception event
    const event = incept({
      keys: options.keys,
      ndigs: options.ndigs,
      isith: this.isith,
      nsith: this.nsith,
    });

    // Create group account state
    const group: GroupAccount = {
      pre: event.pre,
      sn: 0,
      smids: this.smids,
      rmids: this.rmids ?? this.smids,
      mhab: this.mhab,
      kt: this.isith ?? event.ked.kt,
      k: options.keys,
      nt: this.nsith ?? event.ked.nt,
      n: options.ndigs ?? [],
      delpre: this.delpre,
      bt: this.witnesses?.bt.toString() ?? '0',
      b: this.witnesses?.b ?? [],
    };

    // Store group
    this.groups.set(group.pre, group);

    return { group, event };
  }
}

/**
 * Fluent builder for group rotation
 */
export class GroupRotateBuilder {
  private group: GroupAccount;
  private isith?: Threshold;
  private nsith?: Threshold;
  private witnesses?: { ba: string[]; br: string[]; bt: number };

  constructor(
    group: GroupAccount,
    private counselor: Counselor,
    private groups: Map<string, GroupAccount>
  ) {
    this.group = group;
  }

  /**
   * Set new signing threshold
   */
  threshold(isith: Threshold): this {
    this.isith = isith;
    return this;
  }

  /**
   * Set new next threshold
   */
  nextThreshold(nsith: Threshold): this {
    this.nsith = nsith;
    return this;
  }

  /**
   * Update witness configuration
   */
  updateWitnesses(ba: string[], br: string[], bt: number): this {
    this.witnesses = { ba, br, bt };
    return this;
  }

  /**
   * Perform the rotation
   */
  async rotate(options: {
    keys: string[];
    dig: string;
    ndigs?: string[];
  }): Promise<{ group: GroupAccount; event: RotationEvent }> {
    // Create rotation event
    const event = rotate({
      pre: this.group.pre,
      keys: options.keys,
      dig: options.dig,
      sn: this.group.sn + 1,
      isith: this.isith,
      ndigs: options.ndigs,
      nsith: this.nsith,
    });

    // Update group account state
    const updatedGroup: GroupAccount = {
      ...this.group,
      sn: this.group.sn + 1,
      kt: this.isith ?? event.ked.kt,
      k: options.keys,
      nt: this.nsith ?? event.ked.nt,
      n: options.ndigs ?? [],
    };

    if (this.witnesses) {
      // Update witness list
      const newWitnesses = [...updatedGroup.b];
      for (const removed of this.witnesses.br) {
        const idx = newWitnesses.indexOf(removed);
        if (idx >= 0) newWitnesses.splice(idx, 1);
      }
      for (const added of this.witnesses.ba) {
        if (!newWitnesses.includes(added)) {
          newWitnesses.push(added);
        }
      }
      updatedGroup.b = newWitnesses;
      updatedGroup.bt = this.witnesses.bt.toString();
    }

    // Store updated group
    this.groups.set(updatedGroup.pre, updatedGroup);

    return { group: updatedGroup, event };
  }
}

/**
 * Extension for GroupAccount with rotation builder
 */
export function rotateGroup(
  group: GroupAccount,
  counselor: Counselor,
  groups: Map<string, GroupAccount>
): GroupRotateBuilder {
  return new GroupRotateBuilder(group, counselor, groups);
}
