/**
 * Memory-based Group Escrow Store
 *
 * In-memory implementation of GroupEscrowStore for testing and development
 */

import type {
  GroupEscrowStore,
  PartiallySignedEvent,
} from './group-account';

/**
 * In-memory group escrow storage
 */
export class MemoryGroupEscrow implements GroupEscrowStore {
  private gpse: Map<string, PartiallySignedEvent> = new Map(); // group partial signed
  private gdee: Map<string, PartiallySignedEvent> = new Map(); // group delegatee
  private gpwe: Map<string, PartiallySignedEvent> = new Map(); // group partial witness
  private cgms: Map<string, PartiallySignedEvent> = new Map(); // completed group multisig

  async putPartialSigned(
    said: string,
    event: PartiallySignedEvent
  ): Promise<void> {
    this.gpse.set(said, event);
  }

  async getPartialSigned(
    said: string
  ): Promise<PartiallySignedEvent | null> {
    return this.gpse.get(said) ?? null;
  }

  async listPartialSigned(): Promise<PartiallySignedEvent[]> {
    return Array.from(this.gpse.values());
  }

  async removePartialSigned(said: string): Promise<void> {
    this.gpse.delete(said);
  }

  async putDelegatee(
    said: string,
    event: PartiallySignedEvent
  ): Promise<void> {
    this.gdee.set(said, event);
  }

  async getDelegatee(said: string): Promise<PartiallySignedEvent | null> {
    return this.gdee.get(said) ?? null;
  }

  async putPartialWitness(
    said: string,
    event: PartiallySignedEvent
  ): Promise<void> {
    this.gpwe.set(said, event);
  }

  async getPartialWitness(
    said: string
  ): Promise<PartiallySignedEvent | null> {
    return this.gpwe.get(said) ?? null;
  }

  async putCompleted(
    said: string,
    event: PartiallySignedEvent
  ): Promise<void> {
    this.cgms.set(said, event);
  }

  /**
   * Get completed event
   */
  async getCompleted(said: string): Promise<PartiallySignedEvent | null> {
    return this.cgms.get(said) ?? null;
  }

  /**
   * Clear all escrow storage
   */
  clear(): void {
    this.gpse.clear();
    this.gdee.clear();
    this.gpwe.clear();
    this.cgms.clear();
  }

  /**
   * Get storage statistics
   */
  stats(): {
    partialSigned: number;
    delegatee: number;
    partialWitness: number;
    completed: number;
  } {
    return {
      partialSigned: this.gpse.size,
      delegatee: this.gdee.size,
      partialWitness: this.gpwe.size,
      completed: this.cgms.size,
    };
  }
}
