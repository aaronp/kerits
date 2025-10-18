/**
 * KeyStateManager - Track KERI key state for verification
 *
 * Maintains current and next keys for each identifier by replaying KEL events.
 * Used for signature verification, especially for rotation events.
 */

import type { KerStore } from '../storage/types';
import { s } from '../types/keri';

/**
 * Key state for a KERI identifier
 */
export interface KeyState {
  /** Account identifier (AID) */
  aid: string;
  /** Current sequence number */
  sn: number;
  /** Current signing keys (verfers) */
  currentKeys: string[];
  /** Next key digests (commitments) */
  nextDigests: string[];
  /** Current signing threshold */
  currentThreshold: number;
  /** Next signing threshold */
  nextThreshold: number;
  /** Event digest (SAID) of last event */
  lastEventDigest: string;
}

/**
 * KeyStateManager - Manages key state for verification
 *
 * Usage:
 *   const ksm = new KeyStateManager(store);
 *   const state = await ksm.getKeyState(aid);
 *   // Use state.currentKeys for verification
 */
export class KeyStateManager {
  private store: KerStore;
  private cache = new Map<string, KeyState>();

  constructor(store: KerStore) {
    this.store = store;
  }

  /**
   * Get current key state for an identifier
   *
   * Replays KEL to compute current state, with caching.
   *
   * @param aid - Account identifier (AID)
   * @returns Current key state
   */
  async getKeyState(aid: string): Promise<KeyState> {
    if (this.cache.has(aid)) {
      return this.cache.get(aid)!;
    }

    // Replay KEL to build key state
    const kelEvents = await this.store.listKel(s(aid).asAID());

    if (kelEvents.length === 0) {
      throw new Error(`No KEL found for AID: ${aid}`);
    }

    let state: KeyState | null = null;

    for (const event of kelEvents) {
      state = this.applyEvent(state, event);
    }

    if (!state) {
      throw new Error(`Failed to build key state for AID: ${aid}`);
    }

    this.cache.set(aid, state);
    return state;
  }

  /**
   * Apply a KEL event to update key state
   *
   * @param state - Current state (null for inception)
   * @param event - KEL event to apply
   * @returns Updated key state
   */
  private applyEvent(state: KeyState | null, event: any): KeyState {
    const meta = event.meta;

    switch (meta.t) {
      case 'icp': {
        // Inception event establishes initial key state
        if (state !== null) {
          throw new Error('Inception event must be first in KEL');
        }

        return {
          aid: meta.i,
          sn: 0,
          currentKeys: meta.keys || [],
          nextDigests: meta.nextDigests || [],
          currentThreshold: meta.threshold || 1,
          nextThreshold: meta.nextThreshold || 1,
          lastEventDigest: meta.d,
        };
      }

      case 'rot': {
        // Rotation event updates keys
        // Important: For rotation, the signing keys are the NEXT keys from previous event
        // The new current keys are specified in this event
        if (!state) {
          throw new Error('Rotation event requires prior key state');
        }

        return {
          ...state,
          sn: meta.s || state.sn + 1,
          currentKeys: meta.keys || [],
          nextDigests: meta.nextDigests || [],
          currentThreshold: meta.threshold || 1,
          nextThreshold: meta.nextThreshold || 1,
          lastEventDigest: meta.d,
        };
      }

      case 'ixn': {
        // Interaction event doesn't change keys, only advances sequence number
        if (!state) {
          throw new Error('Interaction event requires prior key state');
        }

        return {
          ...state,
          sn: meta.s || state.sn + 1,
          lastEventDigest: meta.d,
        };
      }

      default:
        throw new Error(`Unknown event type: ${meta.t}`);
    }
  }

  /**
   * Get the keys that should have signed a rotation event
   *
   * For rotation events, the signing keys are the NEXT keys from the previous event,
   * not the current keys.
   *
   * @param aid - Account identifier
   * @param sn - Sequence number of rotation event
   * @returns Keys that should sign the rotation (next keys from sn-1)
   */
  async getRotationSigningKeys(aid: string, sn: number): Promise<string[]> {
    if (sn === 0) {
      throw new Error('Rotation cannot have sequence number 0 (use inception)');
    }

    // Get KEL up to sn-1
    const kelEvents = await this.store.listKel(s(aid).asAID());
    const priorEvents = kelEvents.filter(e => parseInt(e.meta.s || '0') < sn);

    if (priorEvents.length === 0) {
      throw new Error(`No prior events found for rotation at sn=${sn}`);
    }

    // Replay to get state at sn-1
    let state: KeyState | null = null;
    for (const event of priorEvents) {
      state = this.applyEvent(state, event);
    }

    if (!state) {
      throw new Error(`Failed to build key state for rotation at sn=${sn}`);
    }

    // Return the NEXT digests from prior event
    // These digests should match the current keys in the rotation event
    return state.nextDigests;
  }

  /**
   * Invalidate cached key state for an identifier
   *
   * Call this after adding new events to force recomputation.
   *
   * @param aid - Account identifier
   */
  invalidate(aid: string): void {
    this.cache.delete(aid);
  }

  /**
   * Clear all cached key states
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get key state at a specific sequence number
   *
   * Useful for verifying historical events.
   *
   * @param aid - Account identifier
   * @param sn - Sequence number
   * @returns Key state at that sequence number
   */
  async getKeyStateAt(aid: string, sn: number): Promise<KeyState> {
    // Get KEL up to sn
    const kelEvents = await this.store.listKel(s(aid).asAID());
    const eventsUpToSn = kelEvents.filter(e => parseInt(e.meta.s || '0') <= sn);

    if (eventsUpToSn.length === 0) {
      throw new Error(`No events found up to sn=${sn}`);
    }

    let state: KeyState | null = null;
    for (const event of eventsUpToSn) {
      state = this.applyEvent(state, event);
    }

    if (!state) {
      throw new Error(`Failed to build key state at sn=${sn}`);
    }

    return state;
  }
}
