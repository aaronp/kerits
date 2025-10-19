/**
 * Transport - Message transport interface
 * 
 * Handles sending and receiving messages between AIDs.
 * Can be backed by WebSocket, HTTP, Convex, or in-memory for testing.
 */

import type { AID, SAID } from '../types';
import type { Bytes } from './types';

/**
 * Message - Transport message between AIDs
 */
export interface Message {
    id: string;             // SAID of envelope
    from: AID;
    to: AID;
    typ: string;            // "kel.proposal" | "tel.append" | "oobi.query" | "keri.rot.proposal.v1" | etc.
    body: Bytes;            // app-level payload
    refs?: string[];        // SAIDs referenced (KEL/TEL/ACDC)
    dt: string;             // ISO timestamp
    sigs?: { keyIndex: number; sig: string }[]; // CESR signatures
}

/**
 * Channel - Message subscription interface
 */
export interface Channel {
    /** Subscribe to messages for this channel */
    subscribe(onMessage: (m: Message) => void): () => void; // returns unsubscribe
}

export interface Transport {
    /** Send a message */
    send(msg: Message): Promise<void>;

    /** Get channel for an AID */
    channel(aid: AID): Channel;

    /** Read unread messages (optional) */
    readUnread?(aid: AID, limit?: number): Promise<Message[]>;

    /** Acknowledge messages (optional) */
    ack?(aid: AID, ids: string[]): Promise<void>;
}

/**
 * In-memory transport implementation for testing
 */
export function memoryTransport(): Transport {
    const subs = new Map<string, Set<(m: Message) => void>>();
    const inbox = new Map<string, Message[]>();

    function push(to: string, m: Message) {
        inbox.set(to, [...(inbox.get(to) ?? []), m]);
        subs.get(to)?.forEach(fn => fn(m));
    }

    return {
        async send(m) {
            push(m.to, m);
        },
        channel(a) {
            const key = a;
            if (!subs.has(key)) subs.set(key, new Set());
            return {
                subscribe(fn) {
                    subs.get(key)!.add(fn);
                    return () => subs.get(key)!.delete(fn);
                }
            };
        },
        async readUnread(a, limit = 100) {
            const arr = inbox.get(a) ?? [];
            inbox.set(a, []);
            return arr.slice(0, limit);
        },
        async ack() { /* no-op for mem */ },
    };
}