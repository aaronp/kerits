/**
 * TEL Service interface
 * 
 * Provides high-level operations for Transaction Event Log management.
 * This is the service layer that wraps the core TEL operations.
 */

import type { AID, SAID } from '../io/types';
import type { TelEvent, TelEnvelope } from './types';

/**
 * TEL Service interface
 * 
 * Provides pure operations for creating and manipulating TEL events.
 * All operations are deterministic and stateless.
 */
export interface TelService {
    /**
     * Create a TEL inception event
     */
    issue(args: {
        controller: AID;
        telId: SAID;
        stateSaid: SAID;
        anchors?: SAID[];
        dt?: string
    }): TelEvent;

    /**
     * Create a TEL update event
     */
    update(args: {
        controller: AID;
        prior: TelEvent;
        stateSaid: SAID;
        policySaid?: SAID;
        dt?: string
    }): TelEvent;

    /**
     * Create a TEL revocation event
     */
    revoke(args: {
        controller: AID;
        prior: TelEvent;
        reason?: string;
        dt?: string
    }): TelEvent;

    /**
     * Sign a TEL event with the provided crypto
     */
    sign(ev: TelEvent, crypto: any): Promise<TelEnvelope>;

    /**
     * Verify signatures on a TEL envelope
     */
    verify(env: TelEnvelope, controllerKel: (aid: AID) => Promise<any>): Promise<{ ok: boolean; reason?: string }>;
}
