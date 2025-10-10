/**
 * Counselor - Group Multi-Signature Coordinator
 *
 * Coordinates the 3-stage escrow processing for group identifiers:
 * 1. Partial Signed Escrow (gpse) - Collect member signatures
 * 2. Delegated Escrow (gdee) - Process delegation anchoring
 * 3. Partial Witness Escrow (gpwe) - Collect witness receipts
 *
 * Based on keripy's Counselor class in app/grouping.py
 */

import type {
  GroupAccount,
  PartiallySignedEvent,
  PartialSigningState,
  GroupEscrowStore,
  ExchangeMessage,
} from './group-account';
import { Tholder } from '../tholder';

/**
 * Counselor configuration
 */
export interface CounselorConfig {
  /** Escrow storage */
  escrow: GroupEscrowStore;

  /** Timeout for escrow events (milliseconds) */
  timeout?: number;
}

/**
 * Signature verification result
 */
export interface VerifyResult {
  /** Whether signature is valid */
  valid: boolean;

  /** Signer identifier (if valid) */
  signer?: string;

  /** Error message (if invalid) */
  error?: string;
}

/**
 * Counselor - Multi-sig coordinator
 *
 * Manages the lifecycle of partially signed events through escrow stages
 */
export class Counselor {
  private readonly escrow: GroupEscrowStore;
  private readonly timeout: number;

  constructor(config: CounselorConfig) {
    this.escrow = config.escrow;
    this.timeout = config.timeout ?? 3600000; // 1 hour default
  }

  /**
   * Process incoming exchange message with partial signature
   *
   * @param msg - Exchange message from group member
   * @param group - Group account state
   * @returns Updated partial signing state
   */
  async processExchangeMessage(
    msg: ExchangeMessage,
    group: GroupAccount
  ): Promise<PartialSigningState> {
    // Extract event and signature from message
    const eventData = msg.a.e;
    const signature = msg.a.s;

    if (!eventData || !signature) {
      return {
        stage: 'failed',
        event: null as any,
        reason: 'Missing event or signature in exchange message',
      };
    }

    // Get or create partially signed event
    let partial = await this.escrow.getPartialSigned(eventData.d);

    if (!partial) {
      // First signature - create new partial event
      partial = await this.createPartialEvent(
        eventData.raw,
        eventData.d,
        group
      );
    }

    // Add signature from sender
    partial.sigs.set(msg.i, signature);

    // Check if we have enough signatures
    const tholder = new Tholder({ sith: group.kt });
    const signedCount = partial.sigs.size;

    if (signedCount >= tholder.num) {
      // Enough signatures - move to next stage
      return await this.processPartialSignedEscrow(partial, group);
    } else {
      // Still collecting signatures
      await this.escrow.putPartialSigned(partial.said, partial);
      return { stage: 'collecting', event: partial };
    }
  }

  /**
   * Stage 1: Process partial signed escrow
   *
   * Collects member signatures until threshold is met
   */
  async processPartialSignedEscrow(
    event: PartiallySignedEvent,
    group: GroupAccount
  ): Promise<PartialSigningState> {
    // Verify we have enough signatures
    const tholder = new Tholder({ sith: group.kt });
    const signedCount = event.sigs.size;

    if (signedCount < tholder.num) {
      // Not enough signatures yet
      await this.escrow.putPartialSigned(event.said, event);
      return { stage: 'collecting', event };
    }

    // Check if this is a delegated group
    if (group.delpre) {
      // Move to delegation stage
      await this.escrow.putDelegatee(event.said, event);
      return {
        stage: 'delegating',
        event,
        anchor: group.delpre,
      };
    }

    // Check if group has witnesses
    if (group.b.length > 0) {
      // Move to witnessing stage
      await this.escrow.putPartialWitness(event.said, event);
      return { stage: 'witnessing', event };
    }

    // No delegation or witnesses - complete
    await this.escrow.putCompleted(event.said, event);
    await this.escrow.removePartialSigned(event.said);
    return { stage: 'completed', event };
  }

  /**
   * Stage 2: Process delegated escrow
   *
   * Waits for delegation approval from delegator
   */
  async processDelegateEscrow(
    event: PartiallySignedEvent,
    group: GroupAccount,
    delegatorApproval?: string
  ): Promise<PartialSigningState> {
    if (!group.delpre) {
      return {
        stage: 'failed',
        event,
        reason: 'Group is not delegated',
      };
    }

    if (!delegatorApproval) {
      // Still waiting for delegator
      return {
        stage: 'delegating',
        event,
        anchor: group.delpre,
      };
    }

    // Delegator approved - move to witnessing or complete
    await this.escrow.removePartialSigned(event.said);

    if (group.b.length > 0) {
      await this.escrow.putPartialWitness(event.said, event);
      return { stage: 'witnessing', event };
    }

    await this.escrow.putCompleted(event.said, event);
    return { stage: 'completed', event };
  }

  /**
   * Stage 3: Process partial witness escrow
   *
   * Collects witness receipts until threshold is met
   */
  async processPartialWitnessEscrow(
    event: PartiallySignedEvent,
    group: GroupAccount,
    receipt?: { witness: string; signature: string }
  ): Promise<PartialSigningState> {
    if (receipt) {
      // Add witness receipt
      if (!event.receipts) {
        event.receipts = new Map();
      }
      event.receipts.set(receipt.witness, receipt.signature);
    }

    // Check if we have enough receipts
    const bt = parseInt(group.bt, 16);
    const receiptCount = event.receipts?.size ?? 0;

    if (receiptCount >= bt) {
      // Enough receipts - complete
      await this.escrow.putCompleted(event.said, event);
      await this.escrow.removePartialSigned(event.said);
      return { stage: 'completed', event };
    }

    // Still collecting receipts
    await this.escrow.putPartialWitness(event.said, event);
    return { stage: 'witnessing', event };
  }

  /**
   * Election mechanism: determine which member handles delegation/witnessing
   *
   * Uses lowest index in signing member list
   */
  isElected(group: GroupAccount, localMhab: string): boolean {
    const localIndex = group.smids.indexOf(localMhab);
    if (localIndex === -1) return false;

    // Check if any earlier member has signed
    for (let i = 0; i < localIndex; i++) {
      // In real implementation, check if smids[i] has already handled this
      // For now, assume we're elected if we're in the list
    }

    return localIndex === 0; // Simple: only first member is elected
  }

  /**
   * Create a new partially signed event
   */
  private async createPartialEvent(
    raw: string,
    said: string,
    group: GroupAccount
  ): Promise<PartiallySignedEvent> {
    // Parse event to get type and sequence number
    const ked = JSON.parse(raw);
    const tholder = new Tholder({ sith: group.kt });

    const event: PartiallySignedEvent = {
      raw,
      said,
      sn: parseInt(ked.s, 16),
      t: ked.t,
      sigs: new Map(),
      required: tholder.num,
      receivedAt: Date.now(),
    };

    return event;
  }

  /**
   * Check for expired escrow events and clean up
   */
  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const partials = await this.escrow.listPartialSigned();

    for (const event of partials) {
      if (now - event.receivedAt > this.timeout) {
        await this.escrow.removePartialSigned(event.said);
      }
    }
  }
}
